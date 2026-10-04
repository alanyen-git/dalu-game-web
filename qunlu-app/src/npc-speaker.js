(()=>{"use strict";
const namingProfiles={"CUL-001":"asdale_west","CUL-002":"valrek_imperial","CUL-003":"asdale_west","CUL-004":"asdale_west","CUL-005":"free_city","CUL-006":"free_city","CUL-007":"free_city","CUL-008":"free_city","CUL-009":"free_city","CUL-011":"asdale_west","CUL-012":"elven","CUL-013":"dwarven","CUL-014":"beast_steppe","CUL-015":"beast_steppe","CUL-016":"beast_steppe","CUL-017":"valrek_imperial","CUL-018":"asdale_west","CUL-019":"free_city","CUL-020":"dark_elf"};
function resolve(facilityId,speakerRole,locationId){
 if(typeof DB!=="object"||!DB||typeof G==="undefined"||!G?.worldState)return null;
 const location=(DB.locations||[]).find(x=>x.id===locationId);if(!location)return null;
 const regionId=location.world_region_id||location.region_id;if(!regionId)return null;
 const candidates=(DB.regional_npc_archetypes||[]).filter(x=>x.region_id===regionId&&x.facility_affinity===facilityId);
 if(!candidates.length)return null;
 const role=String(speakerRole||"");
 let archetype=null;
 if(facilityId==="general"&&/商鋪|商店|雜貨|商人|交易/.test(role))archetype=candidates.find(x=>/行商|工匠/.test(x.role||""));
 if(!archetype&&facilityId==="general"&&/農|居民|村民/.test(role))archetype=candidates.find(x=>/農牧|普通居民/.test(x.role||""));
 archetype=archetype||candidates[0];
 const profile=namingProfiles[archetype.culture_id];if(!profile||typeof generateWorldName!=="function")return null;
 const state=G.worldState,registry=state.namedDialogueNpcNames&&typeof state.namedDialogueNpcNames==="object"?state.namedDialogueNpcNames:(state.namedDialogueNpcNames={});
 let name=registry[archetype.id];
 if(!name){
  try{name=generateWorldName("person",profile,{usedNames:Object.values(registry)})}catch(e){return null}
  if(!name)return null;
  registry[archetype.id]=String(name);
  if(typeof persist==="function")try{persist()}catch(e){}
 }
 return {id:archetype.id,name:String(name),role:archetype.role,regionId,cultureId:archetype.culture_id};
}
if(typeof window!=="undefined")window.resolveRegionalNpcSpeaker=resolve;
})();