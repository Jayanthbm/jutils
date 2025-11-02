const { exiftool } = require("exiftool-vendored");
const fs = require("fs-extra");
const path = require("path");

// Paths
const videoFolder = "/Users/jayanthbharadwajm/Downloads/DCIM/Camera";
const outputFolder = "/Users/jayanthbharadwajm/Downloads/DCIM/updated";

fs.ensureDirSync(outputFolder);

function formatDate(dateObj) {
   if (!dateObj) return null;

   let date;
   if (typeof dateObj === "string") {
      date = dateObj;
   } else if (dateObj instanceof Date) {
      // convert Date object to string in 'YYYY:MM:DD HH:MM:SS' format
      const yyyy = dateObj.getFullYear();
      const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
      const dd = String(dateObj.getDate()).padStart(2, "0");
      const hh = String(dateObj.getHours()).padStart(2, "0");
      const min = String(dateObj.getMinutes()).padStart(2, "0");
      const ss = String(dateObj.getSeconds()).padStart(2, "0");
      date = `${yyyy}:${mm}:${dd} ${hh}:${min}:${ss}`;
   } else {
      return null;
   }

   // Format as YYYY-MM-DD_HH-MM-SS
   return date.replace(/:/g, "-").replace(" ", "_");
}

async function renameVideos() {
   const files = fs.readdirSync(videoFolder).filter(file => {
      const ext = path.extname(file).toLowerCase();
      return [".mp4", ".mov", ".m4v"].includes(ext);
   });

   for (const fileName of files) {
      const fullPath = path.join(videoFolder, fileName);

      try {
         const metadata = await exiftool.read(fullPath);
         const dateStr = formatDate(metadata.MediaCreateDate || metadata.CreateDate);

         if (!dateStr) {
            console.log(`No valid date for: ${fileName}`);
            continue;
         }

         const ext = path.extname(fileName);
         const newFileName = `${dateStr}${ext}`;
         const newFullPath = path.join(outputFolder, newFileName);

         await fs.move(fullPath, newFullPath, { overwrite: true });
         console.log(`Renamed: ${fileName} -> ${newFileName}`);
      } catch (err) {
         console.error(`Error processing ${fileName}:`, err.message);
      }
   }

   await exiftool.end();
}

renameVideos();
