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
    }),
    "wind-spring": Object.freeze({
      title: "風車井旁的清晨",
      image: "./assets/art/locations/wind-spring.svg",
      imageAlt: "淡石牆屋舍沿坡錯落，藍綠布棚圍著風車井，遠處山脊迎著晨光。",
      description: "風泉村的風車井帶動上游水渠。米拉在井邊記下風向與分水時刻，村民正打開藍綠布棚準備市集。",
      resident: Object.freeze({
        name: "米拉・風泉",
        role: "風泉村候選英雄",
        copy: "帶著記錄板與摺疊羅盤，熟悉村裡的風車井和水路。"
      })
    }),
    "salt-marsh": Object.freeze({
      title: "退潮後的鹽脊路",
      image: "./assets/art/locations/salt-marsh.svg",
      imageAlt: "暖灰色淺水環繞白色鹽殼與蘆葦叢，珊瑚色路標標出高地方向。",
      description: "退潮把淺水分成一道道窄渠，鹽殼沿著水面裂開。鹽脊採集人立起珊瑚色警示標記，引導旅人走向高地。",
      resident: Object.freeze({
        name: "鹽脊採集人",
        role: "鹽潮荒野採集人",
        copy: "熟悉鹽脊裂紋與退潮時刻，會把安全路線留給後來的旅人。"
      })
    }),
    "sand-ruins": Object.freeze({
      title: "流沙切開的舊城門",
      image: "./assets/art/locations/sand-ruins.svg",
      imageAlt: "流沙從幾何石門前掠過，門柱刻著舊銅色導航線，通往沉砂遺跡深處。",
      description: "沉砂切開舊城門前的地面，露出一圈被掩埋的石階。鐘守人在銅色刻痕旁標出安全踏點，帶旅人靠近遺跡入口。",
      resident: Object.freeze({
        name: "鐘守人",
        role: "沉砂遺跡入口巡守",
        copy: "辨認牆上的舊城刻痕，並記下通往回音室的安全路線。"
      })
    })
  };
  const api = Object.freeze({ scenes: Object.freeze(scenes) });
  root.DaluRegionContent = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
