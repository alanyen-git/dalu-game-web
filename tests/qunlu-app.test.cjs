const assert = require("node:assert/strict");
const vm = require("node:vm");
const fs = require("node:fs");
const path = require("node:path");
const root = path.join(__dirname, "..");
const app = path.join(root, "qunlu-app");
const lock = JSON.parse(fs.readFileSync(path.join(app, "source-lock.json"), "utf8"));
assert.equal(lock.source_repository, "alanyen-git/qunlu-game");
assert.equal(lock.rules.includes("read-only source"), true);
for (const file of ["index.html","manifest.webmanifest","sw.js","assets/css/game.css","assets/css/app-theme.css","assets/art/qunlu-party-portraits.svg","assets/art/battle-sd-portraits.svg","assets/art/maps/willow-town.svg","assets/art/maps/old-forest.svg","assets/art/maps/stone-vault.svg","assets/art/maps/mountain-pass.svg","assets/art/maps/river-valley.svg","assets/art/maps/region-atlas.svg","assets/art/maps/terrain-scenes.svg","assets/art/event-scenes.svg","assets/art/ui/equipment-display.svg","assets/art/town/facility-interiors.svg","src/battle-ui-theme.js","src/mobile-map-ui.js","src/town-home-ui.js","src/event-portrait-ui.js","assets/art/npc-portrait-sprites.svg","src/inventory-art-ui.js","assets/art/item-skill-icons.svg","src/game-data.js","src/runtime.js","src/equipment-detail-ui.js","src/data-patches.js","src/pwa.js"]) {
  assert.ok(fs.existsSync(path.join(app, file)), "missing imported app file: " + file);
}
const html = fs.readFileSync(path.join(app, "index.html"), "utf8");
const version = JSON.parse(fs.readFileSync(path.join(app, "version.json"), "utf8"));
assert.ok(html.includes(version.version), "app title must match the published version");
assert.ok(html.includes("<title>異界旅人 " + version.version + "</title>"), "standalone app title must be 異界旅人");
const packagedVersion = html.match(/<meta name="app-version" content="([^"]+)">/);
assert.ok(packagedVersion, "standalone app must expose its packaged version");
assert.equal(packagedVersion[1], version.version, "packaged version must match version.json");
const runtimeSource = fs.readFileSync(path.join(app, "src/runtime.js"), "utf8");
assert.ok(runtimeSource.includes('meta[name="app-version"]'), "web updater must compare against packaged app version");
const mapSource = fs.readFileSync(path.join(app, "src/xuanyuan-map-ui.js"), "utf8");
const battleTheme = fs.readFileSync(path.join(app, "src/battle-ui-theme.js"), "utf8");
const mapTheme = fs.readFileSync(path.join(app, "assets/css/app-theme.css"), "utf8");
const emptyRealmResult = {};
const emptyRealmContext = {
  DB: { realm_region_maps: [{ id: "realm-empty", political_entity_id: "polity-empty", name: "雲杉王國", province_region_ids: [] }] },
  window: null,
  realmRegionMap: () => ({ id: "realm-empty", political_entity_id: "polity-empty", name: "雲杉王國", province_region_ids: [] }),
  politicalEntity: id => ({ id, name: "雲杉王國" }),
  showModal: (title, html) => Object.assign(emptyRealmResult, { title, html })
};
emptyRealmContext.window = emptyRealmContext;
vm.createContext(emptyRealmContext);
vm.runInContext(mapSource, emptyRealmContext);
emptyRealmContext.xuRealm("realm-empty");
assert.match(emptyRealmResult.html, /此政體目前尚未登錄行省級地圖資料/);
assert.match(emptyRealmResult.html, /世界/);
assert.ok(mapSource.includes("region-atlas.svg#"), "map layers must render the new illustrated terrain atlas");
assert.ok(mapSource.includes("terrain-scenes.svg#"), "outdoor and dungeon locations must render distinct scene art");
assert.ok(mapSource.includes("exploreState"), "map locations must reflect current and previously visited places");
assert.ok(mapSource.includes("openMapLocationDetail"), "wild and dungeon map nodes must retain location details");
assert.ok(mapTheme.includes("XUANYUAN-MAP-UI-1.2"), "five-layer map art and exploration layout must be present");
assert.ok(mapSource.includes("function local(id)"), "province map must open the local-area layer");
assert.ok(mapSource.includes("function locationMap(id)"), "wild and dungeon nodes must open their illustrated location layer");
assert.ok(mapSource.includes("window.openSettlementRegionMap=local"), "existing settlement-map entrypoint must route to local-area map");
const manifest = JSON.parse(fs.readFileSync(path.join(app, "manifest.webmanifest"), "utf8"));
assert.equal(manifest.name, "異界旅人");
assert.equal(manifest.short_name, "異界旅人");
assert.ok(html.includes('src/game-data.js'));
assert.ok(html.includes('src/runtime.js'));
assert.ok(html.includes('assets/css/app-theme.css'));
assert.ok(html.includes('src/mobile-map-ui.js'));
assert.ok(html.includes('src/battle-ui-theme.js'));
assert.ok(!html.includes("dalu-game-web"));
assert.ok(fs.statSync(path.join(app, "src/game-data.js")).size > 3000000);
assert.ok(html.includes('src/town-home-ui.js'), "town home module must load");
assert.ok(html.includes('src/event-portrait-ui.js'), "event portraits must load");
assert.ok(html.includes('src/npc-speaker.js'), "regional dialogue speaker resolver must load");
assert.ok(html.includes('src/inventory-art-ui.js'), "inventory and skill icons must load");
assert.ok(html.includes('src/equipment-detail-ui.js'),"equipment detail module must load after runtime");
assert.ok(fs.readFileSync(path.join(app,"src/inventory-art-ui.js"),"utf8").includes("item-skill-icons.svg#"), "inventory art uses original SVG icons");
const inventoryArt=fs.readFileSync(path.join(app,"src/inventory-art-ui.js"),"utf8");
const itemSkillIcons=fs.readFileSync(path.join(app,"assets/art/item-skill-icons.svg"),"utf8");
for(const icon of ["heal","shield","poison","lightning","summon","status"])assert.ok(itemSkillIcons.includes(`symbol id="${icon}"`),"skill effect art must exist for "+icon);
assert.ok(inventoryArt.includes("const skillRules=")&&inventoryArt.includes("add(el,el.textContent||\"\",true)"),"skills must select effect-specific icons");
assert.equal(version.item_skill_icon_revision,"ITEM-SKILL-ICONS-2.0");
const iconSandbox={window:{},document:{querySelector:()=>null},MutationObserver:class{},requestAnimationFrame:fn=>fn()};
vm.runInNewContext(inventoryArt.replace("function iconFor","window.iconFor=iconFor; function iconFor"),iconSandbox);
assert.equal(iconSandbox.window.iconFor("治療術",true),"heal");
assert.equal(iconSandbox.window.iconFor("盾牆",true),"shield");
assert.equal(iconSandbox.window.iconFor("連鎖閃電",true),"lightning");
assert.equal(iconSandbox.window.iconFor("召喚靈獸",true),"summon");
assert.equal(iconSandbox.window.iconFor("生命藥劑",false),"potion");
assert.equal(iconSandbox.window.iconFor("鐵盾",false),"armor");
assert.ok(fs.readFileSync(path.join(app,"assets/art/maps/stone-vault.svg"),"utf8").includes("connected chamber rooms"), "dungeon artwork must include rooms and corridors");
assert.equal(html.includes('data-nav="adventure"'), false, "legacy adventure-home nav must be gone");
assert.ok(html.includes('data-nav="home"'), "town map is the home nav");
const townHome = fs.readFileSync(path.join(app, "src/town-home-ui.js"), "utf8");
assert.ok(townHome.includes("dataset.locationId"), "town map must expose active location state for scene styling");
assert.ok(townHome.includes("townHomeActions"), "actions must appear inside the town-map page");
assert.ok(townHome.includes("角色資料"), "character shortcuts must appear on the town-map page");
assert.equal(runtimeSource.includes('add("城鎮設施","openFacilities()")'), false, "generic town-facilities action must be removed");
assert.ok(fs.readFileSync(path.join(app, "assets/css/app-theme.css"), "utf8").includes("XUANYUAN-HOME-1.0"));
assert.ok(mapTheme.includes("XUANYUAN-REGION-ATLAS-1.0"), "new regional map art styles must be present");
assert.ok(fs.readFileSync(path.join(app,"src/runtime.js"),"utf8").includes("facility-interiors.svg#${fid}"), "facility entries must render a matching original indoor scene");
assert.ok(runtimeSource.includes("xu-party-formation"), "character data must show the active party visually");
assert.ok(runtimeSource.includes("equipment-display.svg"), "equipment view must have a dedicated illustration");
assert.ok(fs.readFileSync(path.join(app,"src/event-portrait-ui.js"),"utf8").includes("event-scenes.svg#"), "story and event scenes must use original illustrations");
assert.ok(battleTheme.includes("xuan-hit-fx"), "battle actions must show animated hit feedback");
const sw = fs.readFileSync(path.join(app, "sw.js"), "utf8");
assert.ok(sw.includes('CACHE_NAME=CACHE_PREFIX+"v32"'), "new illustrated scene assets must be deployed with a fresh offline cache");
for (const art of ["willow-town.svg", "old-forest.svg", "stone-vault.svg", "mountain-pass.svg", "river-valley.svg", "npc-portrait-sprites.svg", "item-skill-icons.svg", "region-atlas.svg", "facility-interiors.svg", "terrain-scenes.svg", "event-scenes.svg", "equipment-display.svg"]) assert.ok(sw.includes(art), "scene artwork must be included in the offline cache");
assert.ok(battleTheme.includes("dataset.scene"), "battle background art must follow the current game region");
assert.ok(mapTheme.includes("XUANYUAN-BATTLE-SCENE-1.0"), "battle UI must reuse region scene artwork");
assert.ok(mapTheme.includes("XUANYUAN-DATA-UI-1.0"), "data screens must share the antique interface style");
assert.ok(mapTheme.includes("XUANYUAN-DIALOGUE-ART-1.0"), "event and character artwork styling must be present");
assert.ok(mapTheme.includes("XUANYUAN-ARTKIT-0.1"), "original scene art styles must be present");
assert.equal(version.scene_art_revision, "ORIGINAL-MAP-SCENES-1.6");
assert.ok(mapSource.includes('?"mountain":') && mapSource.includes('?"river":'), "wilderness map selects terrain art by location context");
require("./qunlu-apk-update.test.cjs");
require("./map-controls.test.cjs");
require("./npc-speaker.test.cjs");
require("./equipment-detail-ui.test.cjs");
console.log("Qunlu-derived mobile app source and immutable source lock are present.");

