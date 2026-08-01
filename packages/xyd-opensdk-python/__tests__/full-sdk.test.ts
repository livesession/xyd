import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { compileSmoke, fullIR, listComplexCorpora, listFiles, writeTree } from '@xyd-js/opensdk-ci';

import { opensdkPython, writeProject } from '../index';

// The ENTIRE produced Python SDK, per complex corpus: merge every committed
// per-method IR into one document and run opensdkPython — this is the whole thing:
// <pkg>/__init__.py, _client.py, resources.py, models.py, the vendored stdlib
// transport/pagination runtime, pyproject.toml, and the SDK's own tests/ suite —
// committed as a golden so we can diff the complete generated SDK (not just one
// file per method). Every `<n>.complex.<name>` corpus under __fixtures__ is
// discovered and gets its own golden at `<name>.full/output`.
// Regenerate with O2S_BUILD_DOCS=1; py_compile with O2S_PY_SMOKE=1.

const FIXTURES = path.join(__dirname, '../__fixtures__');

const BUILD = process.env.O2S_BUILD_DOCS === '1';
const PY_SMOKE = process.env.O2S_PY_SMOKE === '1';

for (const corpus of listComplexCorpora(FIXTURES)) {
  const generate = () => opensdkPython(fullIR(corpus.dir, corpus.name));

  // ---- Generator (opt-in) ------------------------------------------------
  describe.runIf(BUILD)(`generate the entire Python SDK golden [${corpus.name}]`, () => {
    it(`build ${corpus.slug}.full/output (whole merged SDK)`, () => {
      const files = generate();
      writeTree(corpus.fullOut, files);
      expect(Object.keys(files).length).toBeGreaterThan(20); // client + resources + models + runtime + tests
    }, 120000);
  });

  // ---- Regen guard (offline) ---------------------------------------------
  describe.skipIf(!fs.existsSync(corpus.fullOut) || BUILD)(`opensdk-python entire SDK [${corpus.name}] (whole tree, regen guard)`, () => {
    it('the whole generated SDK matches the committed golden tree', () => {
      const files = generate();
      const expected = listFiles(corpus.fullOut);
      expect(Object.keys(files).sort()).toEqual(Object.keys(expected).sort());
      for (const [rel, content] of Object.entries(files)) {
        expect(content, `mismatch in ${rel}`).toEqual(expected[rel]);
      }
    });
  });

  // ---- Optional: the whole SDK py_compiles -------------------------------
  // `python3 -m compileall` over the entire merged SDK (dependency-free stdlib
  // transport, so no venv/pip needed) — proves every generated module is
  // syntactically valid Python. Toolchain-gated (python3 absent → skipped).
  describe.runIf(PY_SMOKE && fs.existsSync(corpus.fullOut))(`opensdk-python entire SDK [${corpus.name}] (py_compile)`, () => {
    it('python3 -m compileall on the whole SDK', async () => {
      const files = generate();
      const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'o2s-py-full-'));
      try {
        await writeProject(files, tmp);
        compileSmoke('python', tmp);
      } finally {
        fs.rmSync(tmp, { recursive: true, force: true });
      }
    }, 300000);
  });
}
