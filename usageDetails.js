const fs = require("fs");
const { exec } = require("child_process");

// Get the input parameter (maximum allowed data in GB)
// Try to get maxData from CLI, otherwise fallback to op.txt
let maxData = process.argv[2] ? parseFloat(process.argv[2]) : null;

if (maxData === null) {
  try {
    const savedValue = fs.readFileSync("op.txt", "utf8").trim();
    if (savedValue) {
      maxData = parseFloat(savedValue);
      console.log("Using maxData from op.txt:", maxData);
    }
  } catch (err) {
    console.error("No input provided and op.txt not found.");
    process.exit(1);
  }
}

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

  // Calculate remaining data
  const dataRemaining = maxData - totalUsageInGB;
  const formattedRemaining = dataRemaining.toFixed(2);
  console.log("Data Remaining:", formattedRemaining, "GB");

  // Save result to op.txt
  fs.writeFile("op.txt", formattedRemaining, (err) => {
    if (err) {
      console.error("Error writing to op.txt:", err);
    } else {
      console.log("Data remaining saved to op.txt");
    }
  });

  // Copy to mac clipboard using pbcopy
  exec(`echo "${formattedRemaining}" | pbcopy`, (err) => {
    if (err) {
      console.error("Error copying to clipboard:", err);
    } else {
      console.log("Copied to clipboard:", formattedRemaining);
    }
  });
});
