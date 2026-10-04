const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const assert = require("node:assert/strict");

function validate(web, root = web) {
  const read = file => fs.readFileSync(path.join(web, file), "utf8");
  const version = JSON.parse(read("version.json"));
  const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
  assert.equal(version.slug, "dalu-game-web");
  assert.equal(version.source_repo, "alanyen-git/dalu-game-web");
  assert.equal(version.version, pkg.version, "package / version.json 版本不一致");
  const html = read("index.html");
  const worker = read("service-worker.js");
  const offline = vm.runInNewContext(worker + "\n;({assets: ASSETS, cache: CACHE})", {
    self: { addEventListener() {} }
  }, { timeout: 1000 });
  assert.equal(offline.cache, "dalu-travel-log-v" + version.version);
  assert.ok(read("app-update.js").includes('var BUILD_VERSION = "' + version.version + '"'), "更新管理器版本不一致");
  const refs = [...offline.assets, ...Array.from(html.matchAll(/(?:src|href)=["']([^"']+)["']/g), m => m[1]), ...JSON.parse(read("app.webmanifest")).icons.map(icon => icon.src)];
  for (const ref of refs) {
    if (/^(?:https?:|data:|#)/.test(ref)) continue;
    const url = new URL(ref, "https://bundle.invalid/");
    const file = decodeURIComponent(url.pathname).replace(/^\//, "") || "index.html";
    const resolved = path.resolve(web, file);
    assert.ok(resolved.startsWith(path.resolve(web) + path.sep), "資源路徑超出網頁目錄");
    assert.ok(fs.existsSync(resolved) && fs.statSync(resolved).size > 0, "缺少或空白資源：" + ref);
    if (url.searchParams.has("v")) assert.equal(url.searchParams.get("v"), version.version, "資源版本不一致：" + ref);
  }
  for (const m of html.matchAll(/(?:src|href)=["'](\.\/[^"']+\.(?:js|css)\?v=[^"']+)["']/g)) {
    assert.ok(offline.assets.includes(m[1]), "網頁資源未加入離線快取：" + m[1]);
  }
  return version;
}
module.exports = { validate };
