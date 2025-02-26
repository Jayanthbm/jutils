const fs = require("fs");

// Get the input parameter (maximum allowed data in GB)
const maxData = process.argv[2] ? parseFloat(process.argv[2]) : null;

// Read the content of usage.txt
fs.readFile("usage.txt", "utf8", (err, data) => {
  if (err) {
    console.error("Error reading the file:", err);
    return;
  }

  // Split the data into lines and clean up unnecessary text
  const lines = data.split("\n").filter((line) => {
    return (
      !line.startsWith("Session end time:") &&
      line.trim() !== "LOCAL" &&
      !line.includes("₹ 0.00")
    );
  });

  // Initialize arrays for GB and MB values
  const gbArray = [];
  const mbArray = [];

  // Process each line to extract GB and MB values
  lines.forEach((line) => {
    const trimmedLine = line.trim();

    if (trimmedLine.endsWith("GB")) {
      gbArray.push(parseFloat(trimmedLine.replace("GB", "").trim()));
    } else if (trimmedLine.endsWith("MB")) {
      mbArray.push(parseFloat(trimmedLine.replace("MB", "").trim()));
    }
  });

  // Calculate total usage in GB
  const totalMBtoGB = mbArray.reduce((sum, mb) => sum + mb / 1024, 0); // Convert MB to GB and sum
  const totalGB = gbArray.reduce((sum, gb) => sum + gb, 0); // Sum of GB values
  const totalUsageInGB = totalMBtoGB + totalGB;

  // Print the arrays and total usage
  console.log("GB Array:", gbArray);
  console.log("MB Array:", mbArray);
  console.log("Total Usage in GB:", totalUsageInGB.toFixed(2));

  // Calculate remaining data only if maxData is provided
  if (maxData !== null) {
    const dataRemaining = maxData - totalUsageInGB;
    console.log("Data Remaining:", dataRemaining.toFixed(2), "GB");
  }
});
