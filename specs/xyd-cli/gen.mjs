#!/usr/bin/env node
// Regenerate opencli.json from the TypeSpec source of truth (xyd.tsp).
//
// specs/xyd-cli/xyd.tsp is the single source of truth. It is compiled by the
// @xyd-js/typespec-opencli emitter into an OpenCLI document, which is then fanned
// out to every consumer:
//   - specs/xyd-cli/opencli.json     (canonical; committed)
//   - crates/xyd_cli/opencli.json    (Rust embed via include_str!)
//   - apps/docs/public/opencli.json  (docs static asset)
//
// `info.version` is injected at compile time from the @xyd-js/cli package version
// (specs/xyd-cli intentionally has no version of its own for the CLI surface).

import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdirSync, readFileSync } from 'node:fs';
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

// Resolve the tsp CLI without relying on PATH so `node gen.mjs` works standalone.
const compilerPkgJson = require.resolve('@typespec/compiler/package.json');
const tspBin = join(dirname(compilerPkgJson), 'cmd', 'tsp.js');

console.log(`Compiling xyd.tsp → OpenCLI (version ${version})…`);
execFileSync(
  process.execPath,
  [
    tspBin,
    'compile',
    join(here, 'xyd.tsp'),
    '--emit',
    '@xyd-js/typespec-opencli',
    '--option',
    `@xyd-js/typespec-opencli.version=${version}`,
  ],
  { cwd: here, stdio: 'inherit' },
);

// Fan the emitted doc out to every consumer.
const emitted = join(here, '.tsp-out', 'opencli.json');
const targets = [
  join(here, 'opencli.json'),
  join(repoRoot, 'crates', 'xyd_cli', 'opencli.json'),
  join(repoRoot, 'apps', 'docs', 'public', 'opencli.json'),
];
for (const target of targets) {
  mkdirSync(dirname(target), { recursive: true });
  copyFileSync(emitted, target);
  console.log(`→ ${target}`);
}

// ── Rust codegen (now Rust-owned) ────────────────────────────────────────────
// The Rust CLI's command tree (crates/xyd_cli/src/opencli/**) is regenerated from
// the OpenCLI doc by the RUST regen binary (crates/xyd_opencli2rust/src/bin/regen.rs):
// it runs opencli2rust → write_project (the regen-safe .sdk/sdk.lock / .sdkignore
// lifecycle, ported to Rust in crates/xyd_opensdk_framework) → cargo fmt. The
// module/impl/bin/crate layout config now lives in crates/xyd_cli/regen.toml — a
// single Rust-owned home, no longer duplicated here — so this step no longer imports
// the TS opencli2rust generator or the JS writeProject safe-write lifecycle.
//
// (The `tsp compile` above stays node because TypeSpec is a node compiler; only the
// Rust-CLI codegen moved to Rust.)
execFileSync(
  'cargo',
  [
    'run',
    '-q',
    // cargo can't discover the workspace from repoRoot (the workspace is rooted at
    // crates/, not the repo root), so point it at the crates/ manifest explicitly.
    '--manifest-path',
    join(repoRoot, 'crates', 'Cargo.toml'),
    '-p',
    'xyd_opencli2rust',
    '--bin',
    'regen',
    '--',
    join(repoRoot, 'crates', 'xyd_cli'),
  ],
  { cwd: repoRoot, stdio: 'inherit' },
);

// ── Completion goldens ───────────────────────────────────────────────────────
// Regenerate the Rust completion byte-parity goldens (crates/xyd_cli/src/v0/
// completion/testdata/xyd.{zsh,fish}) from the freshly-fanned opencli.json using the
// canonical TS generators. The native Rust generators must reproduce these; a
// `#[cfg(test)]` in the crate asserts equality and CI `git diff --exit-code`s them.
execFileSync(process.execPath, [join(here, 'gen-completion-fixtures.mjs')], {
  cwd: here,
  stdio: 'inherit',
});
