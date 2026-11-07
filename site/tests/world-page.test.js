import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { liveState, copyFor, pageHtml, liveHtml, readLanguage } from "../src/world-page.js";
import { WORLD_CHAIN } from "../src/world-chain.js";
import { pixelIcon } from "../src/pixel-icons.js";
import { PAGE_FILE, PAGE_PATH } from "../whitepaper/render.mjs";

const NOW = Date.parse("2026-11-06T05:00:00Z");
const reading = (fields = {}) => ({
  schemaVersion: 1,
  measurement: {
    freshness: "online",
    receivedAt: new Date(NOW - 5_000).toISOString(),
    staleAfterSeconds: 120,
    coreStatus: "RUNNING",
    rpmMilli: 64_000,
    ...fields,
  },
});
const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const csp = (html) => html.match(/Content-Security-Policy"\s+content="([^"]+)"/)?.[1] ?? "";
const record = JSON.parse(read("../assets/deployment.json"));
const address = (digit) => `0x${digit.repeat(40)}`;
/** A deployment as the deploy page (contracts/deploy/) prints it, with made-up addresses for the World's own contracts. */
const CHAIN = {
  chainId: 11155111,
  rpcUrl: "https://ethereum-sepolia-rpc.publicnode.com",
  explorer: "https://sepolia.etherscan.io",
  core: record.contracts.SqueekCore.address,
  sqk: record.contracts.SqueekToken.address,
  sqb: address("1"),
  minter: address("2"),
  shop: address("3"),
  faucet: address("4"),
};

test("the live card shows the hamster as squeekpulse.xyz's Squeek Pet page does", () => {
  const cases = [
    [null, {}, { state: "loading", sprite: "wake" }],
    [null, { failed: true }, { state: "unreachable", sprite: "offline" }],
    [{ schemaVersion: 1, measurement: null }, {}, { state: "none", sprite: "offline" }],
    [reading(), {}, { state: "running", sprite: "run", rpm: 64 }],
    [reading({ rpmMilli: 0, coreStatus: "IDLE" }), {}, { state: "resting", sprite: "sleep" }],
    [reading({ coreStatus: "COUNTER_FAULT", rpmMilli: 0 }), {}, { state: "fault", sprite: "fault" }],
    [reading({ rpmMilli: 0, receivedAt: new Date(NOW - 121_000).toISOString() }), {}, { state: "stale", sprite: "offline" }],
    [reading({ freshness: "stale" }), {}, { state: "stale", sprite: "offline" }],
  ];
  for (const [status, options, shown] of cases) assert.deepEqual(liveState(status, { now: NOW, ...options }), shown);
});

test("the live card shows the real RPM, the matching pace and the reading age", () => {
  const html = liveHtml(copyFor("en"), { status: reading(), receivedAt: NOW - 30_000, now: NOW });
  assert.match(html, /Running · 64 RPM/);
  assert.match(html, /Reading 30s ago/);
  assert.match(html, /--speed: 0\.53s/);
  assert.match(liveHtml(copyFor("zh"), { failed: true, now: NOW }), /无法连接 api\.squeekchain\.com/);
});

test("Chinese and English copy cover the same items", () => {
  const en = copyFor("en");
  const zh = copyFor("zh");
  assert.deepEqual(Object.keys(zh).sort(), Object.keys(en).sort());
  for (const key of Object.keys(en)) {
    if (Array.isArray(en[key])) assert.equal(zh[key].length, en[key].length, key);
    assert.equal(typeof zh[key], typeof en[key], key);
  }
});

test("the page holds the game, and without a deployment says it is read-only and needs no wallet", () => {
  for (const lang of ["en", "zh"]) {
    const html = pageHtml(lang, { chain: null });
    assert.match(html, /<div id="world-game" class="world-game"><\/div>/, "the game mounts here");
    assert.match(html, /<h1 id="world-title" class="pet-logo">Squeek Pet World<\/h1>/);
    assert.match(html, lang === "zh" ? /只读 · 无需钱包/ : /Read-only · No wallet/);
    assert.doesNotMatch(html, /connect a wallet|连接钱包|sign in|登录/i);
  }
});

test("the World is a page of its own: its own top bar, no Squeek Pulse sidebar, one link back in the footer", () => {
  for (const chain of [null, CHAIN]) {
    for (const lang of ["en", "zh"]) {
      const html = pageHtml(lang, { chain });
      assert.match(html, /^<div class="world-page"><header class="topbar world-top"><a class="brand" href="\/" aria-current="page"><img class="pixel" src="\/world\.svg" alt="" width="32" height="32"><span>Squeek Pet World<small>COMMUNITY WEB GAME<\/small><\/span><\/a><div class="top-actions">/);
      assert.match(html, new RegExp(`<button class="language-button" data-action="language">${lang === "zh" ? "EN" : "中文"}</button>`));
      assert.doesNotMatch(html, /class="(sidebar|breadcrumb|page|nav-title|sidebar-note)"|<nav|nav-pet|new-tag/, "nothing of the Squeek Pulse sidebar or breadcrumb");
      const away = [...html.matchAll(/href="(https:\/\/squeekpulse\.xyz[^"]*)"/g)].map((m) => m[1]);
      assert.deepEqual(away, ["https://squeekpulse.xyz/"], "one link to squeekpulse.xyz");
      assert.match(html, /<a href="https:\/\/squeekpulse\.xyz\/">[^<]+ ↗<\/a><\/footer><\/main><\/div>$/, "in the footer, to the main site's entry page");
    }
  }
});

test("the top bar and the footer open the whitepaper in the page's language", () => {
  for (const lang of ["en", "zh"]) {
    const html = pageHtml(lang, { chain: CHAIN });
    const links = [...html.matchAll(/<a href="(\/whitepaper\/[^"]*)"[^>]*>([^<]+)<\/a>/g)].map((m) => m.slice(1, 3));
    const link = [PAGE_PATH[lang], copyFor(lang).whitepaper];
    assert.deepEqual(links, [link, link]);
    assert.match(html, new RegExp(`<a href="${PAGE_PATH[lang]}" class="top-doc world-paper">`), "beside Docs in the top bar, which a phone hides");
    assert.match(html, new RegExp(`</p><a href="${PAGE_PATH[lang]}">[^<]+</a><a href="https://squeekpulse\\.xyz/">`), "in the footer, before the link back");
    assert.ok(readFileSync(new URL(`../${PAGE_FILE[lang]}`, import.meta.url), "utf8").includes(`<link rel="canonical" href="https://world.squeekpulse.xyz${PAGE_PATH[lang]}" />`));
  }
});

test("the World's icon is squeekpulse.xyz's World door: its sparkle, purple on soft blue, in a notched ink frame", () => {
  const svg = read("../public/world.svg");
  assert.match(svg, /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" viewBox="0 0 16 16" shape-rendering="crispEdges"[ >]/, "a 16-pixel grid (files written through the shared folder also carry content credentials)");
  const cells = (d, rect) => {
    const on = new Set();
    for (const m of d.matchAll(rect)) {
      const [x, y, w, h] = m.slice(1, 5).map(Number);
      for (let i = 0; i < w; i++) for (let j = 0; j < h; j++) on.add(`${x + i},${y + j}`);
    }
    return on;
  };
  const fills = Object.fromEntries([...svg.matchAll(/<path fill="(#[0-9a-f]{6})" d="([^"]+)"\/>/g)].map((m) => [m[1], m[2]]));
  const tokens = read("../src/styles.css");
  for (const [token, colour] of [["purple", "#7a67df"], ["blue-soft", "#d4eefb"], ["ink", "#213b2e"]]) {
    assert.ok(tokens.includes(`--${token}: ${colour};`), `--${token} is ${colour}`);
    assert.ok(fills[colour], `the icon uses --${token}`);
  }
  const rect = /M(\d+) (\d+)h(\d+)v(\d+)(?:h-\d+|H\d+)z/g;
  const sparkle = pixelIcon("sparkle").match(/<path d="([^"]+)"/)[1];
  const door = [...cells(sparkle, /M(\d+) (\d+)h(\d+)v(1)h-\d+z/g)].map((xy) => xy.split(",").map(Number)).map(([x, y]) => `${x + 2},${y + 2}`);
  assert.deepEqual([...cells(fills["#7a67df"], rect)].sort(), door.sort(), "the door's sparkle, pixel for pixel, with a pixel of blue around it");
  const frame = cells(fills["#213b2e"], rect);
  assert.equal(frame.size, 4 * 14);
  for (const corner of ["0,0", "15,0", "0,15", "15,15"]) assert.ok(!frame.has(corner), "notched corners, like --px-frame");
  for (let i = 1; i < 15; i++) for (const xy of [`${i},0`, `${i},15`, `0,${i}`, `15,${i}`]) assert.ok(frame.has(xy), xy);
  assert.equal(fills["#d4eefb"], "M1 1h14v14H1z");
});

test("with its Sepolia contracts, the page says the World takes a testnet wallet and no real money", () => {
  for (const lang of ["en", "zh"]) {
    const c = copyFor(lang);
    const html = pageHtml(lang, { chain: CHAIN });
    assert.match(html, /<div id="world-game" class="world-game"><\/div>/);
    assert.ok(html.includes(`${c.heroLead}${lang === "zh" ? "" : " "}${c.heroLeadChain}</p>`), "the lead says what the wallet is for, with no space after a Chinese full stop");
    for (const [, text] of c.chipsChain) assert.ok(html.includes(text), text);
    assert.match(html, lang === "zh" ? /连接钱包 · Sepolia 测试网/ : /Connect a wallet · Sepolia testnet/);
    assert.match(html, lang === "zh" ? /不涉及真钱/ : /No real money/);
    assert.doesNotMatch(html, /只读 · 无需钱包|Read-only · No wallet/, "no longer claims to need no wallet");
    assert.doesNotMatch(html, /sign in|登录|mainnet|主网/i);
  }
  assert.equal(pageHtml("en"), pageHtml("en", { chain: WORLD_CHAIN }), "the page follows site/src/world-chain.js");
});

test("the World's Sepolia deployment is unset, or complete and on the official SqueekChain contracts", () => {
  if (WORLD_CHAIN === null) return;
  assert.deepEqual(Object.keys(WORLD_CHAIN).sort(), Object.keys(CHAIN).sort());
  assert.equal(WORLD_CHAIN.chainId, record.chainId);
  assert.equal(WORLD_CHAIN.core, record.contracts.SqueekCore.address, "SqueekCore from the bundled deployment record");
  assert.equal(WORLD_CHAIN.sqk, record.contracts.SqueekToken.address, "SQK from the bundled deployment record");
  assert.equal(WORLD_CHAIN.explorer, "https://sepolia.etherscan.io");
  const own = [WORLD_CHAIN.sqb, WORLD_CHAIN.minter, WORLD_CHAIN.shop, ...(WORLD_CHAIN.faucet === null ? [] : [WORLD_CHAIN.faucet])];
  for (const at of own) assert.match(at, /^0x[0-9a-f]{40}$/, "lowercase addresses, as the deploy page prints them");
  const official = Object.values(record.contracts).map((contract) => contract.address);
  assert.equal(new Set([...own, ...official]).size, own.length + official.length, "the World's own contracts are new ones");
  const rpc = new URL(WORLD_CHAIN.rpcUrl);
  assert.equal(rpc.protocol, "https:");
  assert.ok(csp(read("../public/index.html")).split(";").find((part) => part.trim().startsWith("connect-src")).trim().split(/\s+/).includes(rpc.origin), "the CSP lets the World read its node");
});

test("the language choice is shared with the main site and fails safe", () => {
  assert.equal(readLanguage({ getItem: (key) => (key === "squeek-pulse-language-v2" ? "zh" : null) }), "zh");
  assert.equal(readLanguage({ getItem: () => "fr" }), "en");
  assert.equal(readLanguage({ getItem: () => { throw new Error("blocked"); } }), "en");
});

test("the World's page reads only the official API and the public Sepolia node, and builds as its own site", () => {
  const html = read("../public/index.html");
  assert.equal(csp(html), "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self' https://api.squeekchain.com https://ethereum-sepolia-rpc.publicnode.com; font-src 'self'; object-src 'none'; base-uri 'self'; form-action 'none'", "squeekpulse.xyz's pet page policy plus one exact origin, the public Sepolia node the World reads its contracts through");
  assert.match(html, /src="\/world\.js"/);
  assert.match(html, /href="\/styles\.css"/);
  assert.match(html, /<link rel="canonical" href="https:\/\/world\.squeekpulse\.xyz\/" \/>/);
  assert.match(html, /<title>🐹 Squeek Pet World<\/title>/, "its own name, not Squeek Pulse's");
  for (const page of [html, read("../public/404.html")]) assert.match(page, /<link rel="icon" href="\/world\.svg" type="image\/svg\+xml" \/>/, "and its own icon");
  const build = read("../build.mjs");
  assert.match(build, /entryPoints: \[site\("src\/world-page\.js"\)\]/);
  assert.match(build, /await cp\(site\("public"\), OUT, \{ recursive: true \}\);/, "public/ is copied as it is");
  assert.match(build, /"src\/world-page\.css"/);
  const fonts = read("../subset-fonts.py");
  assert.match(fonts, /SITE \/ "public" \/ "\*\*" \/ "\*\.html"/, "the font subset covers every page in public/");
  assert.match(fonts, /REPO \/ "src" \/ "\*\*" \/ "\*\.ts"/, "and the game's own texts");
});

test("the game, built from src/world, only asks the player's own wallet", async () => {
  // dist-game/squeek-world.js, which `npm test` builds (`npm run build:game`) before these tests.
  const game = read("../../dist-game/squeek-world.js");
  assert.match(game.split("\n")[0], /^\/\*! Squeek Pet World [\d.]+ \(squeek-world (?:[0-9a-f]{7,40}(?:-dirty)?|unknown)\), MIT License\.$/, "the banner names the commit it was built from");
  // No key handling, and no raw message signing: the wallet signs only the typed EIP-2612 permits it shows.
  assert.doesNotMatch(game, /privateKey|mnemonic|seed ?phrase|personal_sign|"eth_sign"|eth_signTransaction|window\.ethereum/i);
  // Everything that needs the player goes through the wallet the player picked (EIP-6963), where they confirm it.
  const asked = new Set([...game.matchAll(/method: ([^,\n]+),/g)].flatMap((m) => [...m[1].matchAll(/"([a-z]+_\w+)"/g)].map((name) => name[1])));
  assert.deepEqual([...asked].sort(), [
    "eth_accounts",
    "eth_chainId",
    "eth_requestAccounts",
    "eth_sendTransaction",
    "eth_signTypedData_v4",
    "wallet_addEthereumChain",
    "wallet_revokePermissions",
    "wallet_switchEthereumChain",
  ]);
  assert.doesNotMatch(game, /eth_sendRawTransaction/, "the public node is only read");
  const hosts = new Set([...game.matchAll(/https:\/\/([a-z0-9.-]+)/gi)].map((m) => m[1]));
  assert.deepEqual([...hosts].sort(), [
    "api.squeekchain.com",
    "cloud.google.com",
    "eth-sepolia.blockscout.com",
    "ethereum-sepolia-rpc.publicnode.com",
    "github.com",
    "sepolia.etherscan.io",
  ], "reads the official API and the Sepolia node; links the explorers, a Sepolia ETH faucet and its source");
  const { mountWorld } = await import("../../dist-game/squeek-world.js");
  assert.equal(typeof mountWorld, "function");
});
