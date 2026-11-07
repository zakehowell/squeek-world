import { t, type Language } from "./i18n";

export function formatAgo(ms: number, language: Language): string {
  const seconds = Math.max(0, Math.round(ms / 1000));
  if (seconds < 3) return t(language, "ago.now");
  if (seconds < 60) return t(language, "ago.seconds", { n: String(seconds) });
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return t(language, "ago.minutes", { n: String(minutes) });
  const hours = Math.floor(minutes / 60);
  if (hours < 48) return t(language, "ago.hours", { n: String(hours) });
  return t(language, "ago.days", { n: String(Math.floor(hours / 24)) });
}
