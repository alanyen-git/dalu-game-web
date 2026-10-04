const SAVE_KEY = "dalu-travel-log-save-v3";
const LOCATIONS = {
  "wind-spring": { name: "風泉村", type: "聚落", settlement: "wind-spring", faction: "wind-spring-council", event: "bell", copy: "旅店、雜貨店、村政廳。地方狀態會隨世界日變化。" },
  "mist-harbor": { name: "霧港村", type: "聚落", settlement: "mist-harbor", faction: "salt-road-guild", event: "harbor", copy: "鹽路商會交換情報，晚到的船總有一個不願說出口的理由。" },
  "bell-hill": { name: "北坡鐘丘", type: "野外", settlement: "wind-spring", faction: "bell-temple", event: "bell", copy: "古老鐘丘，午夜後才會留下真正的腳印。" },
  "salt-marsh": { name: "鹽潮荒野", type: "野外", settlement: "mist-harbor", faction: "salt-road-guild", event: "marsh", copy: "退潮後露出的白色鹽脊，拾荒者說荒野正在呼吸。" },
  "sand-ruins": { name: "沉砂遺跡", type: "地城", settlement: "wind-spring", faction: "bell-temple", event: null, copy: "沉在沙下的舊城，通往鐘守 Boss 入口。" }
};
const EVENTS = {
  bell: { eyebrow: "自由事件・風泉村", title: "失落鐘聲", description: "北坡的鐘聲在午夜響起。村政廳希望你調查，神殿守門人則勸你不要靠近。", choices: [
    { id: "village", label: "接受村政廳的委託", note: "風泉村繁榮 +8／信任 +5", result: "村民把沉砂遺跡的舊地圖交給你。", effect: { prosperity: { "wind-spring": 8 }, faction: { "wind-spring-council": 5 }, unlock: "sand-ruins" } },
    { id: "temple", label: "先拜訪神殿守門人", note: "鐘守信任 +6／威脅 -3", result: "守門人標記了進入遺跡的安全路線。", effect: { threat: -3, faction: { "bell-temple": 6 }, unlock: "sand-ruins" } },
    { id: "wait", label: "在旅店等待午夜", note: "取得線索／威脅 +2", result: "你聽見鐘聲裡混著潮汐，卻錯過第一個時機。", effect: { threat: 2 } }
  ] },
  harbor: { eyebrow: "自由事件・霧港村", title: "霧港的失約船", description: "商路上的船晚了一日，鹽路商會想知道是哪一方改了航線。", choices: [
    { id: "guild", label: "替鹽路商會查航線", note: "商會信任 +7／霧港繁榮 +5", result: "商會將鹽潮荒野的安全路線交給你。", effect: { prosperity: { "mist-harbor": 5 }, faction: { "salt-road-guild": 7 } } },
    { id: "villagers", label: "先把消息告訴等船的人", note: "霧港繁榮 +7／威脅 -1", result: "霧港的夜市重新亮起燈火。", effect: { prosperity: { "mist-harbor": 7 }, threat: -1 } }
  ] },
  marsh: { eyebrow: "自由事件・鹽潮荒野", title: "鹽脊下的呼吸", description: "鹽脊裂縫傳出規律回音，和沉砂遺跡的鐘聲很像。", choices: [
    { id: "listen", label: "貼近裂縫聽完整段回音", note: "取得遺跡線索／威脅 -2", result: "你記下回音節拍，鐘守封印似乎少了一道。", effect: { threat: -2 } },
    { id: "mark", label: "在鹽脊上留下警戒標記", note: "商會信任 +3／荒野安全", result: "鹽路商會開始把你視為可靠的探路人。", effect: { faction: { "salt-road-guild": 3 } } }
  ] }
};Object.assign(EVENTS, {
  council: { eyebrow: "自由事件・地方委託", title: "井邊的缺水帳", description: "村政廳記錄的水桶數與實際對不上。居民、記帳員和商隊各有一套說法。", choices: [
    { id: "audit", label: "陪記帳員重查水路", note: "委託完成／居民信任 +3", result: "缺水帳查清了；記帳員留下下一份地方委託。", effect: { faction: { "wind-spring-council": 3 }, npc: { id: "clerk", name: "村政記帳員", trust: 3, note: "願意提供水路情報" }, commission: { id: "spring-water-followup", title: "修復上游分水閘", location: "wind-spring" } } },
    { id: "share", label: "先公開帳本請居民共同核對", note: "繁榮 +4／村政信任 +1", result: "居民一起核對帳本，村口告示板貼上了公開的分水時刻。", effect: { prosperity: { "wind-spring": 4 }, faction: { "wind-spring-council": 1 }, flag: "water-schedule-public" } }
  ] },
  shrine: { eyebrow: "自由事件・神殿", title: "沒有名字的供燈", description: "神殿側門連續三夜出現供燈，守門人希望找出留下燈的人。", choices: [
    { id: "shelter", label: "替夜歸的採藥人保密", note: "守門人信任 +3／解鎖遺跡", result: "守門人承認採藥人在守護鐘丘，並替你開啟沉砂遺跡安全路線。", effect: { faction: { "bell-temple": 3 }, npc: { id: "keeper", name: "鐘守人", trust: 3, note: "已標記安全路線" }, unlock: "sand-ruins" } },
    { id: "report", label: "依規矩向神殿報告", note: "威脅 -2／神殿巡守", result: "神殿收下燈火名冊，派人看守鐘丘。", effect: { threat: -2, flag: "shrine-watch" } }
  ] },
  guild: { eyebrow: "自由事件・工會", title: "被改過的路標", description: "鹽路商會的貨隊在荒野繞遠路，路標卻像是有人故意轉向。", choices: [
    { id: "repair", label: "和嚮導重立路標", note: "商會信任 +4／安全委託", result: "商會修復路標，並委託你護送下一批藥材。", effect: { faction: { "salt-road-guild": 4 }, commission: { id: "marsh-herbs", title: "護送鹽潮藥材", location: "salt-marsh" }, shop: { location: "mist-harbor", item: "潮鹽藥包", stock: 2 } } },
    { id: "trace", label: "追查舊車轍到退潮線", note: "威脅 -3／荒野線索", result: "車轍在退潮線消失，商會把荒野警戒提高一級。", effect: { threat: -3, flag: "marsh-trail-marked" } }
  ] },
  temporary: { eyebrow: "臨時事件・旅途", title: "雨棚下的急信", description: "一名旅人帶來急信：霧港外的倉棚漏雨，今夜前得決定先救貨還是先救人。", choices: [
    { id: "people", label: "先把滯留旅人帶進村裡", note: "霧港繁榮 +3／臨時委託", result: "旅人安頓下來；倉主留下修棚委託和一批折價補給。", effect: { prosperity: { "mist-harbor": 3 }, commission: { id: "harbor-roof", title: "修補東倉雨棚", location: "mist-harbor" }, shop: { location: "mist-harbor", item: "乾糧包", stock: 3 } } },
    { id: "cargo", label: "先救急件和藥材", note: "商會信任 +2／威脅 -1", result: "急件準時送達，商會回贈一份荒野情報。", effect: { faction: { "salt-road-guild": 2 }, threat: -1, flag: "harbor-letter-delivered" } }
  ] }
});
Object.assign(EVENTS, {
  councilReservoir: { eyebrow: "自由事件・地方政務", title: "分水閘的兩份公文", description: "村政廳與水渠工班各自送來一份修繕公文，兩邊都說對方延誤了分水。", choices: [
    { id: "publish", label: "公開工期並召集居民核對", note: "繁榮 +3／公開分水紀錄", result: "工期與輪水表一同貼上告示板；後續委託會沿用公開時程。", effect: { prosperity: { "wind-spring": 3 }, flag: "spring-water-timetable", commission: { id: "spring-gate-repair", title: "協助修復分水閘", location: "wind-spring" } } },
    { id: "mediate", label: "先讓工班修復最急的一段", note: "村政信任 +3／威脅 -1", result: "水渠先恢復供水，村政廳記下你的協調方式。", effect: { faction: { "wind-spring-council": 3 }, threat: -1, npc: { id: "water-foreman", name: "水渠工頭", trust: 2, note: "願意回報修繕進度" } } }
  ] },
  councilMarket: { eyebrow: "自由事件・地方政務", title: "市集攤位的空缺", description: "兩個攤位同時空下來，返鄉藥草師和外地木匠都想取得位置。", choices: [
    { id: "herbalist", label: "優先留給返鄉藥草師", note: "繁榮 +2／新增藥草商品", result: "藥草師重新開張，雜貨店開始販售止血草包。", effect: { prosperity: { "wind-spring": 2 }, shop: { location: "wind-spring", item: "止血草包", stock: 3 } } },
    { id: "carpenter", label: "讓木匠先修補公共棚架", note: "村政信任 +2／後續委託", result: "棚架修好後，村政廳委託你尋回遺失的木料清單。", effect: { faction: { "wind-spring-council": 2 }, commission: { id: "spring-timber-ledger", title: "尋回公共木料清單", location: "wind-spring" } } }
  ] },
  shrineVotive: { eyebrow: "自由事件・神殿委託", title: "鐘丘的無主供燈", description: "神殿收到一盞沒有署名的供燈，燈芯裡混著鹽潮荒野的白砂。", choices: [
    { id: "ask-keeper", label: "請鐘守人辨認燈芯", note: "神殿信任 +3／NPC 線索", result: "鐘守人認出燈芯來自北坡舊路，並答應帶你避開封鎖處。", effect: { faction: { "bell-temple": 3 }, npc: { id: "bell-keeper", name: "北坡鐘守人", trust: 3, note: "認得供燈中的白砂" } } },
    { id: "trace-sand", label: "沿白砂痕跡追到山徑", note: "威脅 -2／荒野線索", result: "白砂指向鹽脊缺口，神殿在地圖上標出安全折返點。", effect: { threat: -2, flag: "bell-hill-salt-trace" } }
  ] },
  shrineWatch: { eyebrow: "自由事件・神殿政務", title: "夜巡名冊少了一頁", description: "神殿巡守名冊缺頁，值夜的人卻都記得自己曾經簽名。", choices: [
    { id: "restore", label: "重排值夜並補登名冊", note: "神殿信任 +2／威脅 -2", result: "值夜輪班重新排定，鐘丘夜間威脅降低。", effect: { faction: { "bell-temple": 2 }, threat: -2, flag: "bell-watch-roster-restored" } },
    { id: "follow-ink", label: "追查未乾墨跡的去向", note: "新增臨時委託", result: "墨跡在山徑旁中斷，神殿請你帶回遺失的巡守印章。", effect: { commission: { id: "bell-seal-search", title: "尋回巡守印章", location: "bell-hill" } } }
  ] },
  guildManifest: { eyebrow: "自由事件・工會委託", title: "貨單上的空箱", description: "鹽路商會的船貨重量正確，箱數卻比裝船紀錄少了兩只。", choices: [
    { id: "inspect-pier", label: "陪工會逐箱查驗碼頭", note: "商會信任 +3／霧港新增補給", result: "兩只空箱在舊倉找到，商會把乾糧補給送進霧港商店。", effect: { faction: { "salt-road-guild": 3 }, shop: { location: "mist-harbor", item: "乾糧補給", stock: 2 } } },
    { id: "ask-carriers", label: "先詢問搬運工的換班紀錄", note: "新增護送委託", result: "搬運工記得一輛離港貨車，商會委託你護送下一趟盤點隊。", effect: { commission: { id: "harbor-manifest-escort", title: "護送貨單盤點隊", location: "mist-harbor" }, flag: "harbor-manifest-trail" } }
  ] },
  guildFerry: { eyebrow: "自由事件・工會政務", title: "渡船的臨時停航", description: "霧港渡船因潮標偏移暫停，村民與商會對誰該負責意見不同。", choices: [
    { id: "reset-marker", label: "和船長校正潮標", note: "商會信任 +2／渡船恢復", result: "潮標恢復，風泉村與霧港村間的渡船路線重新開放。", effect: { faction: { "salt-road-guild": 2 }, flag: "ferry-tide-marker-reset" } },
    { id: "help-stranded", label: "先安置滯留旅人", note: "霧港繁榮 +3／後續委託", result: "旅人獲得臨時住處，旅店老闆委託你送回遺落的行李。", effect: { prosperity: { "mist-harbor": 3 }, commission: { id: "harbor-lost-baggage", title: "送回旅客遺落行李", location: "mist-harbor" } } }
  ] },
  marshBeacon: { eyebrow: "自由事件・臨時事件", title: "退潮前的燈火", description: "荒野低地冒出求救燈號，退潮只剩一刻鐘。", choices: [
    { id: "rescue", label: "先救出困在鹽脊的人", note: "威脅 -2／NPC 信任 +2", result: "採集人獲救後加入地方聯絡名冊，會提前通報潮位。", effect: { threat: -2, npc: { id: "salt-gatherer", name: "鹽脊採集人", trust: 2, note: "會通報荒野潮位" } } },
    { id: "mark-way", label: "立刻標出可走的高地路線", note: "商會信任 +2／地圖旗標", result: "高地路線畫入荒野圖記，商會派人接回滯留者。", effect: { faction: { "salt-road-guild": 2 }, flag: "salt-marsh-high-route" } }
  ] },
  marshSalt: { eyebrow: "自由事件・地方委託", title: "鹽田的裂紋", description: "鹽田邊緣出現新裂紋，商會想封路，採集人則擔心失去生計。", choices: [
    { id: "temporary-route", label: "開放高地暫行採集線", note: "繁榮 +2／新增補給", result: "採集人改走高地，霧港店家開始販售防潮布。", effect: { prosperity: { "mist-harbor": 2 }, shop: { location: "mist-harbor", item: "防潮布", stock: 2 } } },
    { id: "seal-crack", label: "先封閉裂紋並立警示牌", note: "威脅 -3／工會信任 +1", result: "裂紋周邊暫時安全，商會記錄下需要長期修補的地段。", effect: { threat: -3, faction: { "salt-road-guild": 1 }, flag: "salt-field-crack-marked" } }
  ] },
  ruinsWhisper: { eyebrow: "自由事件・地城", title: "沉砂遺跡的回音室", description: "Boss 入口前的回音室重複播送舊日人聲，只有一段節拍和鐘丘相同。", choices: [
    { id: "record-echo", label: "記下節拍帶回鐘丘比對", note: "鐘守信任 +2／威脅 -2", result: "節拍與鐘丘供燈相合，鐘守人標示出 Boss 入口外的安全位置。", effect: { faction: { "bell-temple": 2 }, threat: -2, flag: "ruins-echo-recorded" } },
    { id: "follow-voice", label: "追著人聲走到封存的壁龕", note: "解鎖後續遺跡委託", result: "壁龕留下舊城門牌，村政廳與神殿都想確認其來歷。", effect: { commission: { id: "ruins-door-plaque", title: "查明舊城門牌來歷", location: "wind-spring" }, flag: "ruins-plaque-found" } }
  ] }
});
Object.assign(EVENTS, {
  harborTidekeeper: { eyebrow: "自由事件・霧港村", title: "被塗掉的潮標", description: "退潮後露出的銅釘被人塗黑，璃澄發現被抹去的是一條仍有船隻使用的夜航線。她需要你決定先公開航線，還是查清塗改者留下的記號。", choices: [
    { id: "publish-safe-route", label: "與璃澄校正並公開安全航線", note: "璃澄信任 +4／新增夜航委託", result: "璃澄重新標出安全水道，並邀你護送下一批夜航船通過潮霧。", effect: { npc: { id: "tidekeeper-li", name: "璃澄", location: "mist-harbor", trust: 4, note: "共同校正夜航潮標" }, commission: { id: "mist-harbor-night-route", title: "護送夜航船通過潮霧", location: "mist-harbor" }, flag: "mist-harbor-safe-route" } },
    { id: "trace-marker", label: "沿著黑漆痕跡追查塗改者", note: "威脅 -2／記錄潮標線索", result: "黑漆裡混著沉砂遺跡的白砂，璃澄把這條線索留在潮標簿上。", effect: { npc: { id: "tidekeeper-li", name: "璃澄", location: "mist-harbor", trust: 2, note: "一同追查黑漆與白砂來源" }, threat: -2, flag: "mist-harbor-marker-trace" } }
  ] }
});
const EVENT_POOLS = { "wind-spring": ["bell", "council", "councilReservoir", "councilMarket"], "mist-harbor": ["harbor", "temporary", "guildManifest", "guildFerry", "harborTidekeeper"], "bell-hill": ["shrine", "bell", "shrineVotive", "shrineWatch"], "salt-marsh": ["marsh", "guild", "marshBeacon", "marshSalt"], "sand-ruins": ["ruinsWhisper"] };
function eventFor(location) { const pool = EVENT_POOLS[location] || []; const done = state.world.completedEvents || []; return pool.find((id) => done.indexOf(id) < 0) || null; }

