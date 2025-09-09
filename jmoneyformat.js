const fs = require("fs");
const csv = require("csv-parser");
const { format, parse } = require("date-fns");

// Input & Output file paths
const inputFile = "money_coach_exported.csv";
const outputFile = "jmoney.csv";
const categoryFile = "category.json";
const payeeFile = "payees.json";

// User ID (constant for all transactions)
const USER_ID = "b926c3c7-062e-4786-b022-957e725f1a8a";

// Load category and payee data
const categoryMap = new Map();
const payeeMap = new Map();

// Load category.json
const categories = JSON.parse(fs.readFileSync(categoryFile, "utf8"));
categories.forEach((cat) => {
  const key = `${cat.name.toLowerCase()}-${cat.type.toLowerCase()}`;
  categoryMap.set(key, { id: cat.id, type: cat.type });
});

// Load payees.json
const payees = JSON.parse(fs.readFileSync(payeeFile, "utf8"));
payees.forEach((payee) => {
  payeeMap.set(payee.name.toLowerCase(), payee.id);
});

// Function to clean up description (remove #tags)
const cleanDescription = (description) => {
  if (!description) return "";
  return description.replace(/#[\w-]+/g, "").trim(); // Removes tags like #TAG or #TAG-123
};

// Function to safely parse date strings
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
  } catch (error) {
    console.error(`⚠️ Invalid date format: "${dateStr}" - Skipping this row.`);
    return null;
  }
};

// Read CSV file and process data
const transactions = [];
fs.createReadStream(inputFile)
  .pipe(csv({ separator: ";" })) // MoneyCoach CSV uses semicolon separator
  .on("data", (row) => {
    try {
      // Parse transaction date safely
      const transactionTimestamp = parseDate(row["Date"]);
      if (!transactionTimestamp) return; // Skip row if date is invalid

      // Parse amount (remove commas)
      const amount = row["Amount"] ? row["Amount"].replace(/,/g, "") : "0";

      // Get category ID & type
      const categoryKey = `${row["Category"].trim().toLowerCase()}-${row[
        "Type"
      ].toLowerCase()}`;
      const category = categoryMap.get(categoryKey) || {
        id: null,
        type: row["Type"] || "Expense",
      };

      if (category.id === null || category.id === undefined) {
        console.log("categoryKey", categoryKey);
      }

      // Get payee ID (if available)
      const payeeId = row["Person / Company"]
        ? payeeMap.get(row["Person / Company"].toLowerCase()) || null
        : null;

      // Clean description
      const cleanedDescription = cleanDescription(row["Description"]);

      // Create transaction object
      transactions.push({
        user_id: USER_ID,
        amount,
        transaction_timestamp: transactionTimestamp,
        description: cleanedDescription,
        created_at: transactionTimestamp,
        category_id: category.id,
        payee_id: payeeId,
        type: category.type,
      });
    } catch (error) {
      console.error("⚠️ Error processing row:", row, error);
    }
  })
  .on("end", () => {
    console.log("✅ CSV file successfully processed. Writing output file...");

    // Write to new CSV file
    const outputStream = fs.createWriteStream(outputFile);
    outputStream.write(
      "user_id,amount,transaction_timestamp,description,created_at,category_id,payee_id,type\n"
    );

    transactions.forEach((tx) => {
      outputStream.write(
        `${tx.user_id},${tx.amount},${tx.transaction_timestamp},"${
          tx.description
        }",${tx.created_at},${tx.category_id || ""},${tx.payee_id || ""},${
          tx.type
        }\n`
      );
    });

    outputStream.end();
    console.log(
      `✅ jmoney.csv successfully created with ${transactions.length} transactions!`
    );
  });
