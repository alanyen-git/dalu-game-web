(function(){
"use strict";
const esc=v=>String(v==null?"":v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const js=v=>String(v==null?"":v).replace(/\\/g,"\\\\").replace(/'/g,"\\'");
const names={guild:"冒險者公會",general:"商鋪",blacksmith:"鐵匠鋪",tavern:"酒館",inn:"旅館",church:"教會",clinic:"診療所",tailor:"裁縫鋪",alchemy:"煉金工坊",enchanter:"附魔工坊",mageguild:"魔法公會"};
const icons={guild:"⚔",general:"◆",blacksmith:"⚒",tavern:"♨",inn:"⌂",church:"✦",clinic:"✚",tailor:"✂",alchemy:"⚗",enchanter:"◇",mageguild:"✧"};
function facility(id){return DB&&DB.facilities?DB.facilities[id]:null}
function locById(id){return typeof loc==="function"?loc(id):(DB.locations||[]).find(x=>x.id===id)}
function crumb(label,call){return '<button type="button" class="xu-crumb" onclick="'+call+'">'+esc(label)+"</button>"}
function frame(title,crumbs,board){return '<div class="xu-map-shell"><div class="xu-map-head"><div><p class="eyebrow">群陸地圖誌・軒轅式導覽</p><h3>'+esc(title)+'</h3><p class="xu-map-hint">點選地圖節點進入下一層；城鎮設施直接標在平面圖上。</p></div><div class="xu-crumbs">'+crumbs+"</div></div>"+board+"</div>"}
function board(kind,body){return '<div class="xu-board '+kind+'"><div class="xu-compass">N</div><div class="xu-rivers"></div><div class="xu-roads"></div>'+body+"</div>"}
function node(label,meta,call,cl){return '<button type="button" class="xu-map-node '+(cl||"")+'" onclick="'+call+'"><b>'+esc(label)+'</b><small>'+esc(meta||"")+"</small></button>"}
function world(){
 const rows=(DB.realm_region_maps||[]).map(r=>{const p=typeof politicalEntity==="function"?politicalEntity(r.political_entity_id):null;return node(p?p.name:r.name,(r.world_tier||(p&&p.world_tier)||"—")+"｜行省 "+((r.province_region_ids||[]).length),"xuRealm('"+js(r.id)+"')","realm")}).join("");
 showModal("世界地圖",frame("世界地圖",crumb("世界","xuWorld()"),board("world",'<div class="xu-map-title">世界航路</div><div class="xu-node-grid">'+(rows||'<span class="small">尚未登錄區域。</span>')+"</div><div class=\"xu-map-footer\">王國／政體是第一層可進入節點，資料直接沿用群陸世界資料庫。</div>")));
}
function realm(id){
 const r=typeof realmRegionMap==="function"?realmRegionMap(id):null;if(!r)return world();
 const p=typeof politicalEntity==="function"?politicalEntity(r.political_entity_id):null;
 const rows=(r.province_region_ids||[]).map(pid=>{const x=typeof provinceRegion==="function"?provinceRegion(pid):null;return x?node(x.name,(x.world_tier||"—")+"｜"+(x.administrative_type||"行省級區域"),"xuProvince('"+js(x.id)+"')","province"):""}).join("");
 showModal((p?p.name:r.name)+"・王國級地圖",frame(p?p.name:r.name,crumb("世界","xuWorld()")+crumb("王國／政體","xuRealm('"+js(r.id)+"')"),board("realm",'<div class="xu-map-title">'+esc(p?p.name:r.name)+'</div><div class="xu-node-grid">'+(rows||'<span class="small">此區域尚未展開行省。</span>')+"</div><div class=\"xu-map-footer\">行省節點依既有政治體與行政區關聯顯示，不跳級、不虛構。</div>")),"xuWorld()"));
}
function province(id){
 const p=typeof provinceRegion==="function"?provinceRegion(id):null;if(!p)return world();
 const r=typeof realmRegionMap==="function"?realmRegionMap(p.parent_realm_map_id):null;
 function rows(k,label,cl){return (typeof provinceCategoryLocations==="function"?provinceCategoryLocations(p,k,false):[]).slice(0,24).map(x=>node(x.name,(x.tier||"—")+"｜"+label,"xuTown('"+js(x.id)+"')",cl)).join("")}
 const body=rows("town","城鎮","town")+rows("wild","野外","wild")+rows("dungeon","地下城","dungeon");
 showModal(p.name+"・行省地圖",frame(p.display_name||p.name,(r?crumb("王國／政體","xuRealm('"+js(r.id)+"')"):"")+crumb("行省","xuProvince('"+js(p.id)+"')"),board("province",'<div class="xu-map-title">'+esc(p.display_name||p.name)+'</div><div class="xu-node-grid">'+(body||'<span class="small">此行省尚未登錄可探索節點。</span>')+"</div><div class=\"xu-map-footer\">城鎮、野外、地下城均保留既有節點與道路資料。</div>")),(r?"xuRealm('"+js(r.id)+"')":"xuWorld()"));
}
function town(id){
 const l=locById(id);if(!l)return world();
 const c=typeof mapHierarchyForLocation==="function"?mapHierarchyForLocation():{};
 const r=c.realm||null,p=c.province||null;
 const fac=(l.facilities||[]).map(fid=>{const f=facility(fid);if(!f)return "";const label=names[fid]||f.name||fid;return '<button type="button" class="xu-facility '+fid+'" onclick="xuFacility(\\''+js(fid)+'\\')"><span class="xu-facility-icon">'+(icons[fid]||"◆")+'</span><b>'+esc(label)+'</b><small>'+esc(f.shop?"交易／服務":"對話／情報")+'</small></button>';}).join("");
 const routes=(l.links||[]).map(x=>{const t=locById(x.to);return t?node(t.name,(x.hours||"—")+" 小時","xuTown('"+js(t.id)+"')","route"):""}).join("");
 const title=l.name||"城鎮";
 const crumbs=(r?crumb("王國／政體","xuRealm('"+js(r.id)+"')"):"")+(p?crumb("行省","xuProvince('"+js(p.id)+"')"):"")+crumb("城鎮","xuTown('"+js(l.id)+"')");
 const html=frame(title,crumbs,'<div class="xu-town-board"><div class="xu-town-title"><b>'+esc(title)+'</b><small>'+esc(l.size||"聚落")+"｜安全度 "+(l.safety_score==null?"—":l.safety_score)+"/100</small></div><div class=\"xu-town-street street-a\"></div><div class=\"xu-town-street street-b\"></div><div class=\"xu-facility-grid\">"+(fac||'<span class="small">此地尚未登錄設施。</span>')+"</div><div class=\"xu-town-routes\">"+routes+"</div><div class=\"xu-map-footer\">點選設施即可開啟交易、對話或情報視窗；城鎮地圖不離開目前地圖層級。</div></div>");
 showModal(title+"・城鎮地圖",html,p?"xuProvince('"+js(p.id)+"')":"xuWorld()");
}
function facilityModal(id,tab){
 const f=facility(id);if(!f)return;const label=names[id]||f.name||id;const data=f||{};
 const content=tab==="trade"?'<h4>'+esc(label)+'・交易／服務</h4><p class="small">'+esc(data.description||"可依所在地、資格與市場狀態提供服務。")+'</p><div class="actions"><button type="button" class="primary" onclick="xuFacilityTrade(\\''+js(id)+'\\')">進入交易／服務</button></div>':tab==="talk"?'<h4>'+esc(label)+'・對話</h4><p class="small">'+esc(data.npc||data.owner||"店內人物會依所在地與世界狀態回應。")+'</p><div class="actions"><button type="button" onclick="xuFacilityTalk(\\''+js(id)+'\\')">開始對話</button></div>':'<h4>'+esc(label)+'・情報</h4><p class="small">'+esc(data.info||data.description||"可取得所在地、商品、委託與周邊狀態情報。")+'</p>';
 const tabs='<div class=\"xu-tabs\"><button type="button" class="'+(tab==="trade"?"active":"")+'" onclick="xuFacility(\\''+js(id)+'\\',\\'trade\\')">交易／服務</button><button type="button" class="'+(tab==="talk"?"active":"")+'" onclick="xuFacility(\\''+js(id)+'\\',\\'talk\\')">對話</button><button type="button" class="'+(tab==="info"?"active":"")+'" onclick="xuFacility(\\''+js(id)+'\\',\\'info\\')">情報</button></div>';
 showModal(label,tabs+'<div class=\"card xu-facility-panel\">'+content+"</div>","xuTown('"+js((mapHierarchyForLocation()||{}).location?.id||"")+"')");
}
function trade(id){if(typeof visitFacility==="function")return visitFacility(id);if(typeof openInventory==="function")return openInventory();facilityModal(id,"trade")}
function talk(id){facilityModal(id,"talk")}
function worldFromCurrent(){const c=typeof mapHierarchyForLocation==="function"?mapHierarchyForLocation():{};if(c.settlement&&c.location&&c.location.kind==="town")return town(c.location.id);if(c.province)return province(c.province.id);if(c.realm)return realm(c.realm.id);return world()}
window.xuWorld=world;window.xuRealm=realm;window.xuProvince=province;window.xuTown=town;window.xuFacility=(id,tab)=>facilityModal(id,tab||"trade");window.xuFacilityTrade=trade;window.xuFacilityTalk=talk;
window.openMap=worldFromCurrent;window.openWorldMapHierarchy=world;window.openRealmRegionMap=realm;window.openProvinceRegionMap=province;
})();