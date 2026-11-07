// Renders the web version of the Squeek Pet World whitepaper from its two
// sources in this folder, zh.md (Chinese, which prevails) and en.md (English),
// into the World's site: public/whitepaper/index.html and
// public/whitepaper/en/index.html, which site/build.mjs copies as they are.
//
//   node site/whitepaper/render.mjs
//
// Run it after editing either source, and commit the pages it writes; a test
// (site/tests/whitepaper.test.js) fails while they are out of date. The pages
// are static: no script (their policy is script-src 'none'), no inline style,
// root paths only, the site's pixel styles plus whitepaper.css. Their figures
// come from figures.mjs. The sources use a small part of Markdown: # title,
// then the version line and the lead paragraph; ## chapters ("1. ...",
// "附录 A ..." or "Appendix A ..."; the first may be unnumbered, the summary);
// ### sections ("1.1 ...", "A.1 ..."); paragraphs; "- " and "1. " lists;
// "- [ ] " open items; pipe tables; ```formula blocks; [[figure:name]];
// [links](https://...) and `code`. Both sources must keep the same structure.
// New Chinese characters may need the pixel fonts rebuilt: site/subset-fonts.py.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { figure } from "./figures.mjs";
import { pixelIcon } from "../src/pixel-icons.js";

const SITE_URL = "https://world.squeekpulse.xyz";
export const LANGS = ["zh", "en"];
/** Where each language's page is served, and where it is written in the site. */
export const PAGE_PATH = { zh: "/whitepaper/", en: "/whitepaper/en/" };
export const PAGE_FILE = { zh: "public/whitepaper/index.html", en: "public/whitepaper/en/index.html" };
const SITE = new URL("../", import.meta.url);

const CHROME = {
  zh: {
    html: "zh-CN",
    title: "🐹 白皮书 · Squeek Pet World",
    description: "Squeek Pet World 白皮书 1.0：一个由真实仓鼠驱动的网页游戏。回合机制、玩法、双币经济（SQB 与 SQK）、Sepolia 上的智能合约、风险和路线图。",
    skip: "跳至内容",
    small: "WHITEPAPER · V1.0",
    switchLabel: "EN",
    switchLong: "English version",
    game: "回到游戏",
    play: "去玩 Squeek Pet World",
    titleWord: "白皮书",
    chips: [
      ["shield", "只在 Sepolia 测试网"],
      ["bean", "SQB 零预挖 · 不出售"],
      ["data", "中英文有出入时以中文版为准"],
    ],
    cardEyebrow: "真实的 Squeektoshi",
    cardTitle: "它跑步，世界就前进",
    cardNote: "SqueekCore 每结算一批跑轮工作量，就是 World 的一个回合；跑步回合是白天，休息回合是夜晚。",
    contents: "目录",
    contentsCount: (n) => `${n} 章`,
    appendices: "附录",
    appendix: (x) => `附录 ${x}`,
    toTop: "回到顶部",
    toContents: "目录",
    independent: "独立社区项目 · 非 SqueekChain 官方产品",
    home: "返回 Squeek Pulse",
  },
  en: {
    html: "en",
    title: "🐹 Whitepaper · Squeek Pet World",
    description: "The Squeek Pet World whitepaper, version 1.0: a web game driven by a real hamster. Its turns, gameplay, two-token economy (SQB and SQK), smart contracts on Sepolia, risks and roadmap.",
    skip: "Skip to content",
    small: "WHITEPAPER · V1.0",
    switchLabel: "中文",
    switchLong: "中文版（以此为准）",
    game: "Back to the game",
    play: "Play Squeek Pet World",
    titleWord: "Whitepaper",
    chips: [
      ["shield", "Sepolia testnet only"],
      ["bean", "SQB: no premine, never sold"],
      ["data", "The Chinese version prevails"],
    ],
    cardEyebrow: "The real Squeektoshi",
    cardTitle: "When it runs, the world moves",
    cardNote: "Every batch of wheel work SqueekCore settles is one turn of the World: running turns are day, resting turns are night.",
    contents: "Contents",
    contentsCount: (n) => `${n} chapters`,
    appendices: "Appendices",
    appendix: (x) => `Appendix ${x}`,
    toTop: "Back to top",
    toContents: "Contents",
    independent: "Independent community project · Not an official SqueekChain product",
    home: "Back to Squeek Pulse",
  },
};

