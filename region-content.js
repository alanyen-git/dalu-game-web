(function (root) {
  "use strict";
  const scenes = {
    "mist-harbor": Object.freeze({
      title: "潮標下的夜航人",
      image: "./assets/art/locations/mist-harbor.svg",
      imageAlt: "霧港村木棧橋通往鹽白石階，遠處燈塔穿過潮霧照亮夜航水道。",
      description: "退潮後，木棧橋露出一排刻著航線的舊銅釘。璃澄沿著釘痕校正潮標，準備替晚到的船隻打開安全水道。",
      resident: Object.freeze({
        name: "璃澄",
        role: "霧港潮標看守人",
        copy: "熟悉夜航、潮位與失約船隻的舊航線。"
      })
    }),
    "bell-hill": Object.freeze({
      title: "風過斷鐘石座",
      image: "./assets/art/locations/bell-hill.svg",
      imageAlt: "北坡短草伏在風蝕岩間，斷裂的銅鐘石座面向潮霧海岸。",
      description: "斷鐘石座只剩半圈銅架。風從缺口穿過時，石面會留下細薄的鹽線，指向沉砂遺跡的北門。",
      resident: Object.freeze({
        name: "北坡鐘守人",
        role: "斷鐘石座看守者",
        copy: "記錄風向、鹽線與鐘架缺口的回聲。"
      })
    })
  };
  const api = Object.freeze({ scenes: Object.freeze(scenes) });
  root.DaluRegionContent = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
