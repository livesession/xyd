#!/usr/bin/env node
// Regenerate the Mintlify settings goldens (migrateme S2) from the REAL migrator.
//
// For each case dir under the crate testdata that contains a `docs.json` (a Mintlify
// config, plus any referenced asset files), copy it to a temp dir, run the built xyd CLI
// `migrateme` (the actual `mintlifyMigrator`) against the copy, and capture the resulting
// xyd `docs.json` as `<case>/expected.json`. The native Rust settings port
// (crates/xyd_cli/src/custom/migrateme/mintlify/settings.rs) must byte-match these; a
// `#[cfg(test)]` asserts it and CI `git diff --exit-code`s the goldens.
//
// `migrateme` prompts (askForStart) for a local path, so we feed `y\n` on stdin. The
// migrator mutates in place (writes docs.json, moves assets into public/), hence the copy.

import { execFileSync } from 'node:child_process';
import {
  cpSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '..', '..');
const cli = join(repoRoot, 'packages', 'xyd-cli', 'dist', 'index.js');
const testdata = join(
  repoRoot,
  'crates',
  'xyd_cli',
  'src',
  'custom',
  'migrateme',
  'mintlify',
  'testdata',
);

const cases = readdirSync(testdata).filter((name) =>
  statSync(join(testdata, name)).isDirectory(),
);

for (const name of cases) {
  const caseDir = join(testdata, name);
  try {
    statSync(join(caseDir, 'docs.json'));
  } catch {
    continue; // not an input case
  }

  const work = mkdtempSync(join(tmpdir(), `mintlify-golden-${name}-`));
  // Copy the case inputs (docs.json + any assets); never the golden itself.
  cpSync(caseDir, work, {
    recursive: true,
    filter: (src) => !src.endsWith('expected.json'),
  });

  execFileSync('node', [cli, 'migrateme', work], {
    input: 'y\n',
    stdio: ['pipe', 'ignore', 'ignore'],
  });

  const out = readFileSync(join(work, 'docs.json'), 'utf8');
  writeFileSync(join(caseDir, 'expected.json'), out);
  console.log(`→ ${name}/expected.json`);
  rmSync(work, { recursive: true, force: true });
}
