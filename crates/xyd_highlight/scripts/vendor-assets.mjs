// Vendor grammar/theme/language-data assets into the crate.
//
// Source of truth: the code9 `@syntax0/highlight` + `syntax0-cdn` packages —
// the exact engine `xyd_highlight` reproduces byte-for-byte. This script is the
// ONLY writer of `assets/`. Run it with bun:
//
//   bun scripts/vendor-assets.mjs
//
// Overrides:
//   CODE9_DIR   root of the code9 checkout (default below)
//
// It writes:
//   assets/grammars/<id>.json.zst   zstd-compressed grammar bundles (254)
//   assets/themes/<name>.json       raw VS Code theme JSON (27)
//   assets/lang-data.json           { aliasOrIdToScope, scopeToLanguageData }
//
// The compressed grammars are lazily decompressed + parsed at runtime by the
// Rust Registry; themes stay raw (they're small).

import { readdirSync, mkdirSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { join, basename } from "node:path";
import { spawnSync } from "node:child_process";

const CODE9_DIR =
  process.env.CODE9_DIR ||
  "/Users/zdunecki/Code/livesession/codable/third-party/code9";

const CDN_GRAMMARS = join(CODE9_DIR, "packages/syntax0-cdn/dist-static/grammars");
const HL_THEMES = join(CODE9_DIR, "packages/syntax0-highlight/themes");
const LANG_DATA_TS = join(CODE9_DIR, "packages/syntax0-highlight/src/language-data.ts");

const CRATE = new URL("..", import.meta.url).pathname;
const OUT_GRAMMARS = join(CRATE, "assets/grammars");
const OUT_THEMES = join(CRATE, "assets/themes");
const OUT_LANG = join(CRATE, "assets/lang-data.json");

function reset(dir) {
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
}

// --- grammars: zstd-compress each bundle -----------------------------------
reset(OUT_GRAMMARS);
const grammarFiles = readdirSync(CDN_GRAMMARS).filter((f) => f.endsWith(".json"));
let rawTotal = 0;
let zTotal = 0;
for (const f of grammarFiles) {
  const src = join(CDN_GRAMMARS, f);
  const dst = join(OUT_GRAMMARS, f + ".zst");
  const raw = readFileSync(src);
  rawTotal += raw.length;
  // zstd -19 (long-range not needed for these sizes); overwrite; quiet.
  const r = spawnSync("zstd", ["-19", "-q", "-f", "-o", dst, src], { stdio: "inherit" });
  if (r.status !== 0) throw new Error(`zstd failed for ${f}`);
  zTotal += readFileSync(dst).length;
}
console.log(
  `grammars: ${grammarFiles.length} files, raw ${(rawTotal / 1e6).toFixed(1)}MB -> zst ${(zTotal / 1e6).toFixed(2)}MB`,
);

// --- themes: copy raw -------------------------------------------------------
reset(OUT_THEMES);
const themeFiles = readdirSync(HL_THEMES).filter((f) => f.endsWith(".json"));
for (const f of themeFiles) {
  writeFileSync(join(OUT_THEMES, f), readFileSync(join(HL_THEMES, f)));
}
console.log(`themes: ${themeFiles.length} files`);

// --- language data: import the TS and serialize the two maps ----------------
const mod = await import(LANG_DATA_TS);
const langData = {
  aliasOrIdToScope: mod.aliasOrIdToScope,
  scopeToLanguageData: mod.scopeToLanguageData,
};
writeFileSync(OUT_LANG, JSON.stringify(langData));
console.log(
  `lang-data: ${Object.keys(langData.aliasOrIdToScope).length} aliases, ${Object.keys(langData.scopeToLanguageData).length} scopes`,
);
