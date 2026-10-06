const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const root = path.join(__dirname, "..");
const web = path.join(root, "www");
const version = JSON.parse(fs.readFileSync(path.join(web, "version.json"), "utf8"));
assert.match(version.version, /^CURRENT-/);
for (const file of ["index.html","manifest.webmanifest","sw.js","assets/css/game.css","assets/css/app-theme.css","assets/art/qunlu-party-portraits.svg","assets/art/battle-sd-portraits.svg","src/battle-ui-theme.js","src/facility-shop-ui.js","src/game-data.js","src/runtime.js","src/runtime-stability.js","src/gather-encounter-runtime.js","src/data-patches.js","src/pwa.js"]) {
  assert.ok(fs.existsSync(path.join(web, file)), "Qunlu App bundle missing " + file);
}
const html=fs.readFileSync(path.join(web,"index.html"),"utf8");
assert.ok(html.includes("src/game-data.js"));
assert.ok(html.includes("<title>異界旅人 " + version.version + "</title>"));
const manifest=JSON.parse(fs.readFileSync(path.join(web,"manifest.webmanifest"),"utf8"));
assert.equal(manifest.name,"異界旅人");
assert.equal(manifest.short_name,"異界旅人");
assert.ok(html.includes("src/runtime.js"));
assert.ok(html.includes("src/runtime-stability.js"));
assert.ok(html.includes("src/gather-encounter-runtime.js"));
assert.ok(fs.readFileSync(path.join(web, "sw.js"), "utf8").includes('"./src/gather-encounter-runtime.js"'));
assert.ok(fs.readFileSync(path.join(web, "sw.js"), "utf8").includes('"./src/runtime-stability.js"'));
assert.ok(html.includes("assets/css/app-theme.css"));
assert.ok(html.includes("src/battle-ui-theme.js"));
assert.ok(html.includes("src/facility-shop-ui.js"));
assert.ok(fs.statSync(path.join(web,"src/game-data.js")).size > 3000000);
console.log("Qunlu-derived mobile app bundle contains the source database, runtime and visual layer.");
