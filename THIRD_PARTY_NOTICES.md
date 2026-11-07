# Third-party sources

`site/assets/deployment.json` (the official SqueekChain Sepolia deployment record, used by the tests to check `site/src/world-chain.js`) was obtained from the official SqueekChain documentation at https://docs.squeekchain.com/ on 2026-10-26. It remains subject to the upstream owner's terms and is not covered by this project's MIT license.

The game (`src/`), the contracts (`contracts/`) and their tests come from https://github.com/zakehowell/squeek-pet (MIT License, commit `87d1944`); the website (`site/`) comes from Squeek Pulse (MIT License). Both copyright notices are kept in `LICENSE`.

The contracts build on OpenZeppelin Contracts 5.6.1 (MIT License), installed by `contracts/package.json` and compiled into the deployed contracts.

The pixel-art hamster and wheel (`site/assets/pet/*.png`), the World icon (`site/public/world.svg`), the interface icons (`site/src/pixel-icons.js`) and the game's drawings (`src/world/art/`) are original artwork made for Squeek Pulse, Squeek Pet and this game. They are not Squeek NFT artwork.

The "Squeek Pixel 8/10/12" fonts in `site/assets/fonts/` are subsets of Fusion Pixel Font by TakWolf (`@fontsource/fusion-pixel-*px-proportional-sc` 5.3.0), licensed under the SIL Open Font License 1.1. They are renamed because the license reserves the name "Fusion Pixel". Each size includes glyphs from further free pixel fonts; their notices are kept in `site/assets/fonts/LICENSE-8px.txt`, `LICENSE-10px.txt` and `LICENSE-12px.txt`. `site/subset-fonts.py` rebuilds the subsets.

The build and test tools (TypeScript, Vite, Vitest, esbuild, ethers, Hardhat and their dependencies) keep their upstream licenses. None of them is part of the website; ethers runs only in the owner's deploy page. The site does not load external scripts, fonts or image services at runtime.
