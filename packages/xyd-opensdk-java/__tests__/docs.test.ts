import { execSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import yaml from 'js-yaml';
import { beforeAll, describe, expect, it } from 'vitest';

import { CORPUS_SPECS, eachOperation, firstMethod, listComplexCorpora, miniDoc } from '@xyd-js/opensdk-ci';
import type { LeafMethod } from '@xyd-js/opensdk-ci';

import { opensdkJava, writeProject } from '../index';
import { resourceQualifier, slug } from '../src/naming';

// Generation-only deps (used when O2S_BUILD_DOCS=1); the regen-guard test below is
// pure (opensdk IR input.json → java).
import { openapi2opensdk } from '@xyd-js/openapi2opensdk';

const FIXTURES = path.join(__dirname, '../__fixtures__');
// Source specs for regen live in the converter's vendored oracle (gitignored/encrypted).
const ORACLE = path.join(__dirname, '../../xyd-openapi2opensdk/oracle');

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
// Driven directly from each corpus's vendored spec (path × method) — every fixture
// is a real 1:1 operation, named by the IR's own resource path + action.
describe.runIf(BUILD)('generate opensdk → java fixtures (assumed-correct, for review)', () => {
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

    it(`build ${src.slug}/<op>/{input.json, output.java}`, () => {
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

        const outDir = path.join(outRoot, dir);
        fs.mkdirSync(outDir, { recursive: true });
        fs.writeFileSync(path.join(outDir, 'input.json'), `${JSON.stringify(ir, null, 2)}\n`);
        fs.writeFileSync(path.join(outDir, 'output.java'), files[key]);
        n++;
      }
      expect(n).toBeGreaterThan(200);
    }, 300000);
  }
});

// ---- Regen guard (offline; pure opensdk IR → java) -----------------------
// Every discovered `<n>.complex.<name>` corpus's committed per-method fixtures.
const corpora = listComplexCorpora(FIXTURES).map((c) => ({
  ...c,
  dirs: fs.existsSync(c.dir)
    ? fs.readdirSync(c.dir).filter((d) => fs.existsSync(path.join(c.dir, d, 'input.json')))
    : [],
}));
const anyFixtures = corpora.some((c) => c.dirs.length > 0);

describe.skipIf(!anyFixtures || BUILD)('opensdk-java docs (IR → java, regen guard)', () => {
  for (const corpus of corpora) {
    for (const dir of corpus.dirs) {
      it(`${corpus.name}/${dir}`, () => {
        const ir = JSON.parse(fs.readFileSync(path.join(corpus.dir, dir, 'input.json'), 'utf8'));
        const files = opensdkJava(ir);
        const leaf = firstMethod(ir.resources);
        const key = leaf && resourceFileKey(files, leaf);
        expect(key, `no resource .java generated for ${dir}`).toBeTruthy();
        const expected = fs.readFileSync(path.join(corpus.dir, dir, 'output.java'), 'utf8');
        expect(files[key as string]).toEqual(expected);
      });
    }
  }
});

// ---- Optional: a sample of the generated projects compiles ---------------
describe.runIf(JAVA_SMOKE && anyFixtures)('opensdk-java docs (javac smoke, sample)', () => {
  for (const corpus of corpora) {
    const step = Math.max(1, Math.floor(corpus.dirs.length / 8));
    const sample = corpus.dirs.filter((_, i) => i % step === 0).slice(0, 8);
    for (const dir of sample) {
      it(`compiles ${corpus.name}/${dir}`, async () => {
        const ir = JSON.parse(fs.readFileSync(path.join(corpus.dir, dir, 'input.json'), 'utf8'));
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
  }
});
