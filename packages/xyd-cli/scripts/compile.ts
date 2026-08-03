import type { BunPlugin } from "bun";
import * as path from "node:path";

/**
 * Compile the self-contained `xyd` binary (S4). Uses Bun.build's compile mode
 * (not the CLI --compile) so we can apply a plugin that stubs the optional
 * diagram deps (rehype-graphviz/mermaid, @hpcc-js/wasm) which are dynamic
 * `await import()`s in @xyd-js/content — unused in the binary's Bun-engine path,
 * but --compile must resolve every reference.
 *
 *   cd packages/xyd-cli && bun scripts/compile.ts [bun-darwin-arm64]
 */

import { readFileSync, writeFileSync } from "node:fs";

const DIR = import.meta.dir;
const target = process.argv[2] || `bun-${process.platform === "darwin" ? "darwin" : process.platform}-${process.arch}`;
const outfile = path.resolve(DIR, "..", "dist", `xyd-${target.replace(/^bun-/, "")}`);

// Inject the version — no package.json on disk inside the compiled bunfs.
const version = JSON.parse(readFileSync(path.resolve(DIR, "..", "package.json"), "utf8")).version || "0.0.0";

// S4.3 — PREBUILD the per-theme render bundles + regenerate the embed manifest
// BEFORE Bun.build, so the manifest's `with { type: "file" }` targets exist on
// disk when --compile embeds them. Reference HOST = monorepo root (react +
// all @xyd-js runtime + every theme are workspace-linked there). PROOF: poetry.
const embedTs = path.resolve(DIR, "..", "src", "embed.generated.ts");
const EMBED_STUB = readFileSync(embedTs, "utf8"); // the committed empty stub
const REPO_ROOT = path.resolve(DIR, "..", "..", "..");
const prebuiltDir = path.resolve(DIR, "..", "prebuilt");
const PREBUILD_THEMES = (process.env.XYD_PREBUILD_THEMES || "poetry").split(",").map((s) => s.trim()).filter(Boolean);
// Absolute path (not the package specifier) so it never resolves to a cached
// published @xyd-js/documan instead of the workspace source.
const prebuildMod = path.resolve(DIR, "..", "..", "xyd-documan", "src", "bun", "prebuild.ts");
const { prebuildThemes, generateEmbedModule } = await import(prebuildMod);
console.error(`[compile] prebuild themes: ${PREBUILD_THEMES.join(", ")} (host=${REPO_ROOT})`);
const manifest = await prebuildThemes(REPO_ROOT, PREBUILD_THEMES, prebuiltDir);
generateEmbedModule(manifest, embedTs);

// Deps that are DEAD in the compiled binary (Bun-engine-only) but that --compile
// would otherwise try to bundle — stub to empty:
//  • Vite + @react-router/dev + friends: the binary never runs the Vite dev/build
//    path (it calls startDevServer/buildStatic). Vite reads its own package.json
//    at module eval, which crashes in the read-only bunfs — stubbing avoids it.
//  • Optional diagram/browser deps: dynamic imports guarded by feature flags.
const OPTIONAL =
  /^(vite|vite-tsconfig-paths|@vitejs\/plugin-react|@react-router\/dev\/vite|@xyd-js\/content\/vite|typedoc|@xyd-js\/sources|rehype-mermaid|rehype-graphviz|@hpcc-js\/wasm|playwright|puppeteer)(\/|$)/;

// The stubbed modules are dead code in the binary, but --compile still validates
// NAMED imports against the stub's exports — so provide no-op names for every
// symbol the Vite dev/build path imports (createServer/build/mergeConfig/… from
// vite; reactRouter; content vitePlugins). Default covers the diagram default imports.
const STUB_CONTENTS = [
  "export const createServer = () => ({});",
  "export const build = async () => ({});",
  "export const mergeConfig = (a, b) => ({ ...(a || {}), ...(b || {}) });",
  "export const searchForWorkspaceRoot = () => '';",
  "export const reactRouter = () => ({});",
  "export const vitePlugins = async () => [];",
  "export const graphviz = {};",
  // @xyd-js/sources / typedoc (TS-source API docs) — degraded in the no-install binary.
  "export const sourcesToUniformV2 = async () => ({ references: [], projectJson: {} });",
  "export const uniformToMiniUniform = () => [];",
  "export const uniformToReactUniform = () => [];",
  "export default {};",
].join("\n");

const stubOptionals: BunPlugin = {
  name: "xyd-stub-optionals",
  setup(b) {
    b.onResolve({ filter: OPTIONAL }, (args) => ({ path: args.path, namespace: "xyd-stub" }));
    b.onLoad({ filter: /.*/, namespace: "xyd-stub" }, () => ({ contents: STUB_CONTENTS, loader: "js" }));
  },
};

console.error(`[compile] target=${target} → ${outfile}`);
const res = await Bun.build({
  entrypoints: [path.resolve(DIR, "..", "src", "binary.ts")],
  // Bundler target MUST be "bun" — without it Bun.build defaults to "browser",
  // under which Node CJS deps (gray-matter → js-yaml, …) are externalized and
  // then fail to resolve at runtime inside the bunfs. `compile.target` is the
  // platform triple (a separate axis).
  target: "bun",
  // @ts-ignore - compile is a Bun.build option (standalone executable)
  compile: { target, outfile },
  plugins: [stubOptionals],
  define: {
    "process.env.NODE_ENV": '"production"',
    __XYD_CLI_VERSION__: JSON.stringify(version),
  },
});

// Restore the committed empty stub so the working tree stays clean — the real
// per-theme manifest only has to exist on disk DURING this compile (the artifacts
// under prebuilt/ are gitignored + regenerated every run).
writeFileSync(embedTs, EMBED_STUB);

if (!res.success) {
  console.error("[compile] FAILED:");
  for (const l of res.logs) console.error(String(l));
  process.exit(1);
}
console.error("[compile] ok →", outfile);
