const axios = require("axios");
const readline = require("readline");

// ================= CONFIG =================
const MAX_TICKETS_PER_AC = 2;
const NO_OF_TICKETS = 4;

const ACCESS_TOKEN1 = "";
const ACCESS_TOKEN2 = "";
const ACCESS_TOKEN3 = "";

const TOKENS = [ACCESS_TOKEN1, ACCESS_TOKEN2, ACCESS_TOKEN3];

const EVENT_ID = 3;
const EVENT_GROUP_ID = 1;
const BASE_URL = "https://rcbscaleapi.ticketgenie.in";

const INTERVAL_MS = 3000;
const MAX_RUNS = 10;

// ================= VALIDATION =================
if (Math.ceil(NO_OF_TICKETS / MAX_TICKETS_PER_AC) > 3) {
  console.error("❌ Too many tickets for available accounts");
  process.exit(1);
}

// ================= HELPERS =================
function sleep(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

function exitWithError(msg, err) {
  console.error("❌", msg);
  if (err) {
    console.error(err.response?.status, err.response?.data || err.message);
  }
  process.exit(1);
}

function getHeaders(token) {
  return {
    accept: "application/json, text/plain, */*",
    origin: "https://shop.royalchallengers.com",
    referer: "https://shop.royalchallengers.com/",
    "user-agent": "Mozilla/5.0",
    Authorization: `Bearer ${token}`,
  };
}

// ================= SEAT LOGIC =================
function findContinuousSeats(seats, count) {
  const grouped = {};

  seats.forEach((s) => {
    if (!grouped[s.row]) grouped[s.row] = [];
    grouped[s.row].push(s);
  });

  const sortedRows = Object.keys(grouped).sort(); // lower rows first

  let best = null;
  let bestScore = -Infinity;

  for (const row of sortedRows) {
    const rowSeats = [...grouped[row]].sort((a, b) => a.seat_No - b.seat_No);

    if (rowSeats.length < count) continue;

    for (let i = 0; i <= rowSeats.length - count; i++) {
      const group = rowSeats.slice(i, i + count);

      let isContinuous = true;
      for (let j = 1; j < group.length; j++) {
        if (group[j].seat_No !== group[j - 1].seat_No + 1) {
          isContinuous = false;
          break;
        }
      }

      if (!isContinuous) continue;

      const midSeat = group[Math.floor(group.length / 2)].seat_No;
      const score = midSeat;

      if (score > bestScore) {
        bestScore = score;
        best = group;
      }
    }
  }

  return best;
}

function findClosestSeats(seats, count) {
  if (seats.length < count) return null;

  const sorted = [...seats].sort((a, b) => {
    if (a.row === b.row) return a.seat_No - b.seat_No;
    return a.row.localeCompare(b.row);
  });

  let best = null;
  let bestScore = -Infinity;

  for (let i = 0; i <= sorted.length - count; i++) {
    const group = sorted.slice(i, i + count);

    let gap = 0;

    for (let j = 1; j < group.length; j++) {
      if (group[j].row === group[j - 1].row) {
        gap += Math.abs(group[j].seat_No - group[j - 1].seat_No);
      } else {
        gap += 1000;
      }
    }

    const midSeat = group[Math.floor(group.length / 2)].seat_No;
    const score = midSeat * 10 - gap;

    if (score > bestScore) {
      bestScore = score;
      best = group;
    }
  }

  return best;
}

function splitSeats(seats, perAccount) {
  const result = [];
  let i = 0;

  while (i < seats.length) {
    result.push(seats.slice(i, i + perAccount));
    i += perAccount;
  }

  return result;
}

// ================= INPUT =================
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function ask(question) {
  return new Promise((res) => rl.question(question, res));
}

// ================= API =================
async function fetchStands() {
  try {
    const res = await axios.get(`${BASE_URL}/ticket/standslist/${EVENT_ID}`, {
      headers: getHeaders(ACCESS_TOKEN1),
    });

    if (res.status !== 200) exitWithError("standslist failed");

    return res.data?.result?.stands || [];
  } catch (err) {
    exitWithError("standslist API failed", err);
  }
}

async function fetchSeats(standId) {
  try {
    const res = await axios.get(
      `${BASE_URL}/ticket/seatlist/1/${EVENT_ID}/${standId}`,
      { headers: getHeaders(ACCESS_TOKEN1) },
    );

    if (res.status !== 200) exitWithError("seatlist failed");

    return res.data.result.filter((s) => s.bucket === "O" && s.status === "O");
  } catch (err) {
    exitWithError("seatlist API failed", err);
  }
}

async function addToCart(token, standId, seats) {
  const payload = {
    eventGroupId: EVENT_GROUP_ID,
    eventId: EVENT_ID,
    standId,
    qty: seats.length,
    seatNos: seats.map((s) => `${s.row}-${s.seat_No}`).join(","),
    seatIds: seats.map((s) => s.i_Id).join(","),
  };

  console.log(
    `🪑 [${token.slice(0, 5)}...]`,
    seats.map((s) => `${s.row}-${s.seat_No}`).join(", "),
  );

  try {
    const res = await axios.post(
      `${BASE_URL}/checkout/ticketaddtocart`,
      payload,
      {
        headers: {
          ...getHeaders(token),
          "content-type": "application/json",
        },
      },
    );

    if (res.status !== 200) exitWithError("addtocart failed");

    console.log(`✅ Success for ${token.slice(0, 5)}...`);
  } catch (err) {
    exitWithError("addtocart API failed", err);
  }
}

// ================= MAIN =================
async function start() {
  const stands = await fetchStands();

  if (!stands.length) exitWithError("No available stands");

  console.log("\n🎟 Available Stands:\n");
  stands.forEach((s) => {
    console.log(`${s.stand_Code} - ${s.stand_Name} - ₹${s.price}`);
  });

  const input = await ask("\nEnter stand IDs (comma separated): ");
  rl.close();

  const selectedStands = input
    .split(",")
    .map((x) => parseInt(x.trim()))
    .filter(Boolean);

  if (!selectedStands.length) exitWithError("Invalid stand selection");

  console.log("\n✅ Selected:", selectedStands);

  for (let run = 1; run <= MAX_RUNS; run++) {
    console.log(`\n🔁 Run ${run}/${MAX_RUNS}`);

    for (const standId of selectedStands) {
      const seats = await fetchSeats(standId);

      if (seats.length < NO_OF_TICKETS) {
        console.log("❌ Not enough seats");
        continue;
      }

      const selected =
        findContinuousSeats(seats, NO_OF_TICKETS) ||
        findClosestSeats(seats, NO_OF_TICKETS);

      if (!selected) {
        console.log("❌ No suitable seats");
        continue;
      }

      console.log(
        "🎯 Selected:",
        selected.map((s) => `${s.row}-${s.seat_No}`).join(", "),
      );

      const chunks = splitSeats(selected, MAX_TICKETS_PER_AC);

      const tasks = chunks.map((chunk, i) =>
        addToCart(TOKENS[i], standId, chunk),
      );

      await Promise.all(tasks);

      console.log("🎉 ALL BOOKINGS DONE");
      process.exit(0);
    }

    await sleep(INTERVAL_MS);
  }

  console.log("❌ Max attempts reached");
  process.exit(0);
}

start();
