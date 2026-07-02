import { execSync } from 'node:child_process';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';

import { expect } from 'vitest';

import { listFiles, writeTree } from '@xyd-js/opensdk-ci';

import { opensdkNode } from '../index';
import type { OpensdkNodeOptions } from '../index';

// REGEN=1 regenerates the golden output/ trees instead of asserting.
const REGENERATE = process.env.REGEN === '1';

// O2S_NODE_SMOKE=1 enables the `tsc --noEmit` compile of the generated SDK.
export const NODE_SMOKE = process.env.O2S_NODE_SMOKE === '1';

function fixturePath(name: string): string {
  return path.join(__dirname, '../__fixtures__', name);
}

function readIR(name: string) {
  return JSON.parse(fs.readFileSync(path.join(fixturePath(name), 'input.json'), 'utf8'));
}

/** Golden test: opensdkNode(input.json) === the committed output/ file tree. */
export function testFixture(name: string, options?: OpensdkNodeOptions) {
  const files = opensdkNode(readIR(name), options);
  const outDir = path.join(fixturePath(name), 'output');

  if (REGENERATE) writeTree(outDir, files);

  const expected = listFiles(outDir);
  expect(Object.keys(files).sort()).toEqual(Object.keys(expected).sort());
  for (const [rel, content] of Object.entries(files)) {
    expect(content, `mismatch in ${name}/${rel}`).toEqual(expected[rel]);
  }
}

/**
 * Optional: write the generated SDK to a temp dir and type-check it with the
 * real TypeScript compiler (`tsc --noEmit`). No external @types are needed — the
 * DOM lib supplies the built-in web APIs (fetch/URL/Headers/Response/FormData/
 * Blob/AbortController/crypto), `process` is declared ambiently in the runtime,
 * and a tiny `tests/_shims.d.ts` declares the stdlib test modules. When the
 * SDK's own test suite is generated, the compile uses `tsconfig.test.json` so
 * the generated `tests/*.test.ts` are type-checked alongside `src/`.
 */
export function tscSmoke(name: string, options?: OpensdkNodeOptions) {
  const files = opensdkNode(readIR(name), options);
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), `o2s-node-${name.replace(/\W/g, '')}-`));
  try {
    writeTree(dir, files);
    const require = createRequire(__filename);
    const tsc = require.resolve('typescript/bin/tsc');
    // tsconfig.test.json includes both src + tests (present whenever generateTests ran).
    const project = files['tsconfig.test.json'] ? 'tsconfig.test.json' : 'tsconfig.json';
    execSync(`node ${JSON.stringify(tsc)} --noEmit -p ${JSON.stringify(path.join(dir, project))}`, {
      cwd: dir,
      stdio: 'pipe',
    });
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}
