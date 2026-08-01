import { execSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { fullIR, hasCommand, listComplexCorpora, listFiles, writeTree } from '@xyd-js/opensdk-ci';

import { opensdkDotnet, writeProject } from '../index';

// The ENTIRE produced C# / .NET SDK, per complex corpus: merge every committed
// per-method IR into one document and run opensdkDotnet. This is the whole thing —
// Client.cs, every <Resource>Service.cs, Models.cs, Transport.cs, Pagination.cs, and
// the SDK's own <Sdk>.Tests project — committed as a golden so we can diff the
// complete generated SDK (openai-dotnet shaped), not just one file per method. Every
// `<n>.complex.<name>` corpus under __fixtures__ is discovered and gets its own
// golden at `<name>.full/output`. Regenerate with O2S_BUILD_DOCS=1; dotnet-build with
// O2S_DOTNET_SMOKE=1 (gated on a .NET SDK on PATH — generate-only otherwise).

const FIXTURES = path.join(__dirname, '../__fixtures__');

const BUILD = process.env.O2S_BUILD_DOCS === '1';
// dotnet is not installed in this environment, so the whole-SDK compile smoke
// skips cleanly by default; it runs in CI (where a .NET SDK is on PATH).
const DOTNET_SMOKE = process.env.O2S_DOTNET_SMOKE === '1' && hasCommand('dotnet --version');

for (const corpus of listComplexCorpora(FIXTURES)) {
  const generate = () => opensdkDotnet(fullIR(corpus.dir, corpus.name));

  // ---- Generator (opt-in) ------------------------------------------------
  describe.runIf(BUILD)(`generate the entire C# SDK golden [${corpus.name}]`, () => {
    it(`build ${corpus.slug}.full/output (whole merged SDK)`, () => {
      const files = generate();
      writeTree(corpus.fullOut, files);
      expect(Object.keys(files).length).toBeGreaterThan(20); // client + resources + models + runtime + tests
    }, 120000);
  });

  // ---- Regen guard (offline) ---------------------------------------------
  describe.skipIf(!fs.existsSync(corpus.fullOut) || BUILD)(`opensdk-dotnet entire SDK [${corpus.name}] (whole tree, regen guard)`, () => {
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
  // `dotnet build` EACH generated `.csproj` — the SDK library and the emitted test
  // project (whose ProjectReference re-checks the library). Gated on a .NET SDK on
  // PATH; skips cleanly when dotnet is absent (this environment), so locally the C#
  // is verified structurally by the goldens and runs in CI.
  describe.runIf(DOTNET_SMOKE && fs.existsSync(corpus.fullOut))(`opensdk-dotnet entire SDK [${corpus.name}] (dotnet build)`, () => {
    it('dotnet build the whole SDK + its test project', async () => {
      const files = generate();
      const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'o2s-full-dotnet-'));
      try {
        await writeProject(files, tmp);
        const projects = Object.keys(files).filter((p) => p.endsWith('.csproj'));
        for (const project of projects) {
          execSync(`dotnet build --nologo ${JSON.stringify(project)}`, { cwd: tmp, stdio: 'pipe' });
        }
      } finally {
        fs.rmSync(tmp, { recursive: true, force: true });
      }
    }, 600000);
  });
}
