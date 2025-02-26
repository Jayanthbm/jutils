const fs = require("fs");
const axios = require("axios");
const path = require("path");
const { exec } = require("child_process");
const channels = [
  {
    type: "jio",
    channel_id: 757,
    image: "Colors_Kannada_HD",
    name: "Colors Kannada HD",
    lang: "Kannada",
  },
  {
    type: "general",
    channel_id: 1000,
    epg_id: 1362,
    image:
      "https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-33827-jo5kcr1c-v4/imageContent-33827-jo5kcr1c-m5.png",
    name: "Zee Kannada",
    lang: "Kannada",
    url: "https://d1g8wgjurz8via.cloudfront.net/bpk-tv/Zeekannada1/default/zeekannada1.m3u8",
  },
  {
    type: "jio",
    channel_id: 896,
    image: "Sun_TV_HD",
    name: "Sun TV HD",
    lang: "Tamil",
  },
  {
    type: "general",
    channel_id: 1001,
    epg_id: 1362,
    image: "https://jiotvimages.cdn.jio.com/dare_images/images/Zee_Kannada.png",
    name: "Zee Kannada",
    lang: "Kannada",
    url: "https://d1g8wgjurz8via.cloudfront.net/bpk-tv/Zeekannada1/default/master.m3u8",
  },
  {
    type: "jio",
    channel_id: 1209,
    image: "Kalaignar_TV",
    name: "Kalaignar TV",
    lang: "Tamil",
  },
  {
    type: "jio",
    channel_id: 894,
    image: "KTV_HD",
    name: "KTV HD",
    lang: "Tamil",
  },
  {
    type: "jio",
    channel_id: 682,
    image: "Sun_Life",
    name: "Sun Life",
    lang: "Tamil",
  },
  {
    type: "jio",
    channel_id: 901,
    image: "Udaya_HD",
    name: "Udaya HD",
    lang: "Kannada",
  },
  {
    type: "jio",
    channel_id: 678,
    image: "Udaya_Movies",
    name: "Udaya Movies",
    lang: "Kannada",
  },
  {
    type: "jio",
    channel_id: 733,
    image: "Udaya_Comedy",
    name: "Udaya Comedy",
    lang: "Kannada",
  },
  {
    type: "jio",
    channel_id: 785,
    image: "Colors_Super",
    name: "Colors Super",
    lang: "Kannada",
  },
  {
    type: "jio",
    channel_id: 744,
    image: "Udaya_Music",
    name: "Udaya Music",
    lang: "Kannada",
  },
  {
    type: "jio",
    channel_id: 1245,
    image: "Sakkat",
    name: "Sakkat",
    lang: "Kannada",
  },
  {
    type: "jio",
    channel_id: 743,
    image: "Raj_Music_Kannada",
    name: "Raj Music Kannada",
    lang: "Kannada",
  },
  {
    type: "jio",
    channel_id: 773,
    image: "Public_Music",
    name: "Public Music",
    lang: "Kannada",
  },
  {
    type: "jio",
    channel_id: 1632,
    image: "Colors_Kannada_Cinema",
    name: "Colors Kannada Cinema",
    lang: "Kannada",
  },
  {
    type: "jio",
    channel_id: 1633,
    image: "Public_Movies",
    name: "Public Movies",
    lang: "Kannada",
  },
  {
    type: "jio",
    channel_id: 1634,
    image: "Sirikannada",
    name: "Siri Kannada",
    lang: "Kannada",
  },
  {
    type: "jio",
    channel_id: 895,
    image: "Sun_Music_HD",
    name: "Sun Music HD",
    lang: "Tamil",
  },
  {
    type: "jio",
    channel_id: 709,
    image: "Adithya_TV",
    name: "Adithya TV",
    lang: "Tamil",
  },
  {
    type: "jio",
    channel_id: 417,
    image: "J_Movies",
    name: "J Movies",
    lang: "Tamil",
  },
  {
    type: "jio",
    channel_id: 429,
    image: "Colors_Tamil_HD",
    name: "Colors Tamil HD",
    lang: "Tamil",
  },
  {
    type: "general",
    channel_id: 1002,
    epg_id: 628,
    image: "https://jiotvimages.cdn.jio.com/dare_images/images/Zee_Tamil.png",
    name: "Zee Tamil",
    lang: "Tamil",
    url: "https://d1g8wgjurz8via.cloudfront.net/bpk-tv/Zeetamil1/default/master.m3u8",
  },
  {
    type: "general",
    channel_id: 1003,
    epg_id: 162,
    image:
      "https://sonypicturesnetworks.com/images/logos/SONY_SportsTen1_HD_Logo_CLR.png",
    name: "Sony Ten 1 HD",
    lang: "English",
    url: "https://dai.google.com/ssai/event/yeYP86THQ4yl7US8Zx5eug/master.m3u8",
  },
  {
    type: "general",
    channel_id: 1004,
    epg_id: 891,
    image:
      "https://sonypicturesnetworks.com/images/logos/SONY_SportsTen2_HD_Logo_CLR.png",
    name: "Sony Ten 2 HD",
    lang: "English",
    url: "https://dai.google.com/ssai/event/Syu8F41-R1y_JmQ7x0oNxQ/master.m3u8",
  },
  {
    type: "general",
    channel_id: 1005,
    epg_id: 155,
    image:
      "https://sonypicturesnetworks.com/images/logos/SONY_SportsTen5_HD_Logo_CLR.png",
    name: "Sony Ten 5",
    lang: "English",
    url: "https://dai.google.com/ssai/event/DD7fA-HgSUaLyZp9AjRYxQ/master.m3u8",
  },

  {
    type: "jio",
    channel_id: 1984,
    image: "Sports18_1_HD",
    name: "Sports18 1 HD",
    lang: "English",
  },
  {
    type: "jio",
    channel_id: 1918,
    image: "Jio_Cricket_English",
    name: "Jio Cricket English HD",
    lang: "English",
  },
  {
    type: "jio",
    channel_id: 626,
    image: "Suvarna_News",
    name: "Suvarna News",
    lang: "Kannada",
  },
  {
    type: "jio",
    channel_id: 778,
    image: "Public_TV",
    name: "Public TV",
    lang: "Kannada",
  },
  {
    type: "jio",
    channel_id: 619,
    image: "TV9_Karnataka",
    name: "TV9 Karnataka",
    lang: "Kannada",
  },

  {
    type: "jio",
    channel_id: 897,
    image: "Gemini_TV_HD",
    name: "Gemini TV HD",
    lang: "Telugu",
  },
  {
    type: "general",
    channel_id: 1006,
    epg_id: 413,
    image:
      "https://jiotvimages.cdn.jio.com/dare_images/images/Zee_Cinemalu.png",
    name: "Zee Cinemalu",
    lang: "Telugu",
    url: "https://d1g8wgjurz8via.cloudfront.net/bpk-tv/Zeecinemalu1/default/master.m3u8",
  },
  {
    type: "jio",
    channel_id: 899,
    image: "Gemini_Movies_HD",
    name: "Gemini Movies HD",
    lang: "Telugu",
  },
  {
    type: "jio",
    channel_id: 898,
    image: "Gemini_Music_HD",
    name: "Gemini Music HD",
    lang: "Telugu",
  },
  {
    type: "jio",
    channel_id: 729,
    image: "Gemini_Comedy",
    name: "Gemini Comedy",
    lang: "Telugu",
  },
  {
    type: "jio",
    channel_id: 1665,
    image: "ETV_Cinema_HD",
    name: "ETV Cinema HD",
    lang: "Telugu",
  },
  {
    type: "jio",
    channel_id: 1973,
    image: "ETV_HD",
    name: "ETV HD",
    lang: "Telugu",
  },
  {
    type: "jio",
    channel_id: 737,
    image: "Raj_Music_Telugu",
    name: "Raj Music Telugu",
    lang: "Telugu",
  },
  {
    type: "jio",
    channel_id: 2956,
    image: "ETV_Plus_HD",
    name: "ETV Plus HD",
    lang: "Telugu",
  },
];

