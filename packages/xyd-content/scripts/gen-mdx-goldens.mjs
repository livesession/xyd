// gen-mdx-goldens.mjs — JS-owned COMPLIANCE HARNESS for the Rust content engine
// (Track C). Regenerates the two-oracle goldens for every fixture in
// packages/xyd-content/__fixtures__/mdx-parity/ from the LIVE JS pipeline
// (@xyd-js/content). The committed goldens are the oracle; this script only
// (re)produces them.
//
//   Oracle A — compiled function-body (semantically normalized):
//     ContentFS.compileContent(source)  (outputFormat:'function-body', jsx:false,
//     with the real markdownPlugins() chains)  ->  normalize()  ->  compiled.normalized.js
//
//   Oracle B — rendered HTML (DOM-normalized, attribute-order-insensitive):
//     execute the compiled module against a FROZEN component-stub set + fixed
//     jsx runtime  ->  renderToStaticMarkup  ->  normalizeHtml()  ->  rendered.html
//
// USAGE
//   # verify (default): regenerate in-memory, diff against committed goldens,
//   # exit 1 on any drift. This is the idempotency / parity check.
//   node scripts/gen-mdx-goldens.mjs
//
//   # write: (re)generate and write goldens to disk.
//   MDX_BUILD_FIXTURES=1 node scripts/gen-mdx-goldens.mjs
//
//   # optional: restrict to matching fixtures
//   MDX_BUILD_FIXTURES=1 node scripts/gen-mdx-goldens.mjs --filter prose
//
// IDEMPOTENCY PROOF: run once with MDX_BUILD_FIXTURES=1, then run again in
// verify mode (no env) — it must report 0 drift. (Run twice with the env set
// and `git status` shows no change.)
//
// Runs under node or bun. Requires the workspace to be built (dist/) so
// @xyd-js/content resolves; run from the package root.
import { promises as fs } from "node:fs";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";

// --- silence the pipeline's console.time* plugin-timing chatter -------------
for (const k of ["time", "timeEnd", "timeLog"]) console[k] = () => {};

import { markdownPlugins } from "@xyd-js/content/md";
import { ContentFS } from "@xyd-js/content";
import { Composer } from "@xyd-js/composer";
import { normalize } from "../__fixtures__/mdx-parity/_harness/normalize.mjs";
import { renderOracle, requiredComponents } from "../__fixtures__/mdx-parity/_harness/render.mjs";

// --- register the composer meta-components (atlas/home/bloghome/firstslide) ---
// The `mdMeta` terminal remark transform (packages/.../plugins/meta/mdMeta.ts)
// reads `uniform:`/`openapi:`/`component:` frontmatter and calls
// `getMetaComponent(meta.component).transform(...)` to REPLACE the page tree
// with the composed node. Those transforms are registered by @xyd-js/composer's
// `@metaComponent` decorators, which only fire once `new Composer()` runs — the
// real app does this in the plugin-docs layout loader
// (packages/xyd-plugin-docs/src/pages/layout.tsx). Instantiating it here makes
// the harness compose IDENTICALLY to the app (headlessly), so the composer-
// backed fixtures (async-frontmatter-uniform, async-component-atlas) get a REAL
// `<Atlas references={…} … />` oracle instead of falling through to raw prose.
// Registration is idempotent (a global Map keyed by name), so re-running the
// gen script re-produces byte-identical goldens.
new Composer();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "__fixtures__", "mdx-parity");
const WRITE = process.env.MDX_BUILD_FIXTURES === "1" || process.env.MDX_BUILD_FIXTURES === "true";
const filterIdx = process.argv.indexOf("--filter");
const FILTER = filterIdx !== -1 ? process.argv[filterIdx + 1] : null;

const DEFAULT_SETTINGS = { theme: { coder: { syntaxHighlight: "github-dark" } } };

function sha256(s) {
  return crypto.createHash("sha256").update(s, "utf8").digest("hex");
}

async function loadCorpus() {
  const raw = await fs.readFile(path.join(ROOT, "corpus.json"), "utf8");
  return JSON.parse(raw);
}

// Drive the LIVE pipeline exactly as the real page loader does
// (packages/xyd-plugin-docs/src/pages/page.tsx): markdownPlugins(toc, settings)
// -> new ContentFS(...) -> compileContent(source, filePath).
async function compilePage(source, settings, filePath) {
  const toc = { maxDepth: settings?.theme?.writer?.maxTocDepth || 2 };
  const { remarkPlugins, rehypePlugins, recmaPlugins } = await markdownPlugins(toc, settings);
  const cfs = new ContentFS(settings, remarkPlugins, rehypePlugins, recmaPlugins, {});
  return cfs.compileContent(source, filePath);
}

