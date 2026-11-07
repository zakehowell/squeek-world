// The languages the World speaks, and the few shared texts it takes from the
// squeek-pet desktop pet (src/core/i18n.ts there): how long ago something
// happened. The World's own texts are in src/world/i18n.ts and i18n-chain.ts.
export type Language = "en" | "zh";

const en = {
  "ago.now": "just now",
  "ago.seconds": "{n}s ago",
  "ago.minutes": "{n}m ago",
  "ago.hours": "{n}h ago",
  "ago.days": "{n}d ago",
};

type Key = keyof typeof en;

const zh: Record<Key, string> = {
  "ago.now": "刚刚",
  "ago.seconds": "{n} 秒前",
  "ago.minutes": "{n} 分钟前",
  "ago.hours": "{n} 小时前",
  "ago.days": "{n} 天前",
};

const tables: Record<Language, Record<Key, string>> = { en, zh };

export type MessageKey = Key;

export function t(language: Language, key: MessageKey, values: Record<string, string> = {}): string {
  const template = tables[language][key] ?? en[key];
  return template.replace(/\{(\w+)\}/g, (match, name: string) => values[name] ?? match);
}