const other = (lang) => (lang === "zh" ? "en" : "zh");
const esc = (value) =>
  String(value).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
/** The game, in the reader's language: the World adopts ?lang= and keeps it. */
const gameHref = (lang) => `/?lang=${lang}`;

// ---- Reading the source -----------------------------------------------------

function chapterHead(text, first) {
  let m;
  if ((m = text.match(/^(\d+)\. (.+)$/))) return { id: `s${m[1]}`, badge: m[1], title: m[2], appendix: false };
  if ((m = text.match(/^(?:附录|Appendix) ([A-Z]) (.+)$/))) return { id: `appendix-${m[1].toLowerCase()}`, badge: m[1], title: m[2], appendix: true };
  if (first) return { id: "summary", badge: "", title: text, appendix: false };
  throw new Error(`Chapter heading without a number: ${text}`);
}

function sectionHead(text) {
  let m;
  if ((m = text.match(/^(\d+)\.(\d+) (.+)$/))) return { id: `s${m[1]}-${m[2]}`, num: `${m[1]}.${m[2]}`, title: m[3] };
  if ((m = text.match(/^([A-Z])\.(\d+) (.+)$/))) return { id: `appendix-${m[1].toLowerCase()}-${m[2]}`, num: `${m[1]}.${m[2]}`, title: m[3] };
  throw new Error(`Section heading without a number: ${text}`);
}

const cells = (row) => row.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((cell) => cell.trim());

