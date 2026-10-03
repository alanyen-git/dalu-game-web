const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const manifest = JSON.parse(fs.readFileSync(path.join(root, "app.webmanifest"), "utf8"));
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
const worker = fs.readFileSync(path.join(root, "service-worker.js"), "utf8");
const version = JSON.parse(fs.readFileSync(path.join(root, "version.json"), "utf8"));

const syntax = spawnSync(process.execPath, ["--check", path.join(root, "app.js")], { encoding: "utf8" });
assert.equal(syntax.status, 0, `app.js must parse: ${syntax.stderr}`);

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

assert.ok(html.endsWith("</body></html>\n"), "homepage must have closing document tags");
assert.equal((html.match(/data-screen=/g) || []).length, 4, "homepage must contain all four app screens");
assert.equal((html.match(/data-nav=/g) || []).length, 4, "homepage must contain all four navigation destinations");
assert.match(html, /app\.webmanifest/);
assert.match(app, /service-worker\.js\?v=0\.4\.15/);
assert.equal(version.version, "0.4.15");
assert.equal(manifest.orientation, "landscape");
assert.match(html, /character-creation\.js/);
assert.match(html, /battle-ui\.js/);
assert.match(html, /qunlu-character-data\.js/);
assert.match(worker, /character-creation\.js/);
assert.match(worker, /battle-ui\.js/);
assert.equal(version.pwa_manifest, true);

console.log("PWA manifest, icons, offline precache, and complete app shell verified.");
