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
