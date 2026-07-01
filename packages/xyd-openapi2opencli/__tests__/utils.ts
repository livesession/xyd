import path from 'node:path';
import fs from 'node:fs';

import { expect } from 'vitest';

import { deferencedOpenAPI } from '@xyd-js/openapi';

import { openapi2opencli } from '../index';
import type { OpenApi2OpenCliOptions } from '../index';

// Set REGEN=1 to (re)generate the golden output.json files instead of asserting.
const REGENERATE = process.env.REGEN === '1';

function fullFixturePath(name: string): string {
  return path.join(__dirname, '../__fixtures__', name);
}

function readOutput(name: string) {
  return JSON.parse(fs.readFileSync(fullFixturePath(name), 'utf8'));
}

function saveOutput(fixtureName: string, result: unknown) {
  fs.writeFileSync(fullFixturePath(`${fixtureName}/output.json`), `${JSON.stringify(result, null, 2)}\n`);
}

/** Run a fixture: deref input.yaml → openapi2opencli → compare against golden output.json. */
export async function testFixture(fixtureName: string, options?: OpenApi2OpenCliOptions) {
  const doc = await deferencedOpenAPI(fullFixturePath(`${fixtureName}/input.yaml`));
  if (!doc) throw new Error(`Failed to load fixture spec: ${fixtureName}/input.yaml`);

  const result = openapi2opencli(doc, options);
  // Normalize to plain JSON (drops undefined, guarantees serializable parity with the file).
  const normalized = JSON.parse(JSON.stringify(result));

  if (REGENERATE) {
    saveOutput(fixtureName, normalized);
  }

  const expected = readOutput(`${fixtureName}/output.json`);
  expect(normalized).toEqual(expected);
}
