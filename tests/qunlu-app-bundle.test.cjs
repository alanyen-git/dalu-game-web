const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const webRoot = path.join(root, "www");
const game = path.join(webRoot, "game");

const rootVersion = JSON.parse(fs.readFileSync(path.join(webRoot, "version.json"), "utf8"));
const webBuild = JSON.parse(fs.readFileSync(path.join(webRoot, "web-build.json"), "utf8"));
const rootHtml = fs.readFileSync(path.join(webRoot, "index.html"), "utf8");
const version = JSON.parse(fs.readFileSync(path.join(game, "version.json"), "utf8"));

assert.match(version.version, /^CURRENT-/);
assert.equal(rootVersion.version, version.version);
assert.equal(rootVersion.web_entry, "game/");
assert.equal(rootVersion.legacy_play_removed, true);
assert.equal(rootVersion.legacy_root_removed, true);
assert.equal(webBuild.entry, "game/");
assert.equal(webBuild.interface, "WEB-2.0");
assert.equal(webBuild.clean_rebuild, true);
assert.equal(webBuild.legacy_play_removed, true);
assert.equal(webBuild.legacy_web_removed, true);
assert.equal(webBuild.cache_reset_redirect, true);
assert.ok(rootHtml.includes("getRegistrations"), "root must unregister old service workers");
assert.ok(rootHtml.includes("caches.keys"), "root must delete old caches");
assert.ok(rootHtml.includes("./game/"), "root must redirect to the new game path");
assert.equal(fs.existsSync(path.join(webRoot, "play")), false, "old /play/ web game must not exist in the build");

for (const file of [
  "index.html","manifest.webmanifest","sw.js","assets/css/game.css","assets/css/app-theme.css","assets/css/web-v2.css",
  "src/game-data.js","src/runtime.js","src/runtime-stability.js","src/gather-encounter-runtime.js",
  "src/data-patches.js","src/combat-scale-v2.js","src/battle-art-catalog-v2.js","src/pwa.js","src/battle-ui-theme.js"
]) {
  assert.ok(fs.existsSync(path.join(game, file)), "WEB 2.0 bundle missing " + file);
}

const html = fs.readFileSync(path.join(game, "index.html"), "utf8");
assert.ok(html.includes("<title>異界旅人 " + version.version + "</title>"));
assert.ok(html.includes('body class="web2"'));
assert.ok(html.includes("異界旅人・WEB 2.0"));
assert.ok(html.includes("冒險指揮台"));
assert.ok(html.includes("戰鬥核心 ×2"));
assert.ok(html.includes("100 職業立繪"));
assert.ok(html.includes("214 怪物立繪"));
assert.ok(!html.includes("旅途未竟，群陸在前"), "legacy web hero must be gone");
assert.ok(html.includes("assets/css/web-v2.css"));
assert.ok(html.includes("src/combat-scale-v2.js"));
assert.ok(html.includes("src/battle-art-catalog-v2.js"));
assert.ok(fs.statSync(path.join(game,"src/game-data.js")).size > 3000000);

const manifest = JSON.parse(fs.readFileSync(path.join(game,"manifest.webmanifest"),"utf8"));
assert.equal(manifest.name,"異界旅人");
assert.equal(manifest.short_name,"異界旅人");

console.log("PASS 異界旅人 WEB 2.0 /game/ is a fresh build and old /play/ is absent.");
