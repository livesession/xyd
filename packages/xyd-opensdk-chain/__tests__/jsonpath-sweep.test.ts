import fs from 'node:fs';
import path from 'node:path';

import { JSONPath } from 'jsonpath-plus';
import { describe, expect, it } from 'vitest';

/**
 * JSONPath DIFFERENTIAL SWEEP — the one real fidelity risk in the chain port.
 *
 * `applyOverlay` drives jsonpath-plus, which is NOT RFC 9535: it adds `^`, `@parent`,
 * `@path`, `@property`, `~` and JS-evaluated script expressions. The Rust port uses
 * `serde_json_path` (RFC 9535). The 4 committed chain fixtures only exercise two
 * trivial targets (`$.info`, `$.paths['/x']`), which is NOT evidence that the engines
 * agree — so this records, for a wide synthetic corpus, exactly which normalized paths
 * jsonpath-plus matches. `crates/xyd_opensdk_chain/tests/jsonpath_sweep.rs` replays the
 * same corpus and diffs.
 *
 *   O2S_BUILD_DOCS=1 pnpm vitest run __tests__/jsonpath-sweep.test.ts   # (re)generate
 *   pnpm vitest run __tests__/jsonpath-sweep.test.ts                    # guard
 */

const DIR = path.join(__dirname, '__oracle__/jsonpath');
const BUILD = process.env.O2S_BUILD_DOCS === '1';

interface Sweep {
  docs: Record<string, unknown>;
  targets: { doc: string; path: string; extension?: string }[];
}

type Entry = { paths: string[][] } | { error: string };

function run(sweep: Sweep): Record<string, Entry> {
  const out: Record<string, Entry> = {};
  for (const t of sweep.targets) {
    const key = `${t.doc} :: ${t.path}`;
    try {
      // `resultType: 'all'` is what applyOverlay uses; `.path` is jsonpath-plus's own
      // normalized path string, which toPathArray turns into comparable segments.
      const matches = JSONPath({ path: t.path, json: sweep.docs[t.doc] as object, resultType: 'all' }) as {
        path: string;
      }[];
      out[key] = { paths: matches.map((m) => JSONPath.toPathArray(m.path)) };
    } catch (err) {
      out[key] = { error: err instanceof Error ? err.message : String(err) };
    }
  }
  return out;
}

describe(`jsonpath differential sweep (${BUILD ? 'GENERATING' : 'guarding'})`, () => {
  it('jsonpath-plus match sets are frozen', () => {
    const sweep = JSON.parse(fs.readFileSync(path.join(DIR, 'sweep.json'), 'utf8')) as Sweep;
    const produced = `${JSON.stringify(run(sweep), null, 2)}\n`;
    const golden = path.join(DIR, 'sweep.golden.json');
    if (BUILD) {
      fs.writeFileSync(golden, produced);
      return;
    }
    expect(fs.existsSync(golden), 'missing sweep.golden.json (run with O2S_BUILD_DOCS=1)').toBe(true);
    expect(produced, 'jsonpath-plus drifted from its frozen sweep').toEqual(fs.readFileSync(golden, 'utf8'));
  });
});
