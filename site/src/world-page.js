// Squeek Pet World, the page at the root of its own site
// (https://world.squeekpulse.xyz, built by site/build.mjs): a small web game
// that grows with the real hamster. The game itself is built from src/world
// in this repository (`npm run build:game` writes dist-game/squeek-world.js,
// which this page imports and the site's build bundles); it
// draws inside a shadow root and keeps its save in this browser. This page
// adds the site around it: its own top bar (no Squeek Pulse sidebar), a live,
// read-only mirror of the real wheel from GET /v1/status, and a footer link
// back to squeekpulse.xyz. With WORLD_CHAIN set (./world-chain.js), the World
// also plays its economy on the Sepolia testnet through the player's own
// browser wallet: the wallet shows every transaction and signature, and no key
// reaches the page. The page itself has no wallet, signing or transaction code.
import { ApiClient, isFreshMeasurement } from "./data.js";
import { pixelIcon } from "./pixel-icons.js";
import { mountWorld } from "../../dist-game/squeek-world.js";
import { WORLD_CHAIN } from "./world-chain.js";
import { sprite } from "./wheel-art.js";
import { SITE_URL } from "./site-paths.js";
import { adoptLanguage, crossSiteHref } from "./language.js";

const LANGUAGE_KEY = "squeek-pulse-language-v2";
const POLL_MS = 10_000;
const STALE_SECONDS = 120;
// The World's own files sit at the root of its site. Squeek Pulse is on
// squeekpulse.xyz, and the footer's link there carries the visitor's language.
const ROOT = "/";
const mainSite = () => crossSiteHref(SITE_URL);
// The whitepaper's web version, one static page per language
// (site/public/whitepaper/, written by site/whitepaper/render.mjs).
const WHITEPAPER = { en: `${ROOT}whitepaper/en/`, zh: `${ROOT}whitepaper/` };

const en = {
  pageTitle: "Squeek Pet World",
  heroTag: "NEW · WEB GAME",
  heroTitle: "A little world that grows with the real hamster.",
  heroLead: "Each batch of rounds SqueekCore settles on Sepolia is one turn here. Busy rounds bring data beans and steps, resting rounds bring dream dew. Grow a garden, build a home, send Squeektoshi on trips and take on a weekly boss together with everyone who plays.",
  chips: [
    ["window", "Plays in your browser"],
    ["shield", "Read-only · No wallet"],
    ["data", "Saved in this browser"],
  ],
  heroLeadChain: "Connect a wallet to stake test SQK for SQB, buy a home deed and send supplies to the guild war.",
  chipsChain: [
    ["window", "Plays in your browser"],
    ["wallet", "Connect a wallet · Sepolia testnet"],
    ["shield", "No real money · Keys stay in your wallet"],
  ],
  liveTitle: "The real Squeektoshi",
  liveLoading: "Connecting to SqueekChain…",
  liveRunning: (rpm) => `Running · ${rpm} RPM`,
  liveRunningNote: "Busy rounds bring data beans and steps once SqueekCore settles them.",
  liveResting: "Resting · dream dew time",
  liveRestingNote: "Resting rounds bring dream dew and grow the night plants.",
  liveStale: "Waiting for fresh wheel data",
  liveStaleNote: `The last reading is older than ${STALE_SECONDS} s. The world only moves on settled rounds, so it just waits.`,
  liveFault: "The wheel sensor reports a fault",
  liveFaultNote: "The world keeps its last settled round until the sensor recovers.",
  liveNone: "The API has no wheel reading yet",
  liveUnreachable: "Can't reach api.squeekchain.com",
  liveUnreachableNote: "Your world stays saved in this browser and catches up when the API is back.",
  liveUpdated: (ago) => `Reading ${ago}`,
  liveSource: "Read from GET api.squeekchain.com/v1/status every 10 s.",
  ago: (s) => (s < 5 ? "just now" : s < 60 ? `${s}s ago` : s < 3600 ? `${Math.floor(s / 60)}m ago` : `${Math.floor(s / 3600)}h ago`),
  noScript: "Squeek Pet World needs JavaScript.",
  independent: "Independent community project · Not an official SqueekChain product",
  whitepaper: "Whitepaper",
  backHome: "Back to Squeek Pulse",
};

