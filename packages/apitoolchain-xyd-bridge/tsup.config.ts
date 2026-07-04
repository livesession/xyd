import { defineConfig } from "tsup";

/**
 * Bundle the entire xyd surface into a single self-contained ESM file so the
 * apitoolchain bun-island services can `file:`-link it without ever resolving
 * `@xyd-js/*` `workspace:*` deps. Everything non-builtin is inlined via the
 * catch-all noExternal below; run from the xyd node_modules context where the
 * `@xyd-js/*` packages are symlinked.
 */
export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  platform: "node",
  target: "node20",
  bundle: true,
  noExternal: [/.*/],
  // No emitted d.ts: the @xyd-js declaration graph can't be bundled cleanly and
  // would leave unresolvable `@xyd-js/*` specifiers in the island. A small,
  // self-contained hand-authored `index.d.ts` (committed at the package root)
  // types the surface instead — see package.json "types".
  dts: false,
  clean: true,
  sourcemap: false,
});
