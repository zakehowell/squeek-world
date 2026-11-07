import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { SPRITES } from "../src/wheel-art.js";

const SITE = fileURLToPath(new URL("..", import.meta.url));
const REPO = join(SITE, "..");
/** A file of the website (site/...). */
const read = (path) => readFileSync(join(SITE, path), "utf8");
/** A file at the repository's root. */
const repo = (path) => readFileSync(join(REPO, path), "utf8");
const csp = (html) => html.match(/Content-Security-Policy"\s+content="([^"]+)"/)?.[1] ?? "";
const files = (dir) =>
  readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => relative(dir, join(entry.parentPath ?? entry.path, entry.name)))
    .sort();

/** public/_headers as { pattern: { header: value } }, in file order. */
function headerRules(text) {
  const rules = {};
  let current = null;
  for (const line of text.split("\n")) {
    if (!line.trim() || line.startsWith("#")) continue;
    if (!/^\s/.test(line)) {
      current = rules[line.trim()] = {};
      continue;
    }
    const at = line.indexOf(":");
    current[line.slice(0, at).trim()] = line.slice(at + 1).trim();
  }
  return rules;
}

test("Squeek Pet World builds into a static site with only what it uses", () => {
  const out = mkdtempSync(join(tmpdir(), "squeek-world-"));
  try {
    // As `npm run build` runs it, after `npm run build:game`.
    execFileSync(process.execPath, ["site/build.mjs", out], { cwd: REPO, stdio: "pipe" });
    const built = files(out);
    const folder = (name) => readdirSync(join(SITE, "assets", name)).sort().map((file) => `assets/${name}/${file}`);
    const pub = files(join(SITE, "public"));
    for (const file of ["404.html", "_headers", "index.html", "world.svg"]) assert.ok(pub.includes(file), `public/${file}`);
    assert.deepEqual(built, [...pub, ...folder("fonts"), ...folder("pet"), "styles.css", "world.js"].sort(), "public/ as it is, the fonts and sprites, one stylesheet, one script");
    for (const page of ["index.html", "404.html"]) {
      const html = readFileSync(join(out, page), "utf8");
      for (const [, path] of html.matchAll(/(?:src|href)="\/([^"]*)"/g)) if (path) assert.ok(built.includes(path), `${page} asks for /${path}`);
      assert.doesNotMatch(html, /(?:src|href)="\.\.?\//, `${page} uses root paths, so any URL on the site finds its files`);
    }
    const styles = readFileSync(join(out, "styles.css"), "utf8");
    for (const [, path] of styles.matchAll(/url\("\.\/([^"]+)"\)/g)) assert.ok(built.includes(path), path);
    assert.match(styles, /\.world-hero \{/);
    assert.match(styles, /\.world-missing \{/);
    assert.match(styles, /\.world-top \{/, "the World's own top bar");
    for (const { src } of Object.values(SPRITES)) assert.ok(built.includes(src), src);
    const bundle = readFileSync(join(out, "world.js"), "utf8");
    assert.match(bundle, /Squeek Pet World [\d.]+ \(squeek-world (?:[0-9a-f]{7,40}(?:-dirty)?|unknown)\), MIT License/, "the game's licence banner, naming the commit, survives the build");
    assert.match(bundle, /attachShadow/, "the game itself is in the bundle");
    assert.match(bundle, /https:\/\/squeekpulse\.xyz\//, "links back to the main site");
  } finally {
    rmSync(out, { recursive: true, force: true });
  }
});

test("the World's response headers repeat its page policy and forbid framing", () => {
  const text = read("public/_headers");
  const rules = headerRules(text);
  assert.deepEqual(Object.keys(rules), ["/*", "https://:project.pages.dev/*", "https://:version.:project.pages.dev/*"]);
  const all = rules["/*"];
  assert.equal(all["Content-Security-Policy"], `${csp(read("public/index.html"))}; frame-ancestors 'none'`);
  assert.equal(all["X-Frame-Options"], "DENY");
  assert.match(all["Strict-Transport-Security"], /^max-age=\d{8,}$/);
  assert.match(all["Permissions-Policy"], /^camera=\(\), microphone=\(\), geolocation=\(\)/);
  assert.equal(all["X-Content-Type-Options"], "nosniff", "as on squeekpulse.xyz");
  assert.equal(all["Referrer-Policy"], "strict-origin-when-cross-origin", "as on squeekpulse.xyz");
  for (const host of ["https://:project.pages.dev/*", "https://:version.:project.pages.dev/*"]) assert.deepEqual(rules[host], { "X-Robots-Tag": "noindex" }, "only world.squeekpulse.xyz is indexed");
  assert.ok(text.split("\n").every((line) => line.length <= 2000), "Cloudflare reads lines up to 2,000 characters");
});

test("the World's not-found page runs no script and leads back to the game", () => {
  const html = read("public/404.html");
  assert.doesNotMatch(html, /<script/);
  assert.match(csp(html), /script-src 'none'/);
  assert.match(csp(html), /connect-src 'none'/);
  assert.match(html, /<meta name="robots" content="noindex" \/>/);
  assert.match(html, /<a class="button" href="\/">/);
  assert.match(html, /<p lang="zh-CN">/);
});

test("npm run deploy and the GitHub workflow test everything, then upload dist/ to the squeek-world project's production branch", () => {
  const { scripts, devDependencies } = JSON.parse(repo("package.json"));
  assert.equal(scripts["build:game"], "vite build --config vite.game.config.ts");
  assert.equal(scripts.test, "vitest run && npm run build:game && node --test site/tests/*.test.js");
  assert.equal(scripts.build, "npm run typecheck && npm run build:game && node site/build.mjs");
  assert.equal(scripts.deploy, "npm test && npm run build && npx --yes wrangler@4.158.0 pages deploy dist --project-name squeek-world --branch main --commit-dirty=true");
  assert.match(devDependencies.esbuild, /^\d+\.\d+\.\d+$/, "one exact esbuild, so a build is reproducible");
  const workflow = repo(".github/workflows/deploy.yml");
  const job = (name) => workflow.split(/\n  (?=[a-z]+:\n)/).find((part) => part.startsWith(`${name}:\n`)) ?? "";
  assert.match(workflow, /on:\n  push:\n    branches: \[main\]\n  pull_request:\n/, "every pull request and every push to main");
  assert.match(job("site"), /run: npm ci\n\s+- run: npm test\n\s+- run: npm run build\n/, "the game's and the site's tests before the build");
  assert.match(job("contracts"), /working-directory: contracts\n/);
  assert.match(job("contracts"), /run: npm ci\n\s+- run: npm test\n/, "the contracts' tests");
  const deploy = job("deploy");
  assert.match(deploy, /needs: \[site, contracts\]\n/, "nothing is uploaded unless every test passed");
  assert.match(deploy, /if: github\.event_name != 'pull_request' && github\.ref == 'refs\/heads\/main'\n/, "only main deploys");
  assert.match(deploy, /CLOUDFLARE_API_TOKEN: \$\{\{ secrets\.CLOUDFLARE_API_TOKEN \}\}\n\s+CLOUDFLARE_ACCOUNT_ID: \$\{\{ secrets\.CLOUDFLARE_ACCOUNT_ID \}\}\n/);
  assert.match(deploy, /npx --yes wrangler@4\.158\.0 pages deploy dist --project-name=squeek-world --branch=main\n/);
  assert.doesNotMatch(job("site") + job("contracts"), /secrets\./, "the test jobs, which also run for pull requests, get no secret");
  for (const [, action] of workflow.matchAll(/uses: ([^\s]+)/g)) assert.match(action, /@[0-9a-f]{40}$/, `${action} pinned to a commit`);
  const ignored = repo(".gitignore").split(/\r?\n/);
  for (const entry of ["dist/", "dist-game/", ".wrangler/", "node_modules/"]) assert.ok(ignored.includes(entry), entry);
});