async function generateCase(entry, corpus) {
  const dir = path.join(ROOT, entry.name);
  const inputPath = path.join(dir, "input.mdx");
  if (!existsSync(inputPath)) {
    return { name: entry.name, status: "missing-input", drift: true };
  }

  // settings.json is an input; auto-provision the shared default if absent.
  const settingsPath = path.join(dir, "settings.json");
  let settings;
  if (existsSync(settingsPath)) {
    settings = JSON.parse(await fs.readFile(settingsPath, "utf8"));
  } else {
    settings = DEFAULT_SETTINGS;
    if (WRITE) await fs.writeFile(settingsPath, JSON.stringify(DEFAULT_SETTINGS, null, 2) + "\n");
  }

  const source = await fs.readFile(inputPath, "utf8");

  // --- Oracle A: compile + normalize -------------------------------------
  let compileStatus = "ok";
  let compiledRaw = "";
  let normalized = "";
  let compileError = null;
  try {
    compiledRaw = await compilePage(source, settings, inputPath);
    normalized = normalize(compiledRaw);
  } catch (e) {
    compileStatus = "error";
    compileError = e.message?.split("\n")[0] || String(e);
    normalized = `/* compile error: ${compileError} */\n`;
  }

  // --- Oracle B: execute + render + normalize HTML -----------------------
  let renderStatus = "ok";
  let renderedHtml = "";
  let renderError = null;
  let required = [];
  if (compileStatus === "ok") {
    try {
      required = requiredComponents(compiledRaw);
      renderedHtml = renderOracle(compiledRaw) + "\n";
    } catch (e) {
      renderStatus = "error";
      renderError = e.message?.split("\n")[0] || String(e);
      renderedHtml = `<!-- render error: ${renderError} -->\n`;
    }
  } else {
    renderStatus = "skipped";
    renderedHtml = `<!-- render skipped: compile ${compileStatus} -->\n`;
  }

  const normalizedOut = normalized.endsWith("\n") ? normalized : normalized + "\n";

  const meta = {
    name: entry.name,
    capability: entry.capability,
    gate: corpus.gate[entry.capability] || "unknown",
    source: entry.source,
    compileStatus,
    renderStatus,
    requiredComponents: required,
    oracleA: { file: "compiled.normalized.js", bytes: normalizedOut.length, sha256: sha256(normalizedOut) },
    oracleB: { file: "rendered.html", bytes: renderedHtml.length, sha256: sha256(renderedHtml) },
  };
  if (entry.note) meta.note = entry.note;
  if (compileError) meta.compileError = compileError;
  if (renderError) meta.renderError = renderError;
  const metaOut = JSON.stringify(meta, null, 2) + "\n";

  const targets = [
    ["compiled.normalized.js", normalizedOut],
    ["rendered.html", renderedHtml],
    ["meta.json", metaOut],
  ];

  let drift = false;
  const driftFiles = [];
  for (const [file, content] of targets) {
    const p = path.join(dir, file);
    const existing = existsSync(p) ? await fs.readFile(p, "utf8") : null;
    if (existing !== content) {
      drift = true;
      driftFiles.push(file);
    }
    if (WRITE) await fs.writeFile(p, content);
  }

  return { name: entry.name, capability: entry.capability, compileStatus, renderStatus, drift, driftFiles, bytesA: normalizedOut.length, bytesB: renderedHtml.length };
}

async function main() {
  const corpus = await loadCorpus();
  let cases = corpus.cases;
  if (FILTER) cases = cases.filter((c) => c.name.includes(FILTER));

  const results = [];
  for (const entry of cases) {
    results.push(await generateCase(entry, corpus));
  }

  // report
  const byCap = {};
  for (const r of results) {
    byCap[r.capability] = byCap[r.capability] || { total: 0, ok: 0, degraded: 0, drift: 0 };
    byCap[r.capability].total++;
    if (r.compileStatus === "ok" && r.renderStatus === "ok") byCap[r.capability].ok++;
    else byCap[r.capability].degraded++;
    if (r.drift) byCap[r.capability].drift++;
  }

  console.log(`\nMDX-parity goldens — mode=${WRITE ? "WRITE" : "VERIFY"}${FILTER ? ` filter=${FILTER}` : ""}`);
  for (const r of results) {
    const flag = r.drift ? (WRITE ? "written" : "DRIFT") : "clean";
    const cs = r.compileStatus === "ok" ? "" : ` compile=${r.compileStatus}`;
    const rs = r.renderStatus === "ok" ? "" : ` render=${r.renderStatus}`;
    console.log(`  [${r.capability.padEnd(9)}] ${r.name.padEnd(30)} A=${String(r.bytesA).padStart(6)}B B=${String(r.bytesB).padStart(6)}B ${flag}${cs}${rs}`);
  }
  console.log("\nBy capability:");
  for (const [cap, s] of Object.entries(byCap)) {
    console.log(`  ${cap.padEnd(9)}: ${s.total} cases, ${s.ok} full-ok, ${s.degraded} degraded${WRITE ? "" : `, ${s.drift} drift`}`);
  }

  const drifted = results.filter((r) => r.drift);
  if (!WRITE && drifted.length) {
    console.log(`\nVERIFY FAILED: ${drifted.length} fixture(s) drifted from committed goldens:`);
    for (const r of drifted) console.log(`  ${r.name}: ${(r.driftFiles || []).join(", ")}`);
    console.log("Run with MDX_BUILD_FIXTURES=1 to regenerate.");
    process.exit(1);
  }
  console.log(WRITE ? "\nDone (written)." : "\nVERIFY OK: goldens match (idempotent).");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
