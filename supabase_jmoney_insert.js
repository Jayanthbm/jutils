require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");
const Database = require("better-sqlite3");
const path = require("path");

// Setup Supabase
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const USER_ID = "b926c3c7-062e-4786-b022-957e725f1a8a";
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Open SQLite DB
const dbPath = path.join(__dirname, "GetRichV1.sqlite");
const db = new Database(dbPath, { readonly: true });

// Apple CoreData Date Conversion
const parseAppleDate = (secondsSince2001) => {
  if (!secondsSince2001) return null;
  const base = new Date("2001-01-01T00:00:00Z");
  return new Date(base.getTime() + secondsSince2001 * 1000).toISOString().replace("T", " ").slice(0, 19);
};

// Clean description
const cleanDescription = (desc) => {
  if (!desc) return "";
  return desc.replace(/#[\w-]+/g, "").trim();
};

// Fetch from SQLite
function getPayees() {
  return db.prepare(`SELECT DISTINCT ZNAME AS name FROM ZPAYEE WHERE ZNAME IS NOT NULL`).all();
}

function getCategories() {
  return db.prepare(`
    SELECT DISTINCT ZCATEGORYNAME AS name, ZCATEGORYTYPE AS type
    FROM ZTRANSACTIONCATEGORY
    WHERE ZCATEGORYNAME IS NOT NULL
  `).all();
}

function getTransactions() {

  // Run the actual query
  const rows = db.prepare(`
    SELECT
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
  `).all();

  return rows;
}


async function extractAndInsertCategories(rows) {
  const categorySet = new Set();
  rows.forEach((row) => {
    const name = row.name?.trim();
    const type = (row.type?.trim() || "Expense");
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
    const payee_id = rawPayee ? payeeMap.get(rawPayee.toLowerCase()) || null : null;

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
  try {
    console.log("🚀 Starting import from SQLite...");

    const payeesFromDB = getPayees();
    const categoriesFromDB = getCategories();
    const transactionsFromDB = getTransactions();

    console.log("📦 Fetched", transactionsFromDB.length, "transactions from SQLite");

    const categoryMap = await extractAndInsertCategories(categoriesFromDB);
    const payeeMap = await extractAndInsertPayees(payeesFromDB);

    await clearTransactions();
    await insertTransactions(transactionsFromDB, categoryMap, payeeMap);

    console.log("🎉 All done!");
  } catch (err) {
    console.error("❌ Error:", err.message);
  }
}

run();
