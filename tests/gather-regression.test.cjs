const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const source = fs.readFileSync(path.join(__dirname, "..", "qunlu-app", "src", "runtime.js"), "utf8");
function extract(name) {
  const start = source.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `runtime should define ${name}`);
  const end = source.indexOf("\n}", start);
  assert.notEqual(end, -1, `${name} should have a top-level closing brace`);
  return source.slice(start, end + 2);
}

const runAudit = extract("runAudit");
assert.doesNotMatch(runAudit, /runGeneratorAudit\s*\(/,
  "the five-turn gameplay audit must not rescan static world content during an action");

const inventory = new Map([[
  "HERB", { id: "HERB", name: "藥草", type: "材料", wild_gather_eligible: true, acquisition_sources: [] }
]]);
const location = { id: "WILD-TEST", kind: "wild", gather: ["HERB"] };
const quest = {
  status: "active", templateId: "GATHER-HERB", target_spawn_boost: 1,
  viableLocationIds: [location.id],
  objective: { kind: "gather", item_id: "HERB", target: 5 }
};
const G = { turn: 0, character: { locationId: location.id, inventory: [] }, quests: [quest] };
const calls = { sync: 0, legacyProgress: 0, endTurn: 0, errors: [] };
const context = {
  G,
  DB: { quest_system: { target_information_bonus: { gather_target_chance: 0.12 } } },
  console: { error: (...args) => calls.errors.push(args) },
  Math: { random: () => 0 },
  loc: id => id === location.id ? location : null,
  item: id => inventory.get(id) || null,
  hasTool: () => false,
  questTemplate: () => null,
  questViableLocations: () => [],
  clamp: (n, low, high) => Math.max(low, Math.min(high, n)),
  rand: () => 0,
  totalHours: () => 0,
  beginTurn: () => { G.turn++; return true; },
  checkRoll: () => 16,
  updateQuestProgress: () => { calls.legacyProgress++; },
  syncAllQuestInventoryProgress: () => {
    calls.sync++;
    const have = G.character.inventory.reduce((sum, row) => sum + (row.id === "HERB" ? row.qty : 0), 0);
    quest.progress = Math.min(quest.objective.target, have);
    if (have >= quest.objective.target) quest.status = "ready";
  },
  log: () => {},
  maybeEncounter: () => false,
  endTurn: () => { calls.endTurn++; },
  persist: () => {},
  renderAll: () => {}
};
vm.createContext(context);
vm.runInContext([
  extract("gatherResourceIds"), extract("gatherEligiblePool"),
  extract("activeGatherTarget"), extract("addItem"), extract("actGather")
].join("\n"), context);
for (let i = 0; i < 3; i++) vm.runInContext("actGather()", context);
const herb = G.character.inventory.find(row => row.id === "HERB");
assert.equal(G.turn, 3, "three consecutive harvests should complete three turns");
assert.equal(herb.qty, 9, "each high roll should keep its three-item yield");
assert.equal(quest.status, "ready", "gather quest progress must still update after the batch");
assert.equal(calls.sync, 3, "quest inventory should sync once per harvest, not once per item");
assert.equal(calls.legacyProgress, 0, "gathered items should skip redundant per-item quest scans");
assert.equal(calls.endTurn, 3, "each harvest should complete its normal turn");
assert.equal(calls.errors.length, 0, "three consecutive harvests should not throw");
console.log("PASS three consecutive harvests preserve yield and quest progress with one inventory sync per action; fifth-turn audit avoids static rescan");
