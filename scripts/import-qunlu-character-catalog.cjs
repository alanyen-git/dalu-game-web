const fs = require("node:fs/promises");
const path = require("node:path");

const revision = "0025a0783dbaf0358ed17dbfb831ecfe8609aa15";
const url = "https://raw.githubusercontent.com/alanyen-git/qunlu-game-web/" + revision + "/src/game-data.js";

async function main() {
  const response = await fetch(url, { headers: { "User-Agent": "dalu-game-web-character-catalog" } });
  if (!response.ok) throw new Error("群陸旅誌資料庫下載失敗：HTTP " + response.status);
  const source = await response.text();
  const prefix = "const DB=";
  if (!source.startsWith(prefix) || !source.endsWith(";")) throw new Error("群陸資料庫格式不符合預期");
  const db = JSON.parse(source.slice(prefix.length, -1));
  const keys = ["races", "origins", "combat_classes", "talents"];
  const catalog = { source_repo: "alanyen-git/qunlu-game-web", source_revision: revision, source_database: "src/game-data.js" };
  for (const key of keys) {
    if (!Array.isArray(db[key]) || !db[key].length) throw new Error("群陸角色資料表缺少：" + key);
    catalog[key] = db[key];
  }
  const output = "(function (root) {\n  \"use strict\";\n  const catalog = " + JSON.stringify(catalog) + ";\n  if (typeof module === \"object\" && module.exports) module.exports = catalog;\n  root.DaluCharacterData = catalog;\n})(typeof window !== \"undefined\" ? window : globalThis);\n";
  await fs.writeFile(path.resolve(__dirname, "../character-data.js"), output, "utf8");
  console.log("Imported 群陸旅誌 character catalog: " + keys.map(key => key + "=" + catalog[key].length).join(", "));
}
main().catch(error => { console.error(error); process.exitCode = 1; });
