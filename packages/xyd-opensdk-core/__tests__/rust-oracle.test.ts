import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { findType, loadOpensdkSpec, mergePublishTargets, walkMethods } from '../src';
import type {
  ChainJson,
  ChainSource,
  ChainTarget,
  LanguageSection,
  OperationHint,
  PublishTarget,
  SdkGrouping,
  SdkJson,
} from '../src';

// ─────────────────────────────────────────────────────────────────────────────
// THE ORACLE for `crates/xyd_opensdk_config` — the Rust port of `src/config.ts`
// + `src/spec.ts`.
//
// This file plays two roles, selected by `O2S_BUILD_DOCS=1` (the switch the rest
// of the opensdk fixtures already use):
//
//   O2S_BUILD_DOCS=1  → GENERATE. Runs the REAL TypeScript over every committed
//                       `<case>/input.json` and writes `<case>/output.json`.
//   (unset)           → GUARD. Re-runs the same pipeline and asserts the
//                       committed goldens still match, so the TS cannot drift
//                       away from the oracle the Rust is gated on.
//
// The goldens live in the CRATE, not here, on purpose: this package is slated
// for deletion once the port lands, and an oracle that dies with its generator
// is not an oracle. `oracle/gen.mjs` in `crates/xyd_oas_snippet` is the same
// idea (JS generates, the crate owns).
//
//   Regenerate:  O2S_BUILD_DOCS=1 pnpm --filter @xyd-js/opensdk-core test -- --run
//   Verify Rust: cargo test -p xyd_opensdk_config
//
// FOUR GROUPS, mapping to what the two modules actually contain:
//
//   merge-publish/  `mergePublishTargets` — the ONLY function in config.ts.
//   sdk-json/       `SdkJson`/`LanguageSection`/`SdkGrouping`/`PublishTarget`.
//   chain-json/     `ChainJson`/`ChainSource`/`ChainTarget`/`ChainInput`.
//   spec-helpers/   `findType` + the `walkMethods` re-export.
//   load-spec/      `loadOpensdkSpec`, FILE half only (see the note there).
//
// HONESTY NOTE on the two config groups: TypeScript interfaces have no runtime,
// so there is no TS behaviour to capture for them. Their `output.json` is a
// PROJECTION — a mechanical, one-line-per-declared-field read of each document
// through the interface (declared fields typed out; index-signature keys bucketed
// the way the declaration says). It pins what the Rust structs must accept and
// expose, which is the portable half of a type. It is NOT a capture of runtime
// behaviour, because there is none to capture.
// ─────────────────────────────────────────────────────────────────────────────

const BUILD = process.env.O2S_BUILD_DOCS === '1';
const REPO_ROOT = path.join(__dirname, '../../..');
const FIXTURES = path.join(REPO_ROOT, 'crates/xyd_opensdk_config/__fixtures__');

/** JSON cannot express `undefined`; this sentinel does (see merge-publish). */
const UNDEFINED_SENTINEL = '__UNDEFINED__';
/** Replaced with the case directory's absolute path at run time. */
const CASE_TOKEN = '__CASE__';

const readJson = (p: string) => JSON.parse(fs.readFileSync(p, 'utf8'));
const or = <T>(v: T | undefined): T | null => (v === undefined ? null : v);

/** `<group>` case directories, sorted, each containing an `input.json`. */
function cases(group: string): string[] {
  const dir = path.join(FIXTURES, group);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((n) => fs.existsSync(path.join(dir, n, 'input.json')))
    .sort();
}

// ── projections ──────────────────────────────────────────────────────────────

/** `PublishTarget`'s declared fields, in declaration order. */
const PUBLISH_FIELDS: readonly string[] = [
  'author',
  'license',
  'repository',
  'homepage',
  'version',
  'registry',
  'tokenEnv',
  'packageName',
];

/**
 * Split a publish target into the 8 DECLARED fields and everything else.
 *
 * The split is the point: a Rust struct that merely passed the whole bag through
 * would serialize identically to one that typed the fields, so the golden would
 * not bite. Bucketing proves the fields were actually typed out.
 */
