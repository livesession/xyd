import { execSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import yaml from 'js-yaml';
import { beforeAll, describe, expect, it } from 'vitest';

import { eachOperation, firstMethod, miniDoc } from '@xyd-js/opensdk-ci';

import { opensdkGo, writeProject } from '../index';
import { slug } from '../src/naming';

// Generation-only dep (used when O2S_BUILD_DOCS=1); the regen-guard test below is
// pure (opensdk IR input.json → go).
import { openapi2opensdk } from '@xyd-js/openapi2opensdk';

const O2S_FIX = path.join(__dirname, '../__fixtures__/-2.complex.openai');
// The canonical OpenAI spec vendored in the converter's oracle is our source of truth.
const SPEC = path.join(__dirname, '../../xyd-openapi2opensdk/oracle/openai-openapi.yaml');
const GROUPING = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../../xyd-openapi2opensdk/oracle/openai-grouping.json'), 'utf8'),
);

const BUILD = process.env.O2S_BUILD_DOCS === '1';
const GO_SMOKE = process.env.O2S_GO_SMOKE === '1';

/** The single top-level resource `.go` file in a generated project (the interesting bit). */
function resourceFileKey(files: Record<string, string>): string | undefined {
  return Object.keys(files).find(
    (k) => k.endsWith('.go') && !k.includes('/') && k !== 'client.go' && k !== 'types.go',
  );
}

// ---- Generator (opt-in): one CORRECT fixture per real spec operation ------
// Driven directly from the vendored spec (path × method) — every fixture is a
// real 1:1 operation, named by the IR's own resource path + action.
describe.runIf(BUILD)('generate opensdk → go fixtures (assumed-correct, for review)', () => {
  // biome-ignore lint/suspicious/noExplicitAny: raw OpenAPI document
  let spec: any;
  beforeAll(() => {
    spec = yaml.load(fs.readFileSync(SPEC, 'utf8'));
  });

  it('build __fixtures__/-2.complex.openai/<op>/{input.json, output.go}', () => {
    fs.rmSync(O2S_FIX, { recursive: true, force: true });
    const used = new Set<string>();
    let n = 0;
    for (const { path: p, method, operation } of eachOperation(spec)) {
      let ir: ReturnType<typeof openapi2opensdk>;
      let files: Record<string, string>;
      try {
        ir = openapi2opensdk(miniDoc(spec, method, p), {
          sdkName: 'openai',
          mountRules: GROUPING.mountRules,
          operationHints: GROUPING.operationHints,
        });
        files = opensdkGo(ir);
      } catch {
        continue;
      }
      const key = resourceFileKey(files);
      const leaf = firstMethod(ir.resources);
      if (!key || !leaf) continue;

      // Dir = the operation's own resource path + action (collision-safe).
      const base = `${leaf.segments.map(slug).join('__')}__${slug(leaf.method.action)}`;
      let dir = base;
      if (used.has(dir)) dir = `${base}__${slug(operation.operationId || method)}`;
      for (let i = 2; used.has(dir); i++) dir = `${base}__${i}`;
      used.add(dir);

      const outDir = path.join(O2S_FIX, dir);
      fs.mkdirSync(outDir, { recursive: true });
      fs.writeFileSync(path.join(outDir, 'input.json'), `${JSON.stringify(ir, null, 2)}\n`);
      fs.writeFileSync(path.join(outDir, 'output.go'), files[key]);
      n++;
    }
    expect(n).toBeGreaterThan(200);
  }, 300000);
});

// ---- Regen guard (offline; pure opensdk IR → go) -------------------------
const fixtures = fs.existsSync(O2S_FIX)
  ? fs.readdirSync(O2S_FIX).filter((d) => fs.existsSync(path.join(O2S_FIX, d, 'input.json')))
  : [];

describe.skipIf(!fixtures.length || BUILD)('opensdk-go docs (IR → go, regen guard)', () => {
  for (const dir of fixtures) {
    it(dir, () => {
      const ir = JSON.parse(fs.readFileSync(path.join(O2S_FIX, dir, 'input.json'), 'utf8'));
      const files = opensdkGo(ir);
      const key = resourceFileKey(files);
      expect(key, `no resource .go generated for ${dir}`).toBeTruthy();
      const expected = fs.readFileSync(path.join(O2S_FIX, dir, 'output.go'), 'utf8');
      expect(files[key as string]).toEqual(expected);
    });
  }
});

// ---- Optional: a sample of the generated projects compiles ---------------
describe.runIf(GO_SMOKE && fixtures.length > 0)('opensdk-go docs (go build smoke, sample)', () => {
  const step = Math.max(1, Math.floor(fixtures.length / 8));
  const sample = fixtures.filter((_, i) => i % step === 0).slice(0, 8);
  for (const dir of sample) {
    it(`builds ${dir}`, async () => {
      const ir = JSON.parse(fs.readFileSync(path.join(O2S_FIX, dir, 'input.json'), 'utf8'));
      const files = opensdkGo(ir);
      const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'o2s-docs-'));
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

