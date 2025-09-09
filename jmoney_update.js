require("dotenv").config();
const { addMinutes } = require("date-fns");
const { createClient } = require("@supabase/supabase-js");
const Database = require("better-sqlite3");

const fs = require("fs");
const path = require("path");
const yauzl = require("yauzl");

// Setup Supabase
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const USER_ID = "b926c3c7-062e-4786-b022-957e725f1a8a";
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const iCloudFolder = path.resolve(
  process.env.HOME,
  "Library/Mobile Documents/iCloud~com~duuro~moneyCoachV3/Documents"
);

const localWorkingDir = path.resolve(__dirname, "jmoney_process");

const args = process.argv.slice(2);
const FORCE = args.includes('--force');
const lastSyncedFile = path.join(__dirname, 'last_synced.json');


function loadLastSyncedId() {
  if (!fs.existsSync(lastSyncedFile)) return null;
  try {
    const data = JSON.parse(fs.readFileSync(lastSyncedFile, 'utf-8'));
    return data.last_pk ?? null;
  } catch {
    console.warn('⚠️ Could not read last_synced.json, acting as --force');
    return null;
  }
}

function saveLastSyncedId(lastPk) {
  fs.writeFileSync(lastSyncedFile, JSON.stringify({ last_pk: lastPk }, null, 2));
  console.log(`📝 Saved last synced Z_PK: ${lastPk}`);
}

function findLatestZip(folder) {
  const files = fs
    .readdirSync(folder)
    .filter((f) => f.endsWith(".zip"))
    .map((f) => {
      const fullPath = path.join(folder, f);
      const stat = fs.statSync(fullPath);
      return {
        name: f,
        path: fullPath,
        mtime: stat.mtime,
      };
    });

  if (files.length === 0) {
    console.log("❌ No .zip files found in the iCloud folder.");
    return null;
  }

  const latest = files.sort((a, b) => b.mtime - a.mtime)[0];
  console.log("📦 Latest ZIP file found:", latest.name);
  return latest;
}

function copyZipToLocal(latestZip) {
  if (!fs.existsSync(localWorkingDir)) {
    fs.mkdirSync(localWorkingDir, { recursive: true });
  }

  const destPath = path.join(localWorkingDir, latestZip.name);
  fs.copyFileSync(latestZip.path, destPath);
  console.log(`📁 Copied ZIP to: ${destPath}`);
  return destPath;
}

function unzipAndReturnSQLitePath(zipPath, outputDir) {
  return new Promise((resolve, reject) => {
    let sqlitePath = null;

    yauzl.open(zipPath, { lazyEntries: true }, (err, zipfile) => {
      if (err) return reject(err);

      zipfile.readEntry();

      zipfile.on("entry", (entry) => {
        const entryPath = path.join(outputDir, entry.fileName);

        if (/\/$/.test(entry.fileName)) {
          // Create directory
          fs.mkdirSync(entryPath, { recursive: true });
          zipfile.readEntry();
        } else {
          // Ensure directory exists
          fs.mkdirSync(path.dirname(entryPath), { recursive: true });

          zipfile.openReadStream(entry, (err, readStream) => {
            if (err) return reject(err);
            const writeStream = fs.createWriteStream(entryPath);
            readStream.pipe(writeStream);

            writeStream.on("finish", () => {
              if (entry.fileName.endsWith(".sqlite")) {
                sqlitePath = entryPath;
              }
              zipfile.readEntry();
            });
          });
        }
      });

      zipfile.on("end", () => {
        if (!sqlitePath) {
          return reject(new Error("❌ No .sqlite file found in ZIP"));
        }
        resolve(sqlitePath);
      });

      zipfile.on("error", reject);
    });
  });
}


// Apple CoreData Date Conversion
const parseAppleDate = (secondsSince2001) => {
  if (!secondsSince2001) return null;
  const base = new Date("2001-01-01T00:00:00Z");

  // Step 1: build UTC date
  const utcDate = new Date(base.getTime() + secondsSince2001 * 1000);

  // Step 2: add 5 hours 30 minutes for IST
  const istDate = addMinutes(utcDate, 330);

  // Step 3: format as "yyyy-MM-dd HH:mm:ss"
  return istDate.toISOString().replace("T", " ").slice(0, 19);
};

