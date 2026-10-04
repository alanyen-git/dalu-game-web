(function (root) {
  "use strict";

  const catalog = Object.freeze({
    races: [
      { id: "human", name: "人類", description: "適應力均衡，能在不同聚落迅速找到立足之處。" },
      { id: "elf", name: "精靈", description: "熟悉潮汐與星象，擅長記下細微線索。" },
      { id: "dwarf", name: "矮人", description: "耐心堅毅，長途跋涉也不輕易退縮。" }
    ],
    origins: [
      { id: "village", name: "村落出身", description: "從風泉一帶的聚落啟程。" },
      { id: "scholar", name: "學者之家", description: "在舊卷與地圖間長大。" },
      { id: "frontier", name: "邊境行旅", description: "熟悉荒野路線與臨時營地。" }
    ],
    combat_classes: [
      { id: "vanguard", name: "劍士", description: "以穩定斬擊守住前線。" },
      { id: "guardian", name: "守衛", description: "保護同伴並承受正面攻勢。" },
      { id: "arcanist", name: "星術師", description: "用星紋術式打擊多個目標。" },
      { id: "ranger", name: "巡弓手", description: "觀察敵陣後選擇精準射擊。" }
    ],
    talents: [
      { id: "keen-eye", name: "敏銳觀察", description: "更容易察覺地區線索。" },
      { id: "steady-hand", name: "沉著手腕", description: "在壓力下維持穩定行動。" },
      { id: "deep-reserve", name: "充沛心力", description: "能承受較長的旅途。" },
      { id: "quick-step", name: "輕身步法", description: "在戰鬥中靈活調整位置。" }
    ]
  });
  if (typeof module === "object" && module.exports) module.exports = catalog;
  root.DaluCharacterData = catalog;
})(typeof window !== "undefined" ? window : globalThis);
