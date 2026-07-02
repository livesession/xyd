import fs from 'node:fs';

import path from 'node:path';

import yaml from 'js-yaml';
import { beforeAll, describe, expect, it } from 'vitest';

import { eachOperation, firstMethod, miniDoc } from '@xyd-js/opensdk-ci';

import { opensdkNode } from '../index';
import { slug } from '../src/naming';

// Generation-only dep (used when O2S_BUILD_DOCS=1); the regen-guard test below is
// pure (opensdk IR input.json → node).
import { openapi2opensdk } from '@xyd-js/openapi2opensdk';

const O2S_FIX = path.join(__dirname, '../__fixtures__/-2.complex.openai');
// The canonical OpenAI spec vendored in the converter's oracle is our source of truth.
const SPEC = path.join(__dirname, '../../xyd-openapi2opensdk/oracle/openai-openapi.yaml');
const GROUPING = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../../xyd-openapi2opensdk/oracle/openai-grouping.json'), 'utf8'),
);

const BUILD = process.env.O2S_BUILD_DOCS === '1';

/** The single top-level resource `.ts` file in a generated project (the interesting bit). */
function resourceFileKey(files: Record<string, string>): string | undefined {
  return Object.keys(files).find(
    (k) => k.startsWith('src/resources/') && k.endsWith('.ts') && k !== 'src/resources/index.ts',
  );
}

// ---- Generator (opt-in): one CORRECT fixture per real spec operation ------
// Driven directly from the vendored spec (path × method) — every fixture is a
// real 1:1 operation, named by the IR's own resource path + action.
describe.runIf(BUILD)('generate opensdk → node fixtures (assumed-correct, for review)', () => {
  // biome-ignore lint/suspicious/noExplicitAny: raw OpenAPI document
  let spec: any;
  beforeAll(() => {
    spec = yaml.load(fs.readFileSync(SPEC, 'utf8'));
  });

  it('build __fixtures__/-2.complex.openai/<op>/{input.json, output.ts}', () => {
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
        files = opensdkNode(ir);
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
      fs.writeFileSync(path.join(outDir, 'output.ts'), files[key]);
      n++;
    }
    expect(n).toBeGreaterThan(200);
  }, 300000);
});

// ---- Regen guard (offline; pure opensdk IR → node) -----------------------
const fixtures = fs.existsSync(O2S_FIX)
  ? fs.readdirSync(O2S_FIX).filter((d) => fs.existsSync(path.join(O2S_FIX, d, 'input.json')))
  : [];

describe.skipIf(!fixtures.length || BUILD)('opensdk-node docs (IR → node, regen guard)', () => {
  for (const dir of fixtures) {
    it(dir, () => {
      const ir = JSON.parse(fs.readFileSync(path.join(O2S_FIX, dir, 'input.json'), 'utf8'));
      const files = opensdkNode(ir);
      const key = resourceFileKey(files);
      expect(key, `no resource .ts generated for ${dir}`).toBeTruthy();
      const expected = fs.readFileSync(path.join(O2S_FIX, dir, 'output.ts'), 'utf8');
      expect(files[key as string]).toEqual(expected);
    });
  }
});
