import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import type { NamedType, OpensdkSpecJson } from '@xyd-js/opensdk-core';
import type { Emitter, EmitterContext, RenderedTypeReference } from '@xyd-js/opensdk-framework';

import { firstMethod } from './spec';

// The DOCS oracle: `generateUsage` / `generateTypeReference` output, frozen per
// operation as `docs.json` next to the existing `input.json`.
//
// Why this exists as a separate artifact rather than leaning on
// `xyd-opensdk-uniform`'s `uniform.json` goldens:
//
//   1. `uniform.json` is POST-MAPPING — it records the uniform projection
//      (sdkTabs[].code, definitions[].variants[]…, context.sdk.signatures) and
//      DROPS `RenderedTypeField.description` plus `response.note`/`langType` in
//      some branches. Gating the Rust port on it would leave those unprotected.
//   2. `uniform.json` is built from an IR that is not committed (an inline TS
//      doc, or the encrypted OpenAI oracle), so the 242-operation tier
//      `skipIf`s away without XYD_CONTENT_SECRET.
//
// The per-operation `input.json` IRs, by contrast, ARE committed — so keying the
// docs oracle off them gives an offline gate over every real operation.
//
// Granularity is deliberately one file per operation: a change to one
// language's field renderer then produces a diff touching exactly the
// operations it affects, which is what you need when hunting a byte divergence
// across 242 ops.

/** One frozen per-operation docs capability output. */
export interface DocsGolden {
  /** The resource-name path (root→owner) the method hangs off. */
  chain: string[];
  /** The method's action verb (`create` / `list` / …), for human orientation. */
  action: string;
  /** `generateUsage` verbatim. */
  usage: string;
  /** `generateTypeReference` verbatim. */
  typeReference: RenderedTypeReference;
}

/** A fixture directory holding an `input.json` (and, once frozen, a `docs.json`). */
export interface DocsFixture {
  /** Stable label for the test name, e.g. `-2.complex.openai/batches__create` or `1.basic`. */
  id: string;
  /** Absolute path to the directory containing `input.json`. */
  dir: string;
}

const INPUT = 'input.json';
export const DOCS_GOLDEN_FILE = 'docs.json';

/**
 * Every fixture dir under `fixturesDir` that carries an `input.json`, at either
 * depth: the small hand-written fixtures (`1.basic/input.json`) and the
 * per-operation corpus entries (`-2.complex.openai/<op>/input.json`).
 *
 * `<slug>.full` golden siblings hold an `output/` tree and no `input.json`, so
 * they fall out naturally.
 */
export function listDocsFixtures(fixturesDir: string): DocsFixture[] {
  if (!fs.existsSync(fixturesDir)) return [];
  const out: DocsFixture[] = [];
  for (const entry of fs.readdirSync(fixturesDir).sort()) {
    const dir = path.join(fixturesDir, entry);
    if (!fs.statSync(dir).isDirectory()) continue;

    if (fs.existsSync(path.join(dir, INPUT))) {
      out.push({ id: entry, dir });
      continue;
    }
    for (const sub of fs.readdirSync(dir).sort()) {
      const subdir = path.join(dir, sub);
      if (!fs.statSync(subdir).isDirectory()) continue;
      if (fs.existsSync(path.join(subdir, INPUT))) out.push({ id: `${entry}/${sub}`, dir: subdir });
    }
  }
  return out;
}

/**
 * Build the emitter context the way the REAL docs pipeline does.
 *
 * Mirrors `prepareFromIr` in `@xyd-js/opensdk-uniform` exactly — in particular
 * `emitterOptions: {}`, so the golden reflects the options the docs path
 * actually passes rather than some test-only configuration.
 */
export function docsEmitterContext(ir: OpensdkSpecJson): EmitterContext {
  return {
    spec: ir,
    types: new Map<string, NamedType>((ir.types ?? []).map((t) => [t.name, t])),
    emitterOptions: {},
  };
}

/**
 * Run an emitter's two docs capabilities over one fixture IR.
 *
 * Returns null when the emitter does not implement them (the Rust target has no
 * docs tab — `SDK_LANGS` is go/python/typescript/ruby/java/csharp) or when the
 * IR carries no method.
 */
