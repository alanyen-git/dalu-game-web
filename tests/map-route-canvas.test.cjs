const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");

const source=fs.readFileSync(path.join(__dirname,"..","qunlu-app","src","xuanyuan-map-ui.js"),"utf8");
const places=[
 {id:"town-a",name:"柳橋鎮",kind:"town",facilities:["general"],links:[{to:"wild-b",hours:1.5}]},
 {id:"wild-b",name:"青石野地",kind:"wild",links:[{to:"town-a",hours:1.5},{to:"dungeon-c",hours:2}]},
 {id:"dungeon-c",name:"舊石窟",kind:"dungeon",links:[{to:"wild-b",hours:2}]},
 {id:"town-x",name:"遠方城鎮",kind:"town",facilities:["general"],links:[]}
];
const DB={
 locations:places,
 facilities:{general:{name:"商鋪"}},
 settlement_region_maps:[{id:"area-a",name:"柳橋周邊",parent_province_region_id:"province-a",location_ids:["town-a","wild-b"]}],
 province_region_maps:[{id:"province-a",name:"河谷省",parent_realm_map_id:"realm-a",administrative_type:"行省"}],
 realm_region_maps:[{id:"realm-a",name:"河谷王國",political_entity_id:"pol-a",province_region_ids:["province-a"]}],
 world_regions:[],political_entities:[{id:"pol-a",name:"河谷王國"}]
};
const G={character:{locationId:"town-a"},history:[],worldTime:{hour:12}};
let shown=null,detailId=null;
const context={
 DB,G,window:{},
 loc:id=>places.find(x=>x.id===id),
 realmRegionMap:id=>DB.realm_region_maps.find(x=>x.id===id),
 provinceRegion:id=>DB.province_region_maps.find(x=>x.id===id),
 politicalEntity:id=>DB.political_entities.find(x=>x.id===id),
 provinceCategoryLocations:(p,kind)=>places.filter(x=>x.kind===kind),
 showModal:(title,body)=>{shown={title,body}},
 openMapLocationDetail:id=>{detailId=id;shown={title:id,body:"道路連結資料"};return "details"}
};
vm.runInNewContext(source,context);
context.window.xuLocal("area-a");
assert.ok(/class="xu-route-map(?:\s|")/.test(shown.body),"local map renders a mapped route layer");
assert.match(shown.body,/xu-road-center/,"map roads come from location links");
assert.match(shown.body,/柳橋鎮/);
assert.match(shown.body,/青石野地/);
assert.match(shown.body,/travel\(&quot;wild-b&quot;,1\.5\)/,"clicking an adjacent wilderness pin runs the travel flow");
assert.match(shown.body,/xuLocation\(&quot;dungeon-c&quot;\)/,"a farther dungeon pin opens its location details without skipping the road network");
assert.doesNotMatch(shown.body,/xu-node-grid/,"location names are map pins, not detached card grids");

context.window.xuTown("town-a");
assert.match(shown.body,/xu-facility-map/,"town facilities are anchored to the street map");
assert.match(shown.body,/xuFacility\(&quot;general&quot;\)/,"shop pin opens its facility interaction");
assert.match(shown.body,/xu-route-map-town/,"town exits are drawn on the same map");
assert.match(shown.body,/travel\(&quot;wild-b&quot;,1\.5\)/,"town wilderness exit pin moves through travel");

context.window.xuTown("town-x");
assert.equal(detailId,"town-x","a remote town opens route/location information instead of remote shop access");
assert.match(shown.body,/道路連結/,"remote town details remain informational");
const appHtml=fs.readFileSync(path.join(__dirname,"..","qunlu-app","index.html"),"utf8");
assert.match(appHtml,/<script src="src\/asdail-depth-v2\.js"><\/script>\s*<script src="src\/political-region-pack-v1\.js"><\/script>/,"region scripts load as separate script elements");
console.log("PASS mapped roads, location pins, direct adjacent travel, facility pins, and remote town access");
