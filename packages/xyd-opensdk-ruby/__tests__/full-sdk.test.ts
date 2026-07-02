import { execSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { fullIR, hasCommand, listFiles, writeTree } from '@xyd-js/opensdk-ci';

import { opensdkRuby, writeProject } from '../index';

// The ENTIRE produced Ruby SDK, assembled by merging every committed per-method
// IR into one document and running opensdkRuby. This is the whole thing —
// client.rb, every resources/<resource>.rb, models.rb, the vendored transport,
// and the SDK's own test/**.rb — committed as a golden so we can diff the
// complete generated SDK against openai-ruby (not just one file per method).
// The merged OpenAI SDK (242 methods) exercises everything — pagination,
// unions, multipart, enums, deep nesting — so this is where real bugs surface.
// Regenerate with O2S_BUILD_DOCS=1; ruby -c the whole tree with O2S_RUBY_SMOKE=1.

const PER_METHOD = path.join(__dirname, '../__fixtures__/-2.complex.openai');
const OUT = path.join(__dirname, '../__fixtures__/-2.complex.openai.full/output');

const BUILD = process.env.O2S_BUILD_DOCS === '1';
const RUBY_SMOKE = process.env.O2S_RUBY_SMOKE === '1' && hasCommand('ruby --version');

const generate = () => opensdkRuby(fullIR(PER_METHOD, 'openai'));

// ---- Generator (opt-in) --------------------------------------------------
describe.runIf(BUILD)('generate the entire Ruby SDK golden', () => {
  it('build __fixtures__/-2.complex.openai.full/output (whole merged SDK)', () => {
    const files = generate();
    writeTree(OUT, files);
    expect(Object.keys(files).length).toBeGreaterThan(20); // client + resources + models + transport + tests
  }, 120000);
});

// ---- Regen guard (offline) ----------------------------------------------
describe.skipIf(!fs.existsSync(OUT) || BUILD)('opensdk-ruby entire SDK (whole tree, regen guard)', () => {
  it('the whole generated SDK matches the committed golden tree', () => {
    const files = generate();
    const expected = listFiles(OUT);
    expect(Object.keys(files).sort()).toEqual(Object.keys(expected).sort());
    for (const [rel, content] of Object.entries(files)) {
      expect(content, `mismatch in ${rel}`).toEqual(expected[rel]);
    }
  });
});

// ---- Optional: the whole SDK is syntactically sound ----------------------
// Ruby is interpreted, so the "compile" bar is a `ruby -c` syntax check of every
// generated .rb file plus a require-time load of the gem entry point. The local
// ruby is 2.6, so this also proves the emitter stays inside 2.6-compatible syntax.
describe.runIf(RUBY_SMOKE && fs.existsSync(OUT))('opensdk-ruby entire SDK (ruby -c on the whole tree)', () => {
  it('ruby -c passes on every generated .rb file (and the gem loads)', async () => {
    const files = generate();
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'o2rb-full-'));
    try {
      await writeProject(files, tmp);
      const rbFiles = Object.keys(files).filter((f) => f.endsWith('.rb'));
      expect(rbFiles.length).toBeGreaterThan(20);
      for (const rel of rbFiles) {
        execSync(`ruby -c ${JSON.stringify(rel)}`, { cwd: tmp, stdio: 'pipe' });
      }
      // Load the whole gem through its entry point (a require-time check on top
      // of the per-file syntax check).
      const pkg = rbFiles.find((f) => f.match(/^lib\/[^/]+\.rb$/))?.replace(/^lib\/|\.rb$/g, '');
      if (pkg) {
        execSync(`ruby -Ilib -e ${JSON.stringify(`require '${pkg}'`)}`, { cwd: tmp, stdio: 'pipe' });
      }
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  }, 300000);
});