const zh = {
  pageTitle: "Squeek Pet World",
  heroTag: "新 · 网页小游戏",
  heroTitle: "跟着真实仓鼠一起长大的小世界。",
  heroLead: "SqueekCore 在 Sepolia 上每结算一批，这里就前进一个回合。跑步的回合带来数据豆和探险步数，休息的回合带来梦露。种菜、盖房子、派 Squeektoshi 去探险，再和所有玩家一起挑战每周的 Boss。",
  chips: [
    ["window", "浏览器里直接玩"],
    ["shield", "只读 · 无需钱包"],
    ["data", "存档在这个浏览器里"],
  ],
  heroLeadChain: "连接钱包后，可以质押测试网 SQK 赚 SQB、买家园地契、给公会战送补给。",
  chipsChain: [
    ["window", "浏览器里直接玩"],
    ["wallet", "连接钱包 · Sepolia 测试网"],
    ["shield", "不涉及真钱 · 私钥只在你的钱包里"],
  ],
  liveTitle: "真实的 Squeektoshi",
  liveLoading: "正在连接 SqueekChain…",
  liveRunning: (rpm) => `跑步中 · ${rpm} RPM`,
  liveRunningNote: "跑步的回合结算后，会带来数据豆和探险步数。",
  liveResting: "休息中 · 收集梦露",
  liveRestingNote: "休息的回合带来梦露，夜间植物也会生长。",
  liveStale: "正在等待新的跑轮数据",
  liveStaleNote: `最近的读数已超过 ${STALE_SECONDS} 秒。世界只跟着已结算的回合前进，所以会安静地等着。`,
  liveFault: "跑轮传感器报告异常",
  liveFaultNote: "传感器恢复之前，世界停在最后一个已结算的回合。",
  liveNone: "API 暂时没有跑轮读数",
  liveUnreachable: "无法连接 api.squeekchain.com",
  liveUnreachableNote: "你的世界保存在这个浏览器里，API 恢复后会自动补上。",
  liveUpdated: (ago) => `读数时间：${ago}`,
  liveSource: "每 10 秒读取一次 api.squeekchain.com/v1/status。",
  ago: (s) => (s < 5 ? "刚刚" : s < 60 ? `${s} 秒前` : s < 3600 ? `${Math.floor(s / 60)} 分钟前` : `${Math.floor(s / 3600)} 小时前`),
  noScript: "Squeek Pet World 需要 JavaScript。",
  independent: "独立社区项目 · 非 SqueekChain 官方产品",
  whitepaper: "白皮书",
  backHome: "返回 Squeek Pulse",
};

/** The language this site remembers; links from and to the main site carry a choice made on either one. */
export function readLanguage(storage) {
  try {
    return (storage ?? globalThis.localStorage)?.getItem(LANGUAGE_KEY) === "zh" ? "zh" : "en";
  } catch {
    return "en";
  }
}

export const copyFor = (lang) => (lang === "zh" ? zh : en);

const esc = (value) =>
  String(value).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

/** Which hamster the latest /v1/status reading shows. Stale or missing data is never shown as sleep. */
export function liveState(status, { now = Date.now(), failed = false } = {}) {
  if (!status) return { state: failed ? "unreachable" : "loading", sprite: failed ? "offline" : "wake" };
  const me = status.measurement;
  if (!me) return { state: "none", sprite: "offline" };
  if (!isFreshMeasurement(me, now)) return { state: "stale", sprite: "offline" };
  if (me.coreStatus === "COUNTER_FAULT") return { state: "fault", sprite: "fault" };
  if (Number(me.rpmMilli) > 0) return { state: "running", sprite: "run", rpm: Number(me.rpmMilli) / 1000 };
  return { state: "resting", sprite: "sleep" };
}

/** Run-cycle length for a given RPM, so the mirrored hamster speeds up with the real one. */
const strideSeconds = (rpm) => (rpm > 0 ? Math.min(1.2, Math.max(0.24, 34 / rpm)) : 0.6);

/** Whether this page plays the World on Sepolia (a deployment is configured). */
const onChain = (chain) => chain !== null && chain !== undefined;
/** Two sentences of copy as one: no space after a Chinese full stop. */
const sentences = (first, second) => `${first}${/[。！？]$/.test(first) ? "" : " "}${second}`;

/** The World's own top bar: its brand, as squeekpulse.xyz's entry page shows Squeek Pulse's, and no sidebar. */
function topbar(lang) {
  return `<header class="topbar world-top"><a class="brand" href="${ROOT}" aria-current="page"><img class="pixel" src="${ROOT}world.svg" alt="" width="32" height="32"><span>Squeek Pet World<small>COMMUNITY WEB GAME</small></span></a><div class="top-actions"><span class="network-pill"><span class="green-dot"></span>SEPOLIA</span><button class="language-button" data-action="language">${lang === "zh" ? "EN" : "中文"}</button><a href="${WHITEPAPER[lang]}" class="top-doc world-paper">${esc(copyFor(lang).whitepaper)}</a><a href="https://docs.squeekchain.com" target="_blank" rel="noreferrer" class="top-doc">Docs ${pixelIcon("arrow", 12)}</a></div></header>`;
}

