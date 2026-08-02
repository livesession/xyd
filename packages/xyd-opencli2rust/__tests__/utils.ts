import { execSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { expect } from 'vitest';

import { opencli2rust } from '../index';
import type { Opencli2RustOptions } from '../index';

// REGEN=1 regenerates the golden output/ trees instead of asserting.
const REGENERATE = process.env.REGEN === '1';

// O2R_CARGO_SMOKE=1 (and a Rust toolchain + network) enables the cargo check smoke.
export const CARGO_SMOKE = process.env.O2R_CARGO_SMOKE === '1' && hasCargo();

export function hasCargo(): boolean {
  try {
    execSync('cargo --version', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function fixturePath(name: string): string {
  return path.join(__dirname, '../__fixtures__', name);
}

function readSpec(name: string) {
  return JSON.parse(fs.readFileSync(path.join(fixturePath(name), 'input.json'), 'utf8'));
}

/** Flatten a ProjectFileMap to plain contents (goldens don't carry writeModes). */
export function flattenFiles(files: ReturnType<typeof opencli2rust>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [rel, value] of Object.entries(files)) {
    out[rel] = typeof value === 'string' ? value : value.content;
  }
  return out;
}

export function fileContents(name: string, options?: Opencli2RustOptions): Record<string, string> {
  return flattenFiles(opencli2rust(readSpec(name), options));
}

export function listFiles(dir: string, base = dir): Record<string, string> {
  const out: Record<string, string> = {};
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) Object.assign(out, listFiles(full, base));
    else out[path.relative(base, full).split(path.sep).join('/')] = fs.readFileSync(full, 'utf8');
  }
  return out;
}

export function writeTree(dir: string, files: Record<string, string>) {
  fs.rmSync(dir, { recursive: true, force: true });
  for (const [rel, content] of Object.entries(files)) {
    const full = path.join(dir, rel);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, content);
  }
}

/** Golden test: opencli2rust(input.json) === the committed output/ file tree. */
export function testFixture(name: string, options?: Opencli2RustOptions) {
  const files = fileContents(name, options);
  const outDir = path.join(fixturePath(name), 'output');

  if (REGENERATE) writeTree(outDir, files);

  const expected = listFiles(outDir);
  expect(Object.keys(files).sort()).toEqual(Object.keys(expected).sort());
  for (const [rel, content] of Object.entries(files)) {
    expect(content, `mismatch in ${name}/${rel}`).toEqual(expected[rel]);
  }
}

/** Optional: write the project to a temp dir and run `cargo check` (shared CARGO_TARGET_DIR). */
export function cargoCheckSmoke(name: string, options?: Opencli2RustOptions) {
  const files = fileContents(name, options);
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), `o2r-${name.replace(/\W/g, '')}-`));
  const targetDir = process.env.CARGO_TARGET_DIR || path.join(os.tmpdir(), 'o2r-target');
  try {
    writeTree(dir, files);
    execSync('cargo check --quiet', {
      cwd: dir,
      stdio: 'pipe',
      env: { ...process.env, CARGO_TARGET_DIR: targetDir },
    });
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}
