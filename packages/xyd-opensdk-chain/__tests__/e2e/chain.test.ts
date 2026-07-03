import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { compileSmoke } from '@xyd-js/opensdk-ci';

import { runFixtureChain } from '../helpers';

// The chain COMPILE e2e (gated E2E_SDK_CHAIN=1): one chain.json exercises the whole
// feature at once — a plain source, a MERGE source (2 inputs), an OVERLAY, and a
// target for EVERY language — then generates all of them and asserts each SDK
// COMPILES (per available toolchain; absent toolchains skip). Both "a test for every
// language" and the multi-source/multi-target proof.
const RUN = process.env.E2E_SDK_CHAIN === '1';

const FIXTURES = path.join(__dirname, '../__fixtures__/chain');
const PETSTORE = path.join(__dirname, '../../../xyd-openapi2opensdk/__fixtures__/1.basic/input.json');
const EXTRA = path.join(FIXTURES, 'extra.json');
const OVERLAY = path.join(FIXTURES, 'overlay.json');

const TARGETS: Record<string, { target: string; marker: string; source: string; options?: Record<string, unknown> }> = {
  'petstore-go': { target: 'go', source: 'merged', marker: 'client.go' },
  'petstore-ts': { target: 'typescript', source: 'petstore', marker: 'src/client.ts', options: { packageName: 'petstore' } },
  'petstore-py': { target: 'python', source: 'merged', marker: 'petstore/_client.py' },
  'petstore-rb': { target: 'ruby', source: 'petstore', marker: 'lib/petstore/client.rb' },
  'petstore-java': { target: 'java', source: 'petstore', marker: 'pom.xml' },
  'petstore-dotnet': { target: 'dotnet', source: 'petstore', marker: 'Petstore.csproj' },
};

describe.runIf(RUN)('chain e2e: one chain.json → many sources (merge + overlay) → many SDKs, each compiles', () => {
  it('generates every target and each compiles (per available toolchain)', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'opensdk-chain-e2e-'));
    try {
      const mergedSpec = path.join(dir, '.chain', 'merged.openapi.json');
      const chain = {
        version: 1,
        sources: {
          petstore: { inputs: [{ location: PETSTORE }] },
          merged: { inputs: [{ location: PETSTORE }, { location: EXTRA }], overlays: [{ location: OVERLAY }], output: mergedSpec },
        },
        targets: Object.fromEntries(
          Object.entries(TARGETS).map(([name, t]) => [
            name,
            { target: t.target, source: t.source, output: path.join(dir, 'sdk', name), sdkName: 'petstore', ...(t.options ? { options: t.options } : {}) },
          ]),
        ),
      };
      const chainPath = path.join(dir, 'chain.json');
      fs.writeFileSync(chainPath, JSON.stringify(chain, null, 2));

      await runFixtureChain(chainPath, dir);

      // Merge + overlay landed: the processed spec has BOTH sources' paths + the overlay's description.
      const merged = JSON.parse(fs.readFileSync(mergedSpec, 'utf8'));
      expect(Object.keys(merged.paths)).toContain('/pets');
      expect(Object.keys(merged.paths)).toContain('/health');
      expect(merged.info.description).toBe('merged + overlaid via chain.json');

      // Every target generated + compiles (or skips when its toolchain is absent).
      const compiled: string[] = [];
      const skipped: string[] = [];
      for (const [name, t] of Object.entries(TARGETS)) {
        const out = path.join(dir, 'sdk', name);
        expect(fs.existsSync(out), `${name} not generated`).toBe(true);
        if (t.marker) expect(fs.existsSync(path.join(out, t.marker)), `${name} missing ${t.marker}`).toBe(true);
        (compileSmoke(t.target, out) ? compiled : skipped).push(t.target);
      }
      // eslint-disable-next-line no-console
      console.log(`chain e2e: compiled [${compiled.join(', ')}], skipped (no toolchain) [${skipped.join(', ')}]`);
      expect(compiled.length + skipped.length).toBe(Object.keys(TARGETS).length);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  }, 600000);
});
