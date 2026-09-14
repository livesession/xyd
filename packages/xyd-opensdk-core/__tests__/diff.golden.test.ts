// Frozen golden oracle for `diffIR`.
//
// This is the *generator + guard* for `__fixtures__/diff/`:
//
//   - `O2S_BUILD_DOCS=1 pnpm --filter @xyd-js/opensdk-core ci:test` rebuilds the
//     corpus: `_specs/*.json` (the inputs, minted by `diff.corpus.ts` from the
//     committed IR fixtures in `packages/xyd-opensdk-go/__fixtures__`) and
//     `<case>/output.json` (the oracle — whatever the REAL `diffIR` produces).
//   - Every other run is a pure guard: it re-reads the committed inputs, runs
//     `diffIR`, and asserts the result still equals the committed `output.json`.
//
// The Rust port (`crates/xyd_opensdk_diff`) gates on these exact goldens, so
// they must only ever be regenerated deliberately, on a clean tree, BEFORE the
// Rust side changes. A golden regenerated to make Rust pass is a dead oracle.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { diffIR } from '../src';
import { CASES, buildSpecs, writeRawNumbers } from './diff.corpus';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES = path.join(HERE, '..', '__fixtures__', 'diff');
const SPECS = path.join(FIXTURES, '_specs');
const GO_FIXTURES = path.join(HERE, '..', '..', 'xyd-opensdk-go', '__fixtures__');

const BUILD = process.env.O2S_BUILD_DOCS === '1';

const writeJson = (file: string, value: unknown) => {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
};
const readJson = (file: string) => JSON.parse(fs.readFileSync(file, 'utf-8'));

if (BUILD) {
  const specs = buildSpecs(GO_FIXTURES);
  fs.rmSync(SPECS, { recursive: true, force: true });
  for (const [name, spec] of Object.entries(specs)) {
    const file = path.join(SPECS, `${name}.json`);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    // `writeRawNumbers` un-quotes the RAW() sentinels so literals JSON.stringify
    // would normalize away (`1.0`, `-0.0`) survive into the committed input.
    fs.writeFileSync(file, `${writeRawNumbers(JSON.stringify(spec, null, 2))}\n`);
  }
  for (const kase of CASES) {
    const dir = path.join(FIXTURES, kase.name);
    fs.rmSync(dir, { recursive: true, force: true });
    writeJson(path.join(dir, 'case.json'), { base: kase.base, head: kase.head });
    // Diff the specs as they were WRITTEN, not the in-memory objects: the RAW()
    // sentinels only become numbers once the file is parsed back, and reading
    // from disk is exactly what both the guard below and the Rust port do.
    writeJson(
      path.join(dir, 'output.json'),
      diffIR(
        readJson(path.join(SPECS, `${kase.base}.json`)),
        readJson(path.join(SPECS, `${kase.head}.json`)),
      ),
    );
  }
}

/** Case directories as they exist ON DISK — the Rust port reads the same set. */
const caseDirs = fs
  .readdirSync(FIXTURES, { withFileTypes: true })
  .filter((e) => e.isDirectory() && e.name !== '_specs')
  .map((e) => e.name)
  .sort();

describe('diffIR golden corpus', () => {
  it('has cases', () => {
    expect(caseDirs.length).toBe(CASES.length);
    expect(caseDirs).toEqual(CASES.map((c) => c.name).sort());
  });

  for (const name of caseDirs) {
    it(name, () => {
      const dir = path.join(FIXTURES, name);
      const { base, head } = readJson(path.join(dir, 'case.json'));
      const actual = diffIR(
        readJson(path.join(SPECS, `${base}.json`)),
        readJson(path.join(SPECS, `${head}.json`)),
      );
      expect(actual).toEqual(readJson(path.join(dir, 'output.json')));
    });
  }

  it('covers every change kind the differ can emit', () => {
    const seen = new Set<string>();
    for (const name of caseDirs) {
      for (const c of readJson(path.join(FIXTURES, name, 'output.json')).changes) {
        seen.add(`${c.kind}:${c.severity}`);
      }
    }
    // Every (kind, severity) pair reachable from diff.ts. `pagination-added`
    // has no counterpart on purpose: the TS emits nothing when base has no
    // pagination and head does.
    const expected = [
      'alias-target-changed:breaking',
      'binding-changed:breaking',
      'body-added:breaking',
      'body-added:safe',
      'body-encoding-changed:breaking',
      'body-removed:breaking',
      'body-required-flip:breaking',
      'body-type-changed:breaking',
      'deprecated-added:risky',
      'enum-value-added:risky',
      'enum-value-removed:breaking',
      'field-added:breaking',
      'field-added:safe',
      'field-nullable-flip:risky',
      'field-removed:breaking',
      'field-required-flip:breaking',
      'field-type-changed:breaking',
      'method-added:safe',
      'method-removed:breaking',
      'pagination-removed:breaking',
      'pagination-style-changed:breaking',
      'param-added:breaking',
      'param-added:safe',
      'param-removed:breaking',
      'param-required-flip:breaking',
      'param-type-changed:breaking',
      'param-wire-name-changed:risky',
      'response-type-changed:breaking',
      'sdk-behavior-changed:safe',
      'security-changed:breaking',
      'type-added:safe',
      'type-kind-changed:breaking',
      'type-removed:breaking',
      'union-variant-added:safe',
      'union-variant-removed:breaking',
    ];
    expect([...seen].sort()).toEqual(expected);
  });
});
