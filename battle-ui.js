(function () {
  "use strict";
  var timer = null;
  function q(selector, root) { return (root || document).querySelector(selector); }
  function livingEnemies() { return Array.from(document.querySelectorAll("#combat-enemies .combat-unit:not(.fallen)")); }
  function weakestEnemy() { return livingEnemies().sort(function (a, b) { return Number(a.querySelector(".hp-bar").style.width.replace("%", "")) - Number(b.querySelector(".hp-bar").style.width.replace("%", "")); })[0]; }
  function open(title, html) { var popup = q("#combat-ui-popup"); if (!popup) return; q("#combat-ui-title", popup).textContent = title; q("#combat-ui-body", popup).innerHTML = html; popup.classList.remove("hide"); }
  function close() { var popup = q("#combat-ui-popup"); if (popup) popup.classList.add("hide"); }
  function clickSkill(id) { var button = q('[data-combat-skill="' + id + '"]'); if (button) button.click(); }
  function skillMenu() {
    var skills = window.DaluCombat && window.DaluCombat.getSkills ? window.DaluCombat.getSkills() : [];
    open("技能", skills.map(function (skill) {
      var mastery = skill.mastered ? "已領悟・效果提升 " + skill.bonus + "%" : "領悟進度 " + skill.uses + "/" + skill.threshold;
      return '<button class="popup-choice" data-ui-skill="' + skill.id + '"><strong>' + skill.name + '</strong><small>' + skill.shape + "・" + skill.copy + '</small><small>' + mastery + '</small></button>';
    }).join(""));
  }
  function formationMenu() {
    var formations = window.DaluCombat && window.DaluCombat.getFormations ? window.DaluCombat.getFormations() : [];
    var choices = formations.map(function (formation) {
      return '<button class="popup-choice formation-choice ' + (formation.selected ? "selected" : "") + '" data-ui-formation="' + formation.id + '" aria-pressed="' + formation.selected + '"><strong>' + formation.name + (formation.selected ? "・使用中" : "") + '</strong><small>' + formation.description + '</small></button>';
    }).join("");
    var rows = Array.from(document.querySelectorAll("#combat-party .combat-unit")).map(function (unit) {
      var id = unit.dataset.combatTarget, text = unit.querySelector(".unit-copy small").textContent;
      return '<button class="popup-choice" data-ui-row="' + id + '"><strong>' + unit.querySelector(".unit-copy strong").textContent + '</strong><small>目前' + (text.indexOf("前排") >= 0 ? "前排" : "後排") + '・切換位置</small></button>';
    }).join("");
    open("陣形與隊列", '<div class="formation-choices">' + choices + '</div><div class="classic-command-heading">隊員位置</div>' + rows);
  }
  function setup() {
    var screen = q('[data-screen="battle"]'), zone = q(".combat-zone", screen), panel = q(".skill-panel", screen);
    if (!screen || !zone || !panel || panel.dataset.classic) return;
    panel.dataset.classic = "1";
    zone.classList.add("classic-battle-layout");
    panel.innerHTML = '<div class="classic-command-heading">戰鬥命令</div><div class="classic-commands"><button class="battle-command" data-ui-command="attack">攻擊</button><button class="battle-command" data-ui-command="skill">技能</button><button class="battle-command" data-ui-command="defend">防禦</button><button class="battle-command" data-ui-command="item">道具</button><button class="battle-command" data-ui-command="formation">陣形／隊列</button><button class="battle-command auto-command" data-ui-auto aria-pressed="false">Auto：關</button></div><span id="combat-hint" hidden></span><div id="combat-skills" hidden></div>';
    zone.appendChild(panel);
    var popup = document.createElement("div");
    popup.id = "combat-ui-popup"; popup.className = "combat-popup hide";
    popup.innerHTML = '<div class="combat-popup-panel" role="dialog" aria-modal="true"><div class="combat-popup-head"><b id="combat-ui-title"></b><button data-ui-close aria-label="關閉">×</button></div><div id="combat-ui-body" class="combat-popup-body"></div></div>';
    screen.appendChild(popup);
    screen.addEventListener("click", function (event) {
      var command = event.target.closest("[data-ui-command]");
      if (command) {
        var type = command.dataset.uiCommand;
        if (type === "attack") { clickSkill("slash"); close(); }
        if (type === "skill") skillMenu();
        if (type === "defend") { clickSkill("guard"); close(); }
        if (type === "item") open("道具", '<button class="popup-choice" data-ui-skill="mend"><strong>藥草</strong><small>恢復兩名受傷隊員。效果隨治療波領悟與陣形提升。</small></button>');
        if (type === "formation") formationMenu();
        return;
      }
      var formation = event.target.closest("[data-ui-formation]");
      if (formation) { if (window.DaluCombat) window.DaluCombat.setFormation(formation.dataset.uiFormation); close(); return; }
      var skill = event.target.closest("[data-ui-skill]");
      if (skill) { clickSkill(skill.dataset.uiSkill); close(); return; }
      var row = event.target.closest("[data-ui-row]");
      if (row) { var member = q('[data-combat-target="' + row.dataset.uiRow + '"]'); if (member) member.click(); close(); return; }
      if (event.target.closest("[data-ui-close]") || event.target === popup) { close(); return; }
      var auto = event.target.closest("[data-ui-auto]");
      if (!auto) return;
      var on = auto.getAttribute("aria-pressed") !== "true";
      auto.setAttribute("aria-pressed", String(on)); auto.textContent = on ? "Auto：開" : "Auto：關"; auto.classList.toggle("active", on);
      if (timer) clearInterval(timer); timer = null;
      if (on) timer = setInterval(function () {
        var round = q("#combat-round");
        if (!q('[data-screen="battle"].active') || !round || round.textContent.indexOf("勝利") >= 0 || round.textContent.indexOf("失敗") >= 0) { clearInterval(timer); timer = null; auto.setAttribute("aria-pressed", "false"); auto.textContent = "Auto：關"; auto.classList.remove("active"); return; }
        var low = Array.from(document.querySelectorAll("#combat-party .combat-unit:not(.fallen) .hp-bar i")).some(function (bar) { return parseFloat(bar.style.width) < 35; });
        if (low) { clickSkill("mend"); return; }
        var target = weakestEnemy();
        if (target) { clickSkill(livingEnemies().length > 1 ? "flare" : "slash"); var chosen = q("#combat-enemies .combat-unit.targetable"); if (chosen) chosen.click(); }
      }, 1100);
    });
    var engine = document.createElement("div"); engine.className = "combat-engine-skills"; engine.style.display = "none"; panel.appendChild(engine);
    var original = q("#combat-skills", panel); engine.appendChild(original);
    new MutationObserver(function () { if (!panel.contains(original)) engine.appendChild(original); }).observe(panel, { childList: true, subtree: true });
  }
  new MutationObserver(setup).observe(document.body, { childList: true, subtree: true });
  setup();
})();
