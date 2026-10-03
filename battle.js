(function () {
  var KEY = "dalu-combat-v1";
  var skills = {
    slash: { name: "劍氣斬", kind: "attack", shape: "同一列", power: 24, threshold: 2, bonus: 0.2, copy: "斬擊目標所在的敵方列。" },
    flare: { name: "爆裂火球", kind: "attack", shape: "十字範圍", power: 18, threshold: 2, bonus: 0.2, copy: "以目標為中心波及相鄰敵人。" },
    mend: { name: "治療波", kind: "heal", shape: "亂數 2 名", power: 22, threshold: 2, bonus: 0.2, copy: "治療兩名受傷的我方單位。" },
    guard: { name: "盾牆", kind: "guard", shape: "我方前排", power: 12, threshold: 2, bonus: 0.2, copy: "前排獲得援護護盾。" }
  };
  var formations = {
    balanced: { name: "均衡陣", description: "攻守平衡，不提供額外加成。", damage: 0, healing: 0, guard: 0, mitigation: 0, combo: false },
    assault: { name: "突擊陣", description: "攻擊技能傷害提高 15%。", damage: 0.15, healing: 0, guard: 0, mitigation: 0, combo: false },
    bulwark: { name: "守勢陣", description: "前排承受傷害降低 25%，盾牆額外增加 6 點。", damage: 0, healing: 0, guard: 6, mitigation: 0.25, combo: false },
    tideLink: { name: "潮火連攜", description: "洛恩前排、潮羽靈後排時，攻擊追加連攜傷害。", damage: 0, healing: 0.1, guard: 0, mitigation: 0, combo: true }
  };
  var battle = null;
  function fresh() { return { round: 1, rngState: 20261003, pending: "", winner: "", formation: "balanced", mastery: { slash: 0, flare: 0, mend: 0, guard: 0 }, learnedSkills: [], log: ["鐘影守衛封鎖了北坡，選擇洛恩的第一個行動。"], party: [
    { id: "loen", name: "洛恩", role: "流浪劍士", row: "front", hp: 120, max: 120, speed: 82, avatar: "洛", cls: "ally-a", guard: 0 },
    { id: "yida", name: "伊妲", role: "星紋術士", row: "back", hp: 86, max: 86, speed: 68, avatar: "伊", cls: "ally-b", guard: 0 },
    { id: "tide", name: "潮羽靈", role: "召喚獸", row: "back", hp: 58, max: 58, speed: 74, avatar: "潮", cls: "ally-c", guard: 0 }
  ], enemies: [
    { id: "hound-a", name: "鹽沼獵犬", role: "野獸", row: "front", hp: 54, max: 54, speed: 76, avatar: "犬", cls: "enemy-beast", guard: 0 },
    { id: "warden", name: "鐘影守衛", role: "Boss・構裝體", row: "boss", hp: 112, max: 112, speed: 61, avatar: "鐘", cls: "enemy-boss", guard: 0 },
    { id: "hound-b", name: "鹽沼獵犬", role: "野獸", row: "front", hp: 54, max: 54, speed: 72, avatar: "犬", cls: "enemy-beast", guard: 0 }
  ] }; }
  function save() { window.localStorage.setItem(KEY, JSON.stringify(battle)); }
  function normalise() {
    if (!battle || typeof battle !== "object") battle = fresh();
    if (!formations[battle.formation]) battle.formation = "balanced";
    if (!battle.mastery || typeof battle.mastery !== "object") battle.mastery = { slash: 0, flare: 0, mend: 0, guard: 0 };
    Object.keys(skills).forEach(function (id) { if (!Number.isFinite(Number(battle.mastery[id]))) battle.mastery[id] = 0; });
    if (!Array.isArray(battle.learnedSkills)) battle.learnedSkills = [];
    battle.learnedSkills = battle.learnedSkills.filter(function (id) { return Boolean(skills[id]); });
    Object.keys(skills).forEach(function (id) { if (battle.mastery[id] >= skills[id].threshold && battle.learnedSkills.indexOf(id) < 0) battle.learnedSkills.push(id); });
    if (!Array.isArray(battle.party) || !Array.isArray(battle.enemies)) battle = fresh();
  }
  function load() { try { battle = JSON.parse(window.localStorage.getItem(KEY) || "null") || fresh(); } catch (error) { battle = fresh(); } normalise(); }
  function isMastered(id) { return Boolean(battle && battle.learnedSkills.indexOf(id) >= 0); }
  function effectivePower(id) {
    var skill = skills[id]; var value = skill.power * (isMastered(id) ? 1 + skill.bonus : 1);
    var formation = formations[battle.formation] || formations.balanced;
    if (skill.kind === "attack") value *= 1 + formation.damage;
    if (skill.kind === "heal") value *= 1 + formation.healing;
    if (skill.kind === "guard") value += formation.guard;
    return Math.max(1, Math.round(value));
  }
  function recordMastery(id) {
    battle.mastery[id] = (battle.mastery[id] || 0) + 1;
    if (battle.mastery[id] >= skills[id].threshold && battle.learnedSkills.indexOf(id) < 0) {
      battle.learnedSkills.push(id);
      writeLog("領悟技能：" + skills[id].name + "，效果提升 " + Math.round(skills[id].bonus * 100) + "%。");
    }
  }
  function setFormation(id) {
    if (!battle || !formations[id] || battle.pending || battle.winner) return false;
    battle.formation = id;
    writeLog("切換為" + formations[id].name + "：" + formations[id].description);
    save(); render(); return true;
  }
  function skillCatalog() {
    return Object.keys(skills).map(function (id) { return { id: id, name: skills[id].name, shape: skills[id].shape, copy: skills[id].copy, uses: battle.mastery[id] || 0, threshold: skills[id].threshold, mastered: isMastered(id), bonus: Math.round(skills[id].bonus * 100) }; });
  }
  function formationCatalog() {
    return Object.keys(formations).map(function (id) { return { id: id, name: formations[id].name, description: formations[id].description, selected: battle.formation === id }; });
  }
  function living(side) { return battle[side].filter(function (unit) { return unit.hp > 0; }); }
  function randomIndex(length) { battle.rngState = (battle.rngState * 1664525 + 1013904223) >>> 0; return battle.rngState % length; }
  function find(id) { return battle.party.concat(battle.enemies).filter(function (unit) { return unit.id === id; })[0]; }
  function writeLog(message) { battle.log.unshift(message); battle.log = battle.log.slice(0, 5); }
  function hit(target, amount) { var shield = target.guard || 0; target.guard = Math.max(0, shield - amount); var damage = Math.max(0, amount - shield); target.hp = Math.max(0, target.hp - damage); return damage; }
  function result() { if (!living("enemies").length) return "victory"; if (!living("party").length) return "defeat"; return ""; }
  function enemyTurn() {
    var enemies = living("enemies").sort(function (a, b) { return b.speed - a.speed; });
    enemies.forEach(function (enemy) {
      var targets = living("party").sort(function (a, b) { return (a.row === "front" ? 0 : 1) - (b.row === "front" ? 0 : 1); });
      if (!targets.length) return;
      var amount = enemy.id === "warden" ? 18 : 11;
      var formation = formations[battle.formation] || formations.balanced;
      if (formation.mitigation && targets[0].row === "front") amount = Math.max(1, Math.round(amount * (1 - formation.mitigation)));
      var dealt = hit(targets[0], amount);
      writeLog(enemy.name + "攻擊" + targets[0].name + "，造成 " + dealt + " 點傷害。");
    });
  }
  function finish() { battle.pending = ""; battle.winner = result(); if (!battle.winner) { enemyTurn(); battle.winner = result(); battle.round += 1; if (!battle.winner) writeLog("第 " + battle.round + " 回合開始，輪到洛恩。"); } else { writeLog(battle.winner === "victory" ? "鐘影守衛崩解，戰鬥勝利。" : "全員倒下，可重新挑戰這場遭遇戰。"); } save(); render(); }
  function toggleRow(id) { var unit = find(id); if (!unit || battle.party.indexOf(unit) < 0 || battle.pending || battle.winner) return false; unit.row = unit.row === "front" ? "back" : "front"; writeLog(unit.name + "調整至" + (unit.row === "front" ? "前排" : "後排") + "。"); save(); render(); return true; }
  function act(id, targetId) {
    if (!battle || battle.winner) return;
    var skill = skills[id]; if (!skill) return;
    if (skill.kind === "attack" && !targetId) { battle.pending = id; writeLog(skill.name + "已準備，請選擇敵方目標。"); render(); return; }
    var power = effectivePower(id);
    var affected = [];
    if (skill.kind === "attack") {
      var target = find(targetId);
      if (!target || target.hp <= 0 || battle.enemies.indexOf(target) < 0) return;
      var targetIndex = battle.enemies.indexOf(target);
      affected = skill.shape === "同一列" ? living("enemies").filter(function (unit) { return unit.row === target.row; }) : living("enemies").filter(function (unit) { var index = battle.enemies.indexOf(unit); return Math.abs(index - targetIndex) <= 1; });
    }
    recordMastery(id);
    power = effectivePower(id);
    if (skill.kind === "attack") {
      affected.forEach(function (unit) { hit(unit, power); });
      writeLog("洛恩使用" + skill.name + "，" + affected.map(function (unit) { return unit.name; }).join("、") + "受到 " + power + " 點傷害。");
      var loen = battle.party.filter(function (unit) { return unit.id === "loen" && unit.hp > 0; })[0];
      var tide = battle.party.filter(function (unit) { return unit.id === "tide" && unit.hp > 0; })[0];
      if (formations[battle.formation].combo && loen && tide && loen.row === "front" && tide.row === "back") {
        var comboDamage = Math.max(1, Math.round(power * 0.35));
        affected.forEach(function (unit) { if (unit.hp > 0) hit(unit, comboDamage); });
        writeLog("潮火連攜！洛恩牽制敵陣，潮羽靈追加 " + comboDamage + " 點潮焰傷害。");
      }
    } else if (skill.kind === "heal") {
      var candidates = living("party").filter(function (unit) { return unit.hp < unit.max; });
      var healed = [];
      while (candidates.length && healed.length < 2) healed.push(candidates.splice(randomIndex(candidates.length), 1)[0]);
      healed.forEach(function (unit) { unit.hp = Math.min(unit.max, unit.hp + power); });
      writeLog(healed.length ? "伊妲引導治療波，" + healed.map(function (unit) { return unit.name; }).join("、") + "各恢復 " + power + " 點生命。" : "伊妲引導治療波，但目前沒有受傷的我方單位。");
    } else {
      living("party").filter(function (unit) { return unit.row === "front"; }).forEach(function (unit) { unit.guard = power; });
      writeLog("潮羽靈展開盾牆，前排獲得 " + power + " 點援護。");
    }
    finish();
  }
  function card(unit, enemy) { var width = Math.round(unit.hp / unit.max * 100); var targetable = enemy && battle.pending && unit.hp > 0 && !battle.winner; return '<button class="combat-unit ' + unit.cls + ' ' + (unit.row === "boss" ? "boss" : "") + ' ' + (unit.hp <= 0 ? "fallen" : "") + ' ' + (targetable ? "targetable" : "") + '" data-combat-target="' + unit.id + '" ' + (enemy && unit.hp <= 0 ? "disabled" : "") + '><span class="unit-avatar">' + unit.avatar + '</span><span class="unit-copy"><strong>' + unit.name + '</strong><small>' + unit.role + "・" + (unit.row === "front" ? "前排" : unit.row === "back" ? "後排" : "Boss 中央") + '</small><span class="hp-bar"><i style="width:' + width + '%"></i></span><small>生命 ' + unit.hp + '/' + unit.max + (unit.guard ? "・援護 " + unit.guard : "") + '</small></span></button>'; }
  function render() {
    if (!battle || !document.querySelector("#combat-enemies")) return;
    var order = living("party").concat(living("enemies")).sort(function (a, b) { return b.speed - a.speed; });
    document.querySelector("#combat-round").textContent = battle.winner === "victory" ? "戰鬥勝利" : battle.winner === "defeat" ? "戰鬥失敗" : "第 " + battle.round + " 回合";
    document.querySelector("#combat-turn").textContent = battle.winner ? (battle.winner === "victory" ? "鐘影守衛已被擊破" : "全員倒下，可重新挑戰") : "洛恩的行動・" + formations[battle.formation].name;
    document.querySelector("#combat-timeline").innerHTML = order.map(function (unit) { return '<span class="' + (unit.id === "loen" ? "active" : "") + '"><b>' + unit.avatar + '</b><small>' + unit.name + '</small></span>'; }).join("");
    document.querySelector("#combat-enemies").innerHTML = battle.enemies.map(function (unit) { return card(unit, true); }).join("");
    document.querySelector("#combat-party").innerHTML = battle.party.map(function (unit) { return card(unit, false); }).join("");
    document.querySelector("#combat-log").innerHTML = battle.log.map(function (line) { return "<p>" + line + "</p>"; }).join("");
    document.querySelector("#combat-hint").textContent = battle.pending ? skills[battle.pending].name + "：選擇目標" : battle.winner ? "" : "陣形：" + formations[battle.formation].name;
    document.querySelector("#combat-skills").innerHTML = Object.keys(skills).map(function (id) { var skill = skills[id]; var mastered = isMastered(id); var progress = Math.min(battle.mastery[id] || 0, skill.threshold); var status = mastered ? "已領悟・效果提升 " + Math.round(skill.bonus * 100) + "%" : "領悟進度 " + progress + "/" + skill.threshold; return '<button class="combat-skill ' + (battle.pending === id ? "selected" : "") + '" data-combat-skill="' + id + '" ' + (battle.winner ? "disabled" : "") + '><strong>' + skill.name + '</strong><span>' + skill.shape + "・" + skill.copy + "・" + status + '</span></button>'; }).join("") + (battle.winner ? '<button class="combat-skill" data-combat-reset="true"><strong>重新挑戰</strong><span>重設本場遭遇戰</span></button>' : "");
  }
  function build() { var main = document.querySelector("#app-main"); if (!main || document.querySelector("[data-screen="battle"]")) return; var launch = document.createElement("button"); launch.className = "battle-launch"; launch.dataset.action = "combat-launch"; launch.innerHTML = '<span class="battle-launch-icon">⚔</span><span><strong>進入鐘丘遭遇戰</strong><small>回合時間軸・前後排・技能目標形狀測試</small></span><b>›</b>'; var world = main.querySelector(".world-card"); if (world) world.insertAdjacentElement("afterend", launch); var nav = document.querySelector(".bottom-nav"); var party = nav && nav.querySelector("[data-nav="party"]"); if (nav && party && !nav.querySelector("[data-nav="battle"]")) { var navItem = document.createElement("button"); navItem.className = "nav-item"; navItem.dataset.nav = "battle"; navItem.innerHTML = "<span>⚔</span><small>戰鬥</small>"; nav.insertBefore(navItem, party); } var screen = document.createElement("section"); screen.className = "screen"; screen.dataset.screen = "battle"; screen.innerHTML = '<div class="battle-heading"><div><p class="eyebrow">鐘丘遭遇戰・回合制原型</p><h2 id="combat-title">鹽脊下的鐘影</h2></div><span class="tag" id="combat-round">第 1 回合</span></div><div class="battle-status"><span id="combat-turn">選擇行動</span><span>行動點 1</span></div><div class="combat-timeline" id="combat-timeline"></div><div class="combat-zone"><div class="combat-side combat-enemy"><div class="combat-side-title"><span>敵方・鐘丘守衛</span><small>Boss 置中／前後排判定</small></div><div class="combat-grid" id="combat-enemies"></div></div><div class="combat-vs">VS</div><div class="combat-side combat-party"><div class="combat-side-title"><span>我方・潮汐雙列</span><small>點選我方隊員卡片切換前後排</small></div><div class="combat-grid" id="combat-party"></div></div></div><div class="combat-log" id="combat-log"></div><div class="skill-panel"><div class="section-heading compact"><div><p class="eyebrow">技能選擇</p><h3>本回合行動</h3></div><span class="tag" id="combat-hint">先選技能</span></div><div class="combat-skills" id="combat-skills"></div></div><button class="outline-button combat-back" data-action="combat-back">返回旅誌</button>'; main.appendChild(screen); }
  function enter(reset) { if (reset || !battle) { battle = fresh(); save(); } build(); document.querySelectorAll("[data-screen]").forEach(function (node) { node.classList.toggle("active", node.dataset.screen === "battle"); }); document.querySelectorAll("[data-nav]").forEach(function (node) { node.classList.toggle("active", node.dataset.nav === "battle"); }); render(); }
  window.DaluCombat = { getFormations: formationCatalog, getSkills: skillCatalog, setFormation: setFormation };
  if (window.__DALU_TEST__) window.__DALU_BATTLE_TEST_API__ = { getState: function () { return battle; }, act: act, toggleRow: toggleRow, setFormation: setFormation, load: load, reset: function () { battle = fresh(); } };
  document.addEventListener("click", function (event) { var launch = event.target.closest("[data-action="combat-launch"]"); if (launch) { enter(true); return; } var nav = event.target.closest("[data-nav="battle"]"); if (nav) { load(); build(); document.querySelectorAll("[data-screen]").forEach(function (node) { node.classList.toggle("active", node.dataset.screen === "battle"); }); render(); return; } var skill = event.target.closest("[data-combat-skill]"); if (skill) { act(skill.dataset.combatSkill); return; } var target = event.target.closest("[data-combat-target]"); if (target && battle) { if (battle.pending) { act(battle.pending, target.dataset.combatTarget); return; } if (battle.party.some(function (unit) { return unit.id === target.dataset.combatTarget; })) { toggleRow(target.dataset.combatTarget); return; } } if (event.target.closest("[data-combat-reset]")) { enter(true); return; } if (event.target.closest("[data-action="combat-back"]")) { document.querySelectorAll("[data-screen]").forEach(function (node) { node.classList.toggle("active", node.dataset.screen === "journal"); }); document.querySelectorAll("[data-nav]").forEach(function (node) { node.classList.toggle("active", node.dataset.nav === "journal"); }); } });
  build(); load();
  if (window.navigator && window.navigator.serviceWorker) window.navigator.serviceWorker.register("./service-worker.js?v=0.4.18").catch(function () {});
}());
