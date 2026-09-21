import { copyFile, mkdir, readdir } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const output = new URL("dist/", root);
const assets = [
  "index.html",
  "styles.css",
  "app.js",
  "ai-coach.js",
  "routine-planner.js",
  "workout-journal.js"
];

await mkdir(output, { recursive: true });
const existing = await readdir(output, { withFileTypes: true });
if (existing.some((entry) => !entry.isFile() || !assets.includes(entry.name))) {
  throw new Error("dist contains unexpected files. Review them before building.");
}
await Promise.all(assets.map((asset) => copyFile(new URL(asset, root), new URL(asset, output))));
console.log(`Built ${assets.length} public assets in dist/.`);
