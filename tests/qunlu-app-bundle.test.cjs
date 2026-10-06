const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const root = path.join(__dirname, "..");
const webRoot = path.join(root, "www");
const play = path.join(webRoot, "play");
const rootVersion = JSON.parse(fs.readFileSync(path.join(webRoot, "version.json"), "utf8"));
const webBuild = JSON.parse(fs.readFileSync(path.join(webRoot, "web-build.json"), "utf8"));
const rootHtml = fs.readFileSync(path.join(webRoot, "index.html"), "utf8");
const version = JSON.parse(fs.readFileSync(path.join(play, "version.json"), "utf8"));

assert.match(version.version, /^CURRENT-/);
assert.equal(rootVersion.version, version.version);
assert.equal(rootVersion.web_entry, "play/");
assert.equal(rootVersion.legacy_root_removed, true);
assert.equal(webBuild.entry, "play/");
assert.equal(webBuild.clean_rebuild, true);
assert.equal(webBuild.legacy_web_removed, true);
assert.equal(webBuild.cache_reset_redirect, true);
assert.ok(rootHtml.includes("getRegistrations"), "root must unregister old service workers");
assert.ok(rootHtml.includes("caches.keys"), "root must delete old caches");
assert.ok(rootHtml.includes("./play/"), "root must redirect to the new play path");

for (const file of ["index.html","manifest.webmanifest","sw.js","assets/css/game.css","assets/css/app-theme.css","assets/art/qunlu-party-portraits.svg","assets/art/battle-sd-portraits.svg","src/battle-ui-theme.js","src/facility-shop-ui.js","src/game-data.js","src/runtime.js","src/runtime-stability.js","src/gather-encounter-runtime.js","src/data-patches.js","src/combat-scale-v2.js","src/battle-art-catalog-v2.js","src/pwa.js"]) {
  assert.ok(fs.existsSync(path.join(play, file)), "new 異界旅人 /play/ bundle missing " + file);
}
const html=fs.readFileSync(path.join(play,"index.html"),"utf8");
assert.ok(html.includes("src/game-data.js"));
assert.ok(html.includes("<title>異界旅人 " + version.version + "</title>"));
assert.ok(html.includes("NEW WEB・" + version.version + "・APP同步版"));
const manifest=JSON.parse(fs.readFileSync(path.join(play,"manifest.webmanifest"),"utf8"));
assert.equal(manifest.name,"異界旅人");
assert.equal(manifest.short_name,"異界旅人");
assert.ok(html.includes("src/runtime.js"));
assert.ok(html.includes("src/combat-scale-v2.js"));
assert.ok(html.includes("src/battle-art-catalog-v2.js"));
assert.ok(html.includes("src/runtime-stability.js"));
assert.ok(html.includes("src/gather-encounter-runtime.js"));
assert.ok(fs.readFileSync(path.join(play, "sw.js"), "utf8").includes('"./src/gather-encounter-runtime.js"'));
assert.ok(fs.readFileSync(path.join(play, "sw.js"), "utf8").includes('"./src/runtime-stability.js"'));
assert.ok(html.includes("assets/css/app-theme.css"));
assert.ok(html.includes("src/battle-ui-theme.js"));
assert.ok(html.includes("src/facility-shop-ui.js"));
assert.ok(fs.statSync(path.join(play,"src/game-data.js")).size > 3000000);
console.log("New 異界旅人 /play/ web bundle is isolated from the deleted legacy root.");
