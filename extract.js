const fs = require("fs");

// Read the file asynchronously
fs.readFile("sample.txt", "utf8", (err, data) => {
  if (err) {
    console.error("Error reading the file:", err);
    return;
  }

  // Split the data into an array of categories
  const categories = data
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line !== "");

  // Get unique categories
  const uniqueCategories = [...new Set(categories)];

  // Write the unique categories to output.txt
  fs.writeFile("output.txt", uniqueCategories.join("\n"), "utf8", (err) => {
    if (err) {
      console.error("Error writing to the file:", err);
      return;
    }
    console.log("Unique categories have been written to output.txt");
  });
});