/** The source as { title, version, lead, chapters: [{ id, badge, title, appendix, blocks, sections: [{ id, num, title, blocks }] }] }. */
export function parse(md) {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  let i = 0;
  const next = () => {
    while (i < lines.length && !lines[i].trim()) i++;
    return lines[i++];
  };
  const title = next().replace(/^# /, "");
  const version = next();
  const lead = next();
  const doc = { title, version, lead, chapters: [] };
  let chapter = null;
  let section = null;
  const push = (block) => {
    if (!chapter) throw new Error(`Text before the first chapter: ${JSON.stringify(block)}`);
    (section ?? chapter).blocks.push(block);
  };
  const take = (test) => {
    const taken = [];
    while (i < lines.length && test(lines[i])) taken.push(lines[i++]);
    return taken;
  };
  while (i < lines.length) {
    const line = lines[i];
    let m;
    if (!line.trim()) {
      i++;
    } else if ((m = line.match(/^## (.+)$/))) {
      chapter = { ...chapterHead(m[1], doc.chapters.length === 0), blocks: [], sections: [] };
      doc.chapters.push(chapter);
      section = null;
      i++;
    } else if ((m = line.match(/^### (.+)$/))) {
      if (!chapter) throw new Error(`Section before the first chapter: ${line}`);
      section = { ...sectionHead(m[1]), blocks: [] };
      chapter.sections.push(section);
      i++;
    } else if (line.startsWith("|")) {
      const rows = take((l) => l.startsWith("|")).map(cells);
      const [head, rule, ...body] = rows;
      if (!rule?.every((cell) => /^:?-{3,}:?$/.test(cell))) throw new Error(`Table without a header rule: ${line}`);
      for (const row of body) if (row.length !== head.length) throw new Error(`Table row with ${row.length} cells, not ${head.length}: ${row.join(" | ")}`);
      push({ type: "table", head, body });
    } else if ((m = line.match(/^```(\w+)$/))) {
      i++;
      const text = take((l) => !l.startsWith("```"));
      i++;
      if (m[1] !== "formula") throw new Error(`Unknown block: ${m[1]}`);
      push({ type: "formula", text: text.join(" ") });
    } else if ((m = line.match(/^\[\[figure:([a-z-]+)\]\]$/))) {
      push({ type: "figure", name: m[1] });
      i++;
    } else if (/^- \[ \] /.test(line)) {
      push({ type: "todo", items: take((l) => /^- \[ \] /.test(l)).map((l) => l.slice(6)) });
    } else if (line.startsWith("- ")) {
      push({ type: "ul", items: take((l) => l.startsWith("- ") && !/^- \[ \] /.test(l)).map((l) => l.slice(2)) });
    } else if (/^\d+\. /.test(line)) {
      push({ type: "ol", items: take((l) => /^\d+\. /.test(l)).map((l) => l.replace(/^\d+\. /, "")) });
    } else if (/^#/.test(line)) {
      throw new Error(`Unexpected heading: ${line}`);
    } else {
      push({ type: "p", text: take((l) => l.trim() && !/^(#|\||```|- |\d+\. |\[\[figure:)/.test(l)).join(" ") });
    }
  }
  return doc;
}

// ---- Writing the page -------------------------------------------------------

const ADDRESS = /^0x[0-9a-f]{40}$/;

function anchor(href, label, lang) {
  if (href === SITE_URL || href.startsWith(`${SITE_URL}/`)) {
    const path = href.slice(SITE_URL.length) || "/";
    return `<a href="${esc(path === "/" ? gameHref(lang) : path)}">${label}</a>`;
  }
  if (!href.startsWith("https://")) throw new Error(`Links leave the site only over https: ${href}`);
  const addr = ADDRESS.test(label) ? ' class="wp-addr"' : "";
  return `<a${addr} href="${esc(href)}" target="_blank" rel="noreferrer">${label}</a>`;
}

function links(text, lang) {
  let out = "";
  let last = 0;
  for (const m of text.matchAll(/\[([^\]]+)\]\(([^)\s]+)\)/g)) {
    out += esc(text.slice(last, m.index)) + anchor(m[2], esc(m[1]), lang);
    last = m.index + m[0].length;
  }
  return out + esc(text.slice(last));
}

/** Inline Markdown: `code` and [links](...); everything else is text. */
function inline(text, lang) {
  return text
    .split(/(`[^`]+`)/)
    .map((part) => (/^`[^`]+`$/.test(part) ? `<code>${esc(part.slice(1, -1))}</code>` : links(part, lang)))
    .join("");
}
const plain = (text) => text.replace(/`([^`]+)`/g, "$1").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
/** Short table cells ("灯笼小路", "约 10,094", "Starlight Ruins") never break inside. */
const short = (text) => plain(text).length <= (/[\u3400-\u9fff]/.test(text) ? 10 : 16);
/** A cell that is one address (a phone gives it the card's whole width), or short enough never to wrap. */
const cellClass = (text) => (ADDRESS.test(plain(text)) ? ' class="wp-addr-cell"' : short(text) ? ' class="wp-short"' : "");

function block(b, lang) {
  switch (b.type) {
    case "p":
      return `<p>${inline(b.text, lang)}</p>`;
    case "ul":
      return `<ul class="wp-list">${b.items.map((item) => `<li>${inline(item, lang)}</li>`).join("")}</ul>`;
    case "ol":
      return `<ol class="wp-list wp-ol">${b.items.map((item) => `<li>${inline(item, lang)}</li>`).join("")}</ol>`;
    case "todo":
      return `<ul class="wp-todo">${b.items.map((item) => `<li><span class="wp-box" aria-hidden="true"></span><span>${inline(item, lang)}</span></li>`).join("")}</ul>`;
    case "formula":
      return `<p class="wp-formula"><span>${esc(b.text)}</span></p>`;
    case "figure":
      return figure(b.name, lang);
    case "table": {
      const labels = b.head.map(plain);
      const head = `<thead><tr>${b.head.map((cell) => `<th scope="col">${inline(cell, lang)}</th>`).join("")}</tr></thead>`;
      const row = (r) =>
        `<tr>${r.map((cell, k) => (k === 0 ? `<th scope="row"${cellClass(cell)}>${inline(cell, lang)}</th>` : `<td${cellClass(cell)} data-label="${esc(labels[k])}"><span>${inline(cell, lang)}</span></td>`)).join("")}</tr>`;
      return `<div class="wp-table wp-cols-${b.head.length}"><table>${head}<tbody>${b.body.map(row).join("")}</tbody></table></div>`;
    }
    default:
      throw new Error(`Unknown block ${b.type}`);
  }
}

const blocks = (list, lang) => list.map((b) => block(b, lang)).join("\n");

function chapterHtml(ch, lang) {
  const c = CHROME[lang];
  const badge = ch.badge ? `<span class="wp-badge">${esc(ch.badge)}</span>` : `<span class="wp-badge wp-badge-icon" aria-hidden="true">${pixelIcon("sparkle", 18)}</span>`;
  const kicker = ch.appendix ? `<span class="sr-only">${esc(c.appendix(""))}</span>` : "";
  const sections = ch.sections
    .map((s) => `<section class="wp-section" id="${s.id}" aria-labelledby="${s.id}-title">\n<h3 id="${s.id}-title"><span class="wp-section-num">${esc(s.num)}</span>${esc(s.title)}</h3>\n${blocks(s.blocks, lang)}\n</section>`)
    .join("\n");
  const part = ch.appendix && ch.badge === "A" ? `<p class="wp-part" id="appendices">${esc(c.appendices)}</p>\n` : "";
  return `${part}<section class="panel wp-chapter" id="${ch.id}" aria-labelledby="${ch.id}-title">
<h2 id="${ch.id}-title">${kicker}${badge}<span class="wp-chapter-name">${esc(ch.title)}</span></h2>
${[blocks(ch.blocks, lang), sections].filter(Boolean).join("\n")}
<a class="wp-up" href="#contents">↑ ${esc(c.toContents)}</a>
</section>`;
}

function tocItems(doc, lang) {
  const c = CHROME[lang];
  return doc.chapters
    .map((ch) => {
      const part = ch.appendix && ch.badge === "A" ? `<li class="wp-toc-part">${esc(c.appendices)}</li>` : "";
      const num = ch.badge ? esc(ch.badge) : pixelIcon("sparkle", 12);
      return `${part}<li><a href="#${ch.id}"><span class="wp-toc-num">${num}</span>${esc(ch.title)}</a></li>`;
    })
    .join("");
}

function cover(doc, lang) {
  const c = CHROME[lang];
  const title = doc.title.replace(c.titleWord, "").trim();
  if (`${title} ${c.titleWord}` !== doc.title) throw new Error(`The title should end with ${c.titleWord}: ${doc.title}`);
  return `<section class="pet-hero world-hero wp-cover" aria-labelledby="wp-title">
<div class="pet-hero-copy">
<p class="hero-tag"><span class="green-dot"></span>${esc(doc.version)}</p>
<h1 id="wp-title" class="pet-logo">${esc(title)} <span class="wp-title-word">${esc(c.titleWord)}</span></h1>
<p class="pet-lead">${inline(doc.lead, lang)}</p>
<ul class="pet-chips">${c.chips.map(([icon, text]) => `<li>${pixelIcon(icon, 12)}${esc(text)}</li>`).join("")}</ul>
<p class="wp-cover-actions"><a class="button" href="${gameHref(lang)}">${pixelIcon("sparkle", 12)}${esc(c.play)}</a><a class="button secondary" href="${PAGE_PATH[other(lang)]}" hreflang="${CHROME[other(lang)].html}" lang="${CHROME[other(lang)].html}">${esc(c.switchLong)}</a></p>
</div>
<figure class="world-live wp-cover-card">
<div class="pet-live-sprite"><span class="px-sprite world-live-art wp-cover-art"><img class="pixel" src="/assets/pet/scene-run.png" alt="" width="900" height="107" decoding="async"></span></div>
<figcaption class="pet-live-text"><p class="eyebrow"><span class="green-dot"></span>${esc(c.cardEyebrow)}</p><strong>${esc(c.cardTitle)}</strong><p>${esc(c.cardNote)}</p></figcaption>
</figure>
</section>`;
}

/** The whole page for one language. */
export function renderPage(lang, source = readSource(lang)) {
  const c = CHROME[lang];
  const doc = parse(source);
  const o = other(lang);
  const items = tocItems(doc, lang);
  const count = c.contentsCount(doc.chapters.length);
  return `<!doctype html>
<html lang="${c.html}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <meta name="description" content="${esc(c.description)}" />
    <meta name="theme-color" content="#213b2e" />
    <meta
      http-equiv="Content-Security-Policy"
      content="default-src 'self'; script-src 'none'; style-src 'self'; img-src 'self'; connect-src 'none'; font-src 'self'; object-src 'none'; base-uri 'self'; form-action 'none'"
    />
    <title>${esc(c.title)}</title>
    <link rel="canonical" href="${SITE_URL}${PAGE_PATH[lang]}" />
    <link rel="alternate" hreflang="zh-CN" href="${SITE_URL}${PAGE_PATH.zh}" />
    <link rel="alternate" hreflang="en" href="${SITE_URL}${PAGE_PATH.en}" />
    <link rel="alternate" hreflang="x-default" href="${SITE_URL}${PAGE_PATH.en}" />
    <link rel="icon" href="/world.svg" type="image/svg+xml" />
    <link rel="stylesheet" href="/styles.css" />
    <link rel="stylesheet" href="/whitepaper/whitepaper.css" />
  </head>
  <body>
    <a class="skip" href="#main">${esc(c.skip)}</a>
    <div class="world-page wp-page">
<header class="topbar world-top"><a class="brand" href="${gameHref(lang)}"><img class="pixel" src="/world.svg" alt="" width="32" height="32"><span>Squeek Pet World<small>${esc(c.small)}</small></span></a><div class="top-actions"><span class="network-pill"><span class="green-dot"></span>SEPOLIA</span><a class="language-button" href="${PAGE_PATH[o]}" hreflang="${CHROME[o].html}" lang="${CHROME[o].html}">${esc(c.switchLabel)}</a><a href="${gameHref(lang)}" class="top-doc">${esc(c.game)} ${pixelIcon("arrow", 12)}</a></div></header>
<main id="main" class="pet-main world-main wp-main">
${cover(doc, lang)}
<div class="wp-layout">
<nav class="wp-toc" aria-labelledby="wp-toc-title"><p class="eyebrow" id="wp-toc-title">${esc(c.contents)}</p><ol class="wp-toc-list">${items}</ol><a class="wp-toc-top" href="#main">↑ ${esc(c.toTop)}</a></nav>
<article class="wp-doc">
<details class="panel wp-toc-phone" id="contents"><summary>${esc(c.contents)} <small>${esc(count)}</small></summary><ol class="wp-toc-list">${items}</ol></details>
${doc.chapters.map((ch) => chapterHtml(ch, lang)).join("\n")}
</article>
</div>
<footer><div class="footer-brand">${pixelIcon("sparkle", 24)} Squeek Pet World</div><p>${esc(c.independent)}</p><a href="${gameHref(lang)}">${esc(c.game)}</a><a href="https://squeekpulse.xyz/?lang=${lang}">${esc(c.home)} ↗</a></footer>
</main>
    </div>
  </body>
</html>
`;
}

export function readSource(lang) {
  return readFileSync(new URL(`${lang}.md`, import.meta.url), "utf8");
}

/** Writes both pages into site/public/whitepaper/. */
export function writePages() {
  for (const lang of LANGS) {
    const file = fileURLToPath(new URL(PAGE_FILE[lang], SITE));
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, renderPage(lang));
    console.log(`Wrote site/${PAGE_FILE[lang]}`);
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) writePages();
