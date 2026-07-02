import { execSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { expect } from 'vitest';

import { hasCommand, listFiles, writeTree } from '@xyd-js/opensdk-ci';

import { opensdkRuby } from '../index';
import type { OpensdkRubyOptions } from '../index';

// REGEN=1 regenerates the golden output/ trees instead of asserting.
const REGENERATE = process.env.REGEN === '1';

// O2S_RUBY_SMOKE=1 (and a ruby) enables a `ruby -c` syntax check of every
// generated .rb file.
export const RUBY_SMOKE = process.env.O2S_RUBY_SMOKE === '1' && hasCommand('ruby --version');

function fixturePath(name: string): string {
  return path.join(__dirname, '../__fixtures__', name);
}

export function readIR(name: string) {
  return JSON.parse(fs.readFileSync(path.join(fixturePath(name), 'input.json'), 'utf8'));
}

/** Golden test: opensdkRuby(input.json) === the committed output/ file tree. */
export function testFixture(name: string, options?: OpensdkRubyOptions) {
  const files = opensdkRuby(readIR(name), options);
  const outDir = path.join(fixturePath(name), 'output');

  if (REGENERATE) writeTree(outDir, files);

  const expected = listFiles(outDir);
  expect(Object.keys(files).sort()).toEqual(Object.keys(expected).sort());
  for (const [rel, content] of Object.entries(files)) {
    expect(content, `mismatch in ${name}/${rel}`).toEqual(expected[rel]);
  }
}

/**
 * Optional: write the project to a temp dir and run `ruby -c` (syntax check
 * only — no execution) on EVERY generated .rb file. The local ruby is 2.6, so
 * this proves the emitter stays inside 2.6-compatible syntax. Optionally also
 * loads the whole gem via `ruby -Ilib -e "require '<pkg>'"`.
 */
export function rubyCompileSmoke(name: string, options?: OpensdkRubyOptions) {
  const files = opensdkRuby(readIR(name), options);
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), `o2rb-${name.replace(/\W/g, '')}-`));
  try {
    writeTree(dir, files);
    const rbFiles = Object.keys(files).filter((f) => f.endsWith('.rb'));
    expect(rbFiles.length, `${name}: no generated .rb files to check`).toBeGreaterThan(0);
    for (const rel of rbFiles) {
      execSync(`ruby -c ${JSON.stringify(rel)}`, { cwd: dir, stdio: 'pipe' });
    }
    // Load the whole gem through its entry point (a require-time check on top of
    // the per-file syntax check).
    const pkg = rbFiles.find((f) => f.match(/^lib\/[^/]+\.rb$/))?.replace(/^lib\/|\.rb$/g, '');
    if (pkg) {
      execSync(`ruby -Ilib -e ${JSON.stringify(`require '${pkg}'`)}`, { cwd: dir, stdio: 'pipe' });
    }
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}