const mapControls=fs.readFileSync(path.join(app,"src/map-controls.js"),"utf8");
assert.ok(html.includes('src/map-controls.js'),"map controls must load in the standalone app");
assert.ok(mapControls.includes("放大地圖")&&mapControls.includes("縮小地圖")&&mapControls.includes("重設地圖縮放"),"map controls must be accessible");
assert.ok(mapControls.includes("pointermove")&&mapControls.includes("translate("),"map must support touch panning");
assert.ok(sw.includes('CACHE_NAME=CACHE_PREFIX+"v32"')&&sw.includes("map-controls.js"),"map controls must ship in a fresh offline cache");
assert.equal(version.map_ui_revision,"XUANYUAN-MAP-UI-1.9");
assert.equal(version.regional_map_revision,"REGIONAL-MAP-SCENES-1.0");
const regionAtlas=fs.readFileSync(path.join(app,"assets/art/maps/region-atlas.svg"),"utf8");
for(const scene of ["region-islands","region-steppe","region-forest","region-highland","region-marsh","region-desert","region-city","region-riverland"])assert.ok(regionAtlas.includes(`symbol id="${scene}"`),"regional scene art must exist for "+scene);
assert.ok(mapSource.includes("function regionalScene(text)")&&mapSource.includes('region-atlas.svg#"+sceneId'),"admin maps must resolve data-based regional scene art");