export function buildDocsGolden(emitter: Emitter, ir: OpensdkSpecJson): DocsGolden | null {
  if (!emitter.generateUsage || !emitter.generateTypeReference) return null;
  const leaf = firstMethod(ir.resources);
  if (!leaf) return null;

  const ctx = docsEmitterContext(ir);
  return {
    chain: leaf.segments,
    action: leaf.method.action,
    usage: emitter.generateUsage(leaf.method, leaf.segments, ctx),
    typeReference: emitter.generateTypeReference(leaf.method, leaf.segments, ctx),
  };
}

/** Serialize a golden the way every other committed fixture is written. */
export function serializeDocsGolden(golden: DocsGolden): string {
  return `${JSON.stringify(golden, null, 2)}\n`;
}

export function readIr(fixture: DocsFixture): OpensdkSpecJson {
  return JSON.parse(fs.readFileSync(path.join(fixture.dir, INPUT), 'utf8'));
}

export function readDocsGolden(fixture: DocsFixture): DocsGolden {
  return JSON.parse(fs.readFileSync(path.join(fixture.dir, DOCS_GOLDEN_FILE), 'utf8'));
}

export function hasDocsGolden(fixture: DocsFixture): boolean {
  return fs.existsSync(path.join(fixture.dir, DOCS_GOLDEN_FILE));
}

export function writeDocsGolden(fixture: DocsFixture, golden: DocsGolden): void {
  fs.writeFileSync(path.join(fixture.dir, DOCS_GOLDEN_FILE), serializeDocsGolden(golden));
}

/**
 * Both halves of the docs oracle for one language, so an emitter package's test
 * file is three lines (same shape as {@link defineSdkE2E}):
 *
 *   - GENERATOR (`O2S_BUILD_DOCS=1`): write `docs.json` for every fixture from
 *     the TypeScript emitter. Run it on a CLEAN TREE with no Rust changes
 *     staged — a golden regenerated after a Rust change is a contaminated
 *     oracle, and this artifact exists precisely to be the pre-port truth.
 *   - GUARD (default, offline): re-run and compare. Fixtures without a
 *     committed `docs.json` are reported as skipped rather than silently
 *     passing, so a half-frozen corpus is visible.
 */
export function defineDocsGolden(emitter: Emitter, fixturesDir: string): void {
  const fixtures = listDocsFixtures(fixturesDir);
  const BUILD = process.env.O2S_BUILD_DOCS === '1';
  const supported = Boolean(emitter.generateUsage && emitter.generateTypeReference);

  describe.runIf(BUILD && supported)(`generate opensdk-${emitter.language} docs goldens`, () => {
    it(`writes ${DOCS_GOLDEN_FILE} for every fixture`, () => {
      let written = 0;
      for (const fixture of fixtures) {
        let golden: DocsGolden | null;
        try {
          golden = buildDocsGolden(emitter, readIr(fixture));
        } catch (e) {
          throw new Error(`${fixture.id}: docs capability threw — ${(e as Error).message}`);
        }
        if (!golden) continue;
        writeDocsGolden(fixture, golden);
        written++;
      }
      expect(written, 'no docs goldens written — is the fixture corpus present?').toBeGreaterThan(0);
    }, 300000);
  });

  describe.skipIf(BUILD || !supported || fixtures.length === 0)(
    `opensdk-${emitter.language} docs capabilities (regen guard)`,
    () => {
      for (const fixture of fixtures) {
        // An emitter that legitimately produces nothing for a fixture (no
        // method in the IR) has no golden and nothing to guard.
        it.skipIf(!hasDocsGolden(fixture))(fixture.id, () => {
          const golden = buildDocsGolden(emitter, readIr(fixture));
          expect(golden, `${fixture.id}: emitter produced no docs output but ${DOCS_GOLDEN_FILE} exists`).toBeTruthy();
          expect(golden as DocsGolden).toEqual(readDocsGolden(fixture));
        });
      }
    },
  );
}