const initialWorld = () => ({ day: 3, season: "春潮", threat: 18, turns: 0, npcHero: null, activeLocation: "wind-spring", settlements: { "wind-spring": 52, "mist-harbor": 38 }, factions: { "wind-spring-council": 12, "bell-temple": 0, "salt-road-guild": 0 }, unlocked: ["wind-spring", "mist-harbor", "bell-hill", "salt-marsh"], boss: false, npcs: {}, shops: {}, commissions: [], completedEvents: [], eventHistory: [], flags: [] });
const state = { screen: "journal", role: null, choices: 0, character: null, profession: null, legacySkills: [], story: window.DaluStoryProgression.initialState(), world: initialWorld() };
const q = (s) => document.querySelector(s);
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
function escapeHTML(value) { const text = String(value); const entities = { "&": "&amp;", "<": "&lt;", ">": "&gt;" }; return text.replace(/[&<>]/g, (char) => entities[char]).replaceAll(String.fromCharCode(34), "&quot;").replaceAll(String.fromCharCode(39), "&#39;"); }
const toast = (m) => { const n = q(".toast"); n.textContent = m; n.classList.add("show"); clearTimeout(toast.t); toast.t = setTimeout(() => n.classList.remove("show"), 2400); };
const save = (quiet) => { localStorage.setItem(SAVE_KEY, JSON.stringify({ version: 3, state })); if (!quiet) toast("旅途已儲存至本機"); };
function inject() {
  const style = document.createElement("style"); style.textContent = ".world-status-card{display:grid;gap:12px;margin-top:12px;padding:17px;border:1px solid rgba(16,44,54,.1);border-radius:21px;background:#fffdf8}.status-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.status-grid div{padding:10px;border-radius:12px;background:#edf3ef}.status-grid small,.status-grid strong{display:block}.status-grid small{font-size:10px;color:#35545d}.status-grid strong{margin-top:4px;color:#225966;font-size:19px}.map-context{display:flex;justify-content:space-between;gap:12px;margin-top:12px;padding:17px;border-radius:19px;background:#102c36;color:#fff}.map-context h3{margin:0 0 5px}.map-context p{margin:0;color:rgba(255,255,255,.72);font-size:12px;line-height:1.6}.map-context button{color:#fff;border:1px solid rgba(255,255,255,.35);background:transparent;padding:9px 13px;border-radius:12px;font-weight:700}.map-node.active,.location-row.selected{outline:2px solid #3c8290}.map-node.locked{opacity:.45}.node-harbor{left:8%;top:17%}.node-marsh{left:14%;bottom:11%}.location-updates{margin-top:12px;padding:16px;border-radius:18px;background:#fffdf8;border:1px solid rgba(16,44,54,.1)}.location-updates h3{margin:0 0 10px}.location-updates ul{margin:0;padding-left:20px;display:grid;gap:7px}.location-updates li{font-size:12px;line-height:1.55;color:#35545d}.location-updates p{margin:0;color:#587078;font-size:12px;line-height:1.6}.growth-card{display:grid;gap:10px;margin-top:12px;padding:17px;border:1px solid rgba(16,44,54,.1);border-radius:18px;background:#fffdf8}.growth-card h3,.growth-card h4,.growth-card p{margin:0}.growth-card p{font-size:13px;line-height:1.55;color:#35545d}.growth-card button{min-height:42px}.growth-skills{display:grid;gap:6px;padding:0;list-style:none}.growth-skills li{display:flex;justify-content:space-between;gap:12px;padding:8px 10px;border-radius:10px;background:#edf3ef;font-size:12px}"; document.head.appendChild(style);
  const storyStyle = document.createElement("style"); storyStyle.textContent = ".story-invitation{display:grid;gap:12px;margin-top:12px;padding:17px;border:1px solid rgba(16,44,54,.1);border-radius:21px;background:#fffdf8}.story-invitation h3,.story-invitation p{margin:0}.story-invitation>p:not(.eyebrow){font-size:13px;line-height:1.6;color:#35545d}.story-actions{display:flex;gap:8px;flex-wrap:wrap}.story-actions button{min-height:42px;padding:9px 13px;border:1px solid #3c8290;border-radius:12px;background:#edf3ef;color:#102c36;font-weight:700}"; document.head.appendChild(storyStyle);
  const wc = q(".world-card"); if (!q(".world-status-card")) wc.insertAdjacentHTML("afterend", "<div class=\"world-status-card\"><div><p class=\"eyebrow\">地方化狀態</p><h3 id=\"region-status\">春潮海岸・風泉村</h3></div><div class=\"status-grid\"><div><small>聚落繁榮</small><strong id=\"settlement-prosperity\">52</strong></div><div><small>勢力信任</small><strong id=\"faction-reputation\">+12</strong></div><div><small>已解鎖</small><strong id=\"unlock-count\">4 / 5</strong></div></div><p id=\"world-status-copy\" class=\"status-copy\">事件結果會回寫聚落、勢力、地圖與 Boss 入口。</p></div>");
  if (!q("#story-invitation")) wc.insertAdjacentHTML("afterend", "<section class=\"story-invitation\" id=\"story-invitation\" aria-live=\"polite\"><p class=\"eyebrow\">主線邀請</p><h3 id=\"story-title\"></h3><p id=\"story-copy\"></p><div id=\"story-choice-actions\" class=\"story-actions\"></div></section>");
  const party = q('[data-screen="party"]'); if (!q("#character-growth-panel")) party.insertAdjacentHTML("beforeend", "<section id=\"character-growth-panel\" class=\"growth-card\" aria-live=\"polite\"></section>");
  const map = q("[data-screen=map]"); const head = map.querySelector(".page-heading").outerHTML; map.innerHTML = head + "<div class=\"map-card\"><div class=\"map-sky\"></div><div class=\"map-route route-one\"></div><div class=\"map-route route-two\"></div><button class=\"map-node node-village\" data-action=\"location\" data-location=\"wind-spring\"><span>風泉村</span><small>聚落</small></button><button class=\"map-node node-harbor\" data-action=\"location\" data-location=\"mist-harbor\"><span>霧港村</span><small>聚落</small></button><button class=\"map-node node-hill\" data-action=\"location\" data-location=\"bell-hill\"><span>北坡鐘丘</span><small>野外</small></button><button class=\"map-node node-marsh\" data-action=\"location\" data-location=\"salt-marsh\"><span>鹽潮荒野</span><small>野外</small></button><button class=\"map-node node-ruin locked\" data-action=\"location\" data-location=\"sand-ruins\"><span>沉砂遺跡</span><small>地城・Boss</small></button></div><div class=\"map-context\"><div><p class=\"eyebrow\">目前目的地</p><h3 id=\"map-context-title\">風泉村</h3><p id=\"map-context-copy\"></p></div><button data-action=\"event\">查看事件</button></div><div class=\"location-list\"></div>";
  if (!q("#location-updates")) q(".location-list").insertAdjacentHTML("afterend", "<section id=\"location-updates\" class=\"location-updates\" aria-live=\"polite\"></section>");
  const sheet = q(".sheet-panel"); sheet.innerHTML = "<button class=\"sheet-close\" data-action=\"close\" aria-label=\"關閉\">×</button><p class=\"eyebrow\" id=\"event-eyebrow\"></p><h2 id=\"event-title\"></h2><p id=\"event-description\"></p><div class=\"choice-list\" id=\"event-choices\"></div>";
}
function renderLocalOutcomes(w, loc) {
  const history = (w.eventHistory || []).filter((entry) => entry.locationId === w.activeLocation).slice(-2).reverse();
  const commissions = (w.commissions || []).filter((entry) => entry.status === "available" && (entry.settlementId === loc.settlement || entry.location === w.activeLocation));
  const npcs = Object.values(w.npcs || {}).filter((entry) => entry.settlementId === loc.settlement || entry.locationId === w.activeLocation);
  const stock = (w.shops || {})[loc.settlement] || [];
  const rows = [
    ...commissions.map((entry) => "後續委託｜" + entry.title),
    ...npcs.map((entry) => "NPC｜" + entry.name + "・信任 " + entry.trust + "・" + entry.note),
    ...stock.map((entry) => "商店｜" + entry.name + "・庫存 " + entry.stock),
    ...history.map((entry) => "事件回響｜" + entry.result)
  ];
  const panel = q("#location-updates");
  const scene = window.DaluRegionContent && window.DaluRegionContent.scenes[w.activeLocation];
  const sceneMarkup = scene ? '<figure class="location-scene"><img src="' + escapeHTML(scene.image) + '" alt="' + escapeHTML(scene.imageAlt) + '" loading="lazy"><figcaption><strong>' + escapeHTML(scene.title) + '</strong><span>' + escapeHTML(scene.description) + '</span></figcaption></figure><article class="location-resident" aria-label="地方人物"><span class="resident-mark" aria-hidden="true">' + escapeHTML(scene.resident.name.slice(0, 1)) + '</span><div><p class="eyebrow">' + escapeHTML(scene.resident.role) + '</p><h4>' + escapeHTML(scene.resident.name) + '</h4><p>' + escapeHTML(scene.resident.copy) + '</p></div></article>' : "";
  if (panel) panel.innerHTML = sceneMarkup + "<h3>地方回響</h3>" + (rows.length ? "<ul>" + rows.map((row) => "<li>" + escapeHTML(row) + "</li>").join("") + "</ul>" : "<p>尚無新增委託、人物往來或商店變化。</p>");
}
function renderGrowth() {
  const panel = q("#character-growth-panel");
  if (!panel) return;
  if (!state.character) { panel.innerHTML = "<h3>旅人養成</h3><p>建立角色後，這裡會記錄技能熟練、傳承與升階試煉。</p>"; return; }
  const growth = window.DaluCharacterGrowth.ensure(state.character).growth;
  const assessment = window.DaluCharacterGrowth.evaluateTrial(state.character);
  const skills = Object.keys(window.DaluCharacterGrowth.SKILLS).map((id) => {
    const skill = window.DaluCharacterGrowth.SKILLS[id];
    const uses = growth.skillUses[id] || 0;
    const mastered = growth.masteredSkills.includes(id);
    return "<li><span>" + skill.name + (growth.inheritedSkills.includes(id) ? "・傳承" : "") + "</span><strong>" + (mastered ? "已領悟" : uses + "/" + skill.threshold) + "</strong></li>";
  }).join("");
  const trialCopy = assessment.nextRank
    ? assessment.title + "：等級 " + growth.level + "/" + assessment.requiredLevel + "，熟練技能 " + growth.masteredSkills.length + "/" + assessment.requiredSkills
    : "已達最高位階";
  const button = assessment.nextRank
    ? '<button type="button" class="primary" data-action="rank-trial" ' + (assessment.available ? "" : "disabled") + '>開始' + assessment.title + '</button>'
    : "";
  panel.innerHTML = "<p class=\"eyebrow\">角色成長</p><h3>" + escapeHTML(state.character.name || "旅人") + "・位階 " + growth.rank + "・等級 " + growth.level + "</h3><p>累積經驗 " + growth.experience + "</p><ul class=\"growth-skills\">" + skills + "</ul><p>下一階段：" + trialCopy + "</p>" + button;
}
function render() {
  const w = state.world; const loc = LOCATIONS[w.activeLocation]; const faction = w.factions[loc.faction] || 0;
  const storyView = window.DaluStoryProgression.describe(state.story, w.day); q("#story-title").textContent = storyView.title; q("#story-copy").textContent = storyView.copy; q("#story-choice-actions").innerHTML = storyView.endingChoices ? "<button type=\"button\" data-action=\"story-ending\" data-ending=\"seal-maintained\">封存回音</button><button type=\"button\" data-action=\"story-ending\" data-ending=\"old-city-revealed\">追查舊城線索</button>" : storyView.choices ? "<button type=\"button\" data-action=\"story-decision\" data-decision=\"accept\">接受邀請</button><button type=\"button\" data-action=\"story-decision\" data-decision=\"decline\">拒絕邀請</button>" : "";
  q("#role-status").textContent = state.story.status === "accepted" ? "主線進行中" : state.story.status === "invited" ? "等待抉擇" : state.story.status === "declined" ? "已婉拒邀請" : "主線已記錄"; q("#world-day").textContent = String(w.day).padStart(2,"0"); q("#world-threat").textContent = w.threat + "%"; q("#world-season").textContent = w.season;
  const meta = document.querySelectorAll(".hero-meta span"); if (meta[0]) meta[0].textContent = "第 " + w.day + " 日"; if (meta[1]) meta[1].textContent = loc.name + "・" + loc.type; if (meta[2]) meta[2].textContent = "回合 " + String(w.turns + 1).padStart(2,"0");
  q("#world-hero-title").textContent = state.story.status === "accepted" ? "你已加入主線" : state.story.status === "npc-led" ? state.story.successor.name + "接下天命" : state.story.status === "completed" ? "鐘丘調查已落幕" : state.story.status === "declined" ? "天命將由世界接續" : "天命尚未被承接"; q("#world-hero-copy").textContent = storyView.copy;
  q("#region-status").textContent = "春潮海岸・" + loc.name; q("#settlement-prosperity").textContent = w.settlements[loc.settlement] || 0; q("#faction-reputation").textContent = (faction > 0 ? "+" : "") + faction; q("#unlock-count").textContent = w.unlocked.length + " / 5"; const openCount = (w.commissions || []).filter((x) => x.status === "available").length; const npcCount = Object.keys(w.npcs || {}).length; const shopCount = Object.values(w.shops || {}).reduce((n, items) => n + items.length, 0); q("#world-status-copy").textContent = w.lastResult ? w.lastResult + "　後續委託 " + openCount + " 件・相關 NPC " + npcCount + " 位・新增商品 " + shopCount + " 種" : "事件結果會回寫聚落、勢力、地圖與 Boss 入口。";
  document.querySelectorAll("[data-location]").forEach((n) => { const ok = w.unlocked.indexOf(n.dataset.location) >= 0; n.classList.toggle("locked", !ok); n.classList.toggle("active", n.dataset.location === w.activeLocation); n.setAttribute("aria-disabled", String(!ok)); });
  const availableEvent = eventFor(w.activeLocation); q("#map-context-title").textContent = loc.name; q("#map-context-copy").textContent = loc.copy; q(".map-context button").dataset.event = availableEvent || ""; q(".map-context button").disabled = !availableEvent; q(".map-context button").textContent = availableEvent ? "查看事件" : (EVENT_POOLS[w.activeLocation] ? "此地事件已完成" : (w.boss ? "鐘守已現身" : "尚未開放"));
  q(".location-list").innerHTML = Object.keys(LOCATIONS).map((id) => { const x = LOCATIONS[id]; const ok = w.unlocked.indexOf(id) >= 0; return "<button class=\"location-row " + (id === w.activeLocation ? "selected " : "") + (!ok ? "locked" : "") + "\" data-action=\"location\" data-location=\"" + id + "\"><span class=\"location-symbol\">◇</span><span><strong>" + x.name + "</strong><small>" + x.type + "・" + x.copy + "</small></span><span>" + (ok ? "›" : "鎖") + "</span></button>"; }).join("");
  renderLocalOutcomes(w, loc);
  renderGrowth();
}
function openEvent(id) { const e = EVENTS[id]; if (!e) return toast("這個地點目前沒有事件"); if (!(EVENT_POOLS[state.world.activeLocation] || []).includes(id)) return toast("請先前往事件所在地"); if ((state.world.completedEvents || []).includes(id)) return toast("這個事件已經處理過"); q("#event-eyebrow").textContent = e.eyebrow; q("#event-title").textContent = e.title; q("#event-description").textContent = e.description; q("#event-choices").innerHTML = e.choices.map((c) => "<button class=\"choice-button\" data-action=\"choice\" data-event=\"" + id + "\" data-choice=\"" + c.id + "\"><strong>" + c.label + "</strong><span>" + c.note + "</span></button>").join(""); q(".event-sheet").classList.add("open"); q(".event-sheet").setAttribute("aria-hidden","false"); }function choice(id, cid) {
  const event = EVENTS[id], selected = event && event.choices.find((item) => item.id === cid);
  if (!selected) return;
  const applied = window.DaluEventSystem.applyOutcome(state.world, id, selected, { locations: LOCATIONS, location: state.world.activeLocation, regionId: "spring-coast" });
  if (!applied.applied) { q(".event-sheet").classList.remove("open"); return toast("這個事件已經處理過"); }
  state.world = applied.world; state.choices++; if (state.character) window.DaluGrowthBridge.recordExperience("event:" + id, 30); const storyResult = window.DaluStoryProgression.recordEvent(state.story, id, selected.id, state.world.day); state.story = storyResult.story; q(".event-sheet").classList.remove("open"); render(); save(true); toast(storyResult.notice || applied.result);
}
function advance() { if (!state.character) { toast("請先建立角色，再推進旅途"); return; } const w = state.world; w.day++; w.turns++; w.threat = clamp(w.threat + 3,0,99); w.season = w.day >= 8 ? "盛夏" : "春潮"; w.settlements["wind-spring"] = clamp(w.settlements["wind-spring"] + (w.threat > 45 ? -1 : 1),0,100); if (w.unlocked.indexOf("sand-ruins") >= 0 && w.day >= 6) w.boss = true; window.DaluGrowthBridge.recordExperience("day:" + w.day, 10); const storyAdvance = window.DaluStoryProgression.advance(state.story, w.day); state.story = storyAdvance.story; render(); save(); toast(storyAdvance.notice || "世界推進至第 " + w.day + " 日"); }
function load() { try { const raw = JSON.parse(localStorage.getItem(SAVE_KEY) || localStorage.getItem("dalu-travel-log-save-v2") || "null"); if (!raw) return; const old = raw.state || raw; state.role = old.role === "hero" ? "hero" : null; state.story = window.DaluStoryProgression.migrate(raw); state.character = old.character ? window.DaluCharacterGrowth.ensure(old.character) : null; state.legacySkills = Array.isArray(old.legacySkills) ? old.legacySkills.filter((entry) => entry && window.DaluCharacterGrowth.SKILLS[entry.id]) : []; state.profession = old.profession || old.character?.profession?.id || null; state.choices = old.choices || 0; state.screen = old.screen || "journal"; state.world = Object.assign(initialWorld(), old.world || {}); if (state.character) window.DaluCharacterGrowth.archiveMastery(state.character, state.legacySkills); } catch (e) { localStorage.removeItem(SAVE_KEY); } }

