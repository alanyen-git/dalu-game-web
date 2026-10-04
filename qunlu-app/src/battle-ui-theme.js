(()=>{"use strict";
const sprite="./assets/art/battle-sd-portraits.svg#";
const make=(tag,cls)=>{const el=document.createElement(tag);if(cls)el.className=cls;return el};
const pick=(text,fallback="warrior")=>{const s=String(text||"");if(/魔法|術士|法師|巫師|咒術|mage|wizard/i.test(s))return"mage";if(/治療|牧師|祭司|僧侶|healer|priest/i.test(s))return"healer";if(/弓|射手|刺客|盜賊|遊俠|scout|rogue|archer/i.test(s))return"scout";if(/怪物|魔物|魔獸|敵人|獸|龍|monster|beast|dragon/i.test(s))return"monster";return fallback};
function portrait(type){const box=make("span","xuan-sd-portrait");box.setAttribute("aria-hidden","true");const svg=document.createElementNS("http://www.w3.org/2000/svg","svg");svg.setAttribute("viewBox","0 0 128 160");svg.setAttribute("focusable","false");const use=document.createElementNS("http://www.w3.org/2000/svg","use");use.setAttribute("href",sprite+type);svg.appendChild(use);box.appendChild(svg);return box}
function wrapUnit(unit,type,extra=""){if(!unit||unit.querySelector(".xuan-sd-portrait"))return;unit.classList.add("xuan-unit-card",extra);const avatar=portrait(type),info=make("div","xuan-unit-info");unit.insertBefore(avatar,unit.firstChild);while(unit.childNodes.length>1)info.appendChild(unit.childNodes[1]);unit.appendChild(info)}
function miniPortrait(unit,type){if(unit&&!unit.querySelector(".xuan-sd-portrait"))unit.insertBefore(portrait(type),unit.firstChild)}
function decorate(){
 const back=document.getElementById("battleBack"),box=back?.querySelector(".battlebox"),body=document.getElementById("battleBody");if(!box||!body)return;box.classList.add("xuan-battlebox");
 const head=body.querySelector(".battlehead");
 if(head&&!head.dataset.xuanStyled){
  const player=head.querySelector(":scope > .battleunit:not(.enemy):not(.companion)"),party=head.querySelector(":scope > .party-battle-strip"),comp=head.querySelector(":scope > .battleunit.companion"),vs=head.querySelector(":scope > .battleversus"),enemy=head.querySelector(":scope > .battleunit.enemy");
  const allies=make("section","xuan-battle-side xuan-allies");allies.setAttribute("aria-label","我方隊伍");const allyTitle=make("div","xuan-side-heading");allyTitle.innerHTML="<span>我方</span><small>隊伍狀態</small>";allies.appendChild(allyTitle);
  const foes=make("section","xuan-battle-side xuan-foes");foes.setAttribute("aria-label","敵方隊伍");const foeTitle=make("div","xuan-side-heading");foeTitle.innerHTML="<span>敵方</span><small>目標狀態</small>";foes.appendChild(foeTitle);
  if(player){const cls=player.querySelector(".small")?.textContent||"";wrapUnit(player,pick(cls),"xuan-main-unit xuan-player-unit");allies.appendChild(player)}
  if(party){party.classList.add("xuan-party-strip");party.querySelectorAll(".party-mini").forEach((unit,index)=>miniPortrait(unit,pick(unit.querySelector("span")?.textContent,["warrior","mage","scout","healer"][index%4])));allies.appendChild(party)}
  if(comp){wrapUnit(comp,"familiar","xuan-companion-unit");allies.appendChild(comp)}
  if(vs)vs.setAttribute("aria-hidden","true");
  if(enemy){wrapUnit(enemy,pick(enemy.querySelector(".small")?.textContent,"monster"),"xuan-enemy-unit");const stage=make("div","xuan-enemy-field");stage.appendChild(enemy);foes.appendChild(stage)}
  head.replaceChildren(allies,vs||make("div","battleversus"),foes);head.classList.add("xuan-battle-head");head.dataset.xuanStyled="true";
 }
 const actions=body.querySelector(".battleactions");if(actions&&!actions.previousElementSibling?.classList.contains("xuan-command-heading")){const title=make("div","xuan-command-heading");title.textContent="戰鬥命令";actions.parentNode.insertBefore(title,actions)}
}
const target=document.getElementById("battleBody");if(target){new MutationObserver(decorate).observe(target,{childList:true});decorate()}
})();