const axios = require("axios");
const semver = require("semver");

// Your JSON input
const inputJson = {
  "@react-native-async-storage/async-storage": "2.2.0",
  "@react-native-community/netinfo": "11.4.1",
  "@react-native-community/slider": "5.0.1",
  "@react-native-picker/picker": "2.11.2",
  "@react-native-vector-icons/ant-design": "12.3.0",
  "@react-native-vector-icons/common": "12.3.0",
  "@react-native-vector-icons/feather": "12.3.0",
  "@react-native-vector-icons/fontawesome": "12.3.0",
  "@react-navigation/native": "7.1.18",
  "@react-navigation/stack": "7.4.9",
  "react-native-blob-util": "0.22.2",
  "react-native-gesture-handler": "2.28.0",
  "react-native-google-mobile-ads": "15.8.0",
  "react-native-pdf": "7.0.1",
  "react-native-safe-area-context": "5.6.1",
  "react-native-screens": "4.16.0"
}

const getLatestVersion = async (packageName) => {
  try {
    const response = await axios.get(
      `https://registry.npmjs.org/${packageName}/latest`
    );
    return response.data.version;
  } catch (error) {
    console.error(`Failed to fetch version for ${packageName}:`, error);
    return null;
  }
};

const checkVersions = async (input) => {
  const updates = [];

  for (const [pkg, version] of Object.entries(input)) {
    const cleanVersion = version.replace(/^[^\d]*/, ""); // Remove any leading non-numeric characters
    const latestVersion = await getLatestVersion(pkg);

    if (latestVersion && semver.gt(latestVersion, cleanVersion)) {
      updates.push(`${pkg}@${latestVersion}`);
    }
  }

  if (updates.length > 0) {
    console.log("Updates found:", updates);
    console.log(`Updates available: ${updates.join(" ")}`);
  } else {
    console.log("All packages are up to date.");
  }
};

checkVersions(inputJson);
