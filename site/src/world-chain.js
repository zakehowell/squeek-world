// Squeek Pet World on the Sepolia testnet: the contracts the project owner
// deployed from their own wallet with the deploy page (contracts/deploy/, then
// part of the squeek-pet project), as that page printed them on 2026-11-07,
// and the public Sepolia node the World reads them through. The node must be in
// site/public/index.html's connect-src. null keeps the World the read-only game it was.
export const WORLD_CHAIN = {
  chainId: 11155111,
  rpcUrl: "https://ethereum-sepolia-rpc.publicnode.com",
  explorer: "https://sepolia.etherscan.io",
  core: "0xfd6c166d4b8e2962e65746a13e5a0797cd4de0c4",
  sqk: "0xd78a3956cf63164d1fa1c622ad3c66623162fa1e",
  sqb: "0xf429c077c66295e7a06aa0ee8cdeb1bf661634df",
  minter: "0x4451b40aeff43c4e112704666093493523a418b2",
  shop: "0x2e4e87b9a2e7cbd227ed203e2d870b4949cf725e",
  faucet: "0x62705e950cd1ade1bde8746fcdc71bbc750c6d0c",
};
