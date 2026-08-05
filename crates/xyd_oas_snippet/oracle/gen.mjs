// Oracle generator for the xyd_oas_snippet parity gate.
//
// For every fixture case under `crates/xyd_oas_snippet/__fixtures__/<case>/`
// (each carrying an `input.json` descriptor: { spec, path, method, values }),
// this runs the REAL `@readme/oas-to-snippet` (the exact call xyd's
// `packages/xyd-openapi/src/impl-js/converters/oas-examples.ts` makes) for the
// four languages xyd emits — shell/javascript/python/go — and writes the
// byte-exact snippets to `<case>/output.json`.
//
// The committed `output.json` is the JS implementation's frozen output — the
// parity oracle for the Rust port (mirrors the repo's OAS_BUILD_FIXTURES /
// O2R_BUILD_DOCS discipline). The Rust test (tests/parity.rs) only READS it and
// asserts byte-equality; it never rewrites it. Regen is an explicit act:
//
//   node crates/xyd_oas_snippet/oracle/gen.mjs
//
// `@readme/oas-to-snippet` and `oas` are resolved from the `@xyd-js/openapi`
// package (which already depends on them for the JS pipeline). Override the
// resolution base with XYD_OAS_SNIPPET_RESOLVE_BASE if needed.

import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import fs from "node:fs";
import path from "node:path";

const LANGS = ["shell", "javascript", "python", "go"];

const here = path.dirname(fileURLToPath(import.meta.url));
const crateDir = path.resolve(here, "..");
const repoRoot = path.resolve(crateDir, "..", "..");
const fixturesDir = path.join(crateDir, "__fixtures__");

const resolveBase =
  process.env.XYD_OAS_SNIPPET_RESOLVE_BASE ||
  path.join(repoRoot, "packages", "xyd-openapi", "package.json");

const require = createRequire(resolveBase);
const oasToSnippet = require("@readme/oas-to-snippet");
const Oas = require("oas");

function generateForCase(caseDir) {
  const inputPath = path.join(caseDir, "input.json");
  const descriptor = JSON.parse(fs.readFileSync(inputPath, "utf8"));
  const { spec, path: opPath, method, values } = descriptor;

  const oas = new Oas(spec);
  const operation = oas.operation(opPath, method);

  const out = {};
  for (const lang of LANGS) {
    // Mirrors oasToSnippet(oas, operation, values, null, lang) in
    // oas-examples.ts (auth === null). `.code` is the emitted snippet.
    const result = oasToSnippet(oas, operation, values, null, lang);
    out[lang] = result.code || "";
  }

  fs.writeFileSync(
    path.join(caseDir, "output.json"),
    `${JSON.stringify(out, null, 2)}\n`,
  );
  return Object.keys(out).length;
}

function main() {
  if (!fs.existsSync(fixturesDir)) {
    console.error(`no fixtures dir: ${fixturesDir}`);
    process.exit(1);
  }
  const cases = fs
    .readdirSync(fixturesDir)
    .map((n) => path.join(fixturesDir, n))
    .filter(
      (p) =>
        fs.statSync(p).isDirectory() &&
        fs.existsSync(path.join(p, "input.json")),
    )
    .sort();

  if (cases.length === 0) {
    console.error(`no fixture cases with input.json under ${fixturesDir}`);
    process.exit(1);
  }

  let total = 0;
  for (const caseDir of cases) {
    const n = generateForCase(caseDir);
    total += n;
    console.log(`oracle: ${path.basename(caseDir)} → ${n} langs`);
  }
  console.log(`oracle: ${cases.length} cases, ${total} snippets written`);
}

main();
