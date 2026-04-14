import express from "express";
import fetch from "node-fetch";

const app = express();
const PORT = 3000;

const SOURCE_API = "https://rcbscaleapi.ticketgenie.in/ticket/eventlist/0";

// Proxy endpoint
app.get("/tickets", async (req, res) => {
  try {
    const response = await fetch(SOURCE_API, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "en-US,en;q=0.9",
        "Referer": "https://ticketgenie.in/",
      },
    });

    const text = await response.text();

    res.status(response.status).send(text);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Proxy running on http://localhost:${PORT}`);
});