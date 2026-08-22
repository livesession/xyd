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
