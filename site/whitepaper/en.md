# Squeek Pet World Whitepaper

Version 1.0 · 7 November 2026

Squeek Pet World is a web game driven by a real hamster: each time SqueekChain settles a batch of wheel work on the Sepolia testnet, the world moves forward one turn. This is version 1.0. It describes the game's design, its turns, its two-token economy, its smart contracts and its risks. Where the Chinese and English versions differ, the Chinese version prevails.

## Summary

Squeek Pet World turns the settled exercise of Squeektoshi, a real hamster, into a small world you can look after: the more it runs, the bigger the home, the further the trips and the faster the guild boss falls. The game plays right in the browser, with nothing to download and no server.

The economy has three layers. Everyday play uses only local data beans, which are free and cannot be traded. On chain there are two tokens: SQK, SqueekChain's official token, and SQB, which we issue. They buy only optional on-chain assets, never game progress. SQB has no premine and is minted only from the hamster's settled work, so its total output does not grow with the number of players. Both tokens are burned when spent.

The project runs only on the Sepolia testnet. Its tokens have no real value; nothing is sold and no money is raised. It is an independent community project, not an official SqueekChain product.

| Item | Details |
| --- | --- |
| Game | A web game at [world.squeekpulse.xyz](https://world.squeekpulse.xyz/); the trial world plays without a wallet |
| Driven by | The wheel of Squeektoshi, the real hamster; every batch SqueekCore settles is one turn |
| Play | Home, upgrades, expeditions, guilds (one shared boss each week) |
| Currencies | Data beans (local, free); SQB (our ERC-20, no premine); SQK (SqueekChain's official ERC-20) |
| Contracts | SqbToken, SqbMinter, WorldShop, SqkFaucet, deployed to Sepolia on 2026-11-07 |
| Status | Testnet trial, started 2026-11-07 |

## 1. Introduction

### 1.1 Background

SqueekChain is a project on the Ethereum Sepolia testnet. It records the wheel runs of Squeektoshi, a real hamster, in rounds of 10 minutes, and its SqueekCore contract settles them on chain in batches. Its official token, SQK, is mined per Squeek block, with a cap of 2.1 billion. Settlement records can be read through the public API (api.squeekchain.com) and from the contracts on chain.

Squeek Pet World is built only on this public data: it reads the public API and contracts, relies on no private interface and changes nothing in the official contracts.

### 1.2 The problem

Blockchain games often fail through a death spiral: the game token is issued in step with the number of players and the time they play, and demand comes mostly from new players arriving. When fewer arrive, the price falls, earnings shrink, players leave and the price falls faster. Section 5.5 sets out how we avoid it.

Meanwhile, a real hamster's wheel data is fun to watch, but there is nothing to do with it. Squeek Pet World gives players a reason to come back every day: when the hamster runs, the world grows.

Our approach: all output comes from one hamster's settled work, which has a natural ceiling and does not grow with the number of players; everyday play is free and runs locally; only optional, scarce assets go on chain.

### 1.3 Design principles

The first three are hard limits that no version will break:

1. One source: every batch SqueekCore settles (one BatchSettled event) is one turn; data beans and SQB come only from settled work.
2. Paid once: each turn counts once. Refreshing, reconnecting, replaying or a chain reorganisation never pays a reward twice.
3. Players keep their wallets: the World connects only to the player's own browser wallet, and only on the Sepolia testnet. The player confirms every transaction and signature in the wallet, and the page never touches a private key. Squeek Pet, the desktop pet, is read-only and connects no wallet.
4. The whole game is free: everyday play uses only data beans; SQB and SQK buy only optional on-chain assets, never progress.
5. No server: the world is computed from public data by fixed rules, so anyone who replays it on any device gets the same world.
6. Testnet first: the World runs only on Sepolia; a third-party audit and a legal review must come before any mainnet launch.

### 1.4 Current status

As of 2026-11-07, the World is live on its own site, world.squeekpulse.xyz, its four contracts are deployed on Sepolia and the testnet trial has begun. On-chain readings (2026-11-07 02:57 UTC, Sepolia block 12,080,845): the total supply of SQB is 0, as nobody has staked yet; no deeds have been sold; the testnet SQK faucet holds 0 and is waiting to be topped up.

## 2. System architecture

### 2.1 Components

[[figure:architecture]]

The system has three layers. SqueekChain's official layer records and settles the hamster's exercise, and we only read it. The game layer runs in the player's browser and keeps its save there. The on-chain economy is our four contracts, which players use with their own wallets.

### 2.2 Data sources

| Data | Source | Used for |
| --- | --- | --- |
| Settlement events | `/v1/events?category=protocol` | Turns: only `system.settlement_completed` with 12 block confirmations |
| 30-day settlement stats | `/v1/settlements?range=30d` | The weekly boss's work damage; one bucket a day from 12:00 UTC, which lines up with the seasons |
| Community activity | `/v1/events?category=players` | One source of boss damage; only the type and time are used |
| Milestones | `/v1/events?category=measurement` | One source of boss damage |
| Live wheel status | `/v1/status` | The live hamster on the page; shown only, never counted as a turn |
| On-chain state | SqueekCore, SQK and our contracts | SQB minting, staking, deeds and guilds; read through a public RPC or the player's wallet |

The API is at [api.squeekchain.com](https://api.squeekchain.com/v1/settlements?range=30d). Its public paths are under `/v1`, and each response gives its version in `schemaVersion`. Since the new deployment of 2026-11-05 (core-sepolia-20261103), the event stream is version 4 and every settlement carries its release and contract addresses; the World accepts only settlements from the current release.

### 2.3 What lives on chain and what stays local

| What | Where it is kept | Who can change it |
| --- | --- | --- |
| Garden, buildings, expeditions, guild contribution | The player's browser, one copy per wallet | Only the player; editing the save changes only their own world |
| Data beans, dream dew and materials | Same | Same; they cannot be transferred or turned into SQB |
| SQB balances and staked SQK | SqbToken and SqbMinter on Sepolia | Only the holder; only the staker can withdraw staked SQK |
| Home deeds, renovations, decorations, guilds, supply records | WorldShop on Sepolia | As the contract's rules say; WorldShop has no owner |
| Public guild war ranking | Computed from the on-chain supply records | Anyone can check it |

## 3. Turns

### 3.1 Turns

Each settlement is one turn, and each turn pays out once. The same settlement records replayed on any device give the same world.

- Running turns (day): turns with work. They bring data beans while SQB is minted network-wide, move expeditions forward, damage the boss and grow sunflowers.
- Resting turns (night): turns without work. They bring dream dew and grow water lilies and moonflowers; expeditions camp and guilds keep night watch. Resting never takes anything away.
- Unsettled exercise: shown only as "on the way", and counted once SqueekCore settles it.

In this paper, the baseline is the real data from the last 7 days of the previous deployment (up to 2026-11-04 12:00 UTC): 998 settlements, 166 of them running turns, with 70,657 work units in all. That is on average about 143 turns a day, about 24 running and about 119 resting, and about 10,094 work units a day. The world is night most of the time, so resting turns must produce something. On 2026-11-05 SqueekChain switched to a new deployment, and rounds and cumulative work started again from zero. It is still the same hamster, so this paper keeps the baseline and will review it once the new deployment has run for 7 days (2026-11-12).

### 3.2 Processing

1. Read: only `system.settlement_completed` from the public event stream, which already has 12 block confirmations (safe). A settlement with no work still counts as a turn: a resting turn.
2. Record: settlements are deduplicated by event ID, so each is recorded once however often it is read.
3. Catch up: the World is a web page and does not run while it is closed. When the page opens again it reads back about two weeks of settlements; turns too old to read back count as a gap, with no rewards and no losses.
4. Reorganisation: if Sepolia replaces a recorded turn with another settlement, the World replaces it and replays from there; each round still counts once.
5. Replay: world = initial state + turns + player choices, replayed in order. A choice made when the world is settled up to round N takes effect before round N+1.
6. Randomness: expedition finds, the companions you meet and the boss's mood are all set by the block hash, transaction hash and log index of the settlement. Nobody knows them before the settlement is on chain, and after that everyone who replays it gets the same result.
7. Rule changes: a change applies only to turns after it. Before a change, the existing turns are folded into a checkpoint, so nothing that already happened is changed.

### 3.3 Fairness

Saves are local, and editing one affects only your own world: data beans cannot become SQB, and public rankings count only on-chain records. Random outcomes come from the settlements themselves, so neither players nor the project can know them in advance or change them afterwards. Anyone can replay the public data and check that they get the same world.

## 4. Gameplay

### 4.1 Four kinds of play

Squeektoshi's settlements drive everything in the world: running turns by day bring data beans and steps, resting turns by night bring dream dew. Players use them in four kinds of play.

| Play | What players do | Driven by | Main output |
| --- | --- | --- | --- |
| Home | Unlock 5 areas, grow 6 crops, build 8 buildings | Running and resting turns | Crops, dream dew, data bean bonuses |
| Upgrades | Take every building from level 1 to level 3 | Data beans and materials | More output, more gear slots |
| Expeditions | Pick a route, take gear, choose safe or risky at the fork | Settled work = steps | Wood, pebbles, star crystals, seeds |
| Guilds | Each week pick a guild, a class and an action, and fight the shared boss together | Settled work + community activity on chain | Season chests |

### 4.2 Home

Home is where most data beans go. Five areas unlock in turn, from the Meadow to the Starlight Ruins, and each brings new garden beds, crops and buildings; players who hold an on-chain home deed get 1 more bed.

Crops come in three kinds: those that grow only while the hamster runs, those that grow only while it rests, and those that grow day and night. Each settled work unit adds 1 point of growth, and each resting turn adds 15 points (5 more for each level of the wishing well). Carrots and sunflower seeds make snack packs, lucky clovers make charms, blueberries boost guild herbalists, and star crystals and dream dew go into advanced buildings and areas. Area and crop parameters are in appendices A.1 and A.2.

### 4.3 Upgrades

Each of the 8 buildings has 3 levels, each dearer and stronger than the last: every level costs about 2.5 times the one before and also needs wood, pebbles and star crystals, which only play can earn. The hamster cottage's level caps every other building's level, so upgrades start there. The home's level is the sum of all building levels, up to 24. Taking everything to level 3 costs 34,800 data beans in all; parameters are in appendix A.3.

### 4.4 Expeditions

Expeditions turn running into distance: 1 settled work unit = 1 step. While the hamster rests, the party camps and never goes backwards. The 5 routes are 3,000 to 18,000 steps long, about 0.3 to 1.8 days at the baseline. Each route has 5 stops, at 20%, 40%, 60%, 80% and 100% of the way. At each of the first 4 something happens (a find, seeds, a companion or a hazard), chosen by the hash of the settlement that reaches the stop; the 5th is the treasure at the end.

- The fork: the 2nd stop is a fork. Before reaching it you can pick the safe path or the risky shortcut (twice the chance of a hazard at stops 3 and 4, and twice the finds). Without a choice, the party takes the safe path.
- Hazards: the dark needs a lamp and a climb needs a rope. Without the right gear a clover charm gets you through; without either you go back up to 10% of the route, but never past the previous stop.
- Gear: take up to 2 items on a trip (3 once the workshop reaches level 3). Gear is permanent; supplies are used up once. You can recall the party at any time: everything found so far stays, but the treasure at the end is lost.

Routes, gear and companions are in appendices A.4 to A.6.

### 4.5 Guilds and the weekly boss

Guilds play a season each week, and every player fights the same boss. The boss's HP comes from public data, so no server is needed and everyone sees the same boss; your own contribution decides your season chest.

- Seasons: a season starts every Monday at 20:00 Beijing time (12:00 UTC); season 1 began on 2026-11-02.
- Joining: pick one guild a season, or pick next season's in advance; you can't switch mid-season. Besides the 4 built-in guilds, players can found their own with a guild banner.
- Fighting: on every running turn you make the action you chose. The boss's mood at that moment is set by the settlement's hash, which nobody can know in advance, so choose the action that works best on average.
- Night watch: +10 contribution on every resting turn.

Contribution on each running turn:

```formula
G = W × E(a, m) × C × (1 + 0.1L)
```

where W is the turn's settled work, E is the effect of action a against boss mood m, C is the class bonus (only on the action the class is best at) and L is the level of the observatory.

Boss damage comes from four sources: the hamster's settled work this week (1 unit = 1 point); real community actions on SqueekChain (claiming rewards 20, staking 40, depositing an NFT 30, combining NFTs 120 points and so on; only the type and time are counted, never addresses); the hamster's milestones (a distance milestone 1,500, a speed record 1,000 points and so on); and SQB supplies that players burn on chain (10 points each). Community actions can take off at most 30% of the boss's HP and milestones at most 20%: the new deployment saw about 4,000 community actions on its first day, which without a cap would have beaten three bosses in one day. So until SQB supplies arrive, at least half the damage comes from the hamster's own work. At the baseline the boss falls on about day 3 when the community is busy, and on day 4 or 5 when it is quiet.

Chests open after the season ends; in a season when the boss is beaten, every chest goes up one tier. Local contribution lives only in your own browser, so it is not ranked; the public guild ranking counts only on-chain SQB supplies. Bosses, guilds, classes, action effects and chests are in appendices A.7 to A.11.

## 5. Token economy

### 5.1 Three currencies

Data beans run all everyday play; SQB and SQK only buy optional on-chain assets. There is no exchange between any of them.

| Currency | Where it lives | How it is earned | What it is for | Once spent |
| --- | --- | --- | --- | --- |
| Data beans | The local save in the player's browser | 1 for every player per 10 work units the hamster settles; the cottage and the bean silo add bonuses | Unlocking areas, building and upgrading, making gear | Gone; cannot be transferred or turned into SQB |
| SQB | Our ERC-20 contract on Sepolia | 1 minted network-wide per 10 work units the hamster settles, shared among the addresses staking SQK | Guild war supplies, deed renovations, season decorations | Burned |
| SQK | SqueekChain's official ERC-20 on Sepolia | Official mining, per Squeek block, capped at 2.1 billion | Staking to mine SQB, buying home deeds, founding guilds | Burned with the SQK contract's own `burn()` |

As of 2026-11-07, about 214.2 million SQK are in circulation, 10.2% of the 2.1 billion cap: 210 million were premined, about 4.19 million have been mined and about 160 have been burned (read from the SQK contract's `totalSupply()` and `cap()`, which match the official API's `/v1/economy/state`).

### 5.2 How SQB is issued

1. On-chain data only: the minting contract, SqbMinter, reads `state()` from SqueekCore (`0xfd6c166d4b8e2962e65746a13e5a0797cd4de0c4`) and takes its cumulative work (cumulativeWork), with the field order taken from the officially published ABI. Anyone can call `sync()`, and staking and claiming sync automatically; work settled before the deployment is not minted.
2. Capped: at most 1,000 SQB per settled round, which is maxWorkPerRound 10,000 ÷ 10. Minting pauses by itself if a round's work exceeds the cap, if cumulative work or settled rounds go backwards, if a reading is malformed or if SqueekCore's implementation contract changes.
3. Shared by stake: newly minted SQB pays out by the second over the next 24 hours to the addresses staking SQK, in proportion to their stake, and is minted when they claim it. Splitting the same SQK across several wallets earns the same in total; a brief large stake earns only its share of that moment.
4. No premine: SQB's total supply was 0 at deployment, with no team share and no presale. Work from any time when nobody is staking, or when minting is paused, is never minted.
5. Least privilege: the deployer can only pause and resume minting, and resuming skips the paused stretch with no catch-up mint. It cannot mint to any address or touch staked SQK. Changing the minting contract takes a 48-hour public notice on chain.

At the baseline, about 1,009 SQB are minted network-wide each day, as many as one player's basic daily data beans.

### 5.3 What SQB and SQK buy

Prices and quantities were written into WorldShop at deployment. The contract has no owner, so its prices can never change; changing a price means deploying a new shop contract.

| Asset | Price | Quantity | Effect |
| --- | --- | --- | --- |
| Home deed | The first costs 10,000 SQK, and each sale raises the next price by 1% | 100 in all | A numbered plot on the public map that you can name; your world gets 1 more garden bed and a name sign |
| Guild banner | 50,000 SQK | Up to 8 a season | Founds a player guild: name it, pick a flag and one of the 4 guild perks; members join free |
| Guild war supplies | Any amount of SQB | Unlimited | Each SQB does 10 damage to this week's shared boss and counts toward the public ranking of the guild you are in this season (join a guild first) |
| Deed renovation | Level 2: 500 SQB, level 3: 1,500 SQB | Each level once per deed | Changes how the deed looks on the public map and in your world |
| Season decoration | 50 SQB each | 4 a season, sold only during that season | A decoration kept by your address for good |

Deeds are ERC-721 tokens (Squeek Pet World Deed, SPWDEED). Every payment is burned on the spot and there is no treasury: SQK with the SQK contract's own `burn()`, SQB with `burnFrom()`. Neither SQB nor SQK buys progress: crops, steps and building are driven only by the hamster's settlements.

### 5.4 Where value flows

[[figure:flows]]

Data beans stay local and vanish when spent; SQB is minted only by the minting contract from the hamster's work and, like SQK, is burned when spent.

### 5.5 Why two tokens alone are not enough

Two tokens alone do not stop a death spiral. As long as the game token is issued in step with the number of players and the time they play, and demand comes mostly from new players, splitting it into two tokens does not stop the fall. We designed the other way round:

| Guardrail | How |
| --- | --- |
| Output does not grow with players | SQB's daily output across the network depends only on the hamster's work; the more players, the less each one gets |
| No entry ticket | Data beans and all everyday play are free; SQB and SQK buy only optional on-chain assets |
| Local progress is never cashed out | Local saves can be edited, so data beans can never become SQB |
| Spent means burned | Every SQB and SQK purchase is burned; there is no treasury |
| Testnet only | SQB is deployed only on Sepolia, has no real value and comes with no promise of returns |

These guardrails limit supply, but they cannot create demand: whether anyone wants SQB depends in the end on how many players choose to spend it on guild wars and decorations.

### 5.6 Pace of progress

At the baseline, the hamster gives each player about 1,009 data beans and about 238 drops of dream dew a day, while about 1,009 SQB are minted network-wide. Building out the whole home takes about 40,680 data beans, or 4 to 6 weeks.

[[figure:daily-beans]]

| Where data beans go | Data beans |
| --- | --- |
| Unlocking the 4 new areas | 5,700 |
| Taking the 8 buildings to level 3 | 34,800 |
| A permanent gear set (lamp, rope, trail map, trowel) | 180 |
| Total | 40,680 |

Basic output alone takes 40 days. With the cottage and the bean silo fully upgraded, data beans rise by 40%, and with expedition treasure and weekly chests it takes about 4 to 6 weeks in practice. The pace is in proportion to how much the hamster runs:

| Work | Work units a day | Data beans a day | Time to build out |
| --- | --- | --- | --- |
| Baseline (last 7 days of the previous deployment) | About 10,094 | About 1,009 | 4 to 6 weeks |
| First two days of the new deployment (2026-11-05 to 11-07) | About 5,500 | About 550 | 7 to 11 weeks |

Against inflation:

- Output has a ceiling: data beans and SQB come only from settled exercise, as much as the hamster runs; treasure comes per trip and chests per week, and both are capped.
- Costs climb: every level costs about 2.5 times the one before, and also needs wood, pebbles and star crystals that only play can earn.
- Two layers kept apart: data beans cannot be bought or turned into SQB, and SQB cannot buy progress, so on-chain price swings do not touch local play.
- Numbers can be tuned: first watch a week of real data; any change applies only to later turns.

## 6. Smart contracts

### 6.1 Contracts and addresses

The four contracts were deployed to Sepolia on 2026-11-07. Their on-chain code is byte-for-byte identical to the contracts compiled from PR #7 of the squeek-pet repository (commit 87d1944), apart from the parameters written at construction, so players can check the addresses their wallet shows against this list.

| Contract | Address | Owner |
| --- | --- | --- |
| SqbToken (SQB) | [0xf429c077c66295e7a06aa0ee8cdeb1bf661634df](https://sepolia.etherscan.io/address/0xf429c077c66295e7a06aa0ee8cdeb1bf661634df) | The project's wallet |
| SqbMinter (staking and minting) | [0x4451b40aeff43c4e112704666093493523a418b2](https://sepolia.etherscan.io/address/0x4451b40aeff43c4e112704666093493523a418b2) | The project's wallet, which can only pause and resume minting |
| WorldShop (deeds, decorations, guild war) | [0x2e4e87b9a2e7cbd227ed203e2d870b4949cf725e](https://sepolia.etherscan.io/address/0x2e4e87b9a2e7cbd227ed203e2d870b4949cf725e) | No owner |
| SqkFaucet (testnet SQK faucet) | [0x62705e950cd1ade1bde8746fcdc71bbc750c6d0c](https://sepolia.etherscan.io/address/0x62705e950cd1ade1bde8746fcdc71bbc750c6d0c) | The project's wallet |

The project deployed the contracts with its own wallet from the deploy page (contracts/deploy/ in the squeek-pet repository); development never touched any private key. The project's wallet is [0xa5dd445ee5aa03fe71645f2557a8d09504147205](https://sepolia.etherscan.io/address/0xa5dd445ee5aa03fe71645f2557a8d09504147205). The official contracts the World uses (release core-sepolia-20261103): SqueekCore `0xfd6c166d4b8e2962e65746a13e5a0797cd4de0c4`, SQK `0xd78a3956cf63164d1fa1c622ad3c66623162fa1e`.

### 6.2 Permissions

| Contract | The owner can | The owner cannot |
| --- | --- | --- |
| SqbToken | Set the minting contract once at deployment; later propose a new one, which takes effect after a 48-hour public notice on chain and can be withdrawn meanwhile | Mint; touch anyone's SQB |
| SqbMinter | Pause and resume minting, skipping the paused stretch on resume; return tokens sent to the contract by mistake | Mint to any address; touch staked SQK |
| WorldShop | Has no owner | Prices and quantities were fixed at deployment, and nobody can change them |
| SqkFaucet | Change the amount per claim, the cooldown and the claim threshold; take back the remaining SQK | Touch the SQK in players' wallets |

Ownership transfers take two steps (the current owner proposes, the new owner accepts), so the contracts cannot be handed to a mistyped address. SqbMinter limits the gas and the return size when it reads SqueekCore, and withdrawing a stake never touches SqueekCore, so even a failing SqueekCore cannot block staking, withdrawing or claiming.

### 6.3 Wallets and transactions

- The World page connects straight to the player's own browser wallet (MetaMask and others), only on the Sepolia testnet (chain ID 11155111); if the wallet is on another network, the page asks it to switch.
- Staking, claiming SQB, buying, naming and renovating deeds, buying decorations, joining or founding guilds and sending supplies all happen in the World.
- The player confirms every transaction and every SQK or SQB permit signature (EIP-2612) in the wallet; the page never touches a private key and never sends a transaction by itself. If a wallet does not support permits, an approve transaction is used instead.
- Without a wallet you can play the trial world (simulated data). The real world's garden and expedition progress are kept in the browser, one copy per wallet.
- The desktop pet and the Squeek Pulse dashboard stay read-only.

### 6.4 Testnet SQK faucet

Players without a Squeek NFT cannot get testnet SQK, so the World's Stake tab has a faucet: a wallet holding less than 100 SQK can claim 10 every 24 hours (100 per claim at deployment, changed to 10 on 2026-11-07; the owner can change it). The faucet is topped up by plain transfers, which anyone can send; it held 0 when it was deployed on 2026-11-07.

### 6.5 Tests and verification

- 46 contract unit tests (including randomised operation tests) and 3 fork tests; the fork tests replay a real settlement from 2026-11-06 (round 356 to round 357) on a Sepolia fork.
- Before deployment, SqueekCore was checked against the official ABI and deployment record: the `state()` read from chain on 2026-11-05 matched the API.
- After deployment, the on-chain code was checked and is byte-for-byte identical to the build of PR #7.
- Not done yet: a third-party audit (required before mainnet); public source verification of the four contracts on Etherscan or Sourcify.
- The source is public on GitHub: the deployed contracts were compiled from PR #7 of zakehowell/squeek-pet (commit 87d1944); the World's site, game and contracts now all live in zakehowell/squeek-world.

## 7. Security, risks and compliance

### 7.1 Risks and responses

| Risk | What could happen | Response |
| --- | --- | --- |
| SqueekCore's source is unverified | The official ABI and deployment record are public, but the source is not yet verified on Etherscan. The `state()` read from chain on 2026-11-05 showed cumulative work of 3,817, matching the API; settled rounds were 308 on chain and 307 in the API, because the API only takes settlements after 12 confirmations | The minting contract enforces a per-round cap, checks that nothing goes backwards and stops on any anomaly; SqueekCore's address and implementation were checked against the official deployment record before deployment; we ask SqueekChain to verify the source publicly |
| SqueekCore is upgraded or redeployed | The deployment already changed once, on 2026-11-05: the contract addresses changed and rounds and cumulative work started again from zero. The new SqueekCore is still an upgradeable proxy; upgrades go through the official timelock, which can be as short as 300 seconds, and its fields may change after an upgrade | The minting contract checks SqueekCore's implementation address at every sync and pauses if it changes, resuming after a check; for a new deployment, a new minting contract goes live and SQB's minting rights move to it after the 48-hour notice; the World follows the new deployment and players keep their assets |
| The official API or settlements stop | The World cannot read new turns | The world stays at the last settled turn and nothing is taken away; when the API is back, the World reads back about two weeks and anything older counts as a gap; SQB minting reads only the chain and does not depend on the API |
| A contract bug | Too much SQB is minted, or staked SQK cannot be withdrawn | Built on standard OpenZeppelin contracts; unit tests and randomised operation tests; a third-party audit before mainnet; a testnet trial first |
| The deployer's key leaks | An attacker could pause minting, take the SQK in the faucet, or install their own minting contract after the 48-hour notice | The deployer cannot mint directly or touch staked SQK; a new minting contract needs a 48-hour public notice on chain, long enough to be noticed; we recommend moving ownership to a hardware wallet or a multisig |
| The website is tampered with | A tampered World page could ask players to sign malicious transactions or approvals | Testnet only, so SQK and SQB have no real value; the site can only be published from the project's Cloudflare account (later by automatic deploys from GitHub), and both should use two-factor authentication; the page's Content Security Policy only allows connections to the SqueekChain API and one Sepolia RPC; wallets show who every transaction and approval goes to, so players can check it against the contract addresses in this paper first |
| Sybil attacks | One person runs many wallets to farm rewards | Rewards are shared by stake, so splitting wallets earns nothing extra; supplies count by the amount burned |
| The faucet is farmed or runs dry | One person claims testnet SQK with many wallets; once the faucet is empty, new players get no SQK | 10 SQK per claim, no claims for wallets holding 100 or more, once every 24 hours; testnet SQK has no real value; an empty faucet only affects the on-chain part, and the local world plays on |
| A local save is edited | It changes only that player's own world | Data beans cannot become SQB; public rankings count only on-chain records |
| Price manipulation | Testnet liquidity is thin, so the price of SQB is easy to pump and dump | Every price in the game is a fixed amount of SQB or SQK; no pool prices are read |

### 7.2 Compliance

On 6 February 2026, the People's Bank of China and seven other agencies issued a notice on further preventing and handling the risks of virtual currencies and related activities. It classes token issuance for fundraising, exchange between fiat money and virtual currencies and similar activities as illegal financial activities, and repeals the 2021 notice known as Document 237 (see [the Science and Technology Daily report](https://www.stdaily.com/web/gdxw/2026-02/07/content_471656.html), in Chinese). This project runs only on testnet: nothing is sold, no money is raised, no fiat exchange is offered and no returns are promised; any mainnet plan will be reviewed by a lawyer first. This section is not legal advice.

## 8. Roadmap

[[figure:roadmap]]

The first two phases are complete. Phase 1 made home, upgrades, expeditions and guilds all work on data beans and turned the World into a web game, leaving only the pet on the desktop. Phase 2 deployed the SQB token, the staking and minting contract, the on-chain shop and the testnet SQK faucet to Sepolia, connected the World to players' wallets and launched it on its own site, world.squeekpulse.xyz.

The testnet trial began on 2026-11-07 and runs for about a week: top up the faucet, watch staking, minting and spending, and check the amount minted against the hamster's settled work. Once the new deployment has run for 7 days (2026-11-12), the numbers will be reviewed with the new data. Mainnet is not scheduled: a third-party audit and a legal review must come first (see section 7).

## 9. Open decisions

- [ ] A Chinese name and an icon for SQB
- [ ] Whether to move contract ownership to a multisig (it is now the project's single-signature wallet)
- [ ] How much testnet SQK the faucet should hold, and who tops it up
- [ ] Whether buildings and gear should also be buyable with SQB (recommended: no, so that SQB never buys progress)
- [ ] Who asks SqueekChain to verify SqueekCore's source publicly on Etherscan (its ABI and deployment record are already public)
- [ ] Whether to verify the four contracts' source publicly on Sourcify or Etherscan
- [ ] Whether to adjust the numbers with the new data once the new deployment has run for 7 days (2026-11-12)

## 10. Disclaimer

This whitepaper only describes the design of Squeek Pet World. It is not investment advice, an offer or a promise of any return. SQB and testnet SQK run only on the Sepolia testnet, have no real value, are not sold and cannot be exchanged for fiat money. Squeek Pet World is an independent community project, not an official SqueekChain product. The numbers here are design parameters and may change between versions; a change applies only to later turns. The contracts may have bugs nobody has found yet; before you sign or send anything, check the contract address and what the transaction does.

## Appendix A Parameters

This appendix lists every game parameter of version 1.0. The times given as "about" are estimates at the baseline; the hamster runs in bursts, so real times will be quicker at some points and slower at others.

### A.1 Areas

| Area | Unlock cost | Garden beds | Own crop | Buildings |
| --- | --- | --- | --- | --- |
| Meadow | Owned from the start | 3 | None | Hamster cottage, lantern path, wishing well |
| Forest Edge | 300 data beans + 20 wood | 2 | Blueberry bush | Bean silo, workshop |
| Lakeside | 800 data beans + 40 wood + 30 pebbles | 2 | Water lily | Little pier |
| Windy Hills | 1,600 data beans + 60 pebbles + 4 star crystals | 2 | None | Windmill |
| Starlight Ruins | 3,000 data beans + 120 dream dew + 10 star crystals | 2 | Moonflower | Observatory |

### A.2 Crops

| Crop | When it grows | Points to ripen | About | Harvest |
| --- | --- | --- | --- | --- |
| Carrot | Day and night | 3,000 | 6 hours | 4 carrots, 1 seed packet back |
| Sunflower | Only while running | 5,000 | Half a day | 5 sunflower seeds + 60 data beans |
| Lucky clover | Day and night | 6,000 | Half a day | 1 lucky clover, 1 seed packet back |
| Blueberry bush | Day and night, Forest Edge only | 9,000 | 18 hours | 4 blueberries, 1 seed packet back |
| Water lily | Only while resting, Lakeside only | 1,800 | 1 day | 1 star crystal + 15 dream dew, 1 seed packet back |
| Moonflower | Only while resting, Ruins only | 3,600 | 2 days | 2 star crystals + 40 dream dew, 1 seed packet back |

A snack pack (3 sunflower seeds + 2 carrots) adds 25% to the steps of one trip. On resting turns, each round also gives 2 drops of dream dew.

### A.3 Buildings

| Building | Area | Level 1 | Level 2 | Level 3 | Effect per level |
| --- | --- | --- | --- | --- | --- |
| Hamster cottage | Meadow | Owned from the start | 400 data beans + 30 wood + 20 pebbles | 1,200 data beans + 60 wood + 40 pebbles + 3 star crystals | Data beans +5% from level 2; sets the top level of every other building |
| Lantern path | Meadow | 150 data beans + 10 wood | 450 data beans + 20 wood + 1 star crystal | 1,200 data beans + 40 wood + 3 star crystals | +1 dream dew every resting turn |
| Wishing well | Meadow | 200 data beans + 25 pebbles | 600 data beans + 50 pebbles | 1,500 data beans + 80 pebbles + 2 star crystals | Crop growth +5 on resting turns |
| Bean silo | Forest Edge | 400 data beans + 30 wood | 1,000 data beans + 60 wood | 2,500 data beans + 100 wood + 3 star crystals | Data beans +10% |
| Workshop | Forest Edge | 300 data beans + 20 wood + 20 pebbles | 900 data beans + 40 wood + 40 pebbles | 2,000 data beans + 60 wood + 60 pebbles + 2 star crystals | Level 1 makes gear; level 2 makes gear 25% cheaper; level 3 adds 1 gear slot |
| Little pier | Lakeside | 500 data beans + 40 wood | 1,200 data beans + 80 wood | 2,800 data beans + 120 wood + 2 star crystals | Each resting turn, a 1% chance (2% at level 2, 3% at level 3) of fishing up a star crystal |
| Windmill | Windy Hills | 800 data beans + 40 wood + 40 pebbles | 2,000 data beans + 60 wood + 80 pebbles | 4,500 data beans + 80 wood + 120 pebbles + 4 star crystals | Growth from running +10%; the windmill turns with the real wheel |
| Observatory | Starlight Ruins | 1,200 data beans + 30 pebbles + 8 star crystals | 3,000 data beans + 60 pebbles + 12 star crystals | 6,000 data beans + 100 pebbles + 16 star crystals | Shows the odds of the boss's moods; guild contribution +10% |

### A.4 Expedition routes

| Route | Area | Length (steps) | About (days) | Hazards | Treasure at the end |
| --- | --- | --- | --- | --- | --- |
| Mossy Trail | Meadow | 3,000 | 0.3 | Climb | 20 wood, 15 pebbles, 80 data beans, 2 sunflower seeds, 1 carrot seed packet |
| Whispering Woods | Forest Edge | 6,000 | 0.6 | Climb, dark | 30 wood, 15 pebbles, 160 data beans, 1 star crystal, 2 blueberry seed packets |
| Mirror Lake | Lakeside | 9,000 | 0.9 | Dark | 25 pebbles, 40 dream dew, 240 data beans, 1 star crystal, 2 water lily seed packets |
| Windchime Hills | Windy Hills | 12,000 | 1.2 | Climb, dark | 50 pebbles, 20 wood, 320 data beans, 2 star crystals, 1 lucky clover seed packet |
| Starfall Ruins | Starlight Ruins | 18,000 | 1.8 | Dark, climb | 5 star crystals, 60 dream dew, 480 data beans, 2 moonflower seed packets |

### A.5 Gear and supplies

| Gear and supplies | Cost | What it does |
| --- | --- | --- |
| Lamp | 50 data beans + 10 wood + 5 pebbles + 1 star crystal | Gets through the dark, and finds 1 more star crystal |
| Rope | 30 data beans + 15 wood | Gets up climbs, and finds 3 more wood |
| Trail map | 60 data beans + 5 wood | Steps +10% |
| Trowel | 40 data beans + 10 pebbles + 5 wood | Digs up 1 more of every find |
| Snack pack (used up) | 3 sunflower seeds + 2 carrots | Steps +25% on this trip |
| Clover charm (used up) | 1 lucky clover + 20 data beans | Gets through one hazard without the right gear; returned if unused |

### A.6 Companions

| Companion | Found on | What they do |
| --- | --- | --- |
| Ollie the owl merchant | Whispering Woods | Gives 2 seed packets |
| Old Frog the sage | Mirror Lake, Starfall Ruins | Takes 1 lucky clover for a star crystal; without one, asks a riddle worth 15 dream dew |
| Moss the mole miner | Windchime Hills | Shares 4–8 pebbles, and 1 star crystal more if you carry a lamp |
| Pip the firefly | Whispering Woods | Lights a shortcut worth 5% of the route in extra steps |
| Corvin the crow collector | Mirror Lake, Starfall Ruins | Swaps 10 pebbles for 1 star crystal |
| Hazel the hedgehog | Mossy Trail | Gives 1 seed packet and 1 sunflower seed |

### A.7 Bosses

| Boss (one a week, in turn) | HP | Most common mood |
| --- | --- | --- |
| Mount Tangerine, the napping cat | 50,000 | Drowsy 40% |
| Clockwork Crow, the gear-eating crow | 55,000 | Shielded 40% |
| Mistcoil, the fog serpent | 60,000 | Tricky 40% |
| Frostmoon, the winter owl | 65,000 | Fierce 40% |

The other three moods come up 20% of the time each.

### A.8 Guilds

| Guild | Perk |
| --- | --- |
| Seedkeepers | Crop growth +10% |
| Lanternbearers | Expedition steps +10% |
| Cogwrights | Data beans spent on building and unlocking -10% |
| Stardreamers | +1 dream dew every resting turn |

A guild founded with a guild banner picks one of these 4 perks.

### A.9 Classes

| Class | Best at |
| --- | --- |
| Guardian | Guard counts 1.5× |
| Ranger | Strike counts 1.5× |
| Herbalist | Support counts 1.3×, or 1.6× when it uses a blueberry |
| Scout | Scavenging finds twice as much |

### A.10 Action effects

| Action against mood | Fierce | Shielded | Drowsy | Tricky |
| --- | --- | --- | --- | --- |
| Strike | 100% | 50% | 200% | 100% |
| Guard | 200% | 100% | 50% | 100% |
| Support | 100% | 150% | 100% | 150% |
| Scavenge | 50% | 50% | 50% | 50% |

Scavenging contributes less, but every turn has a chance to pick up materials or star crystals.

### A.11 Season chests

| Season chest | Contribution this season | Rewards |
| --- | --- | --- |
| Bronze chest | 15,000 | 300 data beans, 10 wood, 10 pebbles |
| Silver chest | 40,000 | 800 data beans, 20 wood, 20 pebbles, 1 star crystal, 1 lucky clover seed packet |
| Gold chest | 80,000 | 1,800 data beans, 40 wood, 40 pebbles, 3 star crystals, 1 blueberry seed packet |
| Rainbow chest | 120,000 | 3,200 data beans, 60 wood, 60 pebbles, 6 star crystals, 1 moonflower and 1 water lily seed packet |

## Appendix B Glossary

| Term | Meaning |
| --- | --- |
| Turn | One SqueekCore settlement (one BatchSettled event); with work it is a running turn, without work a resting turn |
| Work unit | The wheel work SqueekChain records; in the World, 1 work unit = 1 step = 1 point of growth |
| Settled | Written on chain by SqueekCore, with 12 block confirmations |
| Baseline | The real data from the last 7 days of the previous deployment (up to 2026-11-04 12:00 UTC): about 10,094 work units a day |
| Data beans | The local currency: 1 for every player per 10 work units; cannot be traded or turned into SQB |
| Dream dew | A local resource from resting turns, used for advanced areas and buildings |
| Star crystals | A rare material from expeditions, crops and the little pier |
| SQK | SqueekChain's official ERC-20 token (Sepolia), capped at 2.1 billion |
| SQB | Squeek Pet World's ERC-20 token (Sepolia): 1 minted network-wide per 10 work units, no premine |
| Staking | Depositing SQK in SqbMinter to share in SQB by stake; it can be withdrawn at any time |
| Deed | A plot on the public map: an ERC-721 token bought with SQK |
| Season | A week starting Monday 12:00 UTC, in which every player fights the same boss |
| Gap | Turns from a time the page was closed for too long to read them back: no rewards and no losses |
| Reorganisation | When the blockchain replaces its most recent blocks with another branch; the World replaces the affected turns and replays them |

## Appendix C References

- SqueekChain public API: [api.squeekchain.com](https://api.squeekchain.com/v1/settlements?range=30d)
- SqueekChain documentation: [docs.squeekchain.com](https://docs.squeekchain.com/)
- Source of the deployed contracts: [zakehowell/squeek-pet PR #7](https://github.com/zakehowell/squeek-pet/pull/7)
- The World web game: [world.squeekpulse.xyz](https://world.squeekpulse.xyz/)
- The World's source (site, game and contracts): [zakehowell/squeek-world](https://github.com/zakehowell/squeek-world)
- This whitepaper on the web: Chinese [world.squeekpulse.xyz/whitepaper/](https://world.squeekpulse.xyz/whitepaper/), English [world.squeekpulse.xyz/whitepaper/en/](https://world.squeekpulse.xyz/whitepaper/en/)
- Report on the eight agencies' notice: [Science and Technology Daily](https://www.stdaily.com/web/gdxw/2026-02/07/content_471656.html) (in Chinese)

## Appendix D Version history

| Version | Date | Changes |
| --- | --- | --- |
| 1.0 | 2026-11-07 | Formal edition: new chapters; system architecture, permissions, testnet status, glossary and disclaimer added; contract addresses and on-chain data updated after deployment; Chinese and English web versions |
| Draft | 2026-11-06 | On-chain design: wallets connect straight to the World, staking and minting, an on-chain shop and a faucet |
| Draft | 2026-11-04 | First draft: home, upgrades, expeditions, guilds and the two-token model |