function projectPublish(p: PublishTarget | undefined) {
  if (p === undefined) return null;
  const declared: Record<string, unknown> = {};
  const extra: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(p)) {
    if (v === undefined) continue;
    if (PUBLISH_FIELDS.includes(k)) declared[k] = v;
    else extra[k] = v;
  }
  return { declared, extra };
}

function projectHint(h: OperationHint) {
  return { mountOn: or(h.mountOn), action: or(h.action) };
}

function projectGrouping(g: SdkGrouping | undefined) {
  if (g === undefined) return null;
  let operationHints: Record<string, ReturnType<typeof projectHint>> | null = null;
  if (g.operationHints !== undefined) {
    operationHints = {};
    for (const [k, h] of Object.entries(g.operationHints)) operationHints[k] = projectHint(h);
  }
  return { mountRules: or(g.mountRules), operationHints };
}

/** `LanguageSection`: three declared fields, the rest is the emitter's option bag. */
function projectSection(s: LanguageSection) {
  const { output, behavior, publish, ...options } = s;
  return {
    output: or(output),
    behavior: or(behavior),
    publish: projectPublish(publish),
    options,
  };
}

/** `SdkJson`'s declared keys — everything else falls under the index signature. */
const SDK_DECLARED = new Set(['$schema', 'version', 'api', 'spec', 'sdk', 'behavior', 'sdkName', 'grouping', 'publish']);

/**
 * `SdkJson`. The index signature is `[language: string]: LanguageSection | unknown`,
 * so a non-declared key is a language section when (and only when) its value is a
 * plain object; anything else is the `unknown` arm. Alias resolution
 * (`typescript` → `node`) is the CLI's job, deliberately NOT done here.
 */
function projectSdkJson(raw: SdkJson) {
  const sections: Record<string, ReturnType<typeof projectSection>> = {};
  const nonSectionKeys: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (SDK_DECLARED.has(k)) continue;
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) sections[k] = projectSection(v as LanguageSection);
    else nonSectionKeys[k] = v;
  }
  return {
    $schema: or(raw.$schema),
    version: raw.version,
    api: or(raw.api),
    spec: or(raw.spec),
    sdk: or(raw.sdk),
    sdkName: or(raw.sdkName),
    behavior: or(raw.behavior),
    grouping: projectGrouping(raw.grouping),
    publish: projectPublish(raw.publish),
    sections,
    nonSectionKeys,
  };
}

function projectChainSource(s: ChainSource) {
  return {
    inputs: s.inputs.map((i) => ({ location: i.location })),
    overlays: s.overlays === undefined ? null : s.overlays.map((i) => ({ location: i.location })),
    output: or(s.output),
  };
}

function projectChainTarget(t: ChainTarget) {
  return {
    target: t.target,
    source: t.source,
    output: or(t.output),
    sdkName: or(t.sdkName),
    behavior: or(t.behavior),
    grouping: projectGrouping(t.grouping),
    options: or(t.options),
    publish: projectPublish(t.publish),
    tests: or(t.tests),
  };
}

/** `ChainJson`. No index signature → unknown keys are simply not reachable. */
function projectChainJson(raw: ChainJson) {
  const sources: Record<string, ReturnType<typeof projectChainSource>> = {};
  for (const [k, v] of Object.entries(raw.sources ?? {})) sources[k] = projectChainSource(v);
  const targets: Record<string, ReturnType<typeof projectChainTarget>> = {};
  for (const [k, v] of Object.entries(raw.targets ?? {})) targets[k] = projectChainTarget(v);
  return {
    $schema: or(raw.$schema),
    version: raw.version,
    behavior: or(raw.behavior),
    publish: projectPublish(raw.publish),
    sources,
    targets,
  };
}

// ── per-group runners ────────────────────────────────────────────────────────

/**
 * `mergePublishTargets`. A `null` entry in `layers` is an undefined LAYER; the
 * `"__UNDEFINED__"` string as a field value is an undefined FIELD (the `license:
 * undefined` case the hand-written test covers).
 */
