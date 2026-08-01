import fs from 'node:fs';
import path from 'node:path';

import { deferencedOpenAPI, oapSchemaToReferences } from '@xyd-js/openapi';
import type { Reference } from '@xyd-js/uniform';
import yaml from 'js-yaml';
import type { OpenAPIV3 } from 'openapi-types';
import { describe, expect, it } from 'vitest';

import { SDK_LANGS, attachSdkExamples, attachSdkTypes } from '../src/index';
import { buildGolden } from './goldenSerialize';

// The COMPLEX (real OpenAI) uniform GOLDEN — the same enriched-uniform snapshot as
// 1.sdk-uniform, but over the full oracle OpenAI spec. It captures how the SDK
// pipeline shapes a REAL API: per-language SDK usage code, the SDK-native request/
// response type variants, and context.sdk.signatures per language — so we can diff
// future pipeline runs against a known-good baseline (and, later, against how a real
// API actually behaves).
//
// Capture-once-as-golden (the current impl is assumed correct):
//   - regenerate with O2S_BUILD_DOCS=1 → writes __fixtures__/-2.complex.openai/uniform.json
//   - the offline guard re-runs the enrichment and JSON-equals the committed golden.
//
// The source spec (oracle/openai-openapi.yaml) is gitignored/encrypted — BOTH the
// generator and the guard skip when it's absent, so CI without the decrypted oracle
// just skips (mirrors the opensdk docs-corpus tests).

const ORACLE_SPEC = path.join(__dirname, '../../xyd-openapi2opensdk/oracle/openai-openapi.yaml');
const OUT_DIR = path.join(__dirname, '../__fixtures__/-2.complex.openai');
const GOLDEN = path.join(OUT_DIR, 'uniform.json');

const BUILD = process.env.O2S_BUILD_DOCS === '1';
const SPEC_PRESENT = fs.existsSync(ORACLE_SPEC);

/** Convert the oracle OpenAI spec into enriched uniform References — the real
 * pipeline: keep the RAW ($ref'd) doc, dereference, oapSchemaToReferences, then run
 * BOTH enrichers in place (attachSdkExamples → per-language SDK usage tabs;
 * attachSdkTypes → SDK-native definition variants + context.sdk.signatures). */
async function enrichFromOracle(): Promise<Reference[]> {
  // RAW, still-$ref'd — openapi2opensdk (behind both enrichers) needs component
  // identity to survive into nominal types.
  const raw = yaml.load(fs.readFileSync(ORACLE_SPEC, 'utf8')) as OpenAPIV3.Document;
  const doc = (await deferencedOpenAPI(ORACLE_SPEC)) as OpenAPIV3.Document | undefined;
  if (!doc) throw new Error(`could not dereference ${ORACLE_SPEC}`);
  const refs = oapSchemaToReferences(doc);
  attachSdkExamples(refs, raw);
  attachSdkTypes(refs, raw);
  return refs;
}

/** The golden: only the SDK-ENRICHED operations (oapSchemaToReferences also emits a
 * Reference per component schema — those carry no SDK output, so they're dropped as
 * noise). Deterministic (spec order) so the diff is stable. */
async function buildComplexGolden() {
  return buildGolden(await enrichFromOracle()).filter((op) => op.sdkTabs.length > 0);
}

// ---- Generator (opt-in; needs the decrypted oracle) ----------------------
describe.runIf(BUILD && SPEC_PRESENT)('generate the complex-openai uniform.json golden', () => {
  it('build __fixtures__/-2.complex.openai/uniform.json (enriched SDK uniform, full OpenAI)', async () => {
    const golden = await buildComplexGolden();
    fs.mkdirSync(OUT_DIR, { recursive: true });
    fs.writeFileSync(GOLDEN, `${JSON.stringify(golden, null, 2)}\n`);
    // Sanity: a real, non-trivial corpus; every kept op carries per-language usage
    // tabs (≤ the full language set — not every op maps to every language).
    expect(golden.length).toBeGreaterThan(50);
    for (const op of golden) {
      expect(op.sdkTabs.length).toBeGreaterThan(0);
      expect(op.sdkTabs.length).toBeLessThanOrEqual(SDK_LANGS.length);
    }
  }, 120_000);
});

// ---- Regen guard (offline; needs the decrypted oracle + a committed golden) ----
describe.skipIf(!SPEC_PRESENT || !fs.existsSync(GOLDEN) || BUILD)(
  'opensdk-uniform complex-openai enriched uniform (regen guard)',
  () => {
    it('re-running the enrichment JSON-equals the committed complex-openai golden', async () => {
      const golden = await buildComplexGolden();
      const expected = JSON.parse(fs.readFileSync(GOLDEN, 'utf8'));
      expect(golden).toEqual(expected);
    }, 120_000);
  },
);
