const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const root = path.join(__dirname, "..");
const app = path.join(root, "qunlu-app");
const webRoot = path.join(root, "www");
const game = path.join(webRoot, "game");

const rootVersion = JSON.parse(fs.readFileSync(path.join(webRoot, "version.json"), "utf8"));
const webBuild = JSON.parse(fs.readFileSync(path.join(webRoot, "web-build.json"), "utf8"));
const rootHtml = fs.readFileSync(path.join(webRoot, "index.html"), "utf8");
const version = JSON.parse(fs.readFileSync(path.join(game, "version.json"), "utf8"));

assert.match(version.version, /^CURRENT-/);
assert.equal(rootVersion.version, version.version);
assert.equal(rootVersion.web_entry, "game/");
assert.equal(rootVersion.exact_app_mirror, true);
assert.equal(webBuild.entry, "game/");
assert.equal(webBuild.exact_app_mirror, true);
assert.equal(webBuild.ui_transform, false);
assert.equal(webBuild.clean_rebuild, true);
assert.equal(fs.existsSync(path.join(webRoot, "play")), false, "old /play/ must not exist");
assert.ok(rootHtml.includes("./game/"), "root must redirect to /game/");

function digest(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}
for (const rel of [
  "index.html",
  "version.json",
  "manifest.webmanifest",
  "sw.js",
  "src/runtime.js",
  "src/game-data.js",
  "src/combat-scale-v2.js",
  "src/battle-art-catalog-v2.js",
  "src/battle-ui-theme.js",
  "assets/css/game.css",
  "assets/css/app-theme.css",
  "assets/css/polish-v1.css",
  "assets/css/character-creation.css"
]) {
  const appFile=path.join(app,rel), gameFile=path.join(game,rel);
  assert.ok(fs.existsSync(gameFile), "web mirror missing " + rel);
  assert.equal(digest(gameFile),digest(appFile),"web must be byte-identical to App for " + rel);
}
const gameHtml=fs.readFileSync(path.join(game,"index.html"),"utf8");
assert.ok(!gameHtml.includes("web-v2.css"));
assert.ok(!gameHtml.includes('class="web2"'));
assert.ok(!gameHtml.includes("冒險指揮台"));
assert.ok(!gameHtml.includes("WEB 2.0"));
assert.ok(!gameHtml.includes("NEW WEB"));
assert.ok(!gameHtml.includes("web-build-badge"));
const appTownHome=fs.readFileSync(path.join(app,"src/town-home-ui.js"),"utf8");
const webTownHome=fs.readFileSync(path.join(game,"src/town-home-ui.js"),"utf8");
assert.equal(digest(path.join(game,"src/town-home-ui.js")),digest(path.join(app,"src/town-home-ui.js")),"town-home UI must be identical to App");
assert.ok(appTownHome.includes("異界旅人・旅途據點"));
assert.ok(appTownHome.includes("當地地圖"));
assert.ok(appTownHome.includes("世界地圖"));
assert.ok(appTownHome.includes("ensureTownHome"));
const runtimeSource=fs.readFileSync(path.join(app,"src/runtime.js"),"utf8");
assert.ok(runtimeSource.includes('if(typeof window.renderTownHome==="function")window.renderTownHome()'),"enterGame must explicitly enter App town-home UI");

console.log("PASS /game/ is byte-identical to current 異界旅人 App UI/core.");
