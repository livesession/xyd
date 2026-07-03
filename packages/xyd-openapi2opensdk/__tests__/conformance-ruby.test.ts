import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { openapi2opensdkFromSource } from '../index';
import { type SdkAllowlist, diffSurfaces, opensdkToSurface } from '../src/surface';
// ../oracle/parseOpenaiRuby is gitignored/encrypted - imported LAZILY in the refresh block below so this suite SKIPS (not fails to load) when the oracle plaintext is absent (CI without XYD_CONTENT_SECRET, fresh clones, fork PRs).

const ORACLE_DIR = path.join(__dirname, '../oracle');
const SURFACE = path.join(ORACLE_DIR, 'ruby-surface.json');
const FLOOR = path.join(ORACLE_DIR, 'ruby-coverage.floor.json');
const REPORT = path.join(ORACLE_DIR, 'ruby-coverage.report.json');
const OPENAPI = path.join(__dirname, '../../xyd-openapi2opencli/oracle/openai-openapi.yaml');

const REPO = 'openai/openai-ruby';
const REFRESH = process.env.SDK_ORACLE_REFRESH === '1';

// openai-ruby resource classes live under lib/openai/resources/**; the root
// resource graph is on the client in lib/openai/client.rb.
function isRubySource(p: string): boolean {
  if (!p.endsWith('.rb')) return false;
  return p === 'lib/openai/client.rb' || p.startsWith('lib/openai/resources/');
}

async function fetchOpenaiRuby(): Promise<{ sha: string; files: Record<string, string> }> {
  const head = await fetch(`https://api.github.com/repos/${REPO}/commits/main`).then((r) => r.json());
  const sha: string = head.sha;
  const tree = await fetch(`https://api.github.com/repos/${REPO}/git/trees/${sha}?recursive=1`).then((r) => r.json());
  const paths: string[] = (tree.tree as Array<{ path: string; type: string }>)
    .filter((e) => e.type === 'blob' && isRubySource(e.path))
    .map((e) => e.path);

  const files: Record<string, string> = {};
  const BATCH = 16;
  for (let i = 0; i < paths.length; i += BATCH) {
    const batch = paths.slice(i, i + BATCH);
    const contents = await Promise.all(
      batch.map((p) => fetch(`https://raw.githubusercontent.com/${REPO}/${sha}/${p}`).then((r) => r.text())),
    );
    batch.forEach((p, j) => {
      files[p] = contents[j];
    });
  }
  return { sha, files };
}

// ---- Oracle refresh (network; opt-in) ------------------------------------
describe.skipIf(!REFRESH)('ruby oracle refresh (network)', () => {
  it('fetch + parse openai-ruby → oracle/ruby-surface.json', async () => {
    const { sha, files } = await fetchOpenaiRuby();
    const { parseOpenaiRuby } = await import('../oracle/parseOpenaiRuby');
    const surface = parseOpenaiRuby(files);

    fs.mkdirSync(ORACLE_DIR, { recursive: true });
    fs.writeFileSync(SURFACE, `${JSON.stringify(surface, null, 2)}\n`);
    fs.writeFileSync(
      path.join(ORACLE_DIR, 'ruby-pins.json'),
      `${JSON.stringify(
        { repo: REPO, commit: sha, files: Object.keys(files).length, methods: surface.methods.length },
        null,
        2,
      )}\n`,
    );
    expect(surface.methods.length).toBeGreaterThan(150);
  }, 300000);
});

// ---- Conformance (offline; reads committed ruby-surface.json) -------------
const hasOracle = fs.existsSync(SURFACE);

describe.skipIf(!hasOracle)('conformance: openapi → opensdk surface vs openai-ruby', () => {
  it('matches the oracle method surface above the coverage floor', async () => {
    const oracle = JSON.parse(fs.readFileSync(SURFACE, 'utf8'));
    // openai-ruby surface is L0-only (no params parsed), so ignore param/response L1 noise.
    const allowlist: SdkAllowlist = { ignoreResponseType: true };

    const grouping = JSON.parse(fs.readFileSync(path.join(ORACLE_DIR, 'openai-grouping.json'), 'utf8'));
    const spec = await openapi2opensdkFromSource(OPENAPI, {
      sdkName: 'openai',
      mountRules: grouping.mountRules,
      operationHints: grouping.operationHints,
    });
    const ours = opensdkToSurface(spec);
    const diff = diffSurfaces(ours, oracle, allowlist);

    fs.writeFileSync(
      REPORT,
      `${JSON.stringify(
        {
          l0Coverage: Number(diff.l0Coverage.toFixed(4)),
          oracleMethods: diff.oracleMethodCount,
          ourMethods: diff.oursMethodCount,
          matched: diff.methodsMatched.length,
          onlyOracle: diff.methodsOnlyOracle.length,
          onlyOurs: diff.methodsOnlyOurs.length,
          sampleOnlyOracle: diff.methodsOnlyOracle.slice(0, 25),
        },
        null,
        2,
      )}\n`,
    );

    // eslint-disable-next-line no-console
    console.log(
      `[conformance:ruby] L0 ${(diff.l0Coverage * 100).toFixed(1)}%  ` +
        `matched ${diff.methodsMatched.length}/${diff.oracleMethodCount} (ours ${diff.oursMethodCount})`,
    );

    const floor = fs.existsSync(FLOOR) ? JSON.parse(fs.readFileSync(FLOOR, 'utf8')).l0 : 0;
    expect(diff.l0Coverage).toBeGreaterThanOrEqual(floor);
  }, 180000);
});
