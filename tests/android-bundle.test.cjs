const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const root = path.join(__dirname, "..");
const web = path.join(root, "www");
const required = [
  "index.html", "styles.css", "map-navigation.css", "art-direction.css", "app-update.js", "story-progression.js",
  "event-system.js", "region-content.js", "app.js", "map-navigation.js", "battle.js",
  "profession.js", "formation.js", "battle-ui.js", "character-creation.js", "qunlu-database.js", "character-data.js", "character-growth.js", "save-system.js", "service-worker.js", "app.webmanifest", "version.json",
  "assets/art/app-icon-192.png", "assets/art/app-icon-512.png", "assets/art/locations/mist-harbor.svg"
];
for (const file of required) assert.ok(fs.existsSync(path.join(web, file)), "Android bundle is missing " + file);


const html = fs.readFileSync(path.join(web, "index.html"), "utf8");
const manifest = JSON.parse(fs.readFileSync(path.join(web, "app.webmanifest"), "utf8"));
const version = JSON.parse(fs.readFileSync(path.join(web, "version.json"), "utf8"));
const worker = fs.readFileSync(path.join(web, "service-worker.js"), "utf8");
const packageInfo = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
assert.ok(html.trimEnd().endsWith("</body></html>"), "Android app shell must be complete");
assert.equal(manifest.display, "standalone");
assert.equal(version.pwa_manifest, true);
assert.equal(version.save_schema_version, 4);
assert.equal(version.version, packageInfo.version, "Android bundle and package version must match");
assert.ok(html.includes('data-action="restore-save"'), "Save restore must be reachable in settings");
assert.ok(worker.includes("dalu-travel-log-v" + version.version), "service worker cache must match the app version");
assert.ok(worker.includes("SKIP_WAITING"), "new bundle must support automatic service worker activation");
for (const icon of manifest.icons) assert.ok(worker.includes(icon.src), icon.src + " must be cached offline");
for (const file of ["region-content.js", "profession.js", "formation.js", "battle-ui.js", "character-creation.js", "qunlu-database.js", "character-data.js", "character-growth.js", "save-system.js", "app-update.js", "story-progression.js"]) {
  const script = "./" + file + "?v=" + packageInfo.version;
  assert.ok(html.includes(script), script + " must load in the app shell");
  assert.ok(worker.includes(script), script + " must be cached for offline play");
}
assert.ok(!html.includes("qunlu-character-data"), "Dalu must not load a catalog from another project");
assert.ok(!worker.includes("qunlu-character-data"), "offline cache must not depend on another project");
const cachedAssets = worker.split("\"").filter((value) => value.startsWith("./assets/"));
for (const file of cachedAssets) assert.ok(fs.existsSync(path.join(web, file.replace(/^\.\//, ""))), "Offline cache asset is missing " + file);
console.log("Android web bundle contains the complete app shell and all precached assets.");
