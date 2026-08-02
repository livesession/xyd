import { execSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { opencli2rust } from '../index';
import { CARGO_SMOKE, flattenFiles, writeTree } from './utils';

const O2R_FIX = path.join(__dirname, '../__fixtures__/-2.complex.openai');
// The Go package owns fixture generation (from the vendored OpenAPI oracle) and
// request recording (E2E_RECORD); this package keeps independent COPIES of the
// language-neutral input.json/recorded.json, re-synced by O2R_BUILD_DOCS=1.
const O2G_FIX = path.join(__dirname, '../../xyd-opencli2go/__fixtures__/-2.complex.openai');

const BUILD = process.env.O2R_BUILD_DOCS === '1';

const cmdFileKey = (files: Record<string, string>) =>
  Object.keys(files).find((k) => k.startsWith('src/gen/cmd/') && k !== 'src/gen/cmd/mod.rs');

// ---- Generator (opt-in): sync per-method OpenCLI inputs + Rust goldens ----
describe.runIf(BUILD)('sync opencli fixtures from opencli2go → rust goldens (assumed-correct, for review)', () => {
  it('build __fixtures__/-2.complex.openai/<method>/{input.json, recorded.json, output.rs}', () => {
    let n = 0;
    for (const dir of fs.readdirSync(O2G_FIX)) {
      const src = path.join(O2G_FIX, dir);
      if (!fs.existsSync(path.join(src, 'input.json'))) continue;
      const opencli = JSON.parse(fs.readFileSync(path.join(src, 'input.json'), 'utf8'));
      const files = flattenFiles(opencli2rust(opencli));
      const key = cmdFileKey(files);
      if (!key) continue;

      const out = path.join(O2R_FIX, dir);
      fs.mkdirSync(out, { recursive: true });
      fs.copyFileSync(path.join(src, 'input.json'), path.join(out, 'input.json'));
      const recorded = path.join(src, 'recorded.json');
      if (fs.existsSync(recorded)) fs.copyFileSync(recorded, path.join(out, 'recorded.json'));
      fs.writeFileSync(path.join(out, 'output.rs'), files[key]);
      n++;
    }
    expect(n).toBeGreaterThan(100);
  }, 300000);
});

// ---- Regen guard (offline; pure opencli → rust) ---------------------------
const fixtures = fs.existsSync(O2R_FIX)
  ? fs.readdirSync(O2R_FIX).filter((d) => fs.existsSync(path.join(O2R_FIX, d, 'input.json')))
  : [];

describe.skipIf(!fixtures.length || BUILD)('opencli2rust docs (opencli → rust, regen guard)', () => {
  for (const dir of fixtures) {
    it(dir, () => {
      const opencli = JSON.parse(fs.readFileSync(path.join(O2R_FIX, dir, 'input.json'), 'utf8'));
      const files = flattenFiles(opencli2rust(opencli));
      const key = cmdFileKey(files);
      expect(key, `no src/gen/cmd file generated for ${dir}`).toBeTruthy();
      const expected = fs.readFileSync(path.join(O2R_FIX, dir, 'output.rs'), 'utf8');
      expect(files[key as string]).toEqual(expected);
    });
  }
});

// ---- Optional: a sample of the generated projects compiles ----------------
describe.runIf(CARGO_SMOKE && fixtures.length > 0)('opencli2rust docs (cargo check smoke, sample)', () => {
  // Spread the sample across resources (alphabetical), not just the first few.
  const step = Math.max(1, Math.floor(fixtures.length / 8));
  const sample = fixtures.filter((_, i) => i % step === 0).slice(0, 8);
  const targetDir = process.env.CARGO_TARGET_DIR || path.join(os.tmpdir(), 'o2r-target');
  for (const dir of sample) {
    it(`checks ${dir}`, () => {
      const opencli = JSON.parse(fs.readFileSync(path.join(O2R_FIX, dir, 'input.json'), 'utf8'));
      const files = flattenFiles(opencli2rust(opencli));
      const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'o2r-docs-'));
      try {
        writeTree(tmp, files);
        execSync('cargo check --quiet', {
          cwd: tmp,
          stdio: 'pipe',
          env: { ...process.env, CARGO_TARGET_DIR: targetDir },
        });
      } finally {
        fs.rmSync(tmp, { recursive: true, force: true });
      }
    }, 120000);
  }
});
