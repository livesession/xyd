import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { deferencedOpenAPI } from '@xyd-js/openapi';

import { openapi2opencli } from '../index';
import { type Allowlist, diffSurfaces, opencliToSurface } from '../src/surface';
import { parseOpenaiCli } from '../oracle/parseOpenaiCli';

const ORACLE_DIR = path.join(__dirname, '../oracle');
const SURFACE = path.join(ORACLE_DIR, 'surface.json');
const FLOOR = path.join(ORACLE_DIR, 'coverage.floor.json');
const REPORT = path.join(ORACLE_DIR, 'coverage.report.json');
// The OpenAI OpenAPI spec is already vendored in @xyd-js/openapi's fixtures.
const OPENAPI = path.join(__dirname, '../../xyd-openapi/__fixtures__/-2.complex.openai/input.yaml');

const REFRESH = process.env.ORACLE_REFRESH === '1';

// Known, intentional divergences (the burn-down backlog). Each needs a reason.
const allowlist: Allowlist = {
  // Stainless injects a pagination flag on list endpoints that isn't in the spec.
  oracleOnlyFlags: ['max-items'],
};

// ---- Oracle refresh (network; opt-in) ------------------------------------
describe.skipIf(!REFRESH)('oracle refresh (network)', () => {
  it('fetch + parse openai-cli pkg/cmd → oracle/surface.json', async () => {
    const head = await fetch('https://api.github.com/repos/openai/openai-cli/commits/main').then((r) => r.json());
    const sha: string = head.sha;
    const listing = await fetch(
      `https://api.github.com/repos/openai/openai-cli/contents/pkg/cmd?ref=${sha}`,
    ).then((r) => r.json());

    const files: Record<string, string> = {};
    for (const entry of listing as Array<{ name: string; download_url: string }>) {
      if (!entry.name.endsWith('.go') || entry.name.endsWith('_test.go')) continue;
      files[entry.name] = await fetch(entry.download_url).then((r) => r.text());
    }

    const surface = parseOpenaiCli(files);
    fs.mkdirSync(ORACLE_DIR, { recursive: true });
    fs.writeFileSync(SURFACE, `${JSON.stringify(surface, null, 2)}\n`);
    fs.writeFileSync(
      path.join(ORACLE_DIR, 'pins.json'),
      `${JSON.stringify(
        { repo: 'openai/openai-cli', commit: sha, files: Object.keys(files).length, commands: surface.commands.length },
        null,
        2,
      )}\n`,
    );
    expect(surface.commands.length).toBeGreaterThan(50);
  }, 180000);
});

// ---- Conformance (offline; reads committed surface.json) ------------------
const hasOracle = fs.existsSync(SURFACE);

describe.skipIf(!hasOracle)('conformance: openapi → opencli surface vs openai-cli', () => {
  it('matches the oracle command surface above the coverage floor', async () => {
    const oracle = JSON.parse(fs.readFileSync(SURFACE, 'utf8'));
    const doc = await deferencedOpenAPI(OPENAPI);
    if (!doc) throw new Error(`vendored openai-openapi not found at ${OPENAPI}`);

    const spec = openapi2opencli(doc, { cliName: 'openai' });
    const ours = opencliToSurface(spec);
    const diff = diffSurfaces(ours, oracle, allowlist);

    fs.writeFileSync(
      REPORT,
      `${JSON.stringify(
        {
          l0Coverage: Number(diff.l0Coverage.toFixed(4)),
          l1Coverage: Number(diff.l1Coverage.toFixed(4)),
          oracleCommands: diff.oracleCommandCount,
          ourCommands: diff.oursCommandCount,
          matched: diff.commandsMatched.length,
          onlyOracle: diff.commandsOnlyOracle.length,
          onlyOurs: diff.commandsOnlyOurs.length,
          sampleOnlyOracle: diff.commandsOnlyOracle.slice(0, 15),
          sampleOnlyOurs: diff.commandsOnlyOurs.slice(0, 15),
          sampleFlagDiffs: diff.perCommand.slice(0, 15),
        },
        null,
        2,
      )}\n`,
    );

    // eslint-disable-next-line no-console
    console.log(
      `[conformance] L0 ${(diff.l0Coverage * 100).toFixed(1)}%  L1 ${(diff.l1Coverage * 100).toFixed(1)}%  ` +
        `matched ${diff.commandsMatched.length}/${diff.oracleCommandCount} (ours ${diff.oursCommandCount})`,
    );

    const floor = fs.existsSync(FLOOR) ? JSON.parse(fs.readFileSync(FLOOR, 'utf8')).l0 : 0;
    expect(diff.l0Coverage).toBeGreaterThanOrEqual(floor);
  }, 180000);
});
