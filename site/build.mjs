// Builds the website https://world.squeekpulse.xyz (Cloudflare Pages project
// squeek-world) into dist/, or into the folder given as the first argument:
// everything in public/ as it is (the World page at the root, its not-found
// page, response headers and icon), one stylesheet, one script (this page and
// the game, minified) and only the fonts and sprites the World uses. The game
// comes from dist-game/squeek-world.js, so run `npm run build:game` first, or
// simply `npm run build`. `npm run deploy` and the GitHub workflow upload dist/.
import { build } from "esbuild";
import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SITE = fileURLToPath(new URL(".", import.meta.url));
const OUT = resolve(process.argv[2] ?? resolve(SITE, "../dist"));
const STYLES = ["src/styles.css", "src/pet-page.css", "src/world-page.css"];
const site = (path) => resolve(SITE, path);

await rm(OUT, { recursive: true, force: true });
await mkdir(`${OUT}/assets`, { recursive: true });
await build({
  entryPoints: [site("src/world-page.js")],
  bundle: true,
  minify: true,
  format: "esm",
  outfile: `${OUT}/world.js`,
  target: ["es2022"],
  legalComments: "eof",
});
await cp(site("public"), OUT, { recursive: true });
await writeFile(`${OUT}/styles.css`, (await Promise.all(STYLES.map((path) => readFile(site(path), "utf8")))).join("\n"));
for (const folder of ["fonts", "pet"]) await cp(site(`assets/${folder}`), `${OUT}/assets/${folder}`, { recursive: true });
console.log(`Built ${OUT} (Squeek Pet World for Cloudflare Pages, static, no runtime dependencies).`);