window.DaluGrowthBridge = {
  recordSkillUse(skillId) {
    if (!state.character) return { ok: false, reason: "no-character" };
    const result = window.DaluCharacterGrowth.recordSkillUse(state.character, skillId);
    if (result.ok && result.masteredNow) window.DaluCharacterGrowth.archiveMastery(state.character, state.legacySkills);
    if (result.ok) { save(true); render(); }
    return result;
  },
  syncMastery(uses) {
    if (!state.character || !uses) return;
    Object.keys(window.DaluCharacterGrowth.SKILLS).forEach((skillId) => {
      const target = Math.min(window.DaluCharacterGrowth.SKILLS[skillId].threshold, Math.max(0, Number(uses[skillId]) || 0));
      while ((state.character.growth.skillUses[skillId] || 0) < target) this.recordSkillUse(skillId);
    });
  },
  recordExperience(sourceId, amount) {
    if (!state.character) return { ok: false, reason: "no-character" };
    const result = window.DaluCharacterGrowth.grantExperience(state.character, sourceId, amount);
    if (result.ok) { save(true); render(); }
    return result;
  },
  getTrial() { return window.DaluCharacterGrowth.evaluateTrial(state.character); },
  completeTrial(rank, won) {
    const result = window.DaluCharacterGrowth.completeTrial(state.character, rank, won, state.world.day);
    if (result.ok) { save(true); render(); }
    return result;
  }
};
document.addEventListener("click", (ev) => { const n = ev.target.closest("[data-nav]"); if (n) { state.screen = n.dataset.nav; document.querySelectorAll("[data-screen]").forEach((x) => x.classList.toggle("active", x.dataset.screen === state.screen)); document.querySelectorAll("[data-nav]").forEach((x) => x.classList.toggle("active", x.dataset.nav === state.screen)); return; } const a = ev.target.closest("[data-action]"); if (!a) return; if (a.dataset.action === "story-decision") { const result = window.DaluStoryProgression.decide(state.story, a.dataset.decision, state.world.day, state.character && state.character.name, state.world.completedEvents); if (!result.applied) return; state.story = result.story; render(); save(); toast(result.story.status === "accepted" ? "你已接受鐘丘調查邀請" : "你已拒絕邀請；世界仍會繼續運轉"); return; } if (a.dataset.action === "story-ending") { const result = window.DaluStoryProgression.decideEnding(state.story, a.dataset.ending, state.world.day); if (!result.applied) return; state.story = result.story; render(); save(); toast("結局已記入旅誌"); return; } if (a.dataset.action === "save") return save(); if (a.dataset.action === "advance-world") return advance(); if (a.dataset.action === "open-event") return openEvent(a.dataset.event || "bell"); if (a.dataset.action === "event") return openEvent(a.dataset.event); if (a.dataset.action === "choice") return choice(a.dataset.event,a.dataset.choice); if (a.dataset.action === "close") { q(".event-sheet").classList.remove("open"); return; } if (a.dataset.action === "location") { if (state.world.unlocked.indexOf(a.dataset.location) < 0) return toast("這個地點尚未解鎖"); state.world.activeLocation = a.dataset.location; render(); save(true); toast("目的地已切換：" + LOCATIONS[a.dataset.location].name); } });
inject(); load(); render();
window.addEventListener("pagehide", save);
