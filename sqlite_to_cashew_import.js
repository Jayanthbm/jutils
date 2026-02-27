// sqlite_to_cashew_import.js

require("dotenv").config();
const { addMinutes } = require("date-fns");
const { parse } = require("json2csv");
const Database = require("better-sqlite3");

const fs = require("fs");
const path = require("path");
const yauzl = require("yauzl");
const { replaceSheet } = require("./googleSheetsReplace");

//
// ------------------------------------------------------
// CONFIG
// ------------------------------------------------------
//
const iCloudFolder = path.resolve(
  process.env.HOME,
  "Library/Mobile Documents/iCloud~com~duuro~moneyCoachV3/Documents"
);

const workingDir = path.resolve(__dirname, "cashew_extract");
const OUTPUT_CSV = path.join(__dirname, `cashew_import.csv`);

//
// ------------------------------------------------------
// HELPERS
// ------------------------------------------------------
//

// Find latest ZIP in iCloud
function findLatestZip(folder) {
  const files = fs
    .readdirSync(folder)
    .filter((f) => f.endsWith(".zip"))
    .map((f) => {
      const full = path.join(folder, f);
      return { name: f, path: full, mtime: fs.statSync(full).mtime };
    });

  if (files.length === 0) return null;

  return files.sort((a, b) => b.mtime - a.mtime)[0];
}

// Copy ZIP to local folder
function copyZip(zipInfo) {
  if (!fs.existsSync(workingDir)) fs.mkdirSync(workingDir, { recursive: true });
  const dest = path.join(workingDir, zipInfo.name);
  fs.copyFileSync(zipInfo.path, dest);
  return dest;
}

// Unzip & return .sqlite file path
function unzipAndReturnSQLite(zipPath, outDir) {
  return new Promise((resolve, reject) => {
    let sqlitePath = null;

    yauzl.open(zipPath, { lazyEntries: true }, (err, zip) => {
      if (err) return reject(err);
      zip.readEntry();

      zip.on("entry", (entry) => {
        const entryPath = path.join(outDir, entry.fileName);

        if (/\/$/.test(entry.fileName)) {
          fs.mkdirSync(entryPath, { recursive: true });
          zip.readEntry();
        } else {
          fs.mkdirSync(path.dirname(entryPath), { recursive: true });

          zip.openReadStream(entry, (err, readStream) => {
            if (err) return reject(err);

            const writeStream = fs.createWriteStream(entryPath);
            readStream.pipe(writeStream);

            writeStream.on("finish", () => {
              if (entry.fileName.endsWith(".sqlite")) {
                sqlitePath = entryPath;
              }
              zip.readEntry();
            });
          });
        }
      });

      zip.on("end", () => {
        if (!sqlitePath) reject("No sqlite file found");
        else resolve(sqlitePath);
      });
    });
  });
}

// Apple CoreData → Normal Date
function parseAppleDate(secondsSince2001) {
  if (!secondsSince2001) return null;

  const base = new Date("2001-01-01T00:00:00Z");

  // Step 1: UTC date
  const utc = new Date(base.getTime() + secondsSince2001 * 1000);

  // Step 2: Convert to IST (+5:30)
  const ist = addMinutes(utc, 330);

  return ist.toISOString().replace("T", " ").replace("Z", "");
}

// Clean description text
function cleanDescription(desc) {
  if (!desc) return "";
  return desc.replace(/#[\w-]+/g, "").trim();
}

//
// ------------------------------------------------------
// READ FROM SQLITE
// ------------------------------------------------------
//

// Categories
function getCategories(db) {
  return db
    .prepare(
      `SELECT Z_PK, ZCATEGORYNAME AS name, ZCATEGORYTYPE AS type
     FROM ZTRANSACTIONCATEGORY
     WHERE ZISACTIVE = 1 AND ZCATEGORYNAME IS NOT NULL`
    )
    .all();
}

// Payees
function getPayees(db) {
  return db
    .prepare(
      `SELECT Z_PK, ZNAME AS name
     FROM ZPAYEE
     WHERE ZISACTIVE = 1 AND ZNAME IS NOT NULL`
    )
    .all();
}

// Transactions
function getTransactions(db) {
  return db
    .prepare(
      `SELECT
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
     WHERE t.ZISACTIVE = 1 AND t.ZTRANSACTIONACCOUNT = 5`
    )
    .all();
}

function isOnOrAfter(dateStr, filterDateStr) {
  if (!filterDateStr) return true; // No filter → allow all

  const d1 = new Date(dateStr);
  const d2 = new Date(filterDateStr + "T00:00:00");

  return d1 >= d2;
}

//
// ------------------------------------------------------
// MAIN
// ------------------------------------------------------
//

async function run() {
  console.log("🚀 Generating Cashew CSV import...");

  // Parse CLI args
  let FROM_DATE = null;
  process.argv.forEach((arg) => {
    if (arg.startsWith("--from=")) {
      FROM_DATE = arg.split("=")[1].trim();
      console.log("📅 Filtering from date:", FROM_DATE);
    }
  });

  const zip = findLatestZip(iCloudFolder);
  if (!zip) {
    console.log("❌ No ZIP found in iCloud");
    return;
  }

  console.log("📦 Latest ZIP:", zip.name);

  const localZip = copyZip(zip);
  const sqlitePath = await unzipAndReturnSQLite(localZip, workingDir);

  console.log("📚 SQLite:", sqlitePath);

  const db = new Database(sqlitePath, { readonly: true });

  const categories = getCategories(db);
  const transactions = getTransactions(db);

  console.log("📦 Transactions:", transactions.length);

  //
  // ---------------- CSV BUILD ----------------
  //
  const csvRows = [];

  for (const t of transactions) {
    const date = parseAppleDate(t.raw_date);

    // ⛔ skip if filtering by date and record is before FROM_DATE
    if (!isOnOrAfter(date, FROM_DATE)) continue;

    let amount = parseFloat((t.amount || "0").toString().replace(/,/g, ""));

    // ⭐ Make expense negative
    if (t.type === "Expense") {
      amount = -Math.abs(amount);
    } else {
      amount = Math.abs(amount);
    }

    csvRows.push({
      Date: date || "",
      Amount: amount,
      Category: t.category || "",
      Title: cleanDescription(t.name) || "",
      Note: cleanDescription(t.description) || "",
      Account: "", // always blank
    });
  }

  // Convert → CSV
  const csv = parse(csvRows);
  fs.writeFileSync(OUTPUT_CSV, csv);
  console.log("📄 CSV saved:", OUTPUT_CSV);

  const SPREADSHEET_ID = "1MIBz5ZIQ750FuXekXnOWxodZa8zfT0uqV5ooOHXiO_s"; // from URL
  const SHEET_NAME = "Transactions"; // tab name

  const sheetRows = [
    ["Date", "Amount", "Category", "Title", "Note", "Account"],
    ...csvRows.map((r) => [
      r.Date,
      r.Amount,
      r.Category,
      r.Title,
      r.Note,
      r.Account,
    ]),
  ];

  await replaceSheet(SPREADSHEET_ID, SHEET_NAME, sheetRows);

  // Cleanup
  fs.rmSync(workingDir, { recursive: true, force: true });

  console.log("✨ Done!");
}

run().catch((err) => console.error("❌ Error:", err));
