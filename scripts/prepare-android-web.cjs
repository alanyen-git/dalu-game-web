const fs = require("node:fs/promises");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const webDir = path.join(root, "www");
const files = [
  "index.html", "styles.css", "map-navigation.css", "art-direction.css", "app-update.js",
  "event-system.js", "region-content.js", "app.js", "map-navigation.js", "battle.js",
  "profession.js", "formation.js", "battle-ui.js", "character-creation.js",
  "character-data.js", "character-growth.js", "save-system.js", "story-progression.js", "service-worker.js", "app.webmanifest", "version.json"
];

async function main() {
  const missing = [];
  for (const file of [...files, "assets"]) {
    try { await fs.access(path.join(root, file)); } catch (_) { missing.push(file); }
  }
  if (missing.length) throw new Error("來源不完整，缺少：" + missing.join("、") + "。請將覆蓋包套用至完整 dalu-game-web 原始碼；原有 www/ 已保留。");
  const staging = await fs.mkdtemp(path.join(root, ".web-stage-"));
  try {
  for (const file of files) {
    await fs.copyFile(path.join(root, file), path.join(staging, file));
  }
  await fs.cp(path.join(root, "assets"), path.join(staging, "assets"), { recursive: true });
  require("./validate-web-bundle.cjs").validate(staging, root);
  const version = JSON.parse(await fs.readFile(path.join(staging, "version.json"), "utf8"));
  await fs.writeFile(path.join(staging, "build-info.json"), JSON.stringify({
    version: version.version, source_commit: process.env.GITHUB_SHA || null
  }, null, 2) + "\n");
  await fs.rm(webDir, { recursive: true, force: true });
  await fs.rename(staging, webDir);
  console.log("Prepared " + files.length + " web files and assets in www/");
  } finally {
    await fs.rm(staging, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
