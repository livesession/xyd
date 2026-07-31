import { execSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { expect } from 'vitest';

import { hasCommand, listFiles, writeTree } from '@xyd-js/opensdk-ci';

import { opensdkRust } from '../index';
import type { OpensdkRustOptions } from '../index';

// REGEN=1 regenerates the golden output/ trees instead of asserting.
const REGENERATE = process.env.REGEN === '1';

// O2S_RUST_SMOKE=1 (and a cargo toolchain) enables a `cargo test --no-run` compile
// check of every generated crate (lib + its integration tests).
export const RUST_SMOKE = process.env.O2S_RUST_SMOKE === '1' && hasCommand('cargo --version');

function fixturePath(name: string): string {
  return path.join(__dirname, '../__fixtures__', name);
}

export function readIR(name: string) {
  return JSON.parse(fs.readFileSync(path.join(fixturePath(name), 'input.json'), 'utf8'));
}

/** Golden test: opensdkRust(input.json) === the committed output/ file tree. */
export function testFixture(name: string, options?: OpensdkRustOptions) {
  const files = opensdkRust(readIR(name), options);
  const outDir = path.join(fixturePath(name), 'output');

  if (REGENERATE) writeTree(outDir, files);

  const expected = listFiles(outDir);
  expect(Object.keys(files).sort()).toEqual(Object.keys(expected).sort());
  for (const [rel, content] of Object.entries(files)) {
    expect(content, `mismatch in ${name}/${rel}`).toEqual(expected[rel]);
  }
}

/**
 * Optional: write the crate to a temp dir and `cargo test --no-run` it — compiles
 * the lib AND its generated integration tests (tests/**.rs) without running them,
 * so a network round-trip isn't needed. Proves the whole emitted crate compiles.
 */
export function cargoBuildSmoke(name: string, options?: OpensdkRustOptions) {
  const files = opensdkRust(readIR(name), options);
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), `o2rs-${name.replace(/\W/g, '')}-`));
  try {
    writeTree(dir, files);
    execSync('cargo test --no-run', { cwd: dir, stdio: 'pipe' });
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}
