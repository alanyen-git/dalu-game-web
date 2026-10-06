const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const localVersion = JSON.parse(fs.readFileSync(path.join(root, "www", "game", "version.json"), "utf8"));
const webBuild = JSON.parse(fs.readFileSync(path.join(root, "www", "web-build.json"), "utf8"));

assert.match(localVersion.version, /^CURRENT-/);
assert.equal(webBuild.version, localVersion.version);
assert.equal(webBuild.entry, "game/");
assert.equal(webBuild.interface, "WEB-2.0");
assert.equal(webBuild.legacy_play_removed, true);

const base = process.env.PAGES_URL;
if (!base) {
  console.log("No PAGES_URL; local verification only: " + localVersion.version);
  process.exit(0);
}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
async function fetchNoStore(url) {
  return fetch(url, { cache: "no-store", headers: { "Cache-Control": "no-cache" } });
}
async function text(url) {
  const response = await fetchNoStore(url);
  if (!response.ok) throw new Error(url + " HTTP " + response.status);
  return response.text();
}
async function json(url) { return JSON.parse(await text(url)); }

(async()=>{
  let lastError;
  for (let attempt=1; attempt<=20; attempt++) {
    try {
      const token = Date.now() + "-" + attempt;
      const rootVersion = await json(new URL("version.json?verify="+token, base));
      const gameVersion = await json(new URL("game/version.json?verify="+token, base));
      const rootHtml = await text(new URL("?verify="+token, base));
      const gameHtml = await text(new URL("game/?verify="+token, base));
      const playResponse = await fetchNoStore(new URL("play/?verify="+token, base));

      assert.equal(rootVersion.version, localVersion.version);
      assert.equal(rootVersion.web_entry, "game/");
      assert.equal(rootVersion.legacy_play_removed, true);
      assert.equal(gameVersion.version, localVersion.version);
      assert.ok(rootHtml.includes("./game/"), "public root must redirect to /game/");
      assert.ok(rootHtml.includes("getRegistrations"), "public root must clear old service workers");
      assert.ok(gameHtml.includes("異界旅人・WEB 2.0"), "public /game/ must be WEB 2.0");
      assert.ok(gameHtml.includes("冒險指揮台"), "public /game/ must show the new interface");
      assert.ok(!gameHtml.includes("旅途未竟，群陸在前"), "public /game/ must not contain the old hero");
      assert.equal(playResponse.status, 404, "old /play/ must be physically removed from Pages");

      console.log("Verified public 異界旅人 WEB 2.0: " + new URL("game/", base) + " version=" + localVersion.version);
      return;
    } catch (error) {
      lastError = error;
      console.log("Public Pages not fresh yet, attempt " + attempt + ": " + error.message);
      await sleep(3000);
    }
  }
  throw lastError;
})().catch(error=>{ console.error(error); process.exit(1); });
