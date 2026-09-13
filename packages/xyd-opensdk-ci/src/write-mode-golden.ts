import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import type { OpensdkSpecJson } from '@xyd-js/opensdk-core';
import type { Emitter, GeneratedFile, WriteMode } from '@xyd-js/opensdk-framework';

import { docsEmitterContext, listDocsFixtures, readIr } from './docs-golden';

// The WRITE-MODE oracle.
//
// `writeMode` is what makes regeneration non-destructive: `skipIfExists`
// protects a scaffold the user owns, `mergeJson` deep-merges into their file.
// Today the Rust emitters do not produce it at all — the orchestrator's native
// fast path takes file CONTENT from Rust but still loops the TypeScript
// `generateProject` purely to rebuild the `path -> writeMode` map. That is the
// single reason the TS emitters remain load-bearing at XYD_NATIVE=1, so the map
// has to be frozen before the TS can go.
//
// It is deliberately captured by calling the emitter capabilities DIRECTLY
// rather than through `generateFileMap`, whose native branch would let a Rust
// build participate. This artifact must be pure TypeScript truth.
//
// Only NON-DEFAULT entries are recorded — `overwrite` is the default and
// recording it would bury the 7 interesting rows under thousands of noise
// lines. That also matches the wire shape the napi surface will use.

export const WRITE_MODE_GOLDEN_FILE = 'write-modes.json';

/** `fixture id -> { path -> non-default WriteMode }`. */
export type WriteModeGolden = Record<string, Record<string, WriteMode>>;

/** Every file the emitter declares a non-default `writeMode` for. */
export function collectWriteModes(emitter: Emitter, ir: OpensdkSpecJson): Record<string, WriteMode> {
  const ctx = docsEmitterContext(ir);
  const files: GeneratedFile[] = [
    ...emitter.generateProject(ir, ctx),
    ...emitter.generateClient(ir, ctx),
    ...emitter.generateTypes(ir.types ?? [], ctx),
    ...emitter.generateResources(ir.resources ?? [], ctx),
    ...emitter.generateRuntime(ir, ctx),
    ...(emitter.generateTests?.(ir, ctx) ?? []),
  ];

  const out: Record<string, WriteMode> = {};
  for (const f of files) {
    if (f.writeMode && f.writeMode !== 'overwrite') out[f.path] = f.writeMode;
  }
  return Object.fromEntries(Object.entries(out).sort(([a], [b]) => a.localeCompare(b)));
}

/**
 * Restrict to the small hand-written fixtures.
 *
 * The 242-operation corpus would emit an identical manifest 242 times over —
 * `writeMode` is a property of the emitter and the package NAME, not of the
 * operation. The small fixtures still exercise the one dynamic case (Ruby's
 * `<pkg>.gemspec`), because they carry different `info.title`s.
 */
function snapshotFixtures(fixturesDir: string) {
  return listDocsFixtures(fixturesDir).filter((f) => !f.id.includes('/'));
}

/**
 * Generator (`O2S_BUILD_DOCS=1`) + offline guard for one language's write-mode
 * map, written to `__fixtures__/write-modes.json`.
 */
export function defineWriteModeGolden(emitter: Emitter, fixturesDir: string): void {
  const BUILD = process.env.O2S_BUILD_DOCS === '1';
  const goldenPath = path.join(fixturesDir, WRITE_MODE_GOLDEN_FILE);
  const fixtures = snapshotFixtures(fixturesDir);

  const build = (): WriteModeGolden => {
    const golden: WriteModeGolden = {};
    for (const fixture of fixtures) golden[fixture.id] = collectWriteModes(emitter, readIr(fixture));
    return golden;
  };

  describe.runIf(BUILD && fixtures.length > 0)(`generate opensdk-${emitter.language} write-mode golden`, () => {
    it(`writes ${WRITE_MODE_GOLDEN_FILE}`, () => {
      fs.writeFileSync(goldenPath, `${JSON.stringify(build(), null, 2)}\n`);
    });
  });

  describe.skipIf(BUILD || !fs.existsSync(goldenPath))(
    `opensdk-${emitter.language} write modes (regen guard)`,
    () => {
      it('matches the committed map', () => {
        expect(build()).toEqual(JSON.parse(fs.readFileSync(goldenPath, 'utf8')));
      });
    },
  );
}
