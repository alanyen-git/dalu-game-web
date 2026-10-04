const assert = require("node:assert/strict");
const Save = require("../save-system.js");
const Growth = require("../character-growth.js");

function run(name, check) {
  check();
  process.stdout.write("PASS " + name + "\n");
}

class MemoryStorage {
  constructor() { this.data = {}; }
  getItem(key) { return this.data[key] ?? null; }
  setItem(key, value) { this.data[key] = String(value); }
  removeItem(key) { delete this.data[key]; }
}

run("per-character skill practice unlocks at two successful uses and persists", () => {
  const hero = Growth.create({ name: "岑羽" });
  assert.equal(Growth.recordSkillUse(hero, "flare").uses, 1);
  const mastered = Growth.recordSkillUse(hero, "flare");
  assert.equal(mastered.masteredNow, true);
  assert.deepEqual(hero.growth.masteredSkills, ["flare"]);
  const storage = new MemoryStorage();
  assert.equal(Save.save(storage, { character: hero }).ok, true);
  const restored = Save.load(storage).state.character;
  Growth.ensure(restored);
  assert.equal(restored.growth.skillUses.flare, 2);
  assert.deepEqual(restored.growth.masteredSkills, ["flare"]);
});

run("legacy skill archive transfers one mastered skill to a new character", () => {
  const predecessor = Growth.create({ name: "前代旅人" });
  Growth.recordSkillUse(predecessor, "slash");
  Growth.recordSkillUse(predecessor, "slash");
  const archive = Growth.archiveMastery(predecessor, []);
  const successor = Growth.create({ name: "新旅人" });
  assert.equal(Growth.inheritSkill(successor, archive, "slash").ok, true);
  assert.deepEqual(successor.growth.inheritedSkills, ["slash"]);
  assert.equal(Growth.inheritSkill(successor, archive, "slash").reason, "already-mastered");
  assert.equal(Growth.inheritSkill(successor, archive, "flare").reason, "skill-not-archived");
});

run("rank assessment requires experience, practice, and a won in-game trial", () => {
  const hero = Growth.create({ name: "考核者" });
  assert.equal(Growth.evaluateTrial(hero).available, false);
  Growth.recordSkillUse(hero, "guard");
  Growth.recordSkillUse(hero, "guard");
  Growth.grantExperience(hero, "bell-warden", 180);
  const eligible = Growth.evaluateTrial(hero);
  assert.equal(eligible.available, true);
  assert.equal(eligible.nextRank, "E");
  assert.equal(Growth.completeTrial(hero, "E", false, 8).rank, "F");
  assert.equal(Growth.evaluateTrial(hero).available, true);
  assert.equal(Growth.completeTrial(hero, "E", true, 9).rank, "E");
  assert.equal(Growth.evaluateTrial(hero).available, false);
});

run("progress sources cannot grant duplicate experience", () => {
  const hero = Growth.create({ name: "旅人" });
  assert.equal(Growth.grantExperience(hero, "bell-warden", 180).level, 3);
  assert.equal(Growth.grantExperience(hero, "bell-warden", 180).reason, "already-awarded");
  assert.equal(hero.growth.experience, 180);
});

run("character catalog is local to Dalu and includes every creation category", () => {
  const data = require("../character-data.js");
  for (const key of ["races", "origins", "combat_classes", "talents"]) {
    assert.ok(Array.isArray(data[key]) && data[key].length >= 3, key + " catalog must be populated");
  }
});
