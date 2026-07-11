import { execSync } from 'node:child_process';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { fullIR, listComplexCorpora, listFiles, writeTree } from '@xyd-js/opensdk-ci';

import { opensdkNode, writeProject } from '../index';

// The ENTIRE produced Node/TypeScript SDK, per complex corpus: merge every committed
// per-method IR into one document and run opensdkNode — client.ts, every
// src/resources/<resource>.ts, models.ts, the vendored core/ runtime, and the SDK's
// own tests/ suite — committed as a golden so we can diff the complete generated SDK
// (not just one file per method). Every `<n>.complex.<name>` corpus under
// __fixtures__ is discovered and gets its own golden at `<name>.full/output`.
// Regenerate with O2S_BUILD_DOCS=1; tsc-compile with O2S_NODE_SMOKE=1.

const FIXTURES = path.join(__dirname, '../__fixtures__');

const BUILD = process.env.O2S_BUILD_DOCS === '1';
const NODE_SMOKE = process.env.O2S_NODE_SMOKE === '1';

for (const corpus of listComplexCorpora(FIXTURES)) {
  const generate = () => opensdkNode(fullIR(corpus.dir, corpus.name));

  // ---- Generator (opt-in) ------------------------------------------------
  describe.runIf(BUILD)(`generate the entire Node SDK golden [${corpus.name}]`, () => {
    it(`build ${corpus.slug}.full/output (whole merged SDK)`, () => {
      const files = generate();
      writeTree(corpus.fullOut, files);
      expect(Object.keys(files).length).toBeGreaterThan(20); // client + resources + models + runtime + tests
    }, 120000);
  });

  // ---- Regen guard (offline) ---------------------------------------------
  describe.skipIf(!fs.existsSync(corpus.fullOut) || BUILD)(`opensdk-node entire SDK [${corpus.name}] (whole tree, regen guard)`, () => {
    it('the whole generated SDK matches the committed golden tree', () => {
      const files = generate();
      const expected = listFiles(corpus.fullOut);
      expect(Object.keys(files).sort()).toEqual(Object.keys(expected).sort());
      for (const [rel, content] of Object.entries(files)) {
        expect(content, `mismatch in ${rel}`).toEqual(expected[rel]);
      }
    });
  });

  // ---- Optional: the whole SDK type-checks -------------------------------
  // `tsc --noEmit` over the entire merged SDK (src + the SDK's own tests/ suite,
  // via the generated tsconfig.test.json). No external @types are needed — the DOM
  // lib supplies the built-in web APIs (fetch/URL/Headers/Response/FormData/Blob/
  // AbortController/crypto), `process` is declared ambiently in the runtime, and a
  // tiny tests/_shims.d.ts declares the stdlib test modules.
  describe.runIf(NODE_SMOKE && fs.existsSync(corpus.fullOut))(`opensdk-node entire SDK [${corpus.name}] (tsc --noEmit)`, () => {
    it('tsc --noEmit type-checks the whole SDK + its tests', async () => {
      const files = generate();
      const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'o2s-node-full-'));
      try {
        await writeProject(files, tmp);
        const require = createRequire(__filename);
        const tsc = require.resolve('typescript/bin/tsc');
        const project = files['tsconfig.test.json'] ? 'tsconfig.test.json' : 'tsconfig.json';
        execSync(`node ${JSON.stringify(tsc)} --noEmit -p ${JSON.stringify(path.join(tmp, project))}`, {
          cwd: tmp,
          stdio: 'pipe',
        });
      } finally {
        fs.rmSync(tmp, { recursive: true, force: true });
      }
    }, 300000);
  });
}
