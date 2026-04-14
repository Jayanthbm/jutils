const fs = require("fs");

// Load JSON
const data = JSON.parse(fs.readFileSync("stand_tickets.json", "utf-8"));

const statusSet = new Set();
const bucketSet = new Set();
const comboSet = new Set();

data.result.forEach((item) => {
  statusSet.add(item.status);
  bucketSet.add(item.bucket);
  comboSet.add(`${item.status}-${item.bucket}`);
});

// 1️⃣ Unique Statuses
console.log("\n=== Unique Statuses ===");
[...statusSet].forEach((s) => console.log(s));

// 2️⃣ Unique Buckets
console.log("\n=== Unique Buckets ===");
[...bucketSet].forEach((b) => console.log(b));

// 3️⃣ Status-Bucket Combinations
console.log("\n=== Status-Bucket Combinations ===");
[...comboSet].forEach((c) => {
  const [status, bucket] = c.split("-");
  console.log({ status, bucket });
});

// ================= NEW FILTER SECTION =================

// 👉 Define filters here
let buckets = ["O"]; // example: ["O", "U"]
let statuses = ["O"]; // example: ["S", "R"]

// Apply filter
const filtered = data.result.filter((item) => {
  const bucketMatch = buckets.length === 0 || buckets.includes(item.bucket);
  const statusMatch = statuses.length === 0 || statuses.includes(item.status);
  return bucketMatch && statusMatch;
});

// Print filtered seats
console.log(`\n=== Filtered Seats === with bucket ${buckets} and status ${statuses}`);

filtered.forEach((item) => {
  console.log({
    seat_No: item.seat_No,
    i_Id: item.i_Id,
    row: item.row,
    status: item.status,
    bucket: item.bucket,
  });
});

// Optional count
console.log(`\nTotal matching seats: ${filtered.length}`);