export function liveHtml(c, { status = null, failed = false, receivedAt = 0, lang = "en", now = Date.now() } = {}) {
  const m = liveState(status, { failed, now });
  const ago = receivedAt ? c.ago(Math.max(0, Math.round((now - receivedAt) / 1000))) : "";
  const rpm = m.rpm != null ? m.rpm.toLocaleString(lang === "zh" ? "zh-CN" : "en-GB", { maximumFractionDigits: 1 }) : "";
  const [title, note] = {
    loading: [c.liveLoading, ""],
    running: [c.liveRunning(rpm), c.liveRunningNote],
    resting: [c.liveResting, c.liveRestingNote],
    stale: [c.liveStale, c.liveStaleNote],
    fault: [c.liveFault, c.liveFaultNote],
    none: [c.liveNone, c.liveStaleNote],
    unreachable: [c.liveUnreachable, c.liveUnreachableNote],
  }[m.state];
  const speed = m.state === "running" ? `${strideSeconds(m.rpm).toFixed(2)}s` : "";
  return `<div class="pet-live-sprite">${sprite(m.sprite, { base: ROOT, speed, className: "world-live-art" })}</div><div class="pet-live-text"><p class="eyebrow"><span class="live-dot ${m.state}"></span>${esc(c.liveTitle)}</p><strong>${esc(title)}</strong>${note ? `<p>${esc(note)}</p>` : ""}<small>${ago ? esc(c.liveUpdated(ago)) + " · " : ""}${esc(c.liveSource)}</small></div>`;
}

function hero(c, live, chain = WORLD_CHAIN) {
  const lead = onChain(chain) ? sentences(c.heroLead, c.heroLeadChain) : c.heroLead;
  const chips = onChain(chain) ? c.chipsChain : c.chips;
  return `<section class="pet-hero world-hero" aria-labelledby="world-title"><div class="pet-hero-copy"><p class="hero-tag"><span class="green-dot"></span>${esc(c.heroTag)}</p><h1 id="world-title" class="pet-logo">Squeek Pet World</h1><h2>${esc(c.heroTitle)}</h2><p class="pet-lead">${esc(lead)}</p><ul class="pet-chips">${chips.map(([ico, text]) => `<li>${pixelIcon(ico, 12)}${esc(text)}</li>`).join("")}</ul></div><div class="world-live" id="world-live" aria-live="polite">${live}</div></section>`;
}

function footer(c, lang) {
  return `<footer><div class="footer-brand">${pixelIcon("sparkle", 24)} Squeek Pet World</div><p>${esc(c.independent)}</p><a href="${WHITEPAPER[lang]}">${esc(c.whitepaper)}</a><a href="${mainSite()}">${esc(c.backHome)} ↗</a></footer>`;
}

/** The page around the game for one language. Pure, so tests can read it without a browser. */
export function pageHtml(lang, { live = {}, chain = WORLD_CHAIN } = {}) {
  const c = copyFor(lang);
  return `<div class="world-page">${topbar(lang)}<main id="main" class="pet-main world-main">${hero(c, liveHtml(c, { lang, ...live }), chain)}<div id="world-game" class="world-game"></div>${footer(c, lang)}</main></div>`;
}

const state = { lang: adoptLanguage() ?? readLanguage(), status: null, failed: false, receivedAt: 0, world: null };
const liveOptions = () => ({ status: state.status, failed: state.failed, receivedAt: state.receivedAt, lang: state.lang });

function setChrome() {
  const c = copyFor(state.lang);
  document.documentElement.lang = state.lang === "zh" ? "zh-CN" : "en";
  document.title = `🐹 ${c.pageTitle}`;
}

/** Swaps the words around the game without touching the game itself. */
function relabel() {
  const c = copyFor(state.lang);
  setChrome();
  const swap = (selector, html) => {
    const node = document.querySelector(selector);
    if (node) node.outerHTML = html;
  };
  swap(".topbar", topbar(state.lang));
  swap(".world-hero", hero(c, liveHtml(c, liveOptions())));
  swap(".world-main > footer", footer(c, state.lang));
  state.world?.setLanguage(state.lang);
}

function updateLive() {
  const live = document.querySelector("#world-live");
  if (live) live.innerHTML = liveHtml(copyFor(state.lang), liveOptions());
}

function onClick(event) {
  const target = event.target.closest?.("[data-action]");
  if (target?.dataset.action !== "language") return;
  state.lang = state.lang === "zh" ? "en" : "zh";
  try {
    localStorage.setItem(LANGUAGE_KEY, state.lang);
  } catch {}
  relabel();
}

async function poll(api) {
  try {
    state.status = await api.get("/v1/status");
    state.receivedAt = Date.now();
    state.failed = false;
  } catch (error) {
    if (error?.kind !== "aborted") state.failed = true;
  }
  updateLive();
}

export function start() {
  setChrome();
  document.querySelector("#app").innerHTML = pageHtml(state.lang, { live: liveOptions() });
  state.world = mountWorld(document.querySelector("#world-game"), { language: state.lang, chain: WORLD_CHAIN ?? undefined });
  document.addEventListener("click", onClick);
  const api = new ApiClient();
  poll(api);
  setInterval(() => {
    if (document.visibilityState === "visible") poll(api);
    else updateLive();
  }, POLL_MS);
}

if (typeof document !== "undefined" && document.querySelector?.("#app")) start();
