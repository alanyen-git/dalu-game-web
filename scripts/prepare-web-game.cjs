const fs = require("node:fs/promises");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const source = path.join(root, "qunlu-app");
const web = path.join(root, "www");
const game = path.join(web, "game");

async function copyTree(from, to) {
  await fs.mkdir(to, { recursive: true });
  for (const entry of await fs.readdir(from, { withFileTypes: true })) {
    const src = path.join(from, entry.name);
    const dst = path.join(to, entry.name);
    if (entry.isDirectory()) await copyTree(src, dst);
    else await fs.copyFile(src, dst);
  }
}

async function main() {
  const version = JSON.parse(await fs.readFile(path.join(source, "version.json"), "utf8"));
  if (!String(version.version || "").startsWith("CURRENT-")) throw new Error("異界旅人版本格式錯誤");

  // Always start from an empty web artifact. This physically removes the old /play/ game.
  await fs.rm(web, { recursive: true, force: true });
  await fs.mkdir(web, { recursive: true });
  await copyTree(source, game);

  const gameIndexPath = path.join(game, "index.html");
  let html = await fs.readFile(gameIndexPath, "utf8");
  html = html.replace("<body>", '<body class="web2">');
  html = html.replace(/<div class="journey-hero"[\s\S]*?<\/div>\s*<\/div>\s*(?=<div class="hud-meta)/, "");
  html = html.replace(
    '<link rel="stylesheet" href="assets/css/polish-v1.css">',
    '<link rel="stylesheet" href="assets/css/polish-v1.css"><link rel="stylesheet" href="assets/css/web-v2.css">'
  );
  html = html.replace(
    /<div class="journey-hero"[\s\S]*?<\/div>\s*<\/div>\s*(?=<div class="hud-meta)/,
    `<section class="web2-command" aria-label="異界旅人 WEB 2.0 冒險指揮台">
      <div class="web2-kicker">異界旅人・WEB 2.0</div>
      <div class="web2-command-row">
        <div><h1>冒險指揮台</h1><p>APP 核心同步・獨立網頁介面・本機存檔</p></div>
        <div class="web2-build">${version.version}</div>
      </div>
      <div class="web2-chips">
        <span>戰鬥核心 ×2</span><span>100 職業立繪</span><span>214 怪物立繪</span><span>新 WEB 介面</span>
      </div>
    </section>`
  );  await fs.writeFile(gameIndexPath, html);

  const webCss = `
body.web2{
  --web2-gold:#d9b35b;--web2-gold-soft:#f4dea4;--web2-ink:#11100d;--web2-panel:#171713;--web2-panel2:#232017;
  min-height:100dvh;background:
    radial-gradient(circle at 50% -10%,#44351f 0,transparent 34rem),
    linear-gradient(180deg,#100f0c 0,#18150f 42%,#0e0e0c 100%)!important;
  color:#f5ecd5!important;
}
body.web2 .top{position:sticky;top:0;z-index:30;background:#11100df2!important;border-bottom:1px solid #d9b35b88!important;box-shadow:0 8px 28px #0009!important;backdrop-filter:blur(12px)}
body.web2 .topin{max-width:1180px!important;padding:12px 18px!important}
body.web2 .top-brand .title{font-size:24px!important;letter-spacing:.12em;color:#fff4d6!important}
body.web2 .top-subtitle{color:#bcae8f!important}
body.web2 .wrap{max-width:1180px!important;padding:14px 14px 110px!important}
body.web2 .panel{background:linear-gradient(180deg,#1a1914 0,#12120f 100%)!important;border:1px solid #d9b35b55!important;border-radius:18px!important;box-shadow:0 22px 60px #0008,inset 0 1px 0 #ffffff0d!important}
body.web2 .creation-shell{max-width:900px;margin:0 auto!important}
body.web2 .game-shell{display:block!important;padding:14px!important}
body.web2 .game-shell.hide{display:none!important}


body.web2 .hud-meta{display:grid!important;grid-template-columns:repeat(3,1fr)!important;gap:8px!important;margin:0 0 12px!important}
body.web2 .hud-meta-item{min-height:64px;padding:10px 12px!important;border:1px solid #d9b35b38!important;border-radius:12px!important;background:#0f1110!important}
body.web2 .hud-meta-item .small{color:#9c927d!important;font-size:10px!important;letter-spacing:.08em}
body.web2 .hud-meta-item>div:last-child{margin-top:4px;color:#fff3cf!important;font-weight:800}
body.web2 .hud-section{margin:0 0 12px!important;padding:0!important}
body.web2 #statusSummary{padding:12px!important;border:1px solid #ffffff10;border-radius:12px;background:#171813!important}
body.web2 .journal-section,body.web2 .play-section{margin-top:12px!important;padding:14px!important;border:1px solid #d9b35b28!important;border-radius:14px!important;background:linear-gradient(180deg,#15150f,#10110f)!important}
body.web2 .section-title{border-bottom:1px solid #d9b35b20!important;padding-bottom:9px!important;margin-bottom:10px!important}
body.web2 .section-title h3{margin:0!important;color:#f4dea4!important;font-size:17px!important;letter-spacing:.08em}
body.web2 .journal-log{min-height:160px!important;max-height:34dvh!important;border:1px solid #ffffff0d!important;border-radius:12px!important;background:#090b09!important}
body.web2 .actions button,body.web2 button{border-color:#d9b35b55!important}
body.web2 .actions button.primary,body.web2 button.primary{background:linear-gradient(180deg,#6b542a,#46351d)!important;color:#fff2cc!important}
body.web2 .nav{background:#0c0f0edb!important;border-top:1px solid #d9b35b55!important;box-shadow:0 -12px 30px #0009!important;backdrop-filter:blur(14px)}
body.web2 .navin{max-width:760px!important}
body.web2 .nav button{background:transparent!important;border:0!important;color:#c9bea5!important}
body.web2 .nav button.active{background:#d9b35b18!important;color:#ffe7a4!important;box-shadow:inset 0 2px 0 #d9b35b!important}
body.web2 .navico{color:#d9b35b!important}

body.web2 .battleback{background:#070806f5!important}
body.web2 .modal{border-color:#d9b35b55!important}

@media(min-width:860px){
  body.web2 .game-shell{display:grid!important;grid-template-columns:minmax(0,1.2fr) minmax(320px,.8fr);gap:14px}
  body.web2 .game-shell.hide{display:none!important}
  body.web2 .hud-meta,body.web2 .hud-section{grid-column:1/-1}
  body.web2 .journal-section{grid-column:1}
  body.web2 .play-section{grid-column:2;margin-top:12px!important}
}
@media(max-width:520px){
  body.web2 .wrap{padding:10px 8px 102px!important}
  body.web2 .panel{border-radius:0!important;border-left:0!important;border-right:0!important}
  body.web2 .hud-meta{gap:5px!important}
  body.web2 .hud-meta-item{padding:8px!important;min-height:58px}
}
`;
  await fs.writeFile(path.join(game, "assets", "css", "web-v2.css"), webCss);

  const rootRedirect = `<!doctype html>
<html lang="zh-Hant"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="Cache-Control" content="no-store, no-cache, must-revalidate">
<meta http-equiv="Pragma" content="no-cache"><meta http-equiv="Expires" content="0">
<title>異界旅人 WEB 2.0</title>
<style>html,body{height:100%;margin:0;background:#11100d;color:#f4e6bd;font-family:system-ui,-apple-system,"Noto Sans TC",sans-serif}body{display:grid;place-items:center;text-align:center}.box{padding:28px}.mark{color:#d9b35b;font-size:12px;font-weight:900;letter-spacing:.18em}.v{margin-top:10px;color:#f4dea4;font-weight:800}</style>
</head><body><div class="box"><div class="mark">異界旅人・WEB 2.0</div><h1>正在建立全新冒險介面</h1><div>清除舊網頁遊戲與快取後進入新版本</div><div class="v">${version.version}</div></div>
<script>
(async()=>{
  try{
    if("serviceWorker" in navigator){
      const regs=await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map(r=>r.unregister()));
    }
    if("caches" in window){
      const keys=await caches.keys();
      await Promise.all(keys.map(k=>caches.delete(k)));
    }
  }catch(e){}
  location.replace("./game/?build="+encodeURIComponent("${version.version}")+"&t="+Date.now());
})();
</script></body></html>`;

  await fs.writeFile(path.join(web, "index.html"), rootRedirect);
  await fs.writeFile(path.join(web, "version.json"), JSON.stringify({
    game:"異界旅人",
    version:version.version,
    web_entry:"game/",
    legacy_play_removed:true,
    legacy_root_removed:true
  }, null, 2) + "\n");
  await fs.writeFile(path.join(web, "web-build.json"), JSON.stringify({
    game:"異界旅人",
    version:version.version,
    source:"qunlu-app",
    interface:"WEB-2.0",
    entry:"game/",
    clean_rebuild:true,
    legacy_play_removed:true,
    legacy_web_removed:true,
    cache_reset_redirect:true,
    source_commit:process.env.GITHUB_SHA || null
  }, null, 2) + "\n");

  console.log("Deleted old /play/ game and built 異界旅人 WEB 2.0 at /game/ " + version.version);
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
