import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { openapi2opensdkFromSource } from '../index';
import { type SdkAllowlist, diffSurfaces, opensdkToSurface } from '../src/surface';
import { parseOpenaiGo } from '../oracle/parseOpenaiGo';

const ORACLE_DIR = path.join(__dirname, '../oracle');
const SURFACE = path.join(ORACLE_DIR, 'surface.json');
const FLOOR = path.join(ORACLE_DIR, 'coverage.floor.json');
const ALLOWLIST = path.join(ORACLE_DIR, 'allowlist.json');
const REPORT = path.join(ORACLE_DIR, 'coverage.report.json');
// The OpenAI OpenAPI spec vendored alongside the CLI oracle (same source of truth).
const OPENAPI = path.join(__dirname, '../../xyd-openapi2opencli/oracle/openai-openapi.yaml');

const REPO = 'openai/openai-go';
const REFRESH = process.env.SDK_ORACLE_REFRESH === '1';

// Directories/files that are not spec-derived service definitions.
const EXCLUDE_DIRS = ['internal/', 'packages/', 'option/', 'shared/', 'examples/', '.github/', 'scripts/'];
const EXCLUDE_FILES = new Set(['aliases.go', 'field.go', 'default_http_client.go', 'api.md']);

function isServiceFile(p: string): boolean {
  if (!p.endsWith('.go') || p.endsWith('_test.go')) return false;
  if (EXCLUDE_DIRS.some((d) => p.startsWith(d))) return false;
  if (EXCLUDE_FILES.has(p.split('/').pop() || '')) return false;
  return true;
}

async function fetchOpenaiGo(): Promise<{ sha: string; files: Record<string, string> }> {
  const head = await fetch(`https://api.github.com/repos/${REPO}/commits/main`).then((r) => r.json());
  const sha: string = head.sha;
  const tree = await fetch(`https://api.github.com/repos/${REPO}/git/trees/${sha}?recursive=1`).then((r) => r.json());
  const paths: string[] = (tree.tree as Array<{ path: string; type: string }>)
    .filter((e) => e.type === 'blob' && isServiceFile(e.path))
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
describe.skipIf(!REFRESH)('oracle refresh (network)', () => {
  it('fetch + parse openai-go → oracle/surface.json', async () => {
    const { sha, files } = await fetchOpenaiGo();
    const surface = parseOpenaiGo(files);

    fs.mkdirSync(ORACLE_DIR, { recursive: true });
    fs.writeFileSync(SURFACE, `${JSON.stringify(surface, null, 2)}\n`);
    fs.writeFileSync(
      path.join(ORACLE_DIR, 'pins.json'),
      `${JSON.stringify(
        { repo: REPO, commit: sha, files: Object.keys(files).length, methods: surface.methods.length },
        null,
        2,
      )}\n`,
    );
    expect(surface.methods.length).toBeGreaterThan(150);
  }, 300000);
});

// ---- Conformance (offline; reads committed surface.json) ------------------
const hasOracle = fs.existsSync(SURFACE);

describe.skipIf(!hasOracle)('conformance: openapi → opensdk surface vs openai-go', () => {
  it('matches the oracle method surface above the coverage floor', async () => {
    const oracle = JSON.parse(fs.readFileSync(SURFACE, 'utf8'));
    const allowlist: SdkAllowlist = fs.existsSync(ALLOWLIST) ? JSON.parse(fs.readFileSync(ALLOWLIST, 'utf8')) : {};

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
          l1Coverage: Number(diff.l1Coverage.toFixed(4)),
          oracleMethods: diff.oracleMethodCount,
          ourMethods: diff.oursMethodCount,
          matched: diff.methodsMatched.length,
          onlyOracle: diff.methodsOnlyOracle.length,
          onlyOurs: diff.methodsOnlyOurs.length,
          sampleOnlyOracle: diff.methodsOnlyOracle.slice(0, 25),
          sampleOnlyOurs: diff.methodsOnlyOurs.slice(0, 25),
          sampleParamDiffs: diff.perMethod.slice(0, 20),
        },
        null,
        2,
      )}\n`,
    );

    // eslint-disable-next-line no-console
    console.log(
      `[conformance] L0 ${(diff.l0Coverage * 100).toFixed(1)}%  L1 ${(diff.l1Coverage * 100).toFixed(1)}%  ` +
        `matched ${diff.methodsMatched.length}/${diff.oracleMethodCount} (ours ${diff.oursMethodCount})`,
    );

    const floor = fs.existsSync(FLOOR) ? JSON.parse(fs.readFileSync(FLOOR, 'utf8')).l0 : 0;
    expect(diff.l0Coverage).toBeGreaterThanOrEqual(floor);
  }, 180000);
});
