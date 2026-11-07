// The whitepaper's web version: site/whitepaper/render.mjs writes
// public/whitepaper/index.html (Chinese) and public/whitepaper/en/index.html
// from zh.md and en.md. The committed pages must be what it writes, both
// languages keep one structure, and the pages run no script, ask only for
// files the site has and name the contracts the World actually plays on.
import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { LANGS, PAGE_FILE, PAGE_PATH, parse, readSource, renderPage } from "../whitepaper/render.mjs";
import { FIGURE_ORDER } from "../whitepaper/figures.mjs";
import { WORLD_CHAIN } from "../src/world-chain.js";

const SITE = fileURLToPath(new URL("..", import.meta.url));
const REPO = join(SITE, "..");
const SITE_URL = "https://world.squeekpulse.xyz";
const read = (path) => readFileSync(join(SITE, path), "utf8");
const csp = (html) => html.match(/Content-Security-Policy"\s+content="([^"]+)"/)?.[1] ?? "";
const page = Object.fromEntries(LANGS.map((lang) => [lang, read(PAGE_FILE[lang])]));
const other = (lang) => (lang === "zh" ? "en" : "zh");
const ids = (html) => [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);

test("the committed pages are what render.mjs writes from zh.md and en.md", () => {
  for (const lang of LANGS) assert.equal(page[lang], renderPage(lang), `site/${PAGE_FILE[lang]} is out of date: run node site/whitepaper/render.mjs`);
});

/** A block without its words: its kind and size. */
const shape = (b) =>
  b.type === "table" ? `table ${b.head.length}x${b.body.length}` : b.type === "figure" ? `figure ${b.name}` : b.items ? `${b.type} ${b.items.length}` : b.type;
/** A source's outline: chapters, sections and the shape of every block. */
const outline = (doc) =>
  doc.chapters.map((ch) => ({ id: ch.id, blocks: ch.blocks.map(shape), sections: ch.sections.map((s) => ({ id: s.id, blocks: s.blocks.map(shape) })) }));

test("the Chinese and English sources keep one structure: a summary, ten chapters, four appendices and four figures", () => {
  const zh = parse(readSource("zh"));
  const en = parse(readSource("en"));
  assert.deepEqual(outline(en), outline(zh));
  const chapters = ["summary", ...Array.from({ length: 10 }, (_, i) => `s${i + 1}`), ...["a", "b", "c", "d"].map((x) => `appendix-${x}`)];
  assert.deepEqual(zh.chapters.map((ch) => ch.id), chapters);
  const figures = zh.chapters.flatMap((ch) => [...ch.blocks, ...ch.sections.flatMap((s) => s.blocks)]).filter((b) => b.type === "figure");
  assert.deepEqual(figures.map((b) => b.name), FIGURE_ORDER, "each figure once, numbered in reading order");
  assert.match(zh.version, /^版本 1\.0 · /);
  assert.match(en.version, /^Version 1\.0 · /);
  assert.match(page.zh, /中英文有出入时以中文版为准/);
  assert.match(page.en, /The Chinese version prevails/);
});

test("both pages have the same anchors, and every contents link lands on a chapter", () => {
  assert.deepEqual(ids(page.en), ids(page.zh));
  assert.deepEqual(ids(page.zh).filter((id) => /^figure-\d+$/.test(id)), ["figure-1", "figure-2", "figure-3", "figure-4"]);
  for (const lang of LANGS) {
    const html = page[lang];
    const all = ids(html);
    assert.equal(new Set(all).size, all.length, `${lang}: no id twice`);
    for (const [, target] of html.matchAll(/href="#([^"]+)"/g)) assert.ok(all.includes(target), `${lang}: #${target}`);
    const chapters = [...html.matchAll(/<section class="panel wp-chapter" id="([^"]+)"/g)].map((m) => m[1]);
    assert.equal(chapters.length, 15);
    const lists = [...html.matchAll(/<ol class="wp-toc-list">(.*?)<\/ol>/gs)];
    assert.equal(lists.length, 2, "the side contents and the phone's folded one");
    for (const [, list] of lists) assert.deepEqual([...list.matchAll(/href="#([^"]+)"/g)].map((m) => m[1]), chapters);
  }
});

test("the pages are static: no script, no inline style, and a policy that allows neither", () => {
  for (const lang of LANGS) {
    const html = page[lang];
    assert.doesNotMatch(html, /<script|<style|<[^>]+\s(?:style|on[a-z]+)=/i);
    const policy = csp(html).split("; ");
    for (const rule of ["default-src 'self'", "script-src 'none'", "style-src 'self'", "connect-src 'none'", "object-src 'none'", "base-uri 'self'", "form-action 'none'"]) {
      assert.ok(policy.includes(rule), `${lang}: ${rule}`);
    }
  }
});

/** Whether the built site serves a root path: public/ as it is, the stylesheet build.mjs writes, or the fonts and sprites it copies. */
function served(path) {
  const file = path.split(/[?#]/)[0].replace(/^\//, "").replace(/(^|\/)$/, "$1index.html");
  if (file === "styles.css") return true;
  if (/^assets\/(?:fonts|pet)\//.test(file)) return existsSync(join(SITE, file));
  return existsSync(join(SITE, "public", file));
}

test("every file the pages ask for is on the site, by root path", () => {
  for (const lang of LANGS) {
    const html = page[lang];
    const paths = [...html.matchAll(/(?:src|href)="(\/[^"]*)"/g)].map((m) => m[1]);
    for (const path of ["/styles.css", "/whitepaper/whitepaper.css", "/world.svg", "/assets/pet/scene-run.png"]) assert.ok(paths.includes(path), `${lang} uses ${path}`);
    for (const path of paths) assert.ok(served(path), `${lang} asks for ${path}`);
    assert.doesNotMatch(html, /(?:src|href)="(?!https:\/\/|\/|#)/, "root paths, anchors or https only");
  }
});

test("each page links to the other language, names its address, and opens the game in its own language", () => {
  for (const lang of LANGS) {
    const html = page[lang];
    const tag = (l) => (l === "zh" ? "zh-CN" : "en");
    assert.ok(html.startsWith(`<!doctype html>\n<html lang="${tag(lang)}">`));
    assert.ok(html.includes(`<link rel="canonical" href="${SITE_URL}${PAGE_PATH[lang]}" />`));
    for (const [hreflang, path] of [["zh-CN", PAGE_PATH.zh], ["en", PAGE_PATH.en], ["x-default", PAGE_PATH.en]]) {
      assert.ok(html.includes(`<link rel="alternate" hreflang="${hreflang}" href="${SITE_URL}${path}" />`), `${lang}: ${hreflang}`);
    }
    const flip = other(lang);
    assert.ok(html.includes(`<a class="language-button" href="${PAGE_PATH[flip]}" hreflang="${tag(flip)}" lang="${tag(flip)}">`), `${lang}: the language button opens the other page`);
    const game = [...html.matchAll(/href="(\/\?[^"]*)"/g)].map((m) => m[1]);
    assert.ok(game.length >= 3, "brand, top bar, cover and footer");
    assert.deepEqual([...new Set(game)], [`/?lang=${lang}`], "the game opens in the page's language");
    const away = [...html.matchAll(/href="(https:\/\/squeekpulse\.xyz[^"]*)"/g)].map((m) => m[1]);
    assert.deepEqual(away, [`https://squeekpulse.xyz/?lang=${lang}`], "one link back to Squeek Pulse, in the footer");
  }
});

test("links that leave the site use https and open in a new tab without a referrer", () => {
  for (const lang of LANGS) {
    for (const [tag] of page[lang].matchAll(/<a\b[^>]*>/g)) {
      const href = tag.match(/href="([^"]+)"/)[1];
      if (href.startsWith("/") || href.startsWith("#") || href.startsWith("https://squeekpulse.xyz/")) continue;
      assert.match(href, /^https:\/\//, tag);
      assert.match(tag, / target="_blank" rel="noreferrer"/, tag);
    }
  }
});

test("the pages name the World's contracts on Sepolia, the official ones it reads, and the wallet that deployed them", () => {
  const owner = readFileSync(join(REPO, "contracts/README.md"), "utf8").match(/from the owner wallet `(0x[0-9a-f]{40})`/)?.[1];
  assert.ok(owner, "contracts/README.md names the owner wallet");
  const record = JSON.parse(read("assets/deployment.json"));
  assert.equal(WORLD_CHAIN.core, record.contracts.SqueekCore.address);
  assert.equal(WORLD_CHAIN.sqk, record.contracts.SqueekToken.address);
  const { core, sqk, sqb, minter, shop, faucet } = WORLD_CHAIN;
  const expected = [core, sqk, sqb, minter, shop, faucet, owner].sort();
  for (const lang of LANGS) {
    const html = page[lang];
    assert.deepEqual([...new Set(html.match(/0x[0-9a-fA-F]{40}/g))].sort(), expected, lang);
    const shown = [...html.matchAll(/href="https:\/\/sepolia\.etherscan\.io\/address\/(0x[0-9a-f]{40})"[^>]*>(0x[0-9a-f]{40})<\/a>/g)];
    assert.equal(shown.length, 5, `${lang}: four contracts and the owner, each linked to the explorer`);
    for (const [, opens, label] of shown) assert.equal(label, opens, "a link shows the address it opens");
  }
});
