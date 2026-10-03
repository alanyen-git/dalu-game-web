const fs = require("node:fs/promises");
const path = require("node:path");
const vm = require("node:vm");
const revision = "0025a0783dbaf0358ed17dbfb831ecfe8609aa15";
const url = "https://raw.githubusercontent.com/alanyen-git/qunlu-game-web/" + revision + "/src/game-data.js";
async function main() {
  const response = await fetch(url, { headers: { "User-Agent": "dalu-game-web-character-catalog-import" } });
  if (!response.ok) throw new Error("Qunlu database download failed: HTTP " + response.status);
  const source = await response.text();
  const context = { console, window: null };
  context.window = context;
  const exportDb = "\n;globalThis.__QUNLU_DB_EXPORT__ = typeof DB !== 'undefined' ? DB : globalThis.DB;";
  vm.runInNewContext(source + exportDb, context, { timeout: 60000, filename: "qunlu-game-data.js" });
  const db = context.__QUNLU_DB_EXPORT__;
  if (!db) throw new Error("Qunlu game-data.js did not expose DB");
  const aliases = { races: db.races || db.species, origins: db.origins, combat_classes: db.combat_classes, talents: db.talents };
  const catalog = { source: "alanyen-git/qunlu-game-web", revision };
  for (const key of Object.keys(aliases)) {
    const rows = aliases[key];
    if (!Array.isArray(rows) || !rows.length) throw new Error("Qunlu character table is missing: " + key);
    catalog[key] = rows.filter((row) => row && row.id && row.name).map((row) => ({ id: String(row.id), name: String(row.name), description: String(row.description || ""), combat_role: String(row.combat_role || ""), category: String(row.category || "") }));
  }
  const output = "window.QUNLU_CHARACTER_DATA=" + JSON.stringify(catalog) + ";\n";
  await fs.writeFile(path.resolve(__dirname, "../qunlu-character-data.js"), output, "utf8");
  console.log("Imported Qunlu character catalog: " + Object.keys(catalog).map((key) => Array.isArray(catalog[key]) ? key + "=" + catalog[key].length : "").filter(Boolean).join(", "));
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
