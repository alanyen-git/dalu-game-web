const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const localVersion = JSON.parse(fs.readFileSync(path.join(root, "www", "play", "version.json"), "utf8"));
const webBuild = JSON.parse(fs.readFileSync(path.join(root, "www", "web-build.json"), "utf8"));

assert.match(localVersion.version, /^CURRENT-/);
assert.equal(webBuild.version, localVersion.version);
assert.equal(webBuild.entry, "play/");
assert.equal(webBuild.legacy_web_removed, true);

const base = process.env.PAGES_URL;
if (!base) {
  console.log("No PAGES_URL; local verification only: " + localVersion.version);
  process.exit(0);
}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
async function getText(url) {
  const response = await fetch(url, { cache: "no-store", headers: { "Cache-Control": "no-cache" } });
  if (!response.ok) throw new Error(url + " HTTP " + response.status);
  return response.text();
}
async function getJson(url) { return JSON.parse(await getText(url)); }

(async()=>{
  let lastError;
  for (let attempt=1; attempt<=20; attempt++) {
    try {
      const token = Date.now() + "-" + attempt;
      const rootVersion = await getJson(new URL("version.json?verify="+token, base));
      const playVersion = await getJson(new URL("play/version.json?verify="+token, base));
      const rootHtml = await getText(new URL("?verify="+token, base));
      const playHtml = await getText(new URL("play/?verify="+token, base));

      assert.equal(rootVersion.version, localVersion.version);
      assert.equal(rootVersion.web_entry, "play/");
      assert.equal(rootVersion.legacy_root_removed, true);
      assert.equal(playVersion.version, localVersion.version);
      assert.ok(rootHtml.includes("./play/"), "public root must redirect to /play/");
      assert.ok(rootHtml.includes("getRegistrations"), "public root must clear old service worker");
      assert.ok(playHtml.includes("NEW WEB・"+localVersion.version+"・APP同步版"), "public play page must expose new-web badge");
      console.log("Verified public NEW web game: " + new URL("play/", base) + " version=" + localVersion.version);
      return;
    } catch (error) {
      lastError = error;
      console.log("Public Pages not fresh yet, attempt " + attempt + ": " + error.message);
      await sleep(3000);
    }
  }
  throw lastError;
})().catch(error=>{ console.error(error); process.exit(1); });
