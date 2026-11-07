import { describe, expect, it } from "vitest";
import { txUrl } from "../src/core/explorer";
import { formatAgo } from "../src/core/format";

// The shared helpers the World took from the squeek-pet desktop pet behave as they did there.
describe("shared helpers", () => {
  it("says how long ago, in both languages", () => {
    expect(formatAgo(1000, "en")).toBe("just now");
    expect(formatAgo(12_000, "en")).toBe("12s ago");
    expect(formatAgo(185_000, "zh")).toBe("3 分钟前");
    expect(formatAgo(5 * 3600_000, "en")).toBe("5h ago");
    expect(formatAgo(3 * 86_400_000, "zh")).toBe("3 天前");
    expect(formatAgo(-5000, "en")).toBe("just now");
  });

  it("links a settled round's transaction to the Sepolia explorer", () => {
    const hash = `0x${"ab".repeat(32)}`;
    expect(txUrl(hash)).toBe(`https://eth-sepolia.blockscout.com/tx/${hash}`);
  });
});
