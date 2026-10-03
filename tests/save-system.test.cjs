const assert = require("node:assert/strict");
const Save = require("../save-system.js");

class MemoryStorage {
  constructor(initial = {}) { this.data = { ...initial }; this.failKey = null; }
  getItem(key) { return Object.prototype.hasOwnProperty.call(this.data, key) ? this.data[key] : null; }
  setItem(key, value) { if (key === this.failKey) throw new Error("quota exceeded"); this.data[key] = String(value); }
  removeItem(key) { delete this.data[key]; }
}
function test(name, fn) { fn(); process.stdout.write("PASS " + name + "\n"); }
const oldState = { role: "hero", character: { name: "QA 旅人", race: "海裔" }, world: { day: 9, activeLocation: "salt-marsh", unlocked: ["wind-spring", "salt-marsh"] } };

test("v3 save migrates to v4 and preserves the original as a recovery copy", () => {
  const oldRaw = JSON.stringify({ version: 3, state: oldState });
  const storage = new MemoryStorage({ [Save.KEYS.legacy[0]]: oldRaw });
  const loaded = Save.load(storage);
  assert.equal(loaded.status, "migrated");
  assert.equal(loaded.schemaVersion, 4);
  assert.equal(loaded.state.world.day, 9);
  assert.equal(loaded.state.character.name, "QA 旅人");
  assert.equal(storage.getItem(Save.KEYS.backup), oldRaw);
  assert.equal(JSON.parse(storage.getItem(Save.KEYS.current)).schemaVersion, 4);
});

test("v2 saves retain progress fields during migration", () => {
  const storage = new MemoryStorage({ [Save.KEYS.legacy[1]]: JSON.stringify({ version: 2, state: oldState }) });
  const loaded = Save.load(storage);
  assert.equal(loaded.status, "migrated");
  assert.equal(loaded.state.world.activeLocation, "salt-marsh");
  assert.deepEqual(loaded.state.world.unlocked, ["wind-spring", "salt-marsh"]);
});

test("corrupt current save recovers from the last valid backup without replacing it", () => {
  const backup = JSON.stringify({ schemaVersion: 4, savedAt: "2026-10-03T00:00:00.000Z", state: oldState });
  const storage = new MemoryStorage({ [Save.KEYS.current]: "{broken", [Save.KEYS.backup]: backup });
  const loaded = Save.load(storage);
  assert.equal(loaded.status, "recovered");
  assert.equal(loaded.state.world.day, 9);
  assert.equal(storage.getItem(Save.KEYS.backup), backup);
  assert.equal(JSON.parse(storage.getItem(Save.KEYS.current)).state.character.name, "QA 旅人");
});

test("each successful save keeps the previous valid v4 save as the backup", () => {
  const storage = new MemoryStorage();
  assert.equal(Save.save(storage, oldState).ok, true);
  const first = storage.getItem(Save.KEYS.current);
  assert.equal(Save.save(storage, { ...oldState, world: { day: 10 } }).ok, true);
  assert.equal(storage.getItem(Save.KEYS.backup), first);
  assert.equal(JSON.parse(storage.getItem(Save.KEYS.current)).state.world.day, 10);
});

test("manual restore returns the previous save and leaves the backup available", () => {
  const oldRaw = JSON.stringify({ schemaVersion: 4, savedAt: "2026-10-03T00:00:00.000Z", state: oldState });
  const storage = new MemoryStorage({ [Save.KEYS.current]: JSON.stringify({ schemaVersion: 4, state: { world: { day: 12 } } }), [Save.KEYS.backup]: oldRaw });
  const restored = Save.restore(storage);
  assert.equal(restored.status, "restored");
  assert.equal(restored.state.world.day, 9);
  assert.equal(storage.getItem(Save.KEYS.backup), oldRaw);
});

test("failed writes leave the prior save and backup intact", () => {
  const original = JSON.stringify({ schemaVersion: 4, state: oldState });
  const backup = JSON.stringify({ schemaVersion: 4, state: { world: { day: 8 } } });
  const storage = new MemoryStorage({ [Save.KEYS.current]: original, [Save.KEYS.backup]: backup });
  storage.failKey = Save.KEYS.current;
  const result = Save.save(storage, { world: { day: 11 } });
  assert.equal(result.ok, false);
  assert.equal(storage.getItem(Save.KEYS.current), original);
  assert.equal(storage.getItem(Save.KEYS.backup), backup);
});

test("unreadable saves are preserved for manual inspection", () => {
  const damaged = "not-json";
  const storage = new MemoryStorage({ [Save.KEYS.current]: damaged });
  assert.equal(Save.load(storage).status, "empty-or-unreadable");
  assert.equal(storage.getItem(Save.KEYS.current), damaged);
});

test("legacy localStorage calls transparently use the v4 save and backup", () => {
  const storage = new MemoryStorage({ [Save.KEYS.legacy[0]]: JSON.stringify({ version: 3, state: oldState }) });
  const bridge = Save.installCompatibilityBridge(storage);
  assert.equal(bridge.ok, true);
  const projected = JSON.parse(storage.getItem(Save.KEYS.legacy[0]));
  assert.equal(projected.state.world.day, 9);
  storage.setItem(Save.KEYS.legacy[0], JSON.stringify({ version: 3, state: { ...oldState, world: { day: 10 } } }));
  assert.equal(JSON.parse(storage.data[Save.KEYS.current]).state.world.day, 10);
  assert.equal(JSON.parse(storage.data[Save.KEYS.backup]).state.world.day, 9);
});
