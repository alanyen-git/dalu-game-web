(()=>{"use strict";
const portraits=[
 {id:"guild",keys:/公會|委託|任務|冒險者/},
 {id:"merchant",keys:/商鋪|商店|交易|材料|背包|道具/},
 {id:"ranger",keys:/野外|森林|採集|奇遇|探索|地城/},
 {id:"artisan",keys:/鐵匠|鍛造|製作|裝備|工坊/},
 {id:"scholar",keys:/教會|信仰|歷史|情報|研究/},
 {id:"traveler",keys:/人物|對話|角色|旅人|NPC/}
];
const modal=document.querySelector("#modalBack"),body=document.querySelector("#modalBody");
if(!modal||!body)return;
function update(){
 const title=document.querySelector("#modalTitle")?.textContent||"";
 const text=(title+" "+body.textContent).slice(0,2500);
 const target=portraits.find(x=>x.keys.test(text));
 let frame=body.querySelector(":scope > .art-dialogue-portrait");
 if(!target){if(frame)frame.remove();return}
 if(frame?.dataset.portrait===target.id)return;
 if(frame)frame.remove();
 frame=document.createElement("div");frame.className="art-dialogue-portrait";frame.dataset.portrait=target.id;
 frame.setAttribute("role","img");frame.setAttribute("aria-label",title+"人物插畫");
 const svg=document.createElementNS("http://www.w3.org/2000/svg","svg");svg.setAttribute("viewBox","0 0 120 144");svg.setAttribute("focusable","false");
 const use=document.createElementNS("http://www.w3.org/2000/svg","use");use.setAttribute("href","./assets/art/npc-portrait-sprites.svg#"+target.id);svg.appendChild(use);frame.appendChild(svg);
 body.insertBefore(frame,body.firstChild);
}
new MutationObserver(()=>requestAnimationFrame(update)).observe(body,{childList:true,subtree:true,characterData:true});
new MutationObserver(()=>requestAnimationFrame(update)).observe(document.querySelector("#modalTitle"),{childList:true,subtree:true,characterData:true});
update();
})();