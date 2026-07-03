import { execSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import yaml from 'js-yaml';
import { beforeAll, describe, expect, it } from 'vitest';

import { eachOperation, firstMethod, miniDoc } from '@xyd-js/opensdk-ci';
import type { LeafMethod } from '@xyd-js/opensdk-ci';

import { opensdkJava, writeProject } from '../index';
import { resourceQualifier, slug } from '../src/naming';

// Generation-only dep (used when O2S_BUILD_DOCS=1); the regen-guard test below is
// pure (opensdk IR input.json → java).
import { openapi2opensdk } from '@xyd-js/openapi2opensdk';

const O2S_FIX = path.join(__dirname, '../__fixtures__/-2.complex.openai');
// The canonical OpenAI spec vendored in the converter's oracle is our source of truth.
const SPEC = path.join(__dirname, '../../xyd-openapi2opensdk/oracle/openai-openapi.yaml');
const GROUPING_PATH = path.join(__dirname, '../../xyd-openapi2opensdk/oracle/openai-grouping.json');
// oracle/* is gitignored/encrypted; guard the read so the OFFLINE regen-guard below
// still loads + runs when the plaintext is absent (CI without XYD_CONTENT_SECRET).
const GROUPING = fs.existsSync(GROUPING_PATH) ? JSON.parse(fs.readFileSync(GROUPING_PATH, 'utf8')) : {};

const BUILD = process.env.O2S_BUILD_DOCS === '1';
const JAVA_SMOKE = process.env.O2S_JAVA_SMOKE === '1';

/**
 * The leaf resource's `<Qualifier>Service.java` file — the one that actually
 * declares this operation's method. Java splits one file per resource (unlike
 * the Go emitter's single top-level file), so the per-op golden snapshots the
 * service class carrying the method (`chat.completions.create` → the
 * `ChatCompletionService.java` file).
 */
function resourceFileKey(files: Record<string, string>, leaf: LeafMethod): string | undefined {
  const suffix = `/${resourceQualifier(leaf.segments)}Service.java`;
  return Object.keys(files).find((k) => k.endsWith(suffix));
}

// ---- Generator (opt-in): one CORRECT fixture per real spec operation ------
// Driven directly from the vendored spec (path × method) — every fixture is a
// real 1:1 operation, named by the IR's own resource path + action.
describe.runIf(BUILD)('generate opensdk → java fixtures (assumed-correct, for review)', () => {
  // biome-ignore lint/suspicious/noExplicitAny: raw OpenAPI document
  let spec: any;
  beforeAll(() => {
    spec = yaml.load(fs.readFileSync(SPEC, 'utf8'));
  });

  it('build __fixtures__/-2.complex.openai/<op>/{input.json, output.java}', () => {
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
        files = opensdkJava(ir);
      } catch {
        continue;
      }
      const leaf = firstMethod(ir.resources);
      if (!leaf) continue;
      const key = resourceFileKey(files, leaf);
      if (!key) continue;

      // Dir = the operation's own resource path + action (collision-safe).
      const base = `${leaf.segments.map(slug).join('__')}__${slug(leaf.method.action)}`;
      let dir = base;
      if (used.has(dir)) dir = `${base}__${slug(operation.operationId || method)}`;
      for (let i = 2; used.has(dir); i++) dir = `${base}__${i}`;
      used.add(dir);

      const outDir = path.join(O2S_FIX, dir);
      fs.mkdirSync(outDir, { recursive: true });
      fs.writeFileSync(path.join(outDir, 'input.json'), `${JSON.stringify(ir, null, 2)}\n`);
      fs.writeFileSync(path.join(outDir, 'output.java'), files[key]);
      n++;
    }
    expect(n).toBeGreaterThan(200);
  }, 300000);
});

// ---- Regen guard (offline; pure opensdk IR → java) -----------------------
const fixtures = fs.existsSync(O2S_FIX)
  ? fs.readdirSync(O2S_FIX).filter((d) => fs.existsSync(path.join(O2S_FIX, d, 'input.json')))
  : [];

describe.skipIf(!fixtures.length || BUILD)('opensdk-java docs (IR → java, regen guard)', () => {
  for (const dir of fixtures) {
    it(dir, () => {
      const ir = JSON.parse(fs.readFileSync(path.join(O2S_FIX, dir, 'input.json'), 'utf8'));
      const files = opensdkJava(ir);
      const leaf = firstMethod(ir.resources);
      const key = leaf && resourceFileKey(files, leaf);
      expect(key, `no resource .java generated for ${dir}`).toBeTruthy();
      const expected = fs.readFileSync(path.join(O2S_FIX, dir, 'output.java'), 'utf8');
      expect(files[key as string]).toEqual(expected);
    });
  }
});

// ---- Optional: a sample of the generated projects compiles ---------------
describe.runIf(JAVA_SMOKE && fixtures.length > 0)('opensdk-java docs (javac smoke, sample)', () => {
  const step = Math.max(1, Math.floor(fixtures.length / 8));
  const sample = fixtures.filter((_, i) => i % step === 0).slice(0, 8);
  for (const dir of sample) {
    it(`compiles ${dir}`, async () => {
      const ir = JSON.parse(fs.readFileSync(path.join(O2S_FIX, dir, 'input.json'), 'utf8'));
      const files = opensdkJava(ir);
      const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'o2s-java-docs-'));
      const out = fs.mkdtempSync(path.join(os.tmpdir(), 'o2s-java-docs-out-'));
      try {
        await writeProject(files, tmp);
        const sources = Object.keys(files)
          .filter((f) => f.endsWith('.java'))
          .map((f) => path.join(tmp, f));
        execSync(`javac -d ${JSON.stringify(out)} ${sources.map((s) => JSON.stringify(s)).join(' ')}`, { stdio: 'pipe' });
      } finally {
        fs.rmSync(tmp, { recursive: true, force: true });
        fs.rmSync(out, { recursive: true, force: true });
      }
    }, 120000);
  }
});
