// The one language choice (English or Chinese) that Squeek Pulse and Squeek Pet
// World share. Browsers keep storage per site, and the World is its own site on
// world.squeekpulse.xyz, so each site remembers the choice for itself. Links
// between the two sites carry a visitor's explicit choice as ?lang=, and the
// page that opens keeps it and takes it out of the address bar. A visitor who
// never chose reads English, and no link passes that default on.
export const LANGUAGE_KEY = "squeek-pulse-language-v2";

const known = (value) => (value === "zh" || value === "en" ? value : null);

/** The choice this browser remembers for this site, or null when the visitor never chose. */
export function storedLanguage(storage) {
  try {
    return known((storage ?? globalThis.localStorage)?.getItem(LANGUAGE_KEY));
  } catch {
    return null;
  }
}

/**
 * Keeps the choice a link from the other site carried (?lang=zh or ?lang=en)
 * and removes it from the address, leaving the rest of the URL as it was.
 * Returns that language, or null when the address carries none.
 */
export function adoptLanguage({ location = globalThis.location, history = globalThis.history, storage } = {}) {
  let url;
  try {
    url = new URL(location?.href);
  } catch {
    return null;
  }
  if (!url.searchParams.has("lang")) return null;
  const lang = known(url.searchParams.get("lang"));
  url.searchParams.delete("lang");
  try {
    history?.replaceState(history.state, "", `${url.pathname}${url.search}${url.hash}`);
  } catch {}
  if (lang) {
    try {
      (storage ?? globalThis.localStorage)?.setItem(LANGUAGE_KEY, lang);
    } catch {}
  }
  return lang;
}

/** A link to the other site that carries this visitor's explicit choice, if they made one. */
export function crossSiteHref(href, storage) {
  const lang = storedLanguage(storage);
  if (!lang) return href;
  const url = new URL(href);
  url.searchParams.set("lang", lang);
  return url.href;
}
