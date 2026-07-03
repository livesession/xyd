import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { openapi2opensdkFromSource } from '../index';
import { type SdkAllowlist, diffSurfaces, opensdkToSurface } from '../src/surface';
// ../oracle/parseOpenaiJava is gitignored/encrypted - imported LAZILY in the refresh block below so this suite SKIPS (not fails to load) when the oracle plaintext is absent (CI without XYD_CONTENT_SECRET, fresh clones, fork PRs).

const ORACLE_DIR = path.join(__dirname, '../oracle');
const SURFACE = path.join(ORACLE_DIR, 'java-surface.json');
const FLOOR = path.join(ORACLE_DIR, 'java-coverage.floor.json');
const REPORT = path.join(ORACLE_DIR, 'java-coverage.report.json');
const OPENAPI = path.join(__dirname, '../../xyd-openapi2opencli/oracle/openai-openapi.yaml');

const REPO = 'openai/openai-java';
const REFRESH = process.env.SDK_ORACLE_REFRESH === '1';

// openai-java's blocking (synchronous) service interfaces live under
// openai-java-core/src/main/kotlin/com/openai/services/blocking/**; the root
// resource graph is on the client interface in com/openai/client/OpenAIClient.kt.
// We take the interfaces (`*Service.kt`), not their `*ServiceImpl.kt` impls, and
// skip the async services + the test sources.
function isJavaSource(p: string): boolean {
  if (!p.endsWith('.kt') || p.includes('/src/test/')) return false;
  if (p === 'openai-java-core/src/main/kotlin/com/openai/client/OpenAIClient.kt') return true;
  return p.startsWith('openai-java-core/src/main/kotlin/com/openai/services/blocking/') && p.endsWith('Service.kt');
}

async function fetchOpenaiJava(): Promise<{ sha: string; files: Record<string, string> }> {
  const head = await fetch(`https://api.github.com/repos/${REPO}/commits/main`).then((r) => r.json());
  const sha: string = head.sha;
  const tree = await fetch(`https://api.github.com/repos/${REPO}/git/trees/${sha}?recursive=1`).then((r) => r.json());
  const paths: string[] = (tree.tree as Array<{ path: string; type: string }>)
    .filter((e) => e.type === 'blob' && isJavaSource(e.path))
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
describe.skipIf(!REFRESH)('java oracle refresh (network)', () => {
  it('fetch + parse openai-java → oracle/java-surface.json', async () => {
    const { sha, files } = await fetchOpenaiJava();
    const { parseOpenaiJava } = await import('../oracle/parseOpenaiJava');
    const surface = parseOpenaiJava(files);

    fs.mkdirSync(ORACLE_DIR, { recursive: true });
    fs.writeFileSync(SURFACE, `${JSON.stringify(surface, null, 2)}\n`);
    fs.writeFileSync(
      path.join(ORACLE_DIR, 'java-pins.json'),
      `${JSON.stringify(
        { repo: REPO, commit: sha, files: Object.keys(files).length, methods: surface.methods.length },
        null,
        2,
      )}\n`,
    );
    expect(surface.methods.length).toBeGreaterThan(150);
  }, 300000);
});

// ---- Conformance (offline; reads committed java-surface.json) -------------
const hasOracle = fs.existsSync(SURFACE);

describe.skipIf(!hasOracle)('conformance: openapi → opensdk surface vs openai-java', () => {
  it('matches the oracle method surface above the coverage floor', async () => {
    const oracle = JSON.parse(fs.readFileSync(SURFACE, 'utf8'));
    // openai-java surface is L0-only (no params parsed), so ignore param/response L1 noise.
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
      `[conformance:java] L0 ${(diff.l0Coverage * 100).toFixed(1)}%  ` +
        `matched ${diff.methodsMatched.length}/${diff.oracleMethodCount} (ours ${diff.oursMethodCount})`,
    );

    const floor = fs.existsSync(FLOOR) ? JSON.parse(fs.readFileSync(FLOOR, 'utf8')).l0 : 0;
    expect(diff.l0Coverage).toBeGreaterThanOrEqual(floor);
  }, 180000);
});