const TATA_PLAY_URL =
  "https://techy-kuldeep-tata-play-m3u.vercel.app/api/getM3u2";

const TATA_PLAY_CHECK = false;
const M3U_FILE_PATH = "tata_play.m3u"; // Path to store the M3U file

const JIO_URL = "http://localhost:5001";
const FILE_NAME = "jio.m3u";

// const FILE_NAME = "jio-test.m3u";
// const JIO_URL = "http://192.168.1.122:5001";

// const FILE_NAME = "jio-test.m3u";
// const JIO_URL = "https://ebf7-103-186-41-217.ngrok-free.app";

const TARGET_DIRECTORY = "/Users/jayanthbharadwajm/development/mydata";
const TARGET_FILE_PATH = path.join(TARGET_DIRECTORY, FILE_NAME);

const FIVE_HOURS_IN_MS = 5 * 60 * 60 * 1000; // 5 hours in milliseconds

// Function to fetch M3U content from the URL
async function fetchM3UContent(url) {
  try {
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error("Error fetching M3U content:", error);
    return null;
  }
}

// Function to check if the M3U file needs to be updated
async function checkAndUpdateM3UFile() {
  try {
    // Check if the file exists
    if (!fs.existsSync(M3U_FILE_PATH)) {
      console.log("M3U file does not exist. Fetching new content...");
      const tataM3uContent = await fetchM3UContent(TATA_PLAY_URL);
      if (tataM3uContent) {
        fs.writeFileSync(M3U_FILE_PATH, tataM3uContent);
        console.log("M3U file has been created and updated.");
      }
      return tataM3uContent; // Return the fetched content
    }

    const stats = fs.statSync(M3U_FILE_PATH);
    const lastModifiedTime = new Date(stats.mtime);
    const currentTime = new Date();

    // Check if the file is older than 5 hours
    if (currentTime - lastModifiedTime > FIVE_HOURS_IN_MS && TATA_PLAY_CHECK) {
      console.log("M3U file is outdated. Fetching new content...");
      const tataM3uContent = await fetchM3UContent(TATA_PLAY_URL);
      if (tataM3uContent) {
        fs.writeFileSync(M3U_FILE_PATH, tataM3uContent);
        console.log("M3U file has been updated.");
      }
      return tataM3uContent; // Return the fetched content
    } else {
      console.log("M3U file is up to date.");
      return fs.readFileSync(M3U_FILE_PATH, "utf-8");
    }
  } catch (error) {
    console.error("Error checking M3U file:", error);
  }
  return null;
}

