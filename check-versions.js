const axios = require("axios");
const semver = require("semver");

// Your JSON input
const inputJson = {
  "@react-native-async-storage/async-storage": "^2.2.0",
  "@react-native-community/netinfo": "^11.4.1",
  "@react-native-community/slider": "^5.1.1",
  "@react-native-vector-icons/common": "^12.4.0",
  "@react-native-vector-icons/material-design-icons": "^12.4.0",
  "@react-navigation/native": "7.1.26",
  "@react-navigation/native-stack": "7.9.0",
  "react-native-safe-area-context": "^5.6.2",
  "react-native-screens": "4.19.0",
};

// const inputJson = {
//   "@marceloterreiro/flash-calendar": "^1.5.0",
//   "@react-native-async-storage/async-storage": "^2.2.0",
//   "@react-native-community/netinfo": "^11.4.1",
//   "@react-native-vector-icons/common": "12.4.0",
//   "@react-native-vector-icons/ionicons": "^12.3.0",
//   "@react-native-vector-icons/material-design-icons": "^12.4.0",
//   "@react-navigation/native": "^7.1.21",
//   "@react-navigation/native-stack": "^7.6.4",
//   "@shopify/flash-list": "^2.2.0",
//   "@supabase/supabase-js": "^2.84.0",
//   dayjs: "1.11.19",
//   "material-loader-react-native": "^1.0.1",
//   react: "19.1.1",
//   "react-native": "0.82.1",
//   "react-native-dotenv": "^3.4.11",
//   "react-native-gesture-handler": "2.29.1",
//   "react-native-gifted-charts": "^1.4.66",
//   "react-native-linear-gradient": "^2.8.3",
//   "react-native-nitro-modules": "^0.31.9",
//   "react-native-nitro-sqlite": "^9.2.0",
//   "react-native-reanimated": "^4.1.5",
//   "react-native-safe-area-context": "5.6.2",
//   "react-native-screens": "^4.18.0",
//   "react-native-svg": "^15.15.0",
//   "react-native-turbo-image": "^1.23.1",
//   "react-native-url-polyfill": "^3.0.0",
//   "react-native-uuid": "^2.0.3",
//   "react-native-worklets": "^0.6.1",
// };

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
