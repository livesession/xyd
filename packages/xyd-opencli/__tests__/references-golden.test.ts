import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { type OpencliSpecJson, opencliToReferences } from '../src';

// The `opencliToReferences` oracle.
//
// This converter (342 lines) turns an OpenCLI document into uniform
// `Reference[]` and runs on the PAGE-COMPILE HOT PATH — `uniformProcessor.ts`
// and `presets/cli/index.ts` call it for every CLI docs page. It has no Rust
// counterpart yet; `crates/xyd_opencli_uniform` is a fresh port, and the day
// this package is deleted is the day its behavior stops being defined
// anywhere. So freeze it now, while a JS oracle still exists.
//
// The corpus is deliberately SELF-CONTAINED (inputs copied in, not referenced
// where they live). `xyd_opencli_uniform` stays in xyd while
// `xyd-openapi2opencli` and `xyd-opencli2go` move to the opensdk repo — reading
// their fixtures from here would turn into a cross-REPO path the moment the
// split lands.
//
// Inputs:
//   1-5    openapi2opencli-derived docs: arguments, subcommands, body flatten,
//          and `x-openapi.responses` (the "Example response" group)
//   6      the real hand-authored xyd CLI: 6 recursive root options (the global
//          -options branch) plus nested subcommands
//   7.*    a deterministic slice of the real OpenAI-derived corpus
//
// Both `globalOptionsPerCommand` modes are captured because the flag materially
// reshapes the result: false (default) appends ONE extra `global-options`
// reference; true instead adds a "Global options" definition to every command
// and emits no extra reference.

const FIXTURES = path.join(__dirname, '../__fixtures__/references');
const BUILD = process.env.O2S_BUILD_DOCS === '1';

const MODES = [
  { file: 'references.json', options: {} },
  { file: 'references.per-command.json', options: { globalOptionsPerCommand: true } },
] as const;

const cases = fs.existsSync(FIXTURES)
  ? fs
      .readdirSync(FIXTURES)
      .sort()
      .filter((d) => fs.existsSync(path.join(FIXTURES, d, 'input.json')))
  : [];

function convert(name: string, options: Record<string, unknown>) {
  const spec = JSON.parse(fs.readFileSync(path.join(FIXTURES, name, 'input.json'), 'utf8')) as OpencliSpecJson;
  return opencliToReferences(spec, options);
}

describe.runIf(BUILD && cases.length > 0)('generate opencliToReferences goldens', () => {
  it('writes references.json + references.per-command.json for every case', () => {
    for (const name of cases) {
      for (const mode of MODES) {
        const refs = convert(name, mode.options);
        fs.writeFileSync(path.join(FIXTURES, name, mode.file), `${JSON.stringify(refs, null, 2)}\n`);
      }
    }
    expect(cases.length).toBeGreaterThan(0);
  });
});

// The corpus size is ASSERTED, not merely enumerated. `skipIf(cases.length === 0)`
// meant a missing or relocated __fixtures__/references made the whole suite
// vanish and still report green — the failure mode this file exists to prevent.
// Rust's crates/xyd_opencli_uniform/tests/references.rs asserts the same 17
// against the same corpus; keep the two numbers in step.
const EXPECTED_CASES = 17;

describe('opencliToReferences corpus', () => {
  it(`discovers all ${EXPECTED_CASES} committed fixture cases`, () => {
    expect({ count: cases.length, dir: FIXTURES }).toEqual({ count: EXPECTED_CASES, dir: FIXTURES });
  });
});

describe.skipIf(BUILD)('opencliToReferences (regen guard)', () => {
  for (const name of cases) {
    for (const mode of MODES) {
      const goldenPath = path.join(FIXTURES, name, mode.file);
      // Was `it.skipIf(!fs.existsSync(goldenPath))`: a golden that failed to
      // land skipped its own case silently. All 17 × 2 goldens are committed,
      // so a missing one is damage, not a legitimate gap — assert it.
      it(`${name} — ${mode.file}`, () => {
        expect(fs.existsSync(goldenPath), `missing golden ${goldenPath}`).toBe(true);
        expect(convert(name, mode.options)).toEqual(JSON.parse(fs.readFileSync(goldenPath, 'utf8')));
      });
    }
  }
});
