import fs from 'node:fs';
import path from 'node:path';

import { generateFileMap } from '@xyd-js/opensdk-framework';
import { describe, expect, it } from 'vitest';

import { nodeEmitter } from '../index';

// writeMode through the ORCHESTRATOR, i.e. the path the real pipeline takes.
//
// The sibling write-modes.test.ts calls the emitter capabilities directly, so it
// only ever exercises TypeScript. This one goes through generateFileMap, which
// under XYD_NATIVE=1 returns the map — content AND writeMode — straight from the
// Rust crate. Without it, a regression in the Rust write-mode table would be
// invisible to the JS suite, and it is exactly that table which lets the
// orchestrator stop calling the TS generateProject.
//
// Node is the subject because it holds the richest slice of the contract: the
// only mergeJson entry plus two skipIfExists.
//
// Runs in BOTH modes and asserts the same thing, so the ffi job turns it into a
// native-vs-JS differential.

const FIXTURE = path.join(__dirname, '../__fixtures__/1.basic/input.json');

describe('opensdk-node writeMode via generateFileMap', () => {
  const spec = JSON.parse(fs.readFileSync(FIXTURE, 'utf8'));
  const entries = generateFileMap(spec, nodeEmitter);

  it('carries the non-default write modes', () => {
    expect(entries['package.json'].writeMode).toBe('mergeJson');
    expect(entries['tsconfig.json'].writeMode).toBe('skipIfExists');
    expect(entries['README.md'].writeMode).toBe('skipIfExists');
  });

  it('leaves every other file on the overwrite default', () => {
    const nonDefault = Object.entries(entries)
      .filter(([, e]) => e.writeMode !== undefined)
      .map(([p]) => p)
      .sort();
    expect(nonDefault).toEqual(['README.md', 'package.json', 'tsconfig.json']);
  });

  it('still produces content for every entry', () => {
    for (const [p, e] of Object.entries(entries)) {
      expect(typeof e.content, `${p} has no content`).toBe('string');
    }
    expect(Object.keys(entries).length).toBeGreaterThan(5);
  });
});
