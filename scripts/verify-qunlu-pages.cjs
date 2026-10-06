const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const localVersion = JSON.parse(fs.readFileSync(path.join(root, "www", "game", "version.json"), "utf8"));
const webBuild = JSON.parse(fs.readFileSync(path.join(root, "www", "web-build.json"), "utf8"));

assert.equal(webBuild.version,localVersion.version);
assert.equal(webBuild.entry,"game/");
assert.equal(webBuild.exact_app_mirror,true);
assert.equal(webBuild.ui_transform,false);

const base=process.env.PAGES_URL;
if(!base){console.log("Local App-mirror verification only: "+localVersion.version);process.exit(0)}

const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function text(url){
 const r=await fetch(url,{cache:"no-store",headers:{"Cache-Control":"no-cache"}});
 if(!r.ok)throw new Error(url+" HTTP "+r.status);
 return r.text();
}
async function json(url){return JSON.parse(await text(url))}

(async()=>{
 let last;
 for(let attempt=1;attempt<=20;attempt++){
  try{
   const q="?verify="+Date.now()+"-"+attempt;
   const rv=await json(new URL("version.json"+q,base));
   const gv=await json(new URL("game/version.json"+q,base));
   const rootHtml=await text(new URL(q,base));
   const gameHtml=await text(new URL("game/"+q,base));
   const play=await fetch(new URL("play/"+q,base),{cache:"no-store"});
   assert.equal(rv.version,localVersion.version);
   assert.equal(rv.exact_app_mirror,true);
   assert.equal(gv.version,localVersion.version);
   assert.ok(rootHtml.includes("./game/"));
   assert.ok(!gameHtml.includes("web-v2.css"));
   assert.ok(!gameHtml.includes('class="web2"'));
   assert.ok(!gameHtml.includes("冒險指揮台"));
   assert.ok(!gameHtml.includes("WEB 2.0"));
   assert.ok(!gameHtml.includes("NEW WEB"));
   assert.ok(!gameHtml.includes("web-build-badge"));
   assert.ok(gameHtml.includes("<title>異界旅人 "+localVersion.version+"</title>"));
   const townHome=await text(new URL("game/src/town-home-ui.js"+q,base));
   const runtime=await text(new URL("game/src/runtime.js"+q,base));
   assert.ok(townHome.includes("異界旅人・旅途據點"));
   assert.ok(townHome.includes("當地地圖"));
   assert.ok(townHome.includes("ensureTownHome"));
   assert.ok(runtime.includes('if(typeof window.renderTownHome==="function")window.renderTownHome()'));
   assert.equal(play.status,404);
   console.log("Verified public exact App mirror: "+new URL("game/",base)+" version="+localVersion.version);
   return;
  }catch(e){last=e;console.log("Pages not fresh, attempt "+attempt+": "+e.message);await sleep(3000)}
 }
 throw last;
})().catch(e=>{console.error(e);process.exit(1)});
