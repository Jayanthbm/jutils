const axios = require("axios");
const semver = require("semver");

// Your JSON input
const inputJson = {
  "@react-native-async-storage/async-storage": "2.2.0",
  "@react-native-community/netinfo": "11.4.1",
  "@react-native-community/slider": "4.5.7",
  "@react-native-picker/picker": "2.11.1",
  "@react-native-vector-icons/ant-design": "12.0.1",
  "@react-native-vector-icons/common": "12.0.1",
  "@react-native-vector-icons/feather": "12.0.1",
  "@react-native-vector-icons/fontawesome": "12.0.1",
  "@react-navigation/native": "7.1.14",
  "@react-navigation/stack": "7.4.2",
  "react-native-blob-util": "0.22.2",
  "react-native-gesture-handler": "2.27.1",
  "react-native-google-mobile-ads": "15.4.0",
  "react-native-pdf": "6.7.7",
  "react-native-safe-area-context": "5.5.1",
  "react-native-screens": "4.11.1"
};

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
