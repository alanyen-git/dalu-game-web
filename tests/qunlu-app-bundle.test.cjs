const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const root = path.join(__dirname, "..");
const web = path.join(root, "www");
const version = JSON.parse(fs.readFileSync(path.join(web, "version.json"), "utf8"));
assert.match(version.version, /^CURRENT-/);
for (const file of ["index.html","manifest.webmanifest","sw.js","assets/css/game.css","assets/css/app-theme.css","assets/art/qunlu-party-portraits.svg","src/game-data.js","src/runtime.js","src/data-patches.js","src/pwa.js"]) {
  assert.ok(fs.existsSync(path.join(web, file)), "Qunlu App bundle missing " + file);
}
const html=fs.readFileSync(path.join(web,"index.html"),"utf8");
assert.ok(html.includes("src/game-data.js"));
assert.ok(html.includes("src/runtime.js"));
assert.ok(html.includes("assets/css/app-theme.css"));
assert.ok(fs.statSync(path.join(web,"src/game-data.js")).size > 3000000);
console.log("Qunlu-derived mobile app bundle contains the source database, runtime and visual layer.");
