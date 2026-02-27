const { google } = require("googleapis");

const auth = new google.auth.GoogleAuth({
  keyFile: "./service-account.json",
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

async function replaceSheet(spreadsheetId, sheetName, rows) {
  const client = await auth.getClient();
  const sheets = google.sheets({ version: "v4", auth: client });

  // 1️⃣ Clear existing data
  await sheets.spreadsheets.values.clear({
    spreadsheetId,
    range: `${sheetName}!A:Z`,
  });

  // 2️⃣ Write new data
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${sheetName}!A1`,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: rows,
    },
  });

  console.log("✅ Google Sheet replaced successfully");
}

module.exports = { replaceSheet };