const dungeonMap=fs.readFileSync(path.join(app,"src/xuanyuan-map-ui.js"),"utf8");
assert.ok(dungeonMap.includes("function dungeonIndex(l)")&&dungeonMap.includes("G.explorationIntel"),"dungeon map must reflect saved exploration records");
assert.ok(sw.includes("npc-speaker.js"),"regional speaker resolver must be available offline");
assert.ok(sw.includes("equipment-detail-ui.js"),"equipment detail module must be available offline");
assert.equal(version.character_equipment_revision,"EQUIPMENT-DETAIL-1.0");
assert.ok(dungeonMap.includes("encounter_profile")&&dungeonMap.includes("xu-dungeon-index"),"dungeon scenes and indexes must use existing dungeon data");
assert.ok(mapTheme.includes("XUANYUAN-DUNGEON-INDEX-1.0"),"dungeon discovery index must use responsive original styling");
assert.equal(version.dungeon_index_revision,"DUNGEON-INDEX-1.0");
const dbSource=fs.readFileSync(path.join(app,"src/game-data.js"),"utf8");
const db=JSON.parse(dbSource.slice(dbSource.indexOf("=")+1,dbSource.lastIndexOf(";")));
const dungeons=db.locations.filter(x=>x.kind==="dungeon");
assert.equal(dungeons.length,18,"index should cover every existing dungeon");
for(const dungeon of dungeons){assert.ok(Array.isArray(dungeon.explore)&&dungeon.explore.length===5,dungeon.id+" must have five source exploration points");assert.equal(dungeon.explore.reduce((sum,x)=>sum+(Number(x[1])||0),0),100,dungeon.id+" exploration weights must total 100");}

