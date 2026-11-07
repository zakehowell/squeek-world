// The four figures of the whitepaper's web version, drawn in HTML and CSS
// (whitepaper.css) rather than as pictures, so their pixel type stays crisp and
// they reflow on phones. Each figure exists in Chinese and English with the
// same structure; the Claude Doc draws the same four as charts.
//
// A figure's text is trusted copy written here, so it is not escaped.

const node = (title, body, extra = "") => `<li class="wp-node${extra ? ` ${extra}` : ""}"><strong>${title}</strong><span>${body}</span></li>`;

const COPY = {
  zh: {
    label: (n) => `图 ${n}`,
    architecture: {
      title: "官方数据只读；游戏在浏览器里，经济在四个合约里",
      note: "玩家的每笔交易都在自己的钱包里确认，页面碰不到私钥。",
      official: "SqueekChain 官方 · 我们只读",
      chain: [
        ["仓鼠跑轮", "Squeektoshi 的运动"],
        ["SqueekCore", "每 10 分钟结算一轮"],
        ["公开 API", "api.squeekchain.com"],
        ["SQK", "官方代币，上限 21 亿枚"],
      ],
      readsWork: "SqbMinter 读取累计工作量",
      readsEvents: "World 网页读取结算事件",
      contracts: "我们的四个合约 · Sepolia",
      contractNodes: [
        ["SqbToken", "SQB，零预挖"],
        ["SqbMinter", "质押 SQK，铸出 SQB"],
        ["WorldShop", "付款全部销毁"],
        ["SqkFaucet", "测试网 SQK 水龙头"],
      ],
      tx: "交易",
      txNote: "玩家在钱包里确认",
      browser: "玩家的浏览器",
      browserNodes: [
        ["World 网页", "静态网站，没有服务器"],
        ["回合重放", "每笔结算只计一次"],
        ["玩家钱包", "每笔交易由玩家确认"],
        ["本地存档", "数据豆和游戏进度"],
      ],
    },
    flows: {
      title: "SQB 只按仓鼠的已结算工作量铸造，花掉就销毁",
      note: "每 10 个已结算工作单位：每个玩家得 1 颗数据豆，全网铸 1 枚 SQB。三种货币之间没有兑换通道。",
      lanes: [
        {
          name: "数据豆",
          tag: "本地 · 免费",
          kind: "beans",
          steps: [
            ["仓鼠的已结算工作量", "每 10 个工作单位，每个玩家各得 1 颗"],
            ["家园 · 升级 · 探险 · 公会", "全部日常玩法；存档只在玩家的设备上"],
            ["花掉就消失", "不上链，也不能换成 SQB", "wp-node-end"],
          ],
        },
        {
          name: "SQB",
          tag: "我们的代币 · 零预挖",
          kind: "sqb",
          steps: [
            ["仓鼠的已结算工作量", "每 10 个工作单位，全网铸 1 枚"],
            ["SqbMinter 铸币合约", "读 SqueekCore 的 state()，每轮最多铸 1,000 枚", "wp-node-accent"],
            ["质押者的钱包", "按质押 SQK 的比例，24 小时内按秒发完"],
            ["SQB 商店", "公会战补给 · 地契装修 · 赛季装饰"],
          ],
        },
        {
          name: "SQK",
          tag: "SqueekChain 官方",
          kind: "sqk",
          steps: [
            ["官方挖矿", "按 Squeek 区块产出，上限 21 亿枚"],
            ["SQK 持有者", "可以质押进 SqbMinter 分 SQB，随时取回"],
            ["SQK 商店", "家园地契（共 100 块）· 公会旗"],
          ],
        },
      ],
      burn: "销毁",
      burnNote: "每一笔 SQB 和 SQK 消费都让总量减少：SQB 用 burnFrom()，SQK 用 SQK 合约自带的 burn()",
    },
    beans: {
      title: "仓鼠每天产出约 1,009 颗数据豆，7 天里在 799 到 1,329 之间",
      note: "每天 = 北京时间 20:00 到次日 20:00；1 颗 = 10 个已结算工作单位，未含建筑加成；全网 SQB 日产量与此相同。",
      mean: "7 天平均 1,009",
      unit: (n) => `${n} 颗`,
      source: "来源：SqueekChain /v1/settlements?range=7d，上一个部署 2026-10-28 20:00 至 11-04 20:00（北京时间）",
    },
    roadmap: {
      title: "前两个阶段已完成；上主网之前要先过审计和法律评估",
      note: "阶段等宽，不按时间比例；菱形是进入下一阶段前要过的关口。",
      phases: [
        ["1", "可玩的 World", "已完成 · 2026-11-06", ["四种玩法全部跑通", "只用数据豆，没有合约"], "done"],
        ["2", "上链", "已完成 · 2026-11-07", ["合约部署到 Sepolia", "World 连接玩家钱包"], "done"],
        ["3", "测试网试运行", "进行中 · 2026-11-07 起", ["铸币量和结算对得上", "11-12 用新数据复核"], "now"],
        ["4", "主网", "未定", ["通过关口后才开始"], "later"],
      ],
      gates: [
        ["核对 SqueekCore", "部署前，已通过"],
        ["第三方审计 + 法律评估", "主网之前必须完成"],
      ],
    },
  },
  en: {
    label: (n) => `Figure ${n}`,
    architecture: {
      title: "Official data is only read; the game runs in the browser and the economy in four contracts",
      note: "Players confirm every transaction in their own wallet; the page never touches a private key.",
      official: "SqueekChain, official · read only",
      chain: [
        ["Hamster wheel", "Squeektoshi's runs"],
        ["SqueekCore", "Settles a round every 10 minutes"],
        ["Public API", "api.squeekchain.com"],
        ["SQK", "Official token, 2.1 billion cap"],
      ],
      readsWork: "SqbMinter reads cumulative work",
      readsEvents: "The World page reads settlements",
      contracts: "Our four contracts · Sepolia",
      contractNodes: [
        ["SqbToken", "SQB, no premine"],
        ["SqbMinter", "Stake SQK, mint SQB"],
        ["WorldShop", "Every payment burned"],
        ["SqkFaucet", "Testnet SQK faucet"],
      ],
      tx: "Transactions",
      txNote: "confirmed in the player's wallet",
      browser: "The player's browser",
      browserNodes: [
        ["World page", "Static site, no server"],
        ["Turn replay", "Each settlement counts once"],
        ["Player's wallet", "Confirms every transaction"],
        ["Local save", "Data beans and progress"],
      ],
    },
    flows: {
      title: "SQB is minted only from the hamster's settled work and burned when spent",
      note: "Every 10 settled work units: 1 data bean for every player and 1 SQB minted network-wide. There is no exchange between the three currencies.",
      lanes: [
        {
          name: "Data beans",
          tag: "Local · free",
          kind: "beans",
          steps: [
            ["The hamster's settled work", "1 per 10 work units, for every player"],
            ["Home · upgrades · expeditions · guilds", "All everyday play; the save stays on the player's device"],
            ["Gone once spent", "Never on chain, and never turned into SQB", "wp-node-end"],
          ],
        },
        {
          name: "SQB",
          tag: "Our token · no premine",
          kind: "sqb",
          steps: [
            ["The hamster's settled work", "1 per 10 work units, network-wide"],
            ["SqbMinter, the minting contract", "Reads SqueekCore's state(); at most 1,000 per round", "wp-node-accent"],
            ["Stakers' wallets", "Split by SQK staked, paid by the second over 24 hours"],
            ["SQB shop", "Guild war supplies · deed renovations · season decorations"],
          ],
        },
        {
          name: "SQK",
          tag: "Official SqueekChain token",
          kind: "sqk",
          steps: [
            ["Official mining", "Per Squeek block, capped at 2.1 billion"],
            ["SQK holders", "Can stake in SqbMinter for a share of SQB, and withdraw any time"],
            ["SQK shop", "Home deeds (100 in all) · guild banners"],
          ],
        },
      ],
      burn: "Burned",
      burnNote: "Every SQB and SQK purchase shrinks the supply: SQB with burnFrom(), SQK with the SQK contract's own burn()",
    },
    beans: {
      title: "The hamster makes about 1,009 data beans a day, between 799 and 1,329 over 7 days",
      note: "Each day runs from 20:00 to 20:00 Beijing time (12:00 UTC); 1 bean = 10 settled work units, before building bonuses; the network mints the same amount of SQB each day.",
      mean: "7-day average 1,009",
      unit: (n) => n,
      source: "Source: SqueekChain /v1/settlements?range=7d, previous deployment, 2026-10-28 12:00 to 11-04 12:00 UTC",
    },
    roadmap: {
      title: "The first two phases are done; mainnet needs an audit and a legal review first",
      note: "Phases are drawn the same width, not to scale; the diamonds are the gates before the next phase.",
      phases: [
        ["1", "A playable World", "Done · 2026-11-06", ["All four kinds of play work", "Data beans only, no contracts"], "done"],
        ["2", "On chain", "Done · 2026-11-07", ["Contracts deployed to Sepolia", "The World connects players' wallets"], "done"],
        ["3", "Testnet trial", "In progress · from 2026-11-07", ["Minting matches settlements", "Numbers reviewed with new data on 11-12"], "now"],
        ["4", "Mainnet", "Not scheduled", ["Starts only after the gate"], "later"],
      ],
      gates: [
        ["Check SqueekCore", "Before deployment, passed"],
        ["Third-party audit + legal review", "Required before mainnet"],
      ],
    },
  },
};

