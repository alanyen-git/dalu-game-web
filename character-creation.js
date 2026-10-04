(function () {
  "use strict";

  var root = document.querySelector("#character-creator");
  if (!root) return;
  var keys = { race: "races", origin: "origins", profession: "combat_classes", talent: "talents" };
  var creatingSuccessor = false;
  var inheritedSkill = "";
  var name = "旅人";
  var selected = { race: null, origin: null, profession: null, talents: [] };

  function rows(kind) {
    var catalog = window.DaluCharacterData;
    return catalog && Array.isArray(catalog[kind]) ? catalog[kind] : [];
  }

  function esc(value) {
    return String(value || "").replace(/[&<>"]/g, function (char) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[char];
    });
  }

  function cards(kind) {
    return rows(keys[kind]).map(function (item) {
      var chosen = kind === "talent"
        ? selected.talents.some(function (entry) { return entry.id === item.id; })
        : selected[kind] && selected[kind].id === item.id;
      return '<button type="button" class="creation-option ' + (chosen ? "selected" : "") + '" data-create-kind="' + kind + '" data-create-id="' + esc(item.id) + '"><strong>' + esc(item.name) + '</strong><small>' + esc(item.description) + '</small></button>';
    }).join("");
  }

  function drawArchive() {
    var archive = Array.isArray(state.legacySkills) ? state.legacySkills : [];
    if (!archive.length) return '<p class="creation-source">尚無可傳承的熟練技能。</p>';
    return '<div class="creation-options">' + archive.map(function (entry) {
      var chosen = inheritedSkill === entry.id;
      return '<button type="button" class="creation-option ' + (chosen ? "selected" : "") + '" data-create-inherit="' + esc(entry.id) + '" aria-pressed="' + chosen + '"><strong>' + esc(entry.name) + (chosen ? "・已選" : "") + '</strong><small>由' + esc(entry.source || "前代旅人") + '留下；新角色可傳承一項。</small></button>';
    }).join("") + '</div>';
  }

  function drawProfile() {
    var character = state.character;
    var growth = window.DaluCharacterGrowth.describe(character);
    var mastered = growth.masteredSkills.map(function (id) {
      return window.DaluCharacterGrowth.SKILLS[id].name + (growth.inheritedSkills.indexOf(id) >= 0 ? "（傳承）" : "");
    });
    root.innerHTML = '<section class="growth-card"><p class="eyebrow">目前旅人</p><h3>' + esc(character.name) + '</h3><p>' + esc(character.race && character.race.name) + '・' + esc(character.origin && character.origin.name) + '・' + esc(character.profession && character.profession.name) + '</p><p>位階 ' + growth.rank + '・等級 ' + growth.level + '・經驗 ' + growth.experience + '</p><p>' + (mastered.length ? "熟練技能：" + esc(mastered.join("、")) : "尚未領悟技能。") + '</p><button type="button" class="outline-button" data-create-new>建立新旅人</button></section>';
  }

  function drawCreator() {
    root.innerHTML = '<div class="creation-toolbar"><label>角色姓名<input id="created-character-name" maxlength="24" value="' + esc(name) + '"></label><button type="button" class="outline-button" data-create-cancel>返回目前旅人</button></div><div class="creation-groups"><section class="creation-group"><h4>種族</h4><div class="creation-options">' + cards("race") + '</div></section><section class="creation-group"><h4>出身</h4><div class="creation-options">' + cards("origin") + '</div></section><section class="creation-group"><h4>職業</h4><div class="creation-options">' + cards("profession") + '</div></section><section class="creation-group"><h4>天賦（選兩項）</h4><div class="creation-options">' + cards("talent") + '</div></section></div><section class="growth-card"><h4>技能傳承（選填）</h4>' + drawArchive() + '<button type="button" class="text-button" data-create-no-inherit>不使用傳承技能</button></section><p class="creation-source">角色資料由大陸旅誌本地目錄提供。</p><button type="button" class="primary" data-create-start>建立新旅人</button>';
    var input = root.querySelector("#created-character-name");
    input.addEventListener("input", function (event) { name = event.target.value; });
  }

  function draw() {
    if (state.character && !creatingSuccessor) drawProfile();
    else drawCreator();
    var status = document.querySelector("#profession-status");
    if (status) status.textContent = selected.profession ? selected.profession.name : (state.character && state.character.profession ? state.character.profession.name : "尚未選擇");
  }

  function select(kind, id) {
    var entry = rows(keys[kind]).find(function (item) { return item.id === id; });
    if (!entry) return;
    if (kind === "talent") {
      var index = selected.talents.findIndex(function (item) { return item.id === id; });
      if (index >= 0) selected.talents.splice(index, 1);
      else {
        if (selected.talents.length >= 2) selected.talents.shift();
        selected.talents.push(entry);
      }
    } else selected[kind] = entry;
    draw();
  }

  root.addEventListener("click", function (event) {
    var option = event.target.closest("[data-create-kind]");
    if (option) { select(option.dataset.createKind, option.dataset.createId); return; }
    var inherit = event.target.closest("[data-create-inherit]");
    if (inherit) { inheritedSkill = inherit.dataset.createInherit; draw(); return; }
    if (event.target.closest("[data-create-no-inherit]")) { inheritedSkill = ""; draw(); return; }
    if (event.target.closest("[data-create-new]")) {
      if (state.character) window.DaluCharacterGrowth.archiveMastery(state.character, state.legacySkills);
      creatingSuccessor = true;
      name = "旅人";
      inheritedSkill = "";
      selected = { race: null, origin: null, profession: null, talents: [] };
      draw();
      return;
    }
    if (event.target.closest("[data-create-cancel]")) { creatingSuccessor = false; draw(); return; }
    if (event.target.closest("[data-create-start]")) {
      name = (root.querySelector("#created-character-name").value || "旅人").trim();
      if (!selected.race || !selected.origin || !selected.profession || selected.talents.length !== 2) {
        toast("請選擇種族、出身、職業及兩項天賦");
        return;
      }
      var character = window.DaluCharacterGrowth.create({
        name: name || "旅人",
        race: { id: selected.race.id, name: selected.race.name },
        origin: { id: selected.origin.id, name: selected.origin.name },
        profession: { id: selected.profession.id, name: selected.profession.name },
        talents: selected.talents.map(function (item) { return { id: item.id, name: item.name }; })
      });
      if (inheritedSkill) {
        var inherited = window.DaluCharacterGrowth.inheritSkill(character, state.legacySkills, inheritedSkill);
        if (!inherited.ok) { toast("這項技能目前無法傳承"); return; }
      }
      state.character = character;
      state.profession = selected.profession.id;
      creatingSuccessor = false;
      save(true);
      render();
      toast(character.name + " 已踏上旅程");
    }
  });

  draw();
}());