const portraitSource=fs.readFileSync(path.join(app,"src/event-portrait-ui.js"),"utf8");
assert.ok(portraitSource.includes('body.querySelector(".card b")')&&portraitSource.includes("speakerPortraits"),"dialogue portraits must prefer the source speaker role");
assert.ok(portraitSource.includes("art-dialogue-speaker")&&portraitSource.includes('identity.name+"，"+identity.role'),"speaker name and source role must be visible and accessible");
assert.ok(portraitSource.includes("identity?.visualStyle")&&portraitSource.includes("culture-"),"regional dialogue portraits must receive a source culture style");
const portraitAssets=fs.readFileSync(path.join(app,"assets/art/npc-portrait-sprites.svg"),"utf8");
for(const style of ["asdale_west","valrek_imperial","free_city","elven","dwarven","beast_steppe","dark_elf"])assert.ok(portraitAssets.includes("culture-"+style),"regional portrait art must exist for "+style);
assert.equal(version.regional_portrait_revision,"REGIONAL-PORTRAIT-1.0");
assert.ok(mapTheme.includes("XUANYUAN-DIALOGUE-SPEAKER-1.0"),"speaker role captions must use responsive original styling");
assert.equal(version.dialogue_portrait_revision,"DIALOGUE-PORTRAIT-1.0");

const npcSpeakerSource=fs.readFileSync(path.join(app,"src/npc-speaker.js"),"utf8");
assert.ok(npcSpeakerSource.includes("DB.regional_npc_archetypes")&&npcSpeakerSource.includes("generateWorldName"),"dialogue identities must use source archetypes and the existing naming AI");
assert.ok(npcSpeakerSource.includes("namedDialogueNpcNames"),"generated identities and encounter records must persist in an optional save extension");
assert.ok(npcSpeakerSource.includes("function openJournal()")&&npcSpeakerSource.includes("function openProfile(id)"),"journal and profile views must use saved encounters and source archetypes");
assert.equal(version.named_dialogue_npc_revision,"REGIONAL-NPC-JOURNAL-1.2");

assert.ok(mapTheme.includes("REGIONAL-NPC-SPEAKER-1.0"),"regional speaker labels must stay readable on mobile");

assert.ok(portraitSource.includes('/・對話$/.test(title)'),"named identities must only be created in facility dialogue windows");
