import fs from 'node:fs';
import path from 'node:path';

import yaml from 'js-yaml';
import { beforeAll, describe, expect, it } from 'vitest';

import { CORPUS_SPECS, eachOperation, firstMethod, listComplexCorpora, miniDoc } from '@xyd-js/opensdk-ci';

import { opensdkDotnet } from '../index';
import { slug } from '../src/naming';

// Generation-only deps (used when O2S_BUILD_DOCS=1); the regen-guard test below is
// pure (opensdk IR input.json → C#).
import { openapi2opensdk } from '@xyd-js/openapi2opensdk';

const FIXTURES = path.join(__dirname, '../__fixtures__');
// Source specs for regen live in the converter's vendored oracle (gitignored/encrypted).
const ORACLE = path.join(__dirname, '../../xyd-openapi2opensdk/oracle');

const BUILD = process.env.O2S_BUILD_DOCS === '1';

/** The single top-level resource `<Resource>Service.cs` in a generated project (the interesting bit). */
function resourceFileKey(files: Record<string, string>): string | undefined {
  return Object.keys(files).find(
    (k) =>
      k.endsWith('Service.cs') && // serviceClassName always ends "Service"
      !k.includes('/'), // the SDK's own <Resource>Tests.cs lives under <Sdk>.Tests/
  );
}

// ---- Generator (opt-in): one CORRECT fixture per real spec operation ------
// Driven directly from each corpus's vendored spec (path × method) — every fixture
// is a real 1:1 operation, named by the IR's own resource path + action.
describe.runIf(BUILD)('generate opensdk → dotnet fixtures (assumed-correct, for review)', () => {
  for (const src of CORPUS_SPECS) {
    const specPath = path.join(ORACLE, src.specFile);
    const groupingPath = src.groupingFile ? path.join(ORACLE, src.groupingFile) : undefined;
    // biome-ignore lint/suspicious/noExplicitAny: raw OpenAPI document
    let spec: any;
    // oracle/* is gitignored/encrypted; guard the read so absence just skips the corpus.
    const grouping =
      groupingPath && fs.existsSync(groupingPath) ? JSON.parse(fs.readFileSync(groupingPath, 'utf8')) : {};

    beforeAll(() => {
      spec = fs.existsSync(specPath) ? yaml.load(fs.readFileSync(specPath, 'utf8')) : null;
    });

    it(`build ${src.slug}/<op>/{input.json, output.cs}`, () => {
      if (!spec) return; // spec absent (encrypted oracle not decrypted) → skip regen
      const outRoot = path.join(FIXTURES, src.slug);
      fs.rmSync(outRoot, { recursive: true, force: true });
      const used = new Set<string>();
      let n = 0;
      for (const { path: p, method, operation } of eachOperation(spec)) {
        let ir: ReturnType<typeof openapi2opensdk>;
        let files: Record<string, string>;
        try {
          ir = openapi2opensdk(miniDoc(spec, method, p), {
            sdkName: src.sdkName,
            mountRules: grouping.mountRules,
            operationHints: grouping.operationHints,
          });
          files = opensdkDotnet(ir);
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

        const outDir = path.join(outRoot, dir);
        fs.mkdirSync(outDir, { recursive: true });
        fs.writeFileSync(path.join(outDir, 'input.json'), `${JSON.stringify(ir, null, 2)}\n`);
        fs.writeFileSync(path.join(outDir, 'output.cs'), files[key]);
        n++;
      }
      expect(n).toBeGreaterThan(200);
    }, 300000);
  }
});

// ---- Regen guard (offline; pure opensdk IR → C#) -------------------------
// Every discovered `<n>.complex.<name>` corpus's committed per-method fixtures.
const corpora = listComplexCorpora(FIXTURES).map((c) => ({
  ...c,
  dirs: fs.existsSync(c.dir)
    ? fs.readdirSync(c.dir).filter((d) => fs.existsSync(path.join(c.dir, d, 'input.json')))
    : [],
}));
const anyFixtures = corpora.some((c) => c.dirs.length > 0);

describe.skipIf(!anyFixtures || BUILD)('opensdk-dotnet docs (IR → dotnet, regen guard)', () => {
  for (const corpus of corpora) {
    for (const dir of corpus.dirs) {
      it(`${corpus.name}/${dir}`, () => {
        const ir = JSON.parse(fs.readFileSync(path.join(corpus.dir, dir, 'input.json'), 'utf8'));
        const files = opensdkDotnet(ir);
        const key = resourceFileKey(files);
        expect(key, `no resource .cs generated for ${dir}`).toBeTruthy();
        const expected = fs.readFileSync(path.join(corpus.dir, dir, 'output.cs'), 'utf8');
        expect(files[key as string]).toEqual(expected);
      });
    }
  }
});
