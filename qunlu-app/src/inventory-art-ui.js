(()=>{"use strict";
const sprite="./assets/art/item-skill-icons.svg#";
const rules=[
 [/劍|刀|弓|杖|武器|攻擊/,"blade"],[/盔|甲|盾|防具|護具|裝備/,"armor"],[/藥|治療|回復|生命|魔力/,"potion"],[/卷|技能|咒|術式|秘笈/,"scroll"],[/料理|食物|乾糧|肉|魚/,"ration"],[/礦|素材|鍛造|材料|木材/,"ore"],[/晶|寶石|魔核|水晶/,"crystal"],[/鑰匙|鎖|門扉/,"key"],[/火|焰|炎|燃燒/,"fire"],[/水|冰|潮|霜/,"water"],[/風|雷|疾風/,"wind"],[/土|地|石|岩/,"earth"]
];
function iconFor(text){return rules.find(x=>x[0].test(text))?.[1]||"mark"}
function add(host,label){if(!host||host.querySelector(":scope > .art-item-icon"))return;const box=document.createElement("span");box.className="art-item-icon";box.setAttribute("aria-hidden","true");const svg=document.createElementNS("http://www.w3.org/2000/svg","svg");svg.setAttribute("viewBox","0 0 120 120");const use=document.createElementNS("http://www.w3.org/2000/svg","use");use.setAttribute("href",sprite+iconFor(label));svg.appendChild(use);box.appendChild(svg);host.insertBefore(box,host.firstChild)}
function decorate(root=document){root.querySelectorAll(".modalbody .itemrow,.modalbody .skillrow").forEach(el=>add(el,el.textContent||""));root.querySelectorAll(".battleactions button").forEach(el=>add(el,el.textContent||""))}
const modal=document.querySelector("#modalBody"),battle=document.querySelector("#battleBody");
for(const root of [modal,battle])if(root){new MutationObserver(()=>requestAnimationFrame(()=>decorate(root))).observe(root,{childList:true,subtree:true});decorate(root)}
})();