/** Data beans a day over the last 7 days of the previous deployment (SqueekChain /v1/settlements?range=7d). */
export const DAILY_BEANS = [
  ["10/28", 1058],
  ["10/29", 1329],
  ["10/30", 1256],
  ["10/31", 850],
  ["11/01", 898],
  ["11/02", 872],
  ["11/03", 799],
];
/** The chart's scale: the longest bar is 1,329 of 1,400. */
const SCALE = 1400;
const pct = (value) => `${((value / SCALE) * 100).toFixed(2)}%`;
const thousands = (value) => value.toLocaleString("en-US");

function frame(n, kind, copy, label, body) {
  const id = `figure-${n}`;
  return `<figure class="wp-figure wp-figure-${kind}" id="${id}" aria-labelledby="${id}-title">
<figcaption><span class="wp-fig-label">${label}</span><strong id="${id}-title">${copy.title}</strong><span class="wp-fig-note">${copy.note}</span></figcaption>
${body}
</figure>`;
}

function architecture(c) {
  const a = c.architecture;
  return `<div class="wp-arch">
<div class="wp-layer wp-layer-official"><p class="wp-layer-name">${a.official}</p><ol class="wp-nodes wp-nodes-chain">${a.chain.map(([t, b]) => node(t, b)).join("")}</ol></div>
<div class="wp-reads"><p class="wp-read wp-read-work"><span class="wp-arrow" aria-hidden="true">↓</span>${a.readsWork}</p><p class="wp-read wp-read-events"><span class="wp-arrow" aria-hidden="true">↓</span>${a.readsEvents}</p></div>
<div class="wp-pair">
<div class="wp-layer wp-layer-contracts"><p class="wp-layer-name">${a.contracts}</p><ul class="wp-nodes wp-nodes-2">${a.contractNodes.map(([t, b]) => node(t, b)).join("")}</ul></div>
<p class="wp-tx"><span class="wp-arrow wp-arrow-side" aria-hidden="true">←</span><span class="wp-arrow wp-arrow-up" aria-hidden="true">↑</span><strong>${a.tx}</strong><small>${a.txNote}</small></p>
<div class="wp-layer wp-layer-browser"><p class="wp-layer-name">${a.browser}</p><ul class="wp-nodes wp-nodes-2">${a.browserNodes.map(([t, b]) => node(t, b)).join("")}</ul></div>
</div>
</div>`;
}

