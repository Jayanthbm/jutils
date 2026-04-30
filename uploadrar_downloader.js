// uploadrar_downloader.js
//
// Usage:
//
// Interactive:
// node uploadrar_downloader.js
//
// Direct URL:
// node uploadrar_downloader.js --url=https://uploadrar.com/nitnnrq30z8d
//
// Requires:
// npm install axios cheerio

const axios = require("axios");
const cheerio = require("cheerio");
const readline = require("readline");
const { exec } = require("child_process");
const os = require("os");
const path = require("path");
const fs = require("fs");

//
// CONFIG
//

// Default download location -> ~/Downloads/apk
const DOWNLOAD_DIRECTORY = path.join(os.homedir(), "Downloads", "apk");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function ask(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

function getUrlFromArgs() {
  const arg = process.argv.find((item) => item.startsWith("--url="));

  if (!arg) return null;

  return arg.replace("--url=", "").trim();
}

function extractFileId(url) {
  try {
    const parsed = new URL(url);
    return parsed.pathname.replace(/\//g, "");
  } catch (err) {
    return null;
  }
}

function parseDownloadLink(html) {
  const $ = cheerio.load(html);
  let downloadLink = null;

  $("a").each((_, el) => {
    const text = $(el).text().trim().toLowerCase();

    if (text.includes("click here to download")) {
      downloadLink = $(el).attr("href");
      return false;
    }
  });

  return downloadLink;
}

async function main() {
  try {
    if (!fs.existsSync(DOWNLOAD_DIRECTORY)) {
      console.log("Download directory does not exist:");
      console.log(DOWNLOAD_DIRECTORY);
      rl.close();
      return;
    }

    let uploadrarUrl = getUrlFromArgs();

    // fallback to interactive input
    if (!uploadrarUrl) {
      uploadrarUrl = await ask("Enter Uploadrar URL: ");
    }

    if (!uploadrarUrl) {
      console.log("Uploadrar URL is required.");
      rl.close();
      return;
    }

    const fileId = extractFileId(uploadrarUrl);

    if (!fileId) {
      console.log("Invalid Uploadrar URL.");
      rl.close();
      return;
    }

    const formData = new URLSearchParams({
      op: "download2",
      id: fileId,
      rand: "",
      referer: uploadrarUrl,
      method_free: "Free Download",
      method_premium: "",
      adblock_detected: "0",
    });

    const response = await axios.post(uploadrarUrl, formData.toString(), {
      headers: {
        accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "accept-language": "en-IN,en;q=0.9",
        "cache-control": "no-cache",
        "content-type": "application/x-www-form-urlencoded",
        origin: "https://uploadrar.com",
        pragma: "no-cache",
        referer: uploadrarUrl,
        "upgrade-insecure-requests": "1",
        "user-agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36",
      },
      maxRedirects: 5,
    });

    const html = response.data;
    const finalDownloadLink = parseDownloadLink(html);

    if (!finalDownloadLink) {
      console.log("Download link not found.");
      console.log("Uploadrar page structure may have changed.");
      rl.close();
      return;
    }

    console.log("Download started...\n");

    const wgetCommand = `wget \
--no-check-certificate \
--show-progress \
--progress=bar:force:noscroll \
-q \
-P "${DOWNLOAD_DIRECTORY}" \
"${finalDownloadLink}"`;

    const child = exec(wgetCommand);

    // wget progress comes through stderr
    child.stderr.on("data", (data) => {
      process.stdout.write(data.toString());
    });

    // ignore stdout
    child.stdout.on("data", () => { });

    child.on("close", (code) => {
      if (code === 0) {
        console.log("\n\nDownload completed successfully.");
      } else {
        console.log(`\n\nDownload failed with exit code ${code}`);
      }

      rl.close();
    });
  } catch (error) {
    console.log("Error occurred:");
    console.log(error.message);
    rl.close();
  }
}

main();