function runMergePublish(input: { layers: (Record<string, unknown> | null)[] }) {
  const layers = input.layers.map((layer) => {
    if (layer === null) return undefined;
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(layer)) out[k] = v === UNDEFINED_SENTINEL ? undefined : v;
    return out as PublishTarget;
  });
  return { result: projectPublish(mergePublishTargets(...layers)) };
}

interface SpecHelperInput {
  /** Inline IR… */
  spec?: unknown;
  /** …or a repo-relative path to a real one (the large-corpus case). */
  specFile?: string;
  lookups: string[];
}

function runSpecHelpers(input: SpecHelperInput) {
  const spec = (input.specFile ? readJson(path.join(REPO_ROOT, input.specFile)) : input.spec) as Parameters<
    typeof findType
  >[0];
  const types: Record<string, unknown> = {};
  for (const name of input.lookups) types[name] = findType(spec, name) ?? null;
  return {
    types,
    typeCount: (spec.types ?? []).length,
    walk: walkMethods(spec).map((m) => `${m.path.join('/')} ${m.method.action ?? ''}`),
  };
}

async function runLoadSpec(input: { source: string; cwd: string | null }, caseDir: string) {
  const sub = (s: string) => s.split(CASE_TOKEN).join(caseDir);
  const loaded = await loadOpensdkSpec(sub(input.source), input.cwd === null ? undefined : { cwd: sub(input.cwd) });
  return { loaded: loaded ?? null };
}

/** Every group's `<case> -> projected output`, recomputed from scratch. */
async function build(): Promise<Record<string, Record<string, unknown>>> {
  const out: Record<string, Record<string, unknown>> = {
    'merge-publish': {},
    'sdk-json': {},
    'chain-json': {},
    'spec-helpers': {},
    'load-spec': {},
  };
  for (const c of cases('merge-publish')) {
    out['merge-publish'][c] = runMergePublish(readJson(path.join(FIXTURES, 'merge-publish', c, 'input.json')));
  }
  for (const c of cases('sdk-json')) {
    out['sdk-json'][c] = projectSdkJson(readJson(path.join(FIXTURES, 'sdk-json', c, 'input.json')));
  }
  for (const c of cases('chain-json')) {
    out['chain-json'][c] = projectChainJson(readJson(path.join(FIXTURES, 'chain-json', c, 'input.json')));
  }
  for (const c of cases('spec-helpers')) {
    out['spec-helpers'][c] = runSpecHelpers(readJson(path.join(FIXTURES, 'spec-helpers', c, 'input.json')));
  }
  for (const c of cases('load-spec')) {
    const dir = path.join(FIXTURES, 'load-spec', c);
    out['load-spec'][c] = await runLoadSpec(readJson(path.join(dir, 'input.json')), dir);
  }
  return out;
}

const goldenPath = (group: string, c: string) => path.join(FIXTURES, group, c, 'output.json');

// ── generate ─────────────────────────────────────────────────────────────────

describe.runIf(BUILD)('generate the xyd_opensdk_config oracle', () => {
  it('writes <case>/output.json for every fixture', async () => {
    const all = await build();
    let written = 0;
    for (const [group, byCase] of Object.entries(all)) {
      for (const [c, value] of Object.entries(byCase)) {
        fs.writeFileSync(goldenPath(group, c), `${JSON.stringify(value, null, 2)}\n`);
        written++;
      }
    }
    expect(written).toBeGreaterThan(0);
  });
});

// ── guard ────────────────────────────────────────────────────────────────────

describe.skipIf(BUILD)('xyd_opensdk_config oracle (regen guard)', () => {
  it('every fixture still produces its committed golden', async () => {
    const all = await build();
    const missing: string[] = [];
    let checked = 0;
    for (const [group, byCase] of Object.entries(all)) {
      for (const [c, value] of Object.entries(byCase)) {
        const p = goldenPath(group, c);
        if (!fs.existsSync(p)) {
          missing.push(`${group}/${c}`);
          continue;
        }
        expect(value, `${group}/${c}`).toEqual(readJson(p));
        checked++;
      }
    }
    expect(missing, 'goldens missing — run with O2S_BUILD_DOCS=1').toEqual([]);
    // A silently-empty corpus would make this suite vacuously green.
    expect(checked).toBeGreaterThanOrEqual(40);
  });
});
