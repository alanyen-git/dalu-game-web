(function () {
  "use strict";
  function labelFormation() {
    [["#combat-enemies", true], ["#combat-party", false]].forEach(function (entry) {
      var grid = document.querySelector(entry[0]);
      if (!grid) return;
      var side = grid.closest(".combat-side");
      if (!side || side.querySelector(".formation-lanes")) return;
      var labels = document.createElement("div");
      labels.className = "formation-lanes";
      labels.innerHTML = entry[1] ? "<span>後排</span><span>前排</span>" : "<span>前排</span><span>後排</span>";
      grid.parentNode.insertBefore(labels, grid);
    });
    document.querySelectorAll(".combat-unit").forEach(function (unit) {
      var rowLabel = unit.querySelector(".unit-copy small");
      if (!rowLabel) return;
      var text = rowLabel.textContent;
      var formation = text.indexOf("前排") >= 0 ? "front" : text.indexOf("後排") >= 0 ? "back" : "center";
      unit.dataset.formation = formation;
      var grid = unit.parentElement;
      var isEnemy = grid && grid.id === "combat-enemies";
      if (formation === "front") unit.style.gridColumn = isEnemy ? "2" : "1";
      else if (formation === "back") unit.style.gridColumn = isEnemy ? "1" : "2";
      else unit.style.gridColumn = "1 / -1";
      unit.style.gridRow = formation === "front" ? "2" : "1";
    });
  }
  new MutationObserver(labelFormation).observe(document.body, { childList: true, subtree: true });
  labelFormation();
})();
