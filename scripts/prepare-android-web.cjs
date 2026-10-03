const fs = require("node:fs/promises");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const webDir = path.join(root, "www");
const files = [
  "index.html", "styles.css", "map-navigation.css", "art-direction.css",
  "event-system.js", "app.js", "map-navigation.js", "battle.js",
  "profession.js", "formation.js", "battle-ui.js", "character-creation.js",
  "qunlu-character-data.js", "save-system.js", "service-worker.js", "app.webmanifest", "version.json"
];

async function main() {
  await fs.rm(webDir, { recursive: true, force: true });
  await fs.mkdir(webDir, { recursive: true });
  for (const file of files) {
    await fs.access(path.join(root, file));
    await fs.copyFile(path.join(root, file), path.join(webDir, file));
  }
  await fs.cp(path.join(root, "assets"), path.join(webDir, "assets"), { recursive: true });
  console.log("Prepared " + files.length + " web files and assets in www/");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