// Prepare the content for the jio.m3u file
let m3uContent = '#EXTM3U x-tvg-url="https://avkb.short.gy/jioepg.xml.gz"\n\n';

// Load M3U content from TATA_PLAY_URL or from the file
checkAndUpdateM3UFile().then((tataM3uContent) => {
  if (tataM3uContent) {
    const tataLines = tataM3uContent.split("\n");
    const tataChannels = {};

    // Parse the tataM3U content to extract channel information
    for (let i = 0; i < tataLines.length; i++) {
      if (tataLines[i].startsWith("#EXTINF")) {
        const match = tataLines[i].match(/tvg-id="(\d+)"/);
        if (match) {
          const channelId = match[1];
          tataChannels[channelId] = {
            infLine: tataLines[i],
            licenseType: tataLines[i + 1],
            licenseKey: tataLines[i + 2],
            userAgent: tataLines[i + 3],
            extHttp: tataLines[i + 4],
            streamUrl: tataLines[i + 5],
          };
        }
      }
    }

    // Generate M3U content for jio channels
    for (let i = 0; i < channels.length; i++) {
      const channel = channels[i];
      if (channel.type === "jio") {
        m3uContent += `#EXTINF:-1 tvg-id=${channel.channel_id} epg-id="${channel.channel_id}" tvg-name="${channel.name}" tvg-logo="${JIO_URL}/jtvimage/${channel.image}.png" tvg-language="${channel.lang}", ${channel.name}\n`;
        m3uContent += `${JIO_URL}/live/${channel.channel_id}.m3u8\n\n`;
      } else if (channel.type === "tataplay") {
        const tataChannel = tataChannels[channel.channel_id];
        if (tataChannel) {
          // Use the image from the channels array for the tvg-logo
          const logoUrl = channel.image; // Assuming this is the correct URL for Tata Play channels
          m3uContent += `#EXTINF:-1 tvg-id="${channel.channel_id}" epg-id="${channel.channel_id}" tvg-name="${channel.name}" tvg-logo="${logoUrl}" tvg-language="${channel.lang}", ${channel.name}\n`;
          m3uContent += `${tataChannel.licenseType}\n`;
          m3uContent += `${tataChannel.licenseKey}\n`;
          m3uContent += `${tataChannel.userAgent}\n`;
          m3uContent += `${tataChannel.extHttp}\n`;
          m3uContent += `${tataChannel.streamUrl}\n\n`;
        }
      } else if (channel.type === "general") {
        m3uContent += `#EXTINF:-1 tvg-id="${channel.channel_id}" epg-id="${
          channel?.epg_id ? channel.epg_id : channel.channel_id
        }" tvg-name="${channel.name}" tvg-logo="${
          channel.image
        }" tvg-language="${channel.lang}", ${channel.name}\n`;
        m3uContent += `${channel.url}\n\n`;
      }
    }

    // Clear the contents of jio.m3u and write the new content
    fs.writeFile(FILE_NAME, "", (err) => {
      if (err) {
        console.error("Error clearing the file", err);
      } else {
        // Now append the new content
        fs.appendFile(FILE_NAME, m3uContent, (err) => {
          if (err) {
            console.error("Error writing to file", err);
          } else {
            console.log(`${FILE_NAME} file has been updated successfully.`);

            // Copy the file to the target directory
            try {
              fs.copyFileSync(FILE_NAME, TARGET_FILE_PATH);
              console.log(`File has been copied to ${TARGET_FILE_PATH}`);

              // Execute Git commands
              executeGitCommands(path.dirname(TARGET_FILE_PATH));
            } catch (copyError) {
              console.error("Error copying the file:", copyError);
            }
          }
        });
      }
    });
  }
});

function executeGitCommands(gitProjectPath) {
  // Change to the Git project directory
  process.chdir(gitProjectPath);

  // Execute the Git commands
  exec("git add .", (error, stdout, stderr) => {
    if (error) {
      console.error(`Error adding files: ${error.message}`);
      return;
    }
    console.log(`Output of git add: ${stdout}`);

    exec('git commit -m "playlist updated"', (error, stdout, stderr) => {
      if (error) {
        console.error(`Error committing changes: ${error.message}`);
        return;
      }
      console.log(`Output of git commit: ${stdout}`);

      exec("git push", (error, stdout, stderr) => {
        if (error) {
          console.error(`Error pushing changes: ${error.message}`);
          return;
        }
        console.log(`Output of git push: ${stdout}`);
      });
    });
  });
}