// Clean description
const cleanDescription = (desc) => {
  if (!desc) return "";
  return desc.replace(/#[\w-]+/g, "").trim();
};

// Fetch from SQLite
function getPayees(db) {
  return db
    .prepare(
      `SELECT DISTINCT ZNAME AS name FROM ZPAYEE WHERE ZNAME IS NOT NULL AND ZISACTIVE = 1`
    )
    .all();
}

function getCategories(db) {
  return db
    .prepare(
      `
    SELECT DISTINCT ZCATEGORYNAME AS name, ZCATEGORYTYPE AS type
    FROM ZTRANSACTIONCATEGORY
    WHERE ZCATEGORYNAME IS NOT NULL AND ZISACTIVE = 1
  `
    )
    .all();
}

function getTransactions(db, afterPk) {
  let query = `
    SELECT
      t.Z_PK as pk,
      t.ZTRANSACTIONAMOUNT AS amount,
      t.ZTRANSACTIONNAME AS name,
      t.ZTRANSACTIONDESCRIPTION AS description,
      t.ZTRANSACTIONDATE AS raw_date,
      t.ZTRANSACTIONTYPE AS type,
      IFNULL(c.ZCATEGORYNAME, '') AS category,
      IFNULL(p.ZNAME, '') AS payee
    FROM ZTRANSACTION t
    LEFT JOIN ZTRANSACTIONCATEGORY c ON t.ZTRANSACTIONCATEGORY = c.Z_PK
    LEFT JOIN ZPAYEE p ON t.ZPAYEE = p.Z_PK
    WHERE t.ZISACTIVE = 1 AND t.ZTRANSACTIONACCOUNT = 1
  `;
  if (afterPk !== null) {
    query += ` AND t.Z_PK > ?`;
    return db.prepare(query).all(afterPk);
  } else {
    return db.prepare(query).all();
  }
}

async function extractAndInsertCategories(rows) {
  const categorySet = new Set();
  rows.forEach((row) => {
    const name = row.name?.trim();
    const type = row.type?.trim() || "Expense";
    if (name && type) {
      categorySet.add(`${name}|||${type}`);
    }
  });

  const categories = Array.from(categorySet).map((e) => {
    const [name, type] = e.split("|||");
    return { name, type };
  });

  const { data: existing, error: fetchErr } = await supabase
    .from("categories")
    .select("name, type")
    .eq("user_id", USER_ID);
  if (fetchErr) throw new Error(`❌ Fetching categories: ${fetchErr.message}`);

  const existingSet = new Set(existing.map((c) => `${c.name}|||${c.type}`));
  const newCats = categories.filter(
    (c) => !existingSet.has(`${c.name}|||${c.type}`)
  );

  if (newCats.length > 0) {
    const toInsert = newCats.map((c) => ({ ...c, user_id: USER_ID }));
    const { error: insertErr } = await supabase
      .from("categories")
      .insert(toInsert);
    if (insertErr)
      throw new Error(`❌ Inserting categories: ${insertErr.message}`);
    console.log(`✅ Inserted ${newCats.length} new categories`);
  } else {
    console.log("ℹ️ No new categories to insert");
  }

  const { data: allCategories } = await supabase
    .from("categories")
    .select("id, name, type")
    .eq("user_id", USER_ID);
  const categoryMap = new Map();
  allCategories.forEach((cat) =>
    categoryMap.set(
      `${cat.name.toLowerCase()}-${cat.type.toLowerCase()}`,
      cat.id
    )
  );
  return categoryMap;
}

async function extractAndInsertPayees(rows) {
  const payeeSet = new Set();
  rows.forEach((row) => {
    const name = row.name?.trim();
    if (name) payeeSet.add(name);
  });

  const payees = Array.from(payeeSet);

  const { data: existing, error: fetchErr } = await supabase
    .from("payees")
    .select("name")
    .eq("user_id", USER_ID);
  if (fetchErr) throw new Error(`❌ Fetching payees: ${fetchErr.message}`);

  const existingSet = new Set(existing.map((p) => p.name));
  const newPayees = payees.filter((p) => !existingSet.has(p));
  if (newPayees.length > 0) {
    const toInsert = newPayees.map((name) => ({ name, user_id: USER_ID }));
    const { error: insertErr } = await supabase.from("payees").insert(toInsert);
    if (insertErr) throw new Error(`❌ Inserting payees: ${insertErr.message}`);
    console.log(`✅ Inserted ${newPayees.length} new payees`);
  } else {
    console.log("ℹ️ No new payees to insert");
  }

  const { data: allPayees } = await supabase
    .from("payees")
    .select("id, name")
    .eq("user_id", USER_ID);
  const payeeMap = new Map();
  allPayees.forEach((p) => payeeMap.set(p.name.toLowerCase(), p.id));
  return payeeMap;
}

async function clearTransactions() {
  const { error } = await supabase
    .from("transactions")
    .delete()
    .eq("user_id", USER_ID);
  if (error) throw new Error(`❌ Clearing transactions: ${error.message}`);
  console.log("🗑️ Cleared all existing transactions");
}

async function insertTransactions(rows, categoryMap, payeeMap) {
  const transactions = [];

  for (const row of rows) {
    const amount = parseFloat((row.amount || "0").toString().replace(/,/g, ""));
    const transaction_timestamp = parseAppleDate(row.raw_date);
    if (!transaction_timestamp || isNaN(amount)) continue;

    const rawCategory = row.category?.trim() || "";
    const rawType = row.type?.trim() || "Expense";
    const categoryKey = `${rawCategory.toLowerCase()}-${rawType.toLowerCase()}`;
    const category_id = categoryMap.get(categoryKey) || null;

    const rawPayee = row.payee?.trim() || "";
    const payee_id = rawPayee
      ? payeeMap.get(rawPayee.toLowerCase()) || null
      : null;

    if (rawPayee && !payee_id) {
      console.warn(`⚠️ Payee not found: "${rawPayee}"`);
    }

    transactions.push({
      user_id: USER_ID,
      amount,
      transaction_timestamp,
      description: cleanDescription(row.name || ""),
      created_at: transaction_timestamp,
      category_id,
      payee_id,
      type: rawType,
      category_name: rawCategory || null,
      payee_name: rawPayee || null,
    });
  }

  if (transactions.length === 0) {
    console.log("ℹ️ No transactions to insert");
    return;
  }

  const batchSize = 500;
  for (let i = 0; i < transactions.length; i += batchSize) {
    const chunk = transactions.slice(i, i + batchSize);
    const { error } = await supabase.from("transactions").insert(chunk);
    if (error) throw new Error(`❌ Inserting transactions: ${error.message}`);
  }

  console.log(`✅ Inserted ${transactions.length} transactions`);
}

async function run() {
  const startTime = Date.now();
  console.log("🚀 Starting iCloud JMoney sync...");


  const latestZip = findLatestZip(iCloudFolder);
  if (!latestZip) return;

  const localZipPath = copyZipToLocal(latestZip);

  const outputSQLitePath = await unzipAndReturnSQLitePath(localZipPath, localWorkingDir);

  console.log("🗄 Opening extracted SQLite file...",outputSQLitePath);
  const db = new Database(outputSQLitePath, { readonly: true });

  const payeesFromDB = getPayees(db);
  const categoriesFromDB = getCategories(db);

  let lastSyncedPk = loadLastSyncedId();
  if (FORCE || lastSyncedPk === null) {
    console.log("⚡ Force mode: fetching all transactions & clearing table before insert");
    await clearTransactions();
    lastSyncedPk = null;
  } else {
    console.log(`🔄 Incremental mode: fetching transactions where Z_PK > ${lastSyncedPk}`);
  }

  const transactionsFromDB = getTransactions(db, lastSyncedPk);
  console.log("📦 Fetched", transactionsFromDB.length, "transactions from SQLite");

  const categoryMap = await extractAndInsertCategories(categoriesFromDB);
  const payeeMap = await extractAndInsertPayees(payeesFromDB);

  await insertTransactions(transactionsFromDB, categoryMap, payeeMap);

  if (transactionsFromDB.length > 0) {
    const maxPk = Math.max(...transactionsFromDB.map(t => t.pk));
    saveLastSyncedId(maxPk);
  }

  db.close();

  // Safe cleanup
  if (fs.existsSync(localWorkingDir)) {
    fs.rmSync(localWorkingDir, { recursive: true, force: true });
    console.log("🧹 Cleaned up working directory: jmoney_process");
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`⏱️ Sync completed in ${duration} seconds`);
}

run().catch((err) => {
  console.error("❌ Error during sync:", err);
});
