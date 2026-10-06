const fs = require("node:fs/promises");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const source = path.join(root, "qunlu-app");
const web = path.join(root, "www");
const play = path.join(web, "play");

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

  await fs.rm(web, { recursive: true, force: true });
  await fs.mkdir(web, { recursive: true });
  await copyTree(source, play);

  const rootRedirect = `<!doctype html>
<html lang="zh-Hant"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="Cache-Control" content="no-store, no-cache, must-revalidate">
<meta http-equiv="Pragma" content="no-cache"><meta http-equiv="Expires" content="0">
<title>異界旅人・切換新網頁版</title>
<style>html,body{height:100%;margin:0;background:#071014;color:#f4e6bd;font-family:system-ui,-apple-system,"Noto Sans TC",sans-serif}body{display:grid;place-items:center;text-align:center}.box{padding:28px}.v{margin-top:10px;color:#d7bd72;font-weight:800}</style>
</head><body><div class="box"><h1>異界旅人</h1><div>正在移除舊網頁快取並切換到新版本…</div><div class="v">${version.version}</div></div>
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
  location.replace("./play/?build="+encodeURIComponent("${version.version}")+"&t="+Date.now());
})();
</script></body></html>`;

  await fs.writeFile(path.join(web, "index.html"), rootRedirect);
  await fs.writeFile(path.join(web, "version.json"), JSON.stringify({
    game:"異界旅人",
    version:version.version,
    web_entry:"play/",
    legacy_root_removed:true
  }, null, 2) + "\n");
  await fs.writeFile(path.join(web, "web-build.json"), JSON.stringify({
    game:"異界旅人",
    version:version.version,
    source:"qunlu-app",
    entry:"play/",
    clean_rebuild:true,
    legacy_web_removed:true,
    cache_reset_redirect:true,
    source_commit:process.env.GITHUB_SHA || null
  }, null, 2) + "\n");

  console.log("Deleted old web game and built fresh 異界旅人 at /play/ " + version.version);
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
