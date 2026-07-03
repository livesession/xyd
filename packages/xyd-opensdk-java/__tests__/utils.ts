import { execSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { expect } from 'vitest';

import { hasCommand, listFiles, writeTree } from '@xyd-js/opensdk-ci';

import { opensdkJava } from '../index';
import type { OpensdkJavaOptions } from '../index';

// REGEN=1 regenerates the golden output/ trees instead of asserting.
const REGENERATE = process.env.REGEN === '1';

// O2S_JAVA_SMOKE=1 (and a javac toolchain) enables the javac compile smoke.
export const JAVA_SMOKE = process.env.O2S_JAVA_SMOKE === '1' && hasCommand('javac -version');

function fixturePath(name: string): string {
  return path.join(__dirname, '../__fixtures__', name);
}

function readIR(name: string) {
  return JSON.parse(fs.readFileSync(path.join(fixturePath(name), 'input.json'), 'utf8'));
}

/** Golden test: opensdkJava(input.json) === the committed output/ file tree. */
export function testFixture(name: string, options?: OpensdkJavaOptions) {
  const files = opensdkJava(readIR(name), options);
  const outDir = path.join(fixturePath(name), 'output');

  if (REGENERATE) writeTree(outDir, files);

  const expected = listFiles(outDir);
  expect(Object.keys(files).sort()).toEqual(Object.keys(expected).sort());
  for (const [rel, content] of Object.entries(files)) {
    expect(content, `mismatch in ${name}/${rel}`).toEqual(expected[rel]);
  }
}

/**
 * Optional: write the project to a temp dir and compile EVERY generated source
 * together with a single `javac` invocation (package dirs match declarations,
 * dependency-free — java.net.http + java.util only). Proves the emitted SDK is
 * a compilable Java project without a Maven/Gradle toolchain.
 */
export function javacSmoke(name: string, options?: OpensdkJavaOptions) {
  const files = opensdkJava(readIR(name), options);
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), `o2s-java-${name.replace(/\W/g, '')}-`));
  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), `o2s-java-out-${name.replace(/\W/g, '')}-`));
  try {
    writeTree(dir, files);
    const sources = Object.keys(files)
      .filter((rel) => rel.endsWith('.java'))
      .map((rel) => path.join(dir, rel));
    expect(sources.length, 'no generated .java sources').toBeGreaterThan(0);
    execSync(`javac -d ${JSON.stringify(outDir)} ${sources.map((s) => JSON.stringify(s)).join(' ')}`, {
      stdio: 'pipe',
    });
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
    fs.rmSync(outDir, { recursive: true, force: true });
  }
}
