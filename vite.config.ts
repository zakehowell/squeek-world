import { defineConfig } from "vitest/config";

// The dev server for working on the game: world.html runs Squeek Pet World on a
// bare page, and /contracts/deploy/ is the owner's deploy page. The website
// itself (site/) is built by site/build.mjs, not by this server; see
// vite.game.config.ts for how the game becomes one script for it.
export default defineConfig({
  clearScreen: false,
  server: { host: "127.0.0.1", port: 1420, strictPort: true },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
});
