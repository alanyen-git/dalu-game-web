const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const document = { querySelector: () => null, querySelectorAll: () => [], createElement: () => ({ dataset: {}, classList: { add() {}, remove() {}, toggle() {} }, insertAdjacentElement() {} }), addEventListener() {} };
const localStorage = { data: {}, getItem(key) { return this.data[key] || null; }, setItem(key, value) { this.data[key] = value; } };
const growthHooks = { skillUses: [], experience: [], trials: [] };
const window = { __DALU_TEST__: true, localStorage, navigator: { serviceWorker: { register() { return { catch() {} }; } } }, DaluGrowthBridge: {
  syncMastery() {},
  recordSkillUse(id) { growthHooks.skillUses.push(id); },
  recordExperience(source, amount) { growthHooks.experience.push([source, amount]); },
  getTrial() { return { available: true, nextRank: "E", title: "見習考核" }; },
  completeTrial(rank, won) { growthHooks.trials.push([rank, won]); return { ok: true, rank: won ? rank : "F" }; }
} };
vm.runInNewContext(fs.readFileSync(path.join(__dirname, "../battle.js"), "utf8"), { window, document, JSON, Math });
const api = window.__DALU_BATTLE_TEST_API__;
function run(name, check) { check(); process.stdout.write("PASS " + name + "\n"); }
run("fixed-seed cross strike hits the selected cell and adjacent enemies", () => { api.reset(); api.act("flare"); api.act("flare", "warden"); const state = api.getState(); assert.deepEqual(Array.from(state.enemies, unit => [unit.id, unit.hp]), [["hound-a", 36], ["warden", 94], ["hound-b", 36]]); assert.equal(state.pending, ""); });
run("front-line guard absorbs the first fixed-encounter strike", () => { api.reset(); const state = api.getState(); state.enemies = [state.enemies[0]]; api.act("guard"); const loen = state.party.find(unit => unit.id === "loen"); assert.equal(loen.hp, 120); assert.equal(loen.guard, 1); });
run("seeded healing selects the same two injured allies on replay", () => { function play() { api.reset(); const state = api.getState(); state.enemies = []; state.party.forEach((unit, i) => { unit.hp = [40, 50, 30][i]; }); api.act("mend"); return state.party.map(unit => unit.hp); } const first = play(); const replay = play(); assert.deepEqual(first, replay); assert.equal(first.filter((hp, i) => hp > [40, 50, 30][i]).length, 2); });
run("party formation toggles between front and back row", () => { api.reset(); const state = api.getState(); const tide = state.party.find(unit => unit.id === "tide"); assert.equal(tide.row, "back"); assert.equal(api.toggleRow("tide"), true); assert.equal(tide.row, "front"); assert.equal(api.toggleRow("tide"), true); assert.equal(tide.row, "back"); });
run("skill mastery unlocks a 20 percent effect increase after two uses", () => {
  api.reset();
  api.act("slash"); api.act("slash", "hound-a");
  assert.equal(api.getState().mastery.slash, 1);
  assert.equal(api.getState().learnedSkills.includes("slash"), false);
  api.act("slash"); api.act("slash", "hound-a");
  const state = api.getState();
  assert.equal(state.mastery.slash, 2);
  assert.equal(state.learnedSkills.includes("slash"), true);
  assert.equal(state.enemies.find(unit => unit.id === "hound-a").hp, 1);
});
run("assault formation increases line attack damage", () => {
  api.reset();
  assert.equal(api.setFormation("assault"), true);
  api.act("slash"); api.act("slash", "hound-a");
  assert.equal(api.getState().enemies.find(unit => unit.id === "hound-a").hp, 26);
});
run("bulwark formation adds shield strength and reduces front-line damage", () => {
  api.reset();
  const state = api.getState(); state.enemies = [state.enemies[0]];
  assert.equal(api.setFormation("bulwark"), true);
  api.act("guard");
  const loen = state.party.find(unit => unit.id === "loen");
  assert.equal(loen.hp, 120);
  assert.equal(loen.guard, 10);
});
run("tide-link formation triggers a coordinated follow-up strike", () => {
  api.reset();
  assert.equal(api.setFormation("tideLink"), true);
  api.act("flare"); api.act("flare", "warden");
  const state = api.getState();
  assert.deepEqual(Array.from(state.enemies, unit => [unit.id, unit.hp]), [["hound-a", 30], ["warden", 88], ["hound-b", 30]]);
  assert.ok(state.log.some(line => line.includes("潮火連攜")));
});
run("legacy battle saves keep combat progress and receive default mastery and formation", () => {
  api.reset();
  const legacy = JSON.parse(JSON.stringify(api.getState()));
  legacy.round = 5; delete legacy.formation; delete legacy.mastery; delete legacy.learnedSkills;
  localStorage.data["dalu-combat-v1"] = JSON.stringify(legacy);
  api.load();
  const state = api.getState();
  assert.equal(state.round, 5);
  assert.equal(state.formation, "balanced");
  assert.equal(state.mastery.slash, 0);
  assert.deepEqual(Array.from(state.learnedSkills), []);
});
run("summon guardian strategy strengthens the front-line shield", () => {
  api.reset();
  assert.equal(api.setSummonStrategy("guardian"), true);
  api.getState().enemies = [];
  api.act("guard");
  assert.equal(api.getState().party.find(unit => unit.id === "loen").guard, 20);
});
run("summon healer strategy improves the two-target healing effect", () => {
  api.reset();
  assert.equal(api.setSummonStrategy("healer"), true);
  const state = api.getState();
  state.enemies = [];
  state.party.forEach((unit, i) => { unit.hp = [40, 50, 30][i]; });
  const before = state.party.map(unit => unit.hp);
  api.act("mend");
  const healed = state.party.map((unit, i) => unit.hp - before[i]).filter(value => value > 0);
  assert.equal(healed.length, 2);
  assert.ok(healed.every(value => value === 26));
});
run("automatic tactical plan clears the complete encounter with the summon alive", () => {
  api.reset();
  let turns = 0;
  while (!api.getState().winner && turns < 20) {
    assert.equal(api.autoTurn(), true);
    turns += 1;
  }
  const state = api.getState();
  assert.equal(state.winner, "victory");
  assert.ok(state.party.find(unit => unit.id === "tide").hp > 0);
  assert.equal(state.enemies.every(unit => unit.hp === 0), true);
  assert.equal(state.formation, "bulwark");
});
run("valid combat actions update the saved character skill record", () => {
  api.reset();
  const before = growthHooks.skillUses.length;
  api.act("slash"); api.act("slash", "hound-a");
  assert.deepEqual(growthHooks.skillUses.slice(before), ["slash"]);
});
run("winning a rank trial records the result without issuing a repeatable encounter reward", () => {
  api.reset();
  growthHooks.experience.length = 0;
  const before = growthHooks.trials.length;
  assert.equal(api.startRankTrial(), true);
  let turns = 0;
  while (!api.getState().winner && turns < 24) { assert.equal(api.autoTurn(), true); turns += 1; }
  assert.equal(api.getState().winner, "victory");
  assert.deepEqual(growthHooks.trials.slice(before), [["E", true]]);
  assert.deepEqual(growthHooks.experience, []);
});
