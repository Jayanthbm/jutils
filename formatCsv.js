const fs = require("fs");
const csv = require("csv-parser");
const { DateTime } = require("luxon");
const path = require("path");

// Function to convert UTC date to IST and format it
function convertToIST(dateString) {
  const date = DateTime.fromISO(dateString, { zone: "utc" });
  const istDate = date.setZone("Asia/Kolkata");
  return istDate.toFormat("yyyy-MM-dd HH:mm:ss");
}

// Create the expenses directory if it doesn't exist
const expensesDir = path.join(__dirname, "expenses");
if (!fs.existsSync(expensesDir)) {
  fs.mkdirSync(expensesDir);
}

const results = {};

// Read and parse the CSV file
fs.createReadStream("exported.csv")
  .pipe(csv({ separator: ";" }))
  .on("data", (data) => {
    // Process each row
    const istDate = convertToIST(data["Date (ISO 8601)"]);
    const dateObj = DateTime.fromFormat(istDate, "yyyy-MM-dd HH:mm:ss", {
      zone: "Asia/Kolkata",
    });
    const monthKey = dateObj.toFormat("yyyy_MM");

    if (!results[monthKey]) {
      results[monthKey] = [];
    }

    const formattedRow = {
      Date: istDate,
      Type: data["Type"],
      Category: data["Category"],
      Amount: data["Amount"],
      Payee: data["Person / Company"],
      Description: data["Description"],
    };
    results[monthKey].push(formattedRow);
  })
  .on("end", () => {
    // Write the formatted data to separate CSV files for each month
    for (const [monthKey, rows] of Object.entries(results)) {
      const header = "Date;Type;Category;Amount;Payee;Description\n";
      const csvContent = rows
        .map(
          (row) =>
            `${row.Date};${row.Type};${row.Category};${row.Amount};${row.Payee};${row.Description};`
        )
        .join("\n");

      const filePath = path.join(expensesDir, `${monthKey}_expenses.csv`);
      fs.writeFile(filePath, header + csvContent, "utf8", (err) => {
        if (err) {
          console.error(`Error writing to the file ${filePath}:`, err);
          return;
        }
        console.log(`Formatted data has been written to ${filePath}`);
      });
    }
  });
