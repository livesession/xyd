import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect } from 'vitest';

import { openapi2opensdk } from '../src';
import type { OpenApi2OpenSdkOptions } from '../src';

const FIXTURES = join(dirname(fileURLToPath(import.meta.url)), '..', '__fixtures__');
const REGEN = process.env.REGEN === '1';

/**
 * Run the converter on `<name>/input.json` and diff the IR against the committed
 * `<name>/output.json`. `REGEN=1` (re)writes the golden.
 */
export function testFixture(name: string, options: OpenApi2OpenSdkOptions = {}): void {
  const dir = join(FIXTURES, name);
  const input = JSON.parse(readFileSync(join(dir, 'input.json'), 'utf-8'));
  const result = openapi2opensdk(input, options);

  const outputPath = join(dir, 'output.json');
  if (REGEN) {
    writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`);
    return;
  }
  const expected = JSON.parse(readFileSync(outputPath, 'utf-8'));
  expect(result).toEqual(expected);
}
