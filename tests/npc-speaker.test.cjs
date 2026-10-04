const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const source=fs.readFileSync(path.join(__dirname,"../qunlu-app/src/npc-speaker.js"),"utf8");
const state={worldState:{},character:{locationId:"L-WILLOW"}};
const calls=[];
const sandbox={DB:{locations:[{id:"L-WILLOW",world_region_id:"REG-18"}],regional_npc_archetypes:[
 {id:"NPC-ARCH-18-02",region_id:"REG-18",facility_affinity:"general",culture_id:"CUL-018",role:"行商與工匠中介"},
 {id:"NPC-ARCH-18-06",region_id:"REG-18",facility_affinity:"general",culture_id:"CUL-018",role:"農牧、礦工、船工或普通居民"}
]},G:state,window:{},generateWorldName:(type,culture,context)=>{calls.push({type,culture,usedNames:context.usedNames});return "艾洛恩"},persist:()=>calls.push("persist")};
vm.runInNewContext(source,sandbox);
const resolve=sandbox.window.resolveRegionalNpcSpeaker;
const first=resolve("general","雜貨鋪常駐人員","L-WILLOW");
assert.equal(first.id,"NPC-ARCH-18-02");
assert.equal(first.name,"艾洛恩");
assert.equal(first.role,"行商與工匠中介");
const second=resolve("general","商店服務人員","L-WILLOW");
assert.equal(second.name,"艾洛恩");
assert.equal(calls.filter(x=>typeof x==="object").length,1,"speaker name must generate once and persist across modal visits");
assert.equal(state.worldState.namedDialogueNpcNames[first.id],"艾洛恩");
assert.equal(calls.at(-1),"persist");
console.log("Regional dialogue speakers use source archetypes and persist one culturally scoped generated name.");

const unconfigured={DB:{locations:[{id:"L-ISLAND",world_region_id:"REG-10"}],regional_npc_archetypes:[{id:"NPC-ARCH-10-01",region_id:"REG-10",facility_affinity:"guild",culture_id:"CUL-010",role:"船團文書"}]},G:{worldState:{}},window:{},generateWorldName:()=>{throw new Error("unsupported culture must not use a fallback name")}};
vm.runInNewContext(source,unconfigured);
assert.equal(unconfigured.window.resolveRegionalNpcSpeaker("guild","公會常駐人員","L-ISLAND"),null);
assert.deepEqual(unconfigured.G.worldState.namedDialogueNpcNames,undefined);
