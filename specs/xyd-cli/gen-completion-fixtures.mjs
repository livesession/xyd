#!/usr/bin/env node
// Regenerate the Rust completion goldens from the SAME opencli.json the crate embeds,
// using the canonical TS generators (@xyd-js/opencli-completion).
//
// The native Rust generators (crates/xyd_cli/src/v0/completion/{zsh,fish}.rs) must
// reproduce these byte-for-byte. A `#[cfg(test)]` in those modules asserts the Rust
// output equals these committed goldens; CI re-runs THIS script and `git diff --exit-code`
// so a change to the TS generator without regenerating the goldens fails.
//
// Completion output derives only from info.title + options + commands (never info.version),
// so a version-only bump of opencli.json does NOT churn these goldens.
//
// The generator is imported from the built dist by relative path (it is a self-contained
// tsup bundle — its only workspace dep, @xyd-js/opencli, is types-only and erased) so this
// script runs with no extra install step.

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { fish, zsh } from '../../packages/xyd-opencli-completion/dist/index.js';

const here = dirname(fileURLToPath(import.meta.url)); // specs/xyd-cli
const repoRoot = join(here, '..', '..');
const crateDir = join(repoRoot, 'crates', 'xyd_cli');

const spec = JSON.parse(readFileSync(join(crateDir, 'opencli.json'), 'utf8'));
const outDir = join(crateDir, 'src', 'v0', 'completion', 'testdata');
mkdirSync(outDir, { recursive: true });

const targets = [
  [join(outDir, 'xyd.zsh'), zsh(spec)],
  [join(outDir, 'xyd.fish'), fish(spec)],
];
for (const [path, content] of targets) {
  writeFileSync(path, content);
  console.log(`→ ${path}`);
}
