const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const document = { querySelector: () => null, querySelectorAll: () => [], createElement: () => ({ dataset: {}, classList: { add() {}, remove() {}, toggle() {} }, insertAdjacentElement() {} }), addEventListener() {} };
const localStorage = { data: {}, getItem(key) { return this.data[key] || null; }, setItem(key, value) { this.data[key] = value; } };
const window = { __DALU_TEST__: true, localStorage, navigator: { serviceWorker: { register() { return { catch() {} }; } } } };
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
