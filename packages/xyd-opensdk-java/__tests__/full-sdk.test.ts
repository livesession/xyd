import { execSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { fullIR, listComplexCorpora, listFiles, writeTree } from '@xyd-js/opensdk-ci';

import { opensdkJava, writeProject } from '../index';

// The ENTIRE produced Java SDK, per complex corpus: merge every committed per-method
// IR into one document and run opensdkJava. This is the whole thing — Client.java,
// every <Resource>Service.java + params/model POJOs, the enums, the page containers,
// the dependency-free runtime, and the generated <Resource>ServiceTest.java suite —
// committed as a golden so we can diff the complete generated SDK (not just one file
// per method). Every `<n>.complex.<name>` corpus under __fixtures__ is discovered and
// gets its own golden at `<name>.full/output`. Regenerate with O2S_BUILD_DOCS=1;
// javac-compile the whole tree with O2S_JAVA_SMOKE=1.

const FIXTURES = path.join(__dirname, '../__fixtures__');

const BUILD = process.env.O2S_BUILD_DOCS === '1';
const JAVA_SMOKE = process.env.O2S_JAVA_SMOKE === '1';

for (const corpus of listComplexCorpora(FIXTURES)) {
  const generate = () => opensdkJava(fullIR(corpus.dir, corpus.name));

  // ---- Generator (opt-in) ------------------------------------------------
  describe.runIf(BUILD)(`generate the entire Java SDK golden [${corpus.name}]`, () => {
    it(`build ${corpus.slug}.full/output (whole merged SDK)`, () => {
      const files = generate();
      writeTree(corpus.fullOut, files);
      expect(Object.keys(files).length).toBeGreaterThan(20); // client + services + params + models + runtime + tests
    }, 120000);
  });

  // ---- Regen guard (offline) ---------------------------------------------
  describe.skipIf(!fs.existsSync(corpus.fullOut) || BUILD)(`opensdk-java entire SDK [${corpus.name}] (whole tree, regen guard)`, () => {
    it('the whole generated SDK matches the committed golden tree', () => {
      const files = generate();
      const expected = listFiles(corpus.fullOut);
      expect(Object.keys(files).sort()).toEqual(Object.keys(expected).sort());
      for (const [rel, content] of Object.entries(files)) {
        expect(content, `mismatch in ${rel}`).toEqual(expected[rel]);
      }
    });
  });

  // ---- Optional: the whole SDK compiles ----------------------------------
  describe.runIf(JAVA_SMOKE && fs.existsSync(corpus.fullOut))(`opensdk-java entire SDK [${corpus.name}] (javac over all sources)`, () => {
    it('javac -d compiles the whole merged SDK (every .java source together)', async () => {
      const files = generate();
      const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'o2s-java-full-'));
      const out = fs.mkdtempSync(path.join(os.tmpdir(), 'o2s-java-full-out-'));
      try {
        await writeProject(files, tmp);
        const sources = Object.keys(files).filter((f) => f.endsWith('.java'));
        expect(sources.length, 'no generated .java sources').toBeGreaterThan(0);
        // A single javac invocation over EVERY source (package dirs match
        // declarations; dependency-free — java.net.http + java.util only). An
        // @argfile sidesteps ARG_MAX for the merged SDK's hundreds of sources.
        const argfile = path.join(tmp, '__sources__.txt');
        fs.writeFileSync(argfile, sources.map((f) => JSON.stringify(path.join(tmp, f))).join('\n'));
        execSync(`javac -d ${JSON.stringify(out)} @${JSON.stringify(argfile)}`, { stdio: 'pipe' });
      } finally {
        fs.rmSync(tmp, { recursive: true, force: true });
        fs.rmSync(out, { recursive: true, force: true });
      }
    }, 300000);
  });
}
