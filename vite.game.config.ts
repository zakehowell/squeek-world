import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

// Builds the game (src/world) as one ES module, dist-game/squeek-world.js,
// exporting mountWorld. Its styles are inside it: the World draws in a shadow
// root. The website's build (site/build.mjs) bundles it with the page and
// minifies both; it is left unminified here so tests can read it.

const { version } = JSON.parse(readFileSync(new URL("package.json", import.meta.url), "utf8")) as { version: string };

/** The commit being built, marked -dirty when files differ from it. */
function commit(): string {
  const git = (...args: string[]) =>
    execFileSync("git", args, { encoding: "utf8", env: { ...process.env, GIT_OPTIONAL_LOCKS: "0" } }).trim();
  try {
    const sha = git("rev-parse", "--short", "HEAD");
    return git("status", "--porcelain") ? `${sha}-dirty` : sha;
  } catch {
    return "unknown";
  }
}

export default defineConfig({
  build: {
    outDir: "dist-game",
    emptyOutDir: true,
    target: ["es2021", "safari14", "chrome105"],
    minify: false,
    cssMinify: true,
    lib: {
      entry: fileURLToPath(new URL("src/world/app.ts", import.meta.url)),
      formats: ["es"],
      fileName: () => "squeek-world.js",
    },
    rollupOptions: {
      output: {
        // A /*! comment, so the site's minifier keeps it (at the end of world.js) and
        // anyone can see which commit is live.
        banner: `/*! Squeek Pet World ${version} (squeek-world ${commit()}), MIT License.\n * Built from https://github.com/zakehowell/squeek-world with \`npm run build:game\`. */`,
      },
    },
  },
});
