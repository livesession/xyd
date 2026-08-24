#!/usr/bin/env node
// Compile the TypeSpec source of truth (main.tsp) into dist/opencli.json.
//
// specs/xyd-cli/main.tsp (+ globals.tsp + commands/**) is the single source of
// truth for the xyd CLI surface.
// The @xyd-js/typespec-opencli emitter compiles it into an OpenCLI document,
// emitted to `specs/xyd-cli/dist/opencli.json` (and NOTHING else — no fan-out,
// no Rust codegen). Consumers pull the spec themselves:
//   - the committed `specs/xyd-cli/opencli.json` (imported by the TS xyd-cli via
//     `@xyd-js/cli-spec/opencli.json`) is refreshed by hand from this output;
//   - the Rust crate is self-sufficient — it owns its committed
//     `crates/xyd_cli/opencli.json` and syncs it via
//     `cargo run -p xyd_opencli2rust --bin regen -- crates/xyd_cli --spec specs/xyd-cli/dist/opencli.json`.
//
// `info.version` is injected at compile time from the @xyd-js/cli package version
// (specs/xyd-cli intentionally has no version of its own for the CLI surface).

import { copyFileSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const here = dirname(fileURLToPath(import.meta.url)); // specs/xyd-cli
const repoRoot = join(here, '..', '..');

// The CLI version drives info.version — read it from the xyd-cli package.
const cliPkg = JSON.parse(
  readFileSync(join(repoRoot, 'packages', 'xyd-cli', 'package.json'), 'utf8'),
);
const version = cliPkg.version;

// Resolve the tsp CLI without relying on PATH so `node build.mjs` works standalone.
const compilerPkgJson = require.resolve('@typespec/compiler/package.json');
const tspBin = join(dirname(compilerPkgJson), 'cmd', 'tsp.js');

console.log(`Compiling main.tsp → dist/opencli.json (version ${version})…`);
execFileSync(
  process.execPath,
  [
    tspBin,
    'compile',
    join(here, 'main.tsp'),
    '--emit',
    '@xyd-js/typespec-opencli',
    '--option',
    `@xyd-js/typespec-opencli.version=${version}`,
    '--output-dir',
    'dist',
  ],
  { cwd: here, stdio: 'inherit' },
);

// The emitter output dir is configured to `{project-root}/dist` (tspconfig.yaml),
// so the doc lands flat at dist/opencli.json. Normalize defensively in case an
// emitter subdir ever appears: if the flat path is missing, find the emitted
// opencli.json anywhere under dist/ and copy it to the canonical location.
const dist = join(here, 'dist');
const canonical = join(dist, 'opencli.json');
function findFile(dir, name) {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) {
      const found = findFile(p, name);
      if (found) return found;
    } else if (entry === name) {
      return p;
    }
  }
  return undefined;
}
let ok = false;
try {
  statSync(canonical);
  ok = true;
} catch {
  const emitted = findFile(dist, 'opencli.json');
  if (emitted) {
    copyFileSync(emitted, canonical);
    ok = true;
  }
}
if (!ok) {
  console.error('build: emitter did not produce dist/opencli.json');
  process.exit(1);
}
console.log(`→ ${canonical}`);
