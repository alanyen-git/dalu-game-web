const fs = require("node:fs/promises");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const source = path.join(root, "qunlu-app");
const web = path.join(root, "www");

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
  await fs.access(path.join(source, "source-lock.json"));
  await fs.rm(web, { recursive: true, force: true });
  await copyTree(source, web);
  const rootAssets = path.join(root, "assets", "art");
  const appAssets = path.join(web, "assets", "art");
  await fs.mkdir(appAssets, { recursive: true });
  for (const file of ["app-icon-192.png", "app-icon-512.png"]) {
    await fs.copyFile(path.join(rootAssets, file), path.join(appAssets, file));
  }
  console.log("Prepared independent Qunlu-derived mobile app in www/");
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
