import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { fullIR, listFiles, writeTree } from '@xyd-js/opensdk-ci';

import { opensdkRust } from '../index';

// The ENTIRE produced Rust SDK, assembled by merging every committed per-method
// IR into one document and running opensdkRust. This is the whole thing —
// lib.rs, client.rs, every resource module, models.rs, the vendored transport,
// and the SDK's own tests/** — committed as a golden so the complete generated
// SDK can be diffed (not just one file per method). The per-method openai
// fixtures come from the converter oracle; until they are committed, both blocks
// skip. Regenerate the golden with O2S_BUILD_DOCS=1.

const PER_METHOD = path.join(__dirname, '../__fixtures__/-2.complex.openai');
const OUT = path.join(__dirname, '../__fixtures__/-2.complex.openai.full/output');

const BUILD = process.env.O2S_BUILD_DOCS === '1';

const hasInputs = fs.existsSync(PER_METHOD) && fs.readdirSync(PER_METHOD).length > 0;
const generate = () => opensdkRust(fullIR(PER_METHOD, 'openai'));

// ---- Generator (opt-in) --------------------------------------------------
describe.runIf(BUILD && hasInputs)('generate the entire Rust SDK golden', () => {
  it('build __fixtures__/-2.complex.openai.full/output (whole merged SDK)', () => {
    const files = generate();
    writeTree(OUT, files);
    expect(Object.keys(files).length).toBeGreaterThan(10);
  }, 120000);
});

// ---- Regen guard (offline) ----------------------------------------------
describe.skipIf(!fs.existsSync(OUT) || BUILD)('opensdk-rust entire SDK (whole tree, regen guard)', () => {
  it('the whole generated SDK matches the committed golden tree', () => {
    const files = generate();
    const expected = listFiles(OUT);
    expect(Object.keys(files).sort()).toEqual(Object.keys(expected).sort());
    for (const [rel, content] of Object.entries(files)) {
      expect(content, `mismatch in ${rel}`).toEqual(expected[rel]);
    }
  });
});
