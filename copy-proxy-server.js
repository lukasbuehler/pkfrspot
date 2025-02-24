const fs = require("fs");
const path = require("path");

const sourcePath = "src/proxy-server.mjs";
const destinationDir = "dist/pkfrspot/server";
const destinationFile = path.join(destinationDir, "server.mjs");
const buildInfoFile = path.join(destinationDir, "build-info.mjs");

// Check if the source file exists
if (fs.existsSync(sourcePath)) {
  const sourceAbsolutePath = path.resolve(sourcePath);
  const destinationAbsolutePath = path.resolve(destinationFile);

  // Copy the source file to the destination
  fs.copyFile(sourceAbsolutePath, destinationAbsolutePath, (err) => {
    if (err) {
      console.error("Error copying the file:", err);
    } else {
      console.log("File copied successfully.");

      // Generate LAST_MODIFIED string using current date in GMT format
      const lastModified = new Date().toUTCString();
      const buildInfoContent = `export const LAST_MODIFIED = "${lastModified}";\n`;

      // Ensure the destination directory exists
      fs.mkdirSync(path.resolve(destinationDir), { recursive: true });
      // Write the build-info.mjs file
      fs.writeFile(buildInfoFile, buildInfoContent, (err) => {
        if (err) {
          console.error("Error writing build-info.mjs:", err);
        } else {
          console.log("build-info.mjs generated successfully.");
        }
      });
    }
  });
} else {
  console.error("The source file does not exist.");
}
