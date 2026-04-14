const axios = require("axios");
const readline = require("readline");

// ================= CONFIG =================
const AUTH_TOKEN ="";

const EVENT_ID = 3;
const EVENT_GROUP_ID = 1;

const BASE_URL = "https://rcbscaleapi.ticketgenie.in";

const ticketsRequired = 2;
const INTERVAL_MS = 3000;
const MAX_RUNS = 10;

// ================= HEADERS =================
const HEADERS = {
  accept: "application/json, text/plain, */*",
  "accept-language": "en-GB,en-US;q=0.9,en;q=0.8",
  origin: "https://shop.royalchallengers.com",
  referer: "https://shop.royalchallengers.com/",
  "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
  Authorization: `Bearer ${AUTH_TOKEN}`,
};

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

// ================= INPUT =================
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function ask(question) {
  return new Promise((res) => rl.question(question, res));
}

// ================= MAIN =================
async function start() {
  try {
    // 1️⃣ Fetch stands
    let standRes;
    try {
      standRes = await axios.get(`${BASE_URL}/ticket/standslist/${EVENT_ID}`, {
        headers: HEADERS,
      });
    } catch (err) {
      exitWithError("standslist API failed", err);
    }

    if (standRes.status !== 200) {
      exitWithError("standslist returned non-200");
    }

    const stands = standRes.data?.result?.stands || [];

    if (!stands.length) {
      exitWithError("No available stands");
    }

    console.log("\n🎟 Available Stands:\n");
    stands.forEach((s) => {
      console.log(`${s.stand_Code} - ${s.stand_Name} - ₹${s.price}`);
    });

    // 2️⃣ User selection
    const input = await ask("\nEnter stand IDs (comma separated): ");
    rl.close();

    const selectedStands = input
      .split(",")
      .map((x) => parseInt(x.trim()))
      .filter(Boolean);

    if (!selectedStands.length) {
      exitWithError("No valid stand selected");
    }

    console.log("\n✅ Selected:", selectedStands);

    // ================= LOOP =================
    for (let runCount = 1; runCount <= MAX_RUNS; runCount++) {
      console.log(`\n🔁 Run ${runCount}/${MAX_RUNS}`);

      for (const standId of selectedStands) {
        try {
          console.log(`🔍 Checking Stand: ${standId}`);

          let seatRes;
          try {
            seatRes = await axios.get(
              `${BASE_URL}/ticket/seatlist/1/${EVENT_ID}/${standId}`,
              { headers: HEADERS },
            );
          } catch (err) {
            exitWithError("seatlist API failed", err);
          }

          if (seatRes.status !== 200) {
            exitWithError("seatlist returned non-200");
          }

          const availableSeats = seatRes.data?.result?.filter(
            (s) => s.bucket === "O" && s.status === "O",
          );

          console.log(`Available: ${availableSeats.length}`);

          if (availableSeats.length < ticketsRequired) continue;

          let selectedSeats =
            findContinuousSeats(availableSeats, ticketsRequired) ||
            findClosestSeats(availableSeats, ticketsRequired);

          if (!selectedSeats) continue;

          console.log(
            "🪑 Seats:",
            selectedSeats.map((s) => `${s.row}-${s.seat_No}`).join(", "),
          );

          const payload = {
            eventGroupId: EVENT_GROUP_ID,
            eventId: EVENT_ID,
            standId,
            qty: selectedSeats.length, // ✅ fixed
            seatNos: selectedSeats
              .map((s) => `${s.row}-${s.seat_No}`)
              .join(","),
            seatIds: selectedSeats.map((s) => s.i_Id).join(","),
          };

          console.log("🪑 Trying payload:", payload);

          let cartRes;
          try {
            cartRes = await axios.post(
              `${BASE_URL}/checkout/ticketaddtocart`,
              payload,
              {
                headers: {
                  ...HEADERS,
                  "content-type": "application/json",
                },
              },
            );
          } catch (err) {
            exitWithError("addtocart API failed", err);
          }

          if (cartRes.status !== 200) {
            exitWithError("addtocart returned non-200");
          }

          console.log("🛒 Response:", cartRes.data);

          // ✅ SIMPLE SUCCESS CHECK
          const status = cartRes.data?.status;

          if (status === "Success" || status === "success") {
            console.log("✅ SUCCESS — exiting");
            process.exit(0);
          }

          console.log("⚠️ Not successful, continuing...");
        } catch (err) {
          exitWithError(`Error in stand ${standId}`, err);
        }
      }

      await sleep(INTERVAL_MS);
    }

    console.log("\n❌ Max attempts reached. Exiting...");
    process.exit(0);
  } catch (err) {
    exitWithError("Fatal error", err);
  }
}

start();
