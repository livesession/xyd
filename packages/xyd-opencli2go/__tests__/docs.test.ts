import { execSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { beforeAll, describe, expect, it } from 'vitest';

import { opencli2go, writeProject } from '../index';

// Generation-only deps (used when O2G_BUILD_DOCS=1); the regen-guard test below
// is pure (opencli input.json → go).
import { deferencedOpenAPI } from '@xyd-js/openapi';
import { openapi2opencli } from '@xyd-js/openapi2opencli';

const O2G_FIX = path.join(__dirname, '../__fixtures__/-2.complex.openai');
// The openapi2opencli package owns the vendored spec + the per-method (method, path).
const A2O = path.join(__dirname, '../../xyd-openapi2opencli');
const SPEC = path.join(A2O, 'oracle/openai-openapi.yaml');
const A2O_FIX = path.join(A2O, '__fixtures__/-2.complex.openai');

const BUILD = process.env.O2G_BUILD_DOCS === '1';
const GO_SMOKE = process.env.O2G_GO_SMOKE === '1';

const cmdFileKey = (files: Record<string, string>) => Object.keys(files).find((k) => k.startsWith('pkg/cmd/'));

/** A minimal, self-contained OpenAPI doc for a single operation. */
function miniDoc(spec: any, method: string, p: string): any | null {
  const op = spec.paths?.[p]?.[method];
  if (!op) return null;
  return {
    openapi: spec.openapi || '3.0.3',
    info: { title: 'openai', version: spec.info?.version || '1.0.0' },
    servers: spec.servers,
    security: spec.security,
    components: spec.components ? { securitySchemes: spec.components.securitySchemes } : undefined,
    paths: { [p]: { [method]: op } },
  };
}

// ---- Generator (opt-in): per-method OpenCLI input + Go output ------------
describe.runIf(BUILD)('generate opencli → go fixtures (assumed-correct, for review)', () => {
  it('build __fixtures__/-2.complex.openai/<method>/{input.json, output.go}', async () => {
    const spec = await deferencedOpenAPI(SPEC);
    if (!spec) throw new Error(`vendored spec not found at ${SPEC}`);

    let n = 0;
    for (const dir of fs.readdirSync(A2O_FIX)) {
      const metaPath = path.join(A2O_FIX, dir, 'input.json');
      if (!fs.existsSync(metaPath)) continue;
      const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
      if (!meta.path || !meta.httpMethod) continue;

      const doc = miniDoc(spec, meta.httpMethod, meta.path);
      if (!doc) continue;

      const opencli = openapi2opencli(doc, { cliName: 'openai' });
      const files = opencli2go(opencli);
      const key = cmdFileKey(files);
      if (!key) continue;

      const out = path.join(O2G_FIX, dir);
      fs.mkdirSync(out, { recursive: true });
      fs.writeFileSync(path.join(out, 'input.json'), `${JSON.stringify(opencli, null, 2)}\n`);
      fs.writeFileSync(path.join(out, 'output.go'), files[key]);
      n++;
    }
    expect(n).toBeGreaterThan(100);
  }, 300000);
});

// ---- Regen guard (offline; pure opencli → go) ----------------------------
const fixtures = fs.existsSync(O2G_FIX)
  ? fs.readdirSync(O2G_FIX).filter((d) => fs.existsSync(path.join(O2G_FIX, d, 'input.json')))
  : [];

describe.skipIf(!fixtures.length || BUILD)('opencli2go docs (opencli → go, regen guard)', () => {
  for (const dir of fixtures) {
    it(dir, () => {
      const opencli = JSON.parse(fs.readFileSync(path.join(O2G_FIX, dir, 'input.json'), 'utf8'));
      const files = opencli2go(opencli);
      const key = cmdFileKey(files);
      expect(key, `no pkg/cmd file generated for ${dir}`).toBeTruthy();
      const expected = fs.readFileSync(path.join(O2G_FIX, dir, 'output.go'), 'utf8');
      expect(files[key as string]).toEqual(expected);
    });
  }
});

// ---- Optional: a sample of the generated projects compiles ---------------
describe.runIf(GO_SMOKE && fixtures.length > 0)('opencli2go docs (go build smoke, sample)', () => {
  // Spread the sample across resources (alphabetical), not just the first few.
  const step = Math.max(1, Math.floor(fixtures.length / 8));
  const sample = fixtures.filter((_, i) => i % step === 0).slice(0, 8);
  for (const dir of sample) {
    it(`builds ${dir}`, async () => {
      const opencli = JSON.parse(fs.readFileSync(path.join(O2G_FIX, dir, 'input.json'), 'utf8'));
      const files = opencli2go(opencli);
      const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'o2g-docs-'));
      try {
        await writeProject(files, tmp);
        execSync('go mod tidy', { cwd: tmp, stdio: 'pipe' });
        execSync('go build ./...', { cwd: tmp, stdio: 'pipe' });
        execSync('go vet ./...', { cwd: tmp, stdio: 'pipe' });
      } finally {
        fs.rmSync(tmp, { recursive: true, force: true });
      }
    }, 120000);
  }
});
