(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.DaluCharacterGrowth = api;
})(typeof globalThis === "object" ? globalThis : this, function () {
  "use strict";

  const SKILLS = Object.freeze({
    slash: { name: "劍氣斬", threshold: 2 },
    flare: { name: "爆裂火球", threshold: 2 },
    mend: { name: "治療波", threshold: 2 },
    guard: { name: "盾牆", threshold: 2 }
  });
  const RANKS = Object.freeze(["F", "E", "D", "C", "B", "A"]);
  const TRIALS = Object.freeze({
    E: { level: 2, skills: 1, title: "見習考核" },
    D: { level: 3, skills: 2, title: "行旅考核" },
    C: { level: 4, skills: 3, title: "熟練考核" },
    B: { level: 5, skills: 4, title: "精銳考核" },
    A: { level: 6, skills: 4, title: "大師考核" }
  });

  function freshGrowth() {
    return { level: 1, experience: 0, rank: "F", skillUses: {}, masteredSkills: [], inheritedSkills: [], trialHistory: [], experienceSources: [] };
  }

  function ensure(character) {
    if (!character || typeof character !== "object" || Array.isArray(character)) return null;
    const old = character.growth && typeof character.growth === "object" ? character.growth : {};
    const next = Object.assign(freshGrowth(), old);
    next.level = Math.max(1, Math.floor(Number(next.level) || 1));
    next.experience = Math.max(0, Math.floor(Number(next.experience) || 0));
    if (!RANKS.includes(next.rank)) next.rank = "F";
    next.skillUses = next.skillUses && typeof next.skillUses === "object" ? next.skillUses : {};
    next.masteredSkills = Array.isArray(next.masteredSkills) ? next.masteredSkills.filter((id) => SKILLS[id]) : [];
    next.inheritedSkills = Array.isArray(next.inheritedSkills) ? next.inheritedSkills.filter((id) => SKILLS[id]) : [];
    next.trialHistory = Array.isArray(next.trialHistory) ? next.trialHistory.slice(-30) : [];
    next.experienceSources = Array.isArray(next.experienceSources) ? next.experienceSources.filter((id) => typeof id === "string").slice(-100) : [];
    Object.keys(SKILLS).forEach((id) => {
      next.skillUses[id] = Math.min(SKILLS[id].threshold, Math.max(0, Math.floor(Number(next.skillUses[id]) || 0)));
      if (next.skillUses[id] >= SKILLS[id].threshold && !next.masteredSkills.includes(id)) next.masteredSkills.push(id);
    });
    character.growth = next;
    return character;
  }

  function create(character) {
    const next = Object.assign({}, character || {});
    next.growth = freshGrowth();
    return ensure(next);
  }

  function recordSkillUse(character, skillId) {
    const skill = SKILLS[skillId];
    const current = ensure(character);
    if (!current || !skill) return { ok: false, reason: "unknown-skill" };
    const growth = current.growth;
    const before = growth.skillUses[skillId] || 0;
    growth.skillUses[skillId] = Math.min(skill.threshold, before + 1);
    const masteredNow = before < skill.threshold && growth.skillUses[skillId] >= skill.threshold;
    if (masteredNow && !growth.masteredSkills.includes(skillId)) growth.masteredSkills.push(skillId);
    return { ok: true, skillId, uses: growth.skillUses[skillId], threshold: skill.threshold, mastered: growth.masteredSkills.includes(skillId), masteredNow };
  }

  function archiveMastery(character, archive) {
    const current = ensure(character);
    if (!current || !Array.isArray(archive)) return [];
    current.growth.masteredSkills.forEach((skillId) => {
      if (!archive.some((entry) => entry && entry.id === skillId)) {
        archive.push({ id: skillId, name: SKILLS[skillId].name, source: String(current.name || "旅人") });
      }
    });
    return archive;
  }

  function inheritSkill(character, archive, skillId) {
    const current = ensure(character);
    const source = Array.isArray(archive) && archive.find((entry) => entry && entry.id === skillId);
    if (!current || !SKILLS[skillId] || !source) return { ok: false, reason: "skill-not-archived" };
    if (current.growth.masteredSkills.includes(skillId)) return { ok: false, reason: "already-mastered" };
    if (current.growth.inheritedSkills.length >= 1) return { ok: false, reason: "inheritance-slot-used" };
    current.growth.skillUses[skillId] = SKILLS[skillId].threshold;
    current.growth.masteredSkills.push(skillId);
    current.growth.inheritedSkills.push(skillId);
    return { ok: true, skillId, source: source.source || "前代旅人" };
  }

  function levelThreshold(level) {
    return Math.floor(level * (level + 1) / 2 * 60);
  }

  function grantExperience(character, sourceId, amount) {
    const current = ensure(character);
    const xp = Math.max(0, Math.floor(Number(amount) || 0));
    if (!current || !xp || typeof sourceId !== "string" || !sourceId) return { ok: false, reason: "invalid-award" };
    const growth = current.growth;
    if (growth.experienceSources.includes(sourceId)) return { ok: false, reason: "already-awarded", level: growth.level };
    growth.experienceSources.push(sourceId);
    growth.experience = Math.min(10000000, growth.experience + xp);
    while (growth.level < 99 && growth.experience >= levelThreshold(growth.level)) growth.level += 1;
    return { ok: true, experience: growth.experience, gained: xp, level: growth.level };
  }

  function evaluateTrial(character) {
    const current = ensure(character);
    if (!current) return { available: false, reason: "no-character", nextRank: null };
    const index = RANKS.indexOf(current.growth.rank);
    if (index < 0 || index >= RANKS.length - 1) return { available: false, reason: "max-rank", nextRank: null };
    const nextRank = RANKS[index + 1];
    const requirement = TRIALS[nextRank];
    const skills = current.growth.masteredSkills.length;
    const missing = [];
    if (current.growth.level < requirement.level) missing.push("等級 " + requirement.level);
    if (skills < requirement.skills) missing.push("熟練技能 " + requirement.skills + " 項");
    const passed = current.growth.trialHistory.some((entry) => entry && entry.rank === nextRank && entry.result === "pass");
    return { available: missing.length === 0 && !passed, nextRank, title: requirement.title, level: current.growth.level, requiredLevel: requirement.level, masteredSkills: skills, requiredSkills: requirement.skills, missing, passed };
  }

  function completeTrial(character, rank, won, day) {
    const current = ensure(character);
    const assessment = evaluateTrial(current);
    if (!current || !assessment.nextRank || rank !== assessment.nextRank || assessment.missing.length || assessment.passed) {
      return { ok: false, reason: "trial-locked", assessment };
    }
    const result = won ? "pass" : "fail";
    current.growth.trialHistory.push({ rank, result, day: Number.isFinite(Number(day)) ? Number(day) : null });
    if (won) current.growth.rank = rank;
    return { ok: true, result, rank: current.growth.rank, next: evaluateTrial(current) };
  }

  function describe(character) {
    const current = ensure(character);
    if (!current) return { level: 1, rank: "F", experience: 0, masteredSkills: [], trial: evaluateTrial(null) };
    return { level: current.growth.level, rank: current.growth.rank, experience: current.growth.experience, masteredSkills: current.growth.masteredSkills.slice(), inheritedSkills: current.growth.inheritedSkills.slice(), trial: evaluateTrial(current) };
  }

  return Object.freeze({ SKILLS, RANKS, TRIALS, ensure, create, recordSkillUse, archiveMastery, inheritSkill, grantExperience, evaluateTrial, completeTrial, describe, levelThreshold });
});
