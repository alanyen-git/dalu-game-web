const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const root = path.join(__dirname, "..");
const web = path.join(root, "www");
const required = [
  "index.html", "styles.css", "map-navigation.css", "art-direction.css",
  "event-system.js", "app.js", "map-navigation.js", "battle.js",
  "service-worker.js", "app.webmanifest", "version.json",
  "assets/art/app-icon-192.png", "assets/art/app-icon-512.png"
];
for (const file of required) assert.ok(fs.existsSync(path.join(web, file)), "Android bundle is missing " + file);

const html = fs.readFileSync(path.join(web, "index.html"), "utf8");
const manifest = JSON.parse(fs.readFileSync(path.join(web, "app.webmanifest"), "utf8"));
const version = JSON.parse(fs.readFileSync(path.join(web, "version.json"), "utf8"));
const worker = fs.readFileSync(path.join(web, "service-worker.js"), "utf8");
assert.ok(html.endsWith("</body></html>\n"), "Android app shell must be complete");
assert.equal(manifest.display, "standalone");
assert.equal(version.pwa_manifest, true);
for (const icon of manifest.icons) assert.ok(worker.includes(icon.src), icon.src + " must be cached offline");
const cachedAssets = worker.split("\"").filter((value) => value.startsWith("./assets/"));
for (const file of cachedAssets) assert.ok(fs.existsSync(path.join(web, file.replace(/^\.\//, ""))), "Offline cache asset is missing " + file);
console.log("Android web bundle contains the complete app shell and all precached assets.");
