// Where the World's log links a settled round's Sepolia transaction: the same
// explorer the squeek-pet desktop pet links to (src/pet/present.ts there).
export const EXPLORER = "https://eth-sepolia.blockscout.com";

export function txUrl(hash: string): string {
  return `${EXPLORER}/tx/${hash}`;
}
