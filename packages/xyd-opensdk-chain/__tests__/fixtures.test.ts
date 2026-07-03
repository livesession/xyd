import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { listFiles, writeTree } from '@xyd-js/opensdk-ci';

import { runFixtureChain } from './helpers';

// Data-driven chain fixtures: __fixtures__/chain/<n>.<name>/{chain.json, specs/, overlays?} → a committed
// output/ golden = the processed source specs (proving merge/overlay) + sdks.json (target → sorted generated
// file paths, proving each source/target produced its own SDK). REGEN=1 regenerates.
//   1.multi-source  many DISTINCT sources → many SDKs (the Mistral shape)
//   2.merge-overlay merge two inputs + apply an overlay → one SDK
//   3.overlay-remove an overlay `remove` action drops an endpoint before generation
//   4.multi-lang    ONE source → SDKs in several languages
const CHAIN_FIXTURES = path.join(__dirname, '__fixtures__/chain');
const REGEN = process.env.REGEN === '1';
const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'opensdk-chain-'));

/** Copy a fixture's inputs to a temp dir, run the chain, and reduce it to the golden map. */
async function runFixtureGolden(fixtureDir: string): Promise<Record<string, string>> {
  const chainDoc = JSON.parse(fs.readFileSync(path.join(fixtureDir, 'chain.json'), 'utf8')) as {
    sources: Record<string, { output?: string }>;
    targets: Record<string, { output: string }>;
  };
  const work = tmp();
  try {
    fs.copyFileSync(path.join(fixtureDir, 'chain.json'), path.join(work, 'chain.json'));
    for (const sub of ['specs', 'overlays']) {
      const src = path.join(fixtureDir, sub);
      if (fs.existsSync(src)) fs.cpSync(src, path.join(work, sub), { recursive: true });
    }
    await runFixtureChain(path.join(work, 'chain.json'), work);

    const golden: Record<string, string> = {};
    for (const [name, source] of Object.entries(chainDoc.sources)) {
      if (source.output) golden[`sources/${name}.openapi.json`] = fs.readFileSync(path.join(work, source.output), 'utf8');
    }
    const sdks: Record<string, string[]> = {};
    for (const [tname, t] of Object.entries(chainDoc.targets)) {
      sdks[tname] = Object.keys(listFiles(path.join(work, t.output))).sort();
    }
    golden['sdks.json'] = `${JSON.stringify(sdks, null, 2)}\n`;
    return golden;
  } finally {
    fs.rmSync(work, { recursive: true, force: true });
  }
}

describe('chain fixtures (input chain.json → committed output)', () => {
  const cases = fs
    .readdirSync(CHAIN_FIXTURES, { withFileTypes: true })
    .filter((e) => e.isDirectory() && /^\d/.test(e.name))
    .map((e) => e.name)
    .sort();

  for (const name of cases) {
    it(name, async () => {
      const produced = await runFixtureGolden(path.join(CHAIN_FIXTURES, name));
      const outDir = path.join(CHAIN_FIXTURES, name, 'output');
      if (REGEN) writeTree(outDir, produced);
      const expected = listFiles(outDir);
      expect(Object.keys(produced).sort(), `${name}: file set`).toEqual(Object.keys(expected).sort());
      for (const [rel, content] of Object.entries(produced)) expect(content, `${name}/${rel}`).toEqual(expected[rel]);
    }, 60000);
  }
});

describe('runChain behavior', () => {
  it('runs a single --target and errors on an unknown one', async () => {
    const fixture = path.join(CHAIN_FIXTURES, '1.multi-source');
    const work = tmp();
    try {
      fs.copyFileSync(path.join(fixture, 'chain.json'), path.join(work, 'chain.json'));
      fs.cpSync(path.join(fixture, 'specs'), path.join(work, 'specs'), { recursive: true });
      await runFixtureChain(path.join(work, 'chain.json'), work, { target: 'pets-sdk' });
      expect(fs.existsSync(path.join(work, 'sdk/pets/client.go'))).toBe(true);
      expect(fs.existsSync(path.join(work, 'sdk/catalog'))).toBe(false); // other target not run
      await expect(runFixtureChain(path.join(work, 'chain.json'), work, { target: 'nope' })).rejects.toThrow(
        /Unknown target "nope"/,
      );
    } finally {
      fs.rmSync(work, { recursive: true, force: true });
    }
  }, 60000);
});
