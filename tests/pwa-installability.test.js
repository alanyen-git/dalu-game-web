const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");


const root = path.join(__dirname, "..");
const manifest = JSON.parse(fs.readFileSync(path.join(root, "app.webmanifest"), "utf8"));
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
const battle = fs.readFileSync(path.join(root, "battle.js"), "utf8");
const update = fs.readFileSync(path.join(root, "app-update.js"), "utf8");
const worker = fs.readFileSync(path.join(root, "service-worker.js"), "utf8");
const version = JSON.parse(fs.readFileSync(path.join(root, "version.json"), "utf8"));
const packageInfo = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));


for (const file of ["region-content.js", "app.js", "battle.js", "battle-ui.js", "app-update.js", "character-creation.js", "qunlu-database.js", "character-data.js", "character-growth.js", "profession.js", "story-progression.js", "service-worker.js"]) {
  const syntax = spawnSync(process.execPath, ["--check", path.join(root, file)], { encoding: "utf8" });
  assert.equal(syntax.status, 0, `${file} must parse: ${syntax.stderr}`);
}


assert.equal(manifest.name, "大陸旅誌");
assert.equal(manifest.short_name, "大陸旅誌");
assert.equal(manifest.display, "standalone");
assert.equal(manifest.start_url, "./");
assert.equal(manifest.scope, "./");
assert.ok(manifest.icons.some((icon) => icon.sizes === "192x192" && icon.type === "image/png"));
assert.ok(manifest.icons.some((icon) => icon.sizes === "512x512" && icon.purpose.split(/\s+/).includes("maskable")));


for (const icon of manifest.icons) {
  const file = path.join(root, icon.src.replace(/^\.\//, ""));
  const png = fs.readFileSync(file);
  assert.equal(png.subarray(0, 8).toString("hex"), "89504e470d0a1a0a", `${icon.src} must be PNG`);
  assert.equal(png.readUInt32BE(16), Number(icon.sizes.split("x")[0]), `${icon.src} width`);
  assert.equal(png.readUInt32BE(20), Number(icon.sizes.split("x")[1]), `${icon.src} height`);
  assert.ok(worker.includes(icon.src), `${icon.src} must be available offline`);
}


assert.ok(html.trimEnd().endsWith("</body></html>"), "homepage must have closing document tags");
assert.equal((html.match(/data-screen=/g) || []).length, 4, "homepage must contain all four app screens");
assert.equal((html.match(/data-nav=/g) || []).length, 4, "homepage must contain all four navigation destinations");
assert.match(html, /app\.webmanifest/);
assert.ok(html.includes("app-update.js?v=" + packageInfo.version));
assert.ok(html.indexOf("character-growth.js?v=" + packageInfo.version) < html.indexOf("app.js?v=" + packageInfo.version), "growth must initialize before the game state");
assert.ok(html.includes("character-data.js?v=" + packageInfo.version), "character creation uses the local Dalu catalog");
assert.ok(html.includes("qunlu-database.js?v=" + packageInfo.version), "the complete Qunlu base database is loaded locally");
assert.ok(worker.includes("./character-growth.js?v=" + packageInfo.version), "growth module must be cached for offline startup");
assert.ok(worker.includes("./character-data.js?v=" + packageInfo.version), "Dalu character catalog must be cached for offline startup");
assert.ok(worker.includes("./qunlu-database.js?v=" + packageInfo.version), "the complete Qunlu database must be cached for offline startup");
assert.ok(worker.includes("./region-content.js?v=" + packageInfo.version), "regional content must be cached for offline startup");
assert.ok(!html.includes("qunlu-character-data") && !worker.includes("qunlu-character-data"), "Dalu must remain independent of the other project");
assert.equal(version.version, packageInfo.version, "public build version must match the Android package version");
assert.equal((app + battle).includes("serviceWorker.register"), false, "game screens must not register duplicate service workers");
assert.equal((update.match(/serviceWorker\.register/g) || []).length, 1, "the app updater must register the service worker once");
assert.match(update, /updateViaCache: "none"/);
assert.match(update, /getDiagnostics/);
assert.match(worker, /SKIP_WAITING/);
assert.match(worker, /caches\.delete\(CACHE\)/);
assert.ok(worker.includes("./app-update.js?v=" + packageInfo.version), "update manager must be precached for offline startup");
assert.ok(worker.includes("dalu-travel-log-v" + packageInfo.version), "service worker cache must match the app version");
