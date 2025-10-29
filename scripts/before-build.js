/**
 * Before build script for electron-builder
 * Ensures the app is built in production mode before packaging
 */

const { execSync } = require("child_process");
const path = require("path");

module.exports = async function beforeBuild() {
  console.log("🔄 Running production build before packaging...");

  try {
    // Change to the project root directory
    process.chdir(path.join(__dirname, ".."));

    // Run the production build
    execSync("yarn build:prod", {
      stdio: "inherit",
      env: {
        ...process.env,
        NODE_ENV: "production",
      },
    });

    console.log("✅ Production build completed successfully");
    return true;
  } catch (error) {
    console.error("❌ Production build failed:", error.message);
    throw error;
  }
};
