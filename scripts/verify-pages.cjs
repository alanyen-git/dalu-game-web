const { setTimeout: delay } = require("node:timers/promises");
const expectedVersion = require("../package.json").version;
const expectedSha = process.env.GITHUB_SHA;
const base = process.env.PAGES_URL;

async function main() {
  if (!expectedSha || !/^[a-f0-9]{40}$/.test(expectedSha)) throw new Error("缺少部署提交 SHA");
  if (!base || new URL(base).href !== "https://alanyen-git.github.io/dalu-game-web/") throw new Error("Pages URL 與專案不符");
  for (let attempt = 1; attempt <= 12; attempt++) {
    try {
      const read = async file => {
        const response = await fetch(new URL(file + "?verify=" + expectedSha + "-" + attempt, base), { cache: "no-store", signal: AbortSignal.timeout(15000) });
        if (!response.ok) throw new Error(file + ": HTTP " + response.status);
        return response;
      };
      const [version, build, html] = await Promise.all([
        read("version.json").then(r => r.json()),
        read("build-info.json").then(r => r.json()),
        read("index.html").then(r => r.text())
      ]);
      if (version.version !== expectedVersion || version.slug !== "dalu-game-web" || build.version !== expectedVersion || build.source_commit !== expectedSha || !html.includes("app.js?v=" + expectedVersion)) throw new Error("公開內容尚未與部署提交一致");
      console.log("Pages verified: " + expectedVersion + " @ " + expectedSha);
      return;
    } catch (error) {
      if (attempt === 12) throw error;
      console.log("等待 Pages 更新 (" + attempt + "/12): " + error.message);
      await delay(10000);
    }
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
