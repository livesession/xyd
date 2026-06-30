import { execSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { expect } from 'vitest';

import { opencli2go } from '../index';
import type { Opencli2GoOptions } from '../index';

// REGEN=1 regenerates the golden output/ trees instead of asserting.
const REGENERATE = process.env.REGEN === '1';

// O2G_GO_SMOKE=1 (and a Go toolchain + network) enables the go build/vet smoke.
export const GO_SMOKE = process.env.O2G_GO_SMOKE === '1' && hasGo();

function hasGo(): boolean {
  try {
    execSync('go version', { stdio: 'ignore' });
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

function listFiles(dir: string, base = dir): Record<string, string> {
  const out: Record<string, string> = {};
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) Object.assign(out, listFiles(full, base));
    else out[path.relative(base, full).split(path.sep).join('/')] = fs.readFileSync(full, 'utf8');
  }
  return out;
}

function writeTree(dir: string, files: Record<string, string>) {
  fs.rmSync(dir, { recursive: true, force: true });
  for (const [rel, content] of Object.entries(files)) {
    const full = path.join(dir, rel);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, content);
  }
}

/** Golden test: opencli2go(input.json) === the committed output/ file tree. */
export function testFixture(name: string, options?: Opencli2GoOptions) {
  const files = opencli2go(readSpec(name), options);
  const outDir = path.join(fixturePath(name), 'output');

  if (REGENERATE) writeTree(outDir, files);

  const expected = listFiles(outDir);
  expect(Object.keys(files).sort()).toEqual(Object.keys(expected).sort());
  for (const [rel, content] of Object.entries(files)) {
    expect(content, `mismatch in ${name}/${rel}`).toEqual(expected[rel]);
  }
}

/** Optional: write the project to a temp dir and run `go mod tidy && go build && go vet`. */
export function goBuildSmoke(name: string, options?: Opencli2GoOptions) {
  const files = opencli2go(readSpec(name), options);
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), `o2g-${name.replace(/\W/g, '')}-`));
  try {
    writeTree(dir, files);
    execSync('go mod tidy', { cwd: dir, stdio: 'pipe' });
    execSync('go build ./...', { cwd: dir, stdio: 'pipe' });
    execSync('go vet ./...', { cwd: dir, stdio: 'pipe' });
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}
