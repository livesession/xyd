import { execSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { fullIR, listFiles, writeTree } from '@xyd-js/opensdk-ci';

import { opensdkGo, writeProject } from '../index';

// The ENTIRE produced Go SDK, assembled by merging every committed per-method IR
// into one document and running opensdkGo. This is the whole thing — client.go,
// every <resource>.go, types.go, and the vendored runtime — committed as a golden
// so we can diff the complete generated SDK against openai-go (not just one file
// per method). Regenerate with O2S_BUILD_DOCS=1; go-build with O2S_GO_SMOKE=1.

const PER_METHOD = path.join(__dirname, '../__fixtures__/-2.complex.openai');
const OUT = path.join(__dirname, '../__fixtures__/-2.full.openai/output');

const BUILD = process.env.O2S_BUILD_DOCS === '1';
const GO_SMOKE = process.env.O2S_GO_SMOKE === '1';

const generate = () => opensdkGo(fullIR(PER_METHOD, 'openai'));

// ---- Generator (opt-in) --------------------------------------------------
describe.runIf(BUILD)('generate the entire Go SDK golden', () => {
  it('build __fixtures__/-2.full.openai/output (whole merged SDK)', () => {
    const files = generate();
    writeTree(OUT, files);
    expect(Object.keys(files).length).toBeGreaterThan(20); // client + resources + types + runtime
  }, 120000);
});

// ---- Regen guard (offline) ----------------------------------------------
describe.skipIf(!fs.existsSync(OUT) || BUILD)('opensdk-go entire SDK (whole tree, regen guard)', () => {
  it('the whole generated SDK matches the committed golden tree', () => {
    const files = generate();
    const expected = listFiles(OUT);
    expect(Object.keys(files).sort()).toEqual(Object.keys(expected).sort());
    for (const [rel, content] of Object.entries(files)) {
      expect(content, `mismatch in ${rel}`).toEqual(expected[rel]);
    }
  });
});

// ---- Optional: the whole SDK compiles ------------------------------------
describe.runIf(GO_SMOKE && fs.existsSync(OUT))('opensdk-go entire SDK (go build/vet)', () => {
  it('go build ./... && go vet ./... on the whole SDK', async () => {
    const files = generate();
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'o2s-full-'));
    try {
      await writeProject(files, tmp);
      execSync('go mod tidy', { cwd: tmp, stdio: 'pipe' });
      execSync('go build ./...', { cwd: tmp, stdio: 'pipe' });
      execSync('go vet ./...', { cwd: tmp, stdio: 'pipe' });
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  }, 300000);
});
