(function(){
"use strict";
const esc=v=>String(v==null?"":v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const call=(n,id)=>n+"("+JSON.stringify(String(id))+")";
const getLoc=id=>typeof loc==="function"?loc(id):(DB.locations||[]).find(x=>x.id===id);
const area=id=>(DB.settlement_region_maps||[]).find(x=>x.id===id);
const areaOf=id=>(DB.settlement_region_maps||[]).find(x=>(x.location_ids||[]).includes(id));
const areas=id=>(DB.settlement_region_maps||[]).filter(x=>x.parent_province_region_id===id);
const exploreState=id=>{const l=getLoc(id);if(!l)return"未踏";if(typeof G!=="undefined"&&G.character&&G.character.locationId===id)return"目前所在";const history=typeof G!=="undefined"&&Array.isArray(G.history)?G.history:[];return history.some(h=>h.tag==="旅行"&&String(h.text||"").includes("抵達"+l.name))?"曾經抵達":"尚未抵達"};
function crumb(label,fn){return '<button class="xu-crumb" type="button" onclick="'+esc(fn)+'">'+esc(label)+'</button>'}
function board(kind,body,sceneId){const layer={world:"world",realm:"realm",province:"province",local:"local"}[kind.split(" ")[0]]||"local";const art=sceneId?"./assets/art/maps/terrain-scenes.svg#"+sceneId:"./assets/art/maps/region-atlas.svg#"+layer;const h=typeof G!=="undefined"&&G.worldTime?G.worldTime.hour:12,time=h<6?"night":h<10?"dawn":h<18?"day":h<21?"dusk":"night";return '<div class="xu-board '+kind+' time-'+time+'"><svg class="xu-map-art" viewBox="0 0 800 500" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><use href="'+art+'"></use></svg><div class="xu-compass">N</div><div class="xu-terrain ridge-a"></div><div class="xu-terrain ridge-b"></div><div class="xu-river"></div>'+body+'</div>'}
function frame(title,crumbs,content){return '<div class="xu-map-shell"><div class="xu-map-head"><div><p class="eyebrow">異界旅人・五層地圖</p><h3>'+esc(title)+'</h3><p class="xu-map-hint">世界 → 王國／政體 → 行省 → 當地區域 → 城鎮</p></div><div class="xu-crumbs">'+crumbs+'</div></div>'+content+'</div>'}
function node(label,meta,fn,kind){return '<button type="button" class="xu-map-node '+(kind||"")+'" onclick="'+esc(fn)+'"><b>'+esc(label)+'</b><small>'+esc(meta||"")+'</small></button>'}
function world(){
 const rows=(DB.realm_region_maps||[]).map(r=>{const p=typeof politicalEntity==="function"?politicalEntity(r.political_entity_id):null;return node(p?p.name:r.name,"行省 "+(r.province_region_ids||[]).length,call("xuRealm",r.id),"realm")}).join("");
 showModal("世界地圖",frame("世界地圖",crumb("世界",call("xuWorld","")),board("world",'<div class="xu-map-title">世界航路</div><div class="xu-node-grid">'+rows+'</div><div class="xu-map-footer">行政區依既有資料庫呈現。</div>')));
}
function realm(id){
 const r=typeof realmRegionMap==="function"?realmRegionMap(id):null;if(!r)return world();
 const p=typeof politicalEntity==="function"?politicalEntity(r.political_entity_id):null;
 const rows=(r.province_region_ids||[]).map(pid=>{const x=typeof provinceRegion==="function"?provinceRegion(pid):null;return x?node(x.name,x.administrative_type||"行省",call("xuProvince",x.id),"province"):""}).join("");
 showModal((p?p.name:r.name)+"・王國地圖",frame(p?p.name:r.name,crumb("世界",call("xuWorld",""))+crumb("王國／政體",call("xuRealm",r.id)),board("realm",'<div class="xu-map-title">'+esc(p?p.name:r.name)+'</div><div class="xu-node-grid">'+rows+'</div>')),call("xuWorld",""));
}
function province(id){
 const p=typeof provinceRegion==="function"?provinceRegion(id):null;if(!p)return world();
 const r=typeof realmRegionMap==="function"?realmRegionMap(p.parent_realm_map_id):null,groups=areas(p.id);
 const owned=new Set(groups.flatMap(x=>x.location_ids||[]));
 let rows=groups.map(s=>node(s.name,(s.role||"當地區域")+"｜"+(s.location_ids||[]).length+" 個地點",call("xuLocal",s.id),"region")).join("");
 const loose=["town","wild","dungeon"].flatMap(k=>typeof provinceCategoryLocations==="function"?provinceCategoryLocations(p,k,false):[]).filter(x=>!owned.has(x.id));
 rows+=(loose.length?'<div class="xu-grid-label">其他已登錄地點</div>':"")+loose.map(x=>node(x.name,x.kind==="town"?"城鎮":x.kind==="dungeon"?"地下城":"野外",call(x.kind==="town"?"xuTown":"xuLocation",x.id),x.kind)).join("");
 const content='<div class="xu-map-title">'+esc(p.display_name||p.name)+'</div><div class="xu-node-grid">'+rows+'</div><div class="xu-map-footer">點選當地區域查看道路、城鎮、野外與地下城。</div>';
 showModal(p.name+"・行省地圖",frame(p.name,(r?crumb("王國／政體",call("xuRealm",r.id)):"")+crumb("行省",call("xuProvince",p.id)),board("province",content)),r?call("xuRealm",r.id):call("xuWorld",""));
}
function local(id){
 const s=area(id);if(!s)return world();
 const p=typeof provinceRegion==="function"?provinceRegion(s.parent_province_region_id):null,r=p&&typeof realmRegionMap==="function"?realmRegionMap(p.parent_realm_map_id):null;
 const ids=s.location_ids||[],places=ids.map(getLoc).filter(Boolean);
 const rows=places.map((x,i)=>{const k=x.kind==="town"?"town":x.kind==="dungeon"?"dungeon":"wild";return node((i===0?"✦ ":"")+x.name,(k==="town"?"城鎮":k==="dungeon"?"地下城":"野外")+"｜"+exploreState(x.id),call(k==="town"?"xuTown":"xuLocation",x.id),k+" explore-"+exploreState(x.id))}).join("");
 const lines=[];places.forEach(x=>(x.links||[]).forEach(e=>{if(ids.includes(e.to))lines.push(e.to)}));
 const content='<div class="xu-area-caption"><b>'+esc(s.name)+'</b><span>'+esc(s.role||"當地道路與探索地點")+'</span></div><div class="xu-area-paths">'+lines.map(()=>'<i class="xu-route-line"></i>').join("")+'</div><div class="xu-node-grid">'+rows+'</div><div class="xu-map-footer">選擇城鎮進入街廓；野外和地下城會顯示正確地點資訊與道路。</div>';
 showModal(s.name+"・當地區域",frame(s.name,(r?crumb("王國／政體",call("xuRealm",r.id)):"")+(p?crumb("行省",call("xuProvince",p.id)):"")+crumb("當地區域",call("xuLocal",s.id)),board("local",content)),p?call("xuProvince",p.id):call("xuWorld",""));
}
function locationMap(id){
 const l=getLoc(id);if(!l)return world();if(l.kind==="town")return town(id);const s=areaOf(id),d=l.kind==="dungeon";
 const links=(l.links||[]).map(e=>{const t=getLoc(e.to);return t?node(t.name,(e.hours||"—")+" 小時",call("xuLocation",t.id),t.kind):""}).join("");
 const terrainText=[l.name,l.description,l.summary,s&&s.name].join(" ");
 const terrain=d?(/墓|陵|墳|沉砂|遺跡|廢墟|古城/.test(terrainText)?"crypt":/水|潮|淹|河/.test(terrainText)?"flooded-vault":"vault"):/海|港|灘|海岸/.test(terrainText)?"coast":/沼|濕地|泥灘|鹽潮/.test(terrainText)?"marsh":/草原|平原|原野/.test(terrainText)?"grassland":/山|峰|嶺|峽|雪/.test(terrainText)?"mountain":/河|湖|溪|水道/.test(terrainText)?"river":"forest";
 const content='<div class="xu-site-card"><span class="xu-site-kicker">'+(d?"地下城・入口示意":"野外・探索示意")+'</span><h4>'+esc(l.name)+'</h4><p>'+esc(l.description||l.summary||"依既有地點資料探索周邊環境。")+'</p><button type="button" class="xu-site-action" onclick="'+esc(call("openMapLocationDetail",l.id))+'">開啟地點資料／探索</button></div><div class="xu-node-grid xu-site-routes">'+links+'</div><div class="xu-map-footer">示意沿用已登錄地點和道路，不新增房間、任務或事件。</div>';
 showModal(l.name+(d?"・地下城":"・野外"),frame(l.name,(s?crumb("當地區域",call("xuLocal",s.id)):"")+crumb(d?"地下城":"野外",call("xuLocation",l.id)),board(d?("dungeon-site terrain-"+terrain):("wild-site terrain-"+terrain),content,terrain)),s?call("xuLocal",s.id):call("xuWorld",""));
}
function town(id){
 const l=getLoc(id);if(!l)return world();const s=areaOf(id),p=s&&typeof provinceRegion==="function"?provinceRegion(s.parent_province_region_id):null,r=p&&typeof realmRegionMap==="function"?realmRegionMap(p.parent_realm_map_id):null;
 const icons={guild:"⚔",general:"◆",blacksmith:"⚒",tavern:"♨",inn:"⌂",church:"✦"};
 const labels={guild:"冒險者公會",general:"商鋪",blacksmith:"鐵匠鋪",tavern:"酒館",inn:"旅館",church:"教會"};
 const fac=(l.facilities||[]).map(fid=>{const f=DB.facilities&&DB.facilities[fid];return f?'<button type="button" class="xu-facility '+fid+'" onclick="'+esc(call("xuFacility",fid))+'"><span class="xu-facility-icon">'+(icons[fid]||"◆")+'</span><b>'+esc(labels[fid]||f.name||fid)+'</b><small>交易／對話／情報</small></button>':""}).join("");
 const routes=(l.links||[]).map(e=>{const t=getLoc(e.to);return t?node(t.name,(e.hours||"—")+" 小時",call(t.kind==="town"?"xuTown":"xuLocation",t.id),"route"):""}).join("");
 const content='<div class="xu-town-board"><div class="xu-town-title"><b>'+esc(l.name)+'</b><small>'+esc(l.size||"聚落")+'</small></div><div class="xu-town-street street-a"></div><div class="xu-town-street street-b"></div><div class="xu-town-center"></div><div class="xu-facility-grid">'+fac+'</div><div class="xu-town-routes">'+routes+'</div><div class="xu-map-footer">點選公會、商鋪、酒館、旅館或教會開啟互動。</div></div>';
 showModal(l.name+"・城鎮地圖",frame(l.name,(r?crumb("王國／政體",call("xuRealm",r.id)):"")+(p?crumb("行省",call("xuProvince",p.id)):"")+(s?crumb("當地區域",call("xuLocal",s.id)):"")+crumb("城鎮",call("xuTown",l.id)),content),s?call("xuLocal",s.id):call("xuWorld",""));
}
function current(){const c=typeof mapHierarchyForLocation==="function"?mapHierarchyForLocation():{};if(c.location&&c.location.kind==="town")return town(c.location.id);if(c.location&&(c.location.kind==="wild"||c.location.kind==="dungeon"))return locationMap(c.location.id);if(c.settlement)return local(c.settlement.id);if(c.province)return province(c.province.id);if(c.realm)return realm(c.realm.id);return world()}
window.xuWorld=world;window.xuRealm=realm;window.xuProvince=province;window.xuLocal=local;window.xuLocation=locationMap;window.xuTown=town;
window.openMap=current;window.openWorldMapHierarchy=world;window.openRealmRegionMap=realm;window.openProvinceRegionMap=province;window.openSettlementRegionMap=local;
})();