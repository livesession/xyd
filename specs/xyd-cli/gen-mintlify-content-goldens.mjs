#!/usr/bin/env node
// Regenerate the Mintlify CONTENT goldens (migrateme S3) from the REAL migrator.
//
// For each case dir under the crate content-testdata that contains an `input.mdx`, spin up
// a temp Mintlify docs project (minimal docs.json + the input as `page.mdx`), run the built
// xyd CLI `migrateme` (the actual MDX→Markdown transform), and capture the produced
// `page.md` as `<case>/expected.md`. The native Rust content port
// (crates/xyd_cli/src/v0/migrateme/mintlify/content.rs + serialize.rs) targets these.
//
// Byte-parity is the goal for these CURATED, remark-canonical shapes; arbitrary real-world
// prose falls back to semantic equivalence (see the plan). The migrator prompts (askForStart)
// for a local path, so we feed `y\n` on stdin.

import { execFileSync } from 'node:child_process';
import {
  copyFileSync,
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
  'v0',
  'migrateme',
  'mintlify',
  'content-testdata',
);

const DOCS_JSON = JSON.stringify({
  $schema: 'https://mintlify.com/docs.json',
  name: 'C',
  navigation: { groups: [{ group: 'G', pages: ['page'] }] },
});

const cases = readdirSync(testdata).filter((name) =>
  statSync(join(testdata, name)).isDirectory(),
);

for (const name of cases) {
  const caseDir = join(testdata, name);
  const input = join(caseDir, 'input.mdx');
  try {
    statSync(input);
  } catch {
    continue;
  }

  const work = mkdtempSync(join(tmpdir(), `mintlify-content-${name}-`));
  writeFileSync(join(work, 'docs.json'), DOCS_JSON);
  copyFileSync(input, join(work, 'page.mdx'));

  execFileSync('node', [cli, 'migrateme', work], {
    input: 'y\n',
    stdio: ['pipe', 'ignore', 'ignore'],
  });

  writeFileSync(join(caseDir, 'expected.md'), readFileSync(join(work, 'page.md'), 'utf8'));
  console.log(`→ ${name}/expected.md`);
  rmSync(work, { recursive: true, force: true });
}
