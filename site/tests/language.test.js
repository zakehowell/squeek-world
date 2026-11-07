import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { LANGUAGE_KEY, adoptLanguage, crossSiteHref, storedLanguage } from "../src/language.js";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const memory = (initial = {}) => {
  const items = { ...initial };
  return { items, getItem: (key) => items[key] ?? null, setItem: (key, value) => { items[key] = String(value); } };
};
const visit = (href) => {
  const calls = [];
  return { calls, location: { href }, history: { state: { kept: true }, replaceState: (...args) => calls.push(args) } };
};

test("a link from the other site carries the language, which the page keeps and takes out of the address", () => {
  const storage = memory();
  const zh = visit("https://squeekpulse.xyz/dashboard/?range=7d&lang=zh#owners");
  assert.equal(adoptLanguage({ location: zh.location, history: zh.history, storage }), "zh");
  assert.equal(storage.items[LANGUAGE_KEY], "zh", "remembered for this site");
  assert.deepEqual(zh.calls, [[{ kept: true }, "", "/dashboard/?range=7d#owners"]], "the rest of the address stays as it was");
  const en = visit("https://world.squeekpulse.xyz/?lang=en");
  assert.equal(adoptLanguage({ location: en.location, history: en.history, storage }), "en");
  assert.equal(storage.items[LANGUAGE_KEY], "en");
  assert.deepEqual(en.calls[0].slice(1), ["", "/"]);
});

test("an unknown or missing language changes nothing that was chosen before", () => {
  const storage = memory({ [LANGUAGE_KEY]: "zh" });
  const unknown = visit("https://world.squeekpulse.xyz/?lang=fr");
  assert.equal(adoptLanguage({ location: unknown.location, history: unknown.history, storage }), null);
  assert.equal(storage.items[LANGUAGE_KEY], "zh");
  assert.deepEqual(unknown.calls[0].slice(1), ["", "/"], "an unknown value still leaves the address");
  const none = visit("https://world.squeekpulse.xyz/#main");
  assert.equal(adoptLanguage({ location: none.location, history: none.history, storage }), null);
  assert.deepEqual(none.calls, [], "an address without ?lang= is left alone");
  assert.equal(adoptLanguage({ location: undefined, history: undefined, storage }), null, "no address outside a browser");
});

test("blocked storage or history never breaks a page", () => {
  const blocked = { getItem() { throw new Error("blocked"); }, setItem() { throw new Error("blocked"); } };
  const history = { state: null, replaceState() { throw new Error("blocked"); } };
  assert.equal(adoptLanguage({ location: { href: "https://squeekpulse.xyz/?lang=zh" }, history, storage: blocked }), "zh", "the page still opens in the carried language");
  assert.equal(storedLanguage(blocked), null);
  assert.equal(crossSiteHref("https://world.squeekpulse.xyz/", blocked), "https://world.squeekpulse.xyz/");
});

test("links to the other site carry only a choice the visitor made", () => {
  assert.equal(crossSiteHref("https://world.squeekpulse.xyz/", memory()), "https://world.squeekpulse.xyz/", "the English default is not passed on");
  assert.equal(crossSiteHref("https://world.squeekpulse.xyz/", memory({ [LANGUAGE_KEY]: "zh" })), "https://world.squeekpulse.xyz/?lang=zh");
  assert.equal(crossSiteHref("https://squeekpulse.xyz/dashboard/#owners", memory({ [LANGUAGE_KEY]: "en" })), "https://squeekpulse.xyz/dashboard/?lang=en#owners");
  assert.equal(crossSiteHref("https://squeekpulse.xyz/", memory({ [LANGUAGE_KEY]: "fr" })), "https://squeekpulse.xyz/");
  assert.equal(crossSiteHref("https://squeekpulse.xyz/", memory({ "squeek-pulse-language": "zh" })), "https://squeekpulse.xyz/", "only the current key counts");
});

test("the World reads the same key as squeekpulse.xyz and keeps a carried language before its first read", () => {
  assert.equal(LANGUAGE_KEY, "squeek-pulse-language-v2");
  const source = read("../src/world-page.js");
  assert.match(source, /const LANGUAGE_KEY = "squeek-pulse-language-v2";/);
  assert.match(source, /lang: adoptLanguage\(\) \?\? readLanguage\(\)/);
});
