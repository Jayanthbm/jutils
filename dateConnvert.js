const fs = require("fs");
const { DateTime } = require("luxon");
// Function to convert UTC date to IST and format it
function convertToIST(dateString) {
  const utcDateTime = DateTime.fromISO(dateString, { zone: "UTC" });
  const istDateTime = utcDateTime.setZone("Asia/Kolkata");
  return istDateTime.toFormat("yyyy-MM-dd HH:mm:ss");
}

// Read the file asynchronously
fs.readFile("sample.txt", "utf8", (err, data) => {
  if (err) {
    console.error("Error reading the file:", err);
    return;
  }

  // Split the data into an array of date strings
  const dateStrings = data
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line !== "");

  // Convert each date to IST and format it
  const formattedDates = dateStrings.map(convertToIST);

  // Write the formatted dates to output.txt
  fs.writeFile("output.txt", formattedDates.join("\n"), "utf8", (err) => {
    if (err) {
      console.error("Error writing to the file:", err);
      return;
    }
    console.log("Formatted dates have been written to output.txt");
  });
});