function flows(c) {
  const f = c.flows;
  const lane = (l) =>
    `<section class="wp-lane wp-lane-${l.kind}" aria-label="${l.name}"><p class="wp-lane-name"><span class="wp-coin">${l.name}</span>${l.tag}</p><ol class="wp-nodes wp-steps">${l.steps.map(([t, b, extra]) => node(t, b, extra)).join("")}</ol></section>`;
  return `<div class="wp-flows">
${f.lanes.map(lane).join("\n")}
<p class="wp-burn"><strong>${f.burn}</strong><span>${f.burnNote}</span></p>
</div>`;
}

function dailyBeans(c) {
  const b = c.beans;
  const mean = DAILY_BEANS.reduce((sum, [, beans]) => sum + beans, 0) / DAILY_BEANS.length;
  const bar = (beans) =>
    `<svg class="wp-bar" width="100%" height="28" aria-hidden="true" focusable="false"><rect class="wp-bar-fill" x="0" y="6" width="${pct(beans)}" height="16"/><line class="wp-bar-mean" x1="${pct(mean)}" x2="${pct(mean)}" y1="0" y2="28"/></svg>`;
  const rows = DAILY_BEANS.map(([day, beans]) => `<li><span class="wp-bar-day">${day}</span>${bar(beans)}<span class="wp-bar-value">${c.beans.unit(thousands(beans))}</span></li>`).join("");
  const axis = `<li class="wp-bar-axis" aria-hidden="true"><span></span><svg class="wp-bar" width="100%" height="20" focusable="false"><text class="wp-bar-mean-label" x="${pct(mean)}" y="14" text-anchor="middle">${b.mean}</text></svg><span></span></li>`;
  return `<ol class="wp-bars">${rows}${axis}</ol>
<p class="wp-fig-source">${b.source}</p>`;
}

function roadmap(c) {
  const r = c.roadmap;
  const phase = ([n, name, status, items, state]) =>
    `<li class="wp-phase wp-phase-${state}"><p class="wp-phase-num">${n}</p><strong>${name}</strong><span class="wp-phase-status">${status}</span><ul>${items.map((item) => `<li>${item}</li>`).join("")}</ul></li>`;
  const gate = ([name, state], i) => `<li class="wp-gate wp-gate-${i + 1}"><span class="wp-diamond" aria-hidden="true">◆</span><strong>${name}</strong><span>${state}</span></li>`;
  const [p1, p2, p3, p4] = r.phases;
  return `<ol class="wp-road">${[phase(p1), phase(p2), gate(r.gates[0], 0), phase(p3), gate(r.gates[1], 1), phase(p4)].join("")}</ol>`;
}

const FIGURES = {
  architecture: [architecture, "architecture"],
  flows: [flows, "flows"],
  "daily-beans": [dailyBeans, "beans"],
  roadmap: [roadmap, "roadmap"],
};
export const FIGURE_ORDER = Object.keys(FIGURES);

/** One figure of the whitepaper in one language, as an HTML block. */
export function figure(name, lang) {
  if (!FIGURES[name]) throw new Error(`No figure called ${name}`);
  const [draw, key] = FIGURES[name];
  const c = COPY[lang];
  const n = FIGURE_ORDER.indexOf(name) + 1;
  return frame(n, name, c[key], c.label(n), draw(c));
}
