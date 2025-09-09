require("dotenv").config();

const fs = require("fs");
const csv = require("csv-parser");
const { createClient } = require("@supabase/supabase-js");
const { parse, format } = require("date-fns");

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const USER_ID = "b926c3c7-062e-4786-b022-957e725f1a8a";

const inputFile = "money_coach_exported.csv";
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Parse date string into proper format
const parseDate = (dateStr) => {
  if (!dateStr || dateStr.trim() === "") return null;
  try {
    return format(
      parse(
        dateStr.trim().replace(/\s+/g, " "),
        "dd/MM/yy, h:mm a",
        new Date()
      ),
      "yyyy-MM-dd HH:mm:ss"
    );
  } catch {
    return null;
  }
};

const cleanDescription = (desc) => {
  if (!desc) return "";
  return desc.replace(/#[\w-]+/g, "").trim();
};

async function extractAndInsertCategories(rows) {
  const categorySet = new Set();
  rows.forEach((row) => {
    const name = row["Category"]?.trim();
    const type = row["Type"]?.trim();
    if (name && type && ["Income", "Expense"].includes(type)) {
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
    const name = row["Person / Company"]?.trim();
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
    const amount = parseFloat((row["Amount"] || "0").replace(/,/g, ""));
    const transaction_timestamp = parseDate(row["Date"]);
    if (!transaction_timestamp || isNaN(amount)) continue;

    const rawCategory = row["Category"]?.trim() || "";
    const rawType = row["Type"]?.trim() || "Expense";
    const categoryKey = `${rawCategory.toLowerCase()}-${rawType.toLowerCase()}`;
    const category_id = categoryMap.get(categoryKey) || null;

    const rawPayee = row["Person / Company"]?.trim() || "";
    const payee_id = rawPayee ? payeeMap.get(rawPayee.toLowerCase()) || null : null;

    // 🪵 Debug if payee name is present but no ID found
    if (rawPayee && !payee_id) {
      console.warn(`⚠️ Payee not found: "${rawPayee}"`);
    }

    transactions.push({
      user_id: USER_ID,
      amount,
      transaction_timestamp,
      description: cleanDescription(row["Description"]),
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
    console.log("🚀 Starting full import process...");

    const rows = await new Promise((resolve, reject) => {
      const data = [];
      fs.createReadStream(inputFile)
        .pipe(csv({ separator: ";" }))
        .on("data", (row) => data.push(row))
        .on("end", () => resolve(data))
        .on("error", reject);
    });

    const categoryMap = await extractAndInsertCategories(rows);
    const payeeMap = await extractAndInsertPayees(rows);
    await clearTransactions();
    await insertTransactions(rows, categoryMap, payeeMap);

    console.log("🎉 All done!");
  } catch (err) {
    console.error("❌ Error:", err.message);
  }
}

run();
