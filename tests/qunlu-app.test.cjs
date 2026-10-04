const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const root = path.join(__dirname, "..");
const app = path.join(root, "qunlu-app");
const lock = JSON.parse(fs.readFileSync(path.join(app, "source-lock.json"), "utf8"));
assert.equal(lock.source_repository, "alanyen-git/qunlu-game");
assert.equal(lock.rules.includes("read-only source"), true);
for (const file of ["index.html","manifest.webmanifest","sw.js","assets/css/game.css","assets/css/app-theme.css","assets/art/qunlu-party-portraits.svg","src/mobile-map-ui.js","src/game-data.js","src/runtime.js","src/data-patches.js","src/pwa.js"]) {
  assert.ok(fs.existsSync(path.join(app, file)), "missing imported app file: " + file);
}
const html = fs.readFileSync(path.join(app, "index.html"), "utf8");
assert.ok(html.includes('src/game-data.js'));
assert.ok(html.includes('src/runtime.js'));
assert.ok(html.includes('assets/css/app-theme.css'));
assert.ok(html.includes('src/mobile-map-ui.js'));
assert.ok(!html.includes("dalu-game-web"));
assert.ok(fs.statSync(path.join(app, "src/game-data.js")).size > 3000000);
console.log("Qunlu-derived mobile app source and immutable source lock are present.");
