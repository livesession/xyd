import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { describe, expect, it, vi } from 'vitest';

import {
  CLI_CONVERTER_KEYS,
  applyPublishIdentity,
  cliBackendKeys,
  converterOptions,
  diffCommand,
  generateCommand,
  generateTargets,
  initCommand,
  isCliTarget,
  loadGrouping,
  parseCommand,
  registerBuiltinEmitters,
  resolveConfig,
  splitCliOptions,
} from '../src';
import type { DiffFailOn } from '../src';

// ─────────────────────────────────────────────────────────────────────────────
// THE ORACLE for `crates/xyd_opensdk_cli` — the Rust port of this package.
//
// Two roles, selected by `O2S_BUILD_DOCS=1` (the switch the rest of the opensdk
// fixtures already use):
//
//   O2S_BUILD_DOCS=1  → GENERATE. Runs the REAL TypeScript over every committed
//                       `<case>/input.json` and writes `<case>/output.json`.
//   (unset)           → GUARD. Re-runs the same pipeline and asserts the
//                       committed goldens still match, so the TS cannot drift
//                       away from the oracle the Rust is gated on.
//
// The goldens live in the CRATE, not here: this package is slated for deletion
// once the port lands, and an oracle that dies with its generator is not an
// oracle. Same arrangement as `packages/xyd-opensdk-core/__tests__/rust-oracle.test.ts`.
//
//   Regenerate:  O2S_BUILD_DOCS=1 pnpm --filter @xyd-js/opensdk-cli test -- --run
//   Verify Rust: cargo test -p xyd_opensdk_cli
//
// EIGHT GROUPS. Seven freeze a PURE unit; the eighth is behavioural:
//
//   converter-options/  `converterOptions` + `loadGrouping` — the option bag fed
//                       to the converter by parse/generate/diff, incl. the
//                       field-by-field `--grouping` file override.
//   resolved-config/    `resolveConfig` — sdk.json detection + normalization
//                       (alias → canonical, output/behavior/publish → targets,
//                       the rest → emitterOptions, spec resolution, precedence).
//   cli-split/          `splitCliOptions` / `isCliTarget` / `cliBackendKeys` —
//                       the go-cli/rust-cli allowlist split.
//   diff-report/        the grouped human report + the 0/1/2 exit table.
//   init-templates/     the scaffolded sdk.json / chain.json / opensdk.config.mjs
//                       bytes.
//   publish-identity/   `applyPublishIdentity` — publish block → spec.info.
//   generate-tree/      BEHAVIOURAL: `generate` writes a tree, so the golden is
//                       a manifest of that tree (path → sha256) produced by the
//                       real TypeScript. Covers option threading, the
//                       multi-target loop, CLI-target routing and the
//                       `writeProject` lifecycle in one comparison.
//
// KEY ORDER is captured explicitly (`*Keys` arrays) everywhere it is observable:
// vitest `toEqual` and serde_json's IndexMap equality are both
// order-INSENSITIVE, so an object comparison alone would not pin it. Order is
// load-bearing here — sdk.json section order is the multi-target generation
// order, and `mountRules` is scanned longest-prefix-first with a strict `>`.
// ─────────────────────────────────────────────────────────────────────────────

const BUILD = process.env.O2S_BUILD_DOCS === '1';
const REPO_ROOT = path.join(__dirname, '../../..');
const FIXTURES = path.join(REPO_ROOT, 'crates/xyd_opensdk_cli/__fixtures__');

/** Replaced with the case directory's absolute path at run time. */
const CASE_TOKEN = '__CASE__';

const readJson = (p: string) => JSON.parse(fs.readFileSync(p, 'utf8'));
const or = <T>(v: T | undefined): T | null => (v === undefined ? null : v);
const keysOf = (v: unknown): string[] | null =>
  v !== null && typeof v === 'object' && !Array.isArray(v) ? Object.keys(v as object) : null;

/** `<group>` case directories, sorted, each containing an `input.json`. */
function cases(group: string): string[] {
  const dir = path.join(FIXTURES, group);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((n) => fs.existsSync(path.join(dir, n, 'input.json')))
    .sort();
}

/** Run `fn`, returning its value or the thrown message — both are contract. */
async function capture<T>(fn: () => T | Promise<T>): Promise<{ ok: T } | { error: string }> {
  try {
    return { ok: await fn() };
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) };
  }
}

/** Substitute `__CASE__` in any string, recursively. */
function sub<T>(value: T, caseDir: string): T {
  if (typeof value === 'string') return value.split(CASE_TOKEN).join(caseDir) as unknown as T;
  if (Array.isArray(value)) return value.map((v) => sub(v, caseDir)) as unknown as T;
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) out[k] = sub(v, caseDir);
    return out as T;
  }
  return value;
}

/** Undo the substitution so goldens stay machine-independent. */
const unsub = (text: string, caseDir: string) => text.split(caseDir).join(CASE_TOKEN);

// ── converter-options ────────────────────────────────────────────────────────

/**
 * `converterOptions(inputs)`. The `grouping` input is a `__CASE__`-relative path
 * to a committed grouping json, so the file-over-config override is exercised
 * with real IO.
 */
async function runConverterOptions(input: Record<string, unknown>, caseDir: string) {
  const inputs = sub(input.inputs ?? {}, caseDir) as Parameters<typeof converterOptions>[0];
  const result = await capture(() => converterOptions(inputs));
  if ('error' in result) return { error: unsub(result.error, caseDir) };
  return { options: result.ok, optionKeys: Object.keys(result.ok) };
}

/** `loadGrouping(path)` on its own — the file reader behind the override. */
async function runLoadGrouping(input: Record<string, unknown>, caseDir: string) {
  const result = await capture(() => loadGrouping(sub(input.grouping as string, caseDir)));
  if ('error' in result) return { error: unsub(result.error, caseDir) };
  return {
    // `loadGrouping` always returns BOTH keys (possibly undefined) — that shape
    // is what makes the override field-by-field rather than whole-object.
    mountRules: or(result.ok.mountRules),
    operationHints: or(result.ok.operationHints),
    mountRuleKeys: keysOf(result.ok.mountRules),
  };
}

// ── resolved-config ──────────────────────────────────────────────────────────

function projectTarget(t: Record<string, unknown>) {
  return {
    output: or(t.output as string | undefined),
    behavior: or(t.behavior),
    publish: or(t.publish),
    publishKeys: keysOf(t.publish),
    merge: or(t.merge),
  };
}

/**
 * A `ResolvedConfig`. Both maps are projected as ORDERED entry lists: the
 * multi-target generate iterates `Object.keys(emitterOptions)`, so this order
 * IS the generation order.
 */
function projectConfig(c: Awaited<ReturnType<typeof resolveConfig>>, caseDir: string) {
  if (!c) return null;
  const emitterOptions = Object.entries(c.emitterOptions ?? {}).map(([lang, opts]) => ({
    lang,
    options: opts,
    optionKeys: Object.keys(opts),
  }));
  const targets = Object.entries(c.targets ?? {}).map(([lang, t]) => ({
    lang,
    ...projectTarget(t as Record<string, unknown>),
  }));
  return {
    spec: c.spec ? unsub(c.spec, caseDir) : null,
    sdkName: or(c.sdkName),
    sdk: or(c.sdk),
    mountRules: or(c.mountRules),
    mountRuleKeys: keysOf(c.mountRules),
    operationHints: or(c.operationHints),
    publish: or(c.publish),
    publishKeys: keysOf(c.publish),
    merge: or(c.merge),
    // `emitterOptions`/`targets` are left UNSET when empty (the `??` chain in
    // generate/publish depends on that), so `declaredLanguages` mirrors it.
    hasEmitterOptions: c.emitterOptions !== undefined,
    hasTargets: c.targets !== undefined,
    declaredLanguages: Object.keys(c.emitterOptions ?? c.targets ?? {}),
    emitterOptions,
    targets,
    sourceKind: c.source?.kind ?? null,
    sourceFilePath: c.source?.filePath ? unsub(c.source.filePath, caseDir) : null,
  };
}

/**
 * `resolveConfig(cwd, explicitPath)`. The case dir IS the cwd, so the committed
 * `sdk.json` / `.sdk/sdk.json` / `opensdk.config.mjs` files drive detection and
 * precedence.
 */
async function runResolvedConfig(input: Record<string, unknown>, caseDir: string) {
  const explicit = input.explicitPath ? sub(input.explicitPath as string, caseDir) : undefined;
  const result = await capture(() => resolveConfig(caseDir, explicit));
  if ('error' in result) return { error: unsub(result.error, caseDir) };
  return { config: projectConfig(result.ok, caseDir) };
}

// ── cli-split ────────────────────────────────────────────────────────────────

function runCliSplit(input: Record<string, unknown>) {
  const lang = input.lang as string;
  const base = {
    isCliTarget: isCliTarget(lang),
    backendKeys: [...cliBackendKeys(lang)],
    converterKeys: [...CLI_CONVERTER_KEYS],
  };
  let split: { converter: unknown; backend: unknown; converterOrder: string[]; backendOrder: string[] } | null =
    null;
  let error: string | null = null;
  try {
    const out = splitCliOptions(lang, input.bag as Record<string, unknown>);
    split = {
      converter: out.converter,
      backend: out.backend,
      converterOrder: Object.keys(out.converter),
      backendOrder: Object.keys(out.backend),
    };
  } catch (err) {
    error = err instanceof Error ? err.message : String(err);
  }
  return { ...base, split, error };
}

// ── diff-report ──────────────────────────────────────────────────────────────

/**
 * `diffCommand` over two committed OpenSDK IR docs. Captures the grouped report
 * LINE BY LINE (one entry per `console.log`) so the comparison never hinges on
 * how trailing newlines are joined, plus the exit code under each `--fail-on`.
 */
async function runDiffReport(caseDir: string) {
  const base = path.join(caseDir, 'base.json');
  const head = path.join(caseDir, 'head.json');
  const log = vi.spyOn(console, 'log').mockImplementation(() => {});
  let reportLines: string[];
  try {
    await diffCommand({ base, head });
    reportLines = log.mock.calls.map((call) => call.join(' '));
  } finally {
    log.mockRestore();
  }
  const exit: Record<string, number> = {};
  for (const failOn of ['breaking', 'risky', 'any'] as DiffFailOn[]) {
    const silence = vi.spyOn(console, 'log').mockImplementation(() => {});
    try {
      exit[failOn] = await diffCommand({ base, head, failOn });
    } finally {
      silence.mockRestore();
    }
  }
  return { reportLines, exit };
}

// ── init-templates ───────────────────────────────────────────────────────────

/** `initCommand` into a throwaway project dir; the golden is the written file. */
async function runInitTemplate(input: Record<string, unknown>) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'opensdk-oracle-init-'));
  const log = vi.spyOn(console, 'log').mockImplementation(() => {});
  try {
    await initCommand({ project: dir, ...(input as object) });
    const rel = (input.chain ? 'chain.json' : input.format === 'mjs' ? 'opensdk.config.mjs' : 'sdk.json') as string;
    const full = input.chain || input.format !== 'mjs' ? path.join(dir, (input.dir as string) ?? '.', rel) : path.join(dir, rel);
    const body = fs.readFileSync(full, 'utf8');
    // Re-running must refuse rather than clobber.
    const again = await capture(() => initCommand({ project: dir, ...(input as object) }));
    return {
      relPath: path.relative(dir, full),
      body,
      logged: log.mock.calls.map((c) => c.join(' ')).map((s) => s.split(dir).join(CASE_TOKEN)),
      rerunError: 'error' in again ? again.error : null,
    };
  } finally {
    log.mockRestore();
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

// ── publish-identity ─────────────────────────────────────────────────────────

function runPublishIdentity(input: Record<string, unknown>) {
  const info = input.info as Parameters<typeof applyPublishIdentity>[0];
  const publish = (input.publish ?? undefined) as Parameters<typeof applyPublishIdentity>[1];
  const out = applyPublishIdentity(info, publish);
  return {
    info: out,
    infoKeys: Object.keys(out),
    // The input must never be mutated — per-language calls share one base.
    inputUnchanged: JSON.stringify(info) === JSON.stringify(input.info),
  };
}

// ── generate-tree ────────────────────────────────────────────────────────────
//
// The BEHAVIOURAL half. `generate` writes a tree; there is no pure value to
// freeze, so the golden is a MANIFEST of the tree the real TypeScript produces:
// every relative path with the sha256 of its bytes. Rust generates the same
// inputs into its own temp dir and must produce the identical manifest.
//
// Constraint: outputs are always ABSOLUTE (the temp dir). A relative `output`
// resolves against `process.cwd()`, which differs between the two runners (and
// would write into the repo), so per-language `output` is covered by the
// `resolved-config` group instead — where it is a pure normalization.

const PETSTORE = 'packages/xyd-openapi2opensdk/__fixtures__/1.basic/input.json';

/** Every file under `root`, relative path → sha256 of its bytes. */
function treeManifest(root: string, prefix = ''): Record<string, string> {
  const out: Record<string, string> = {};
  const dir = path.join(root, prefix);
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) Object.assign(out, treeManifest(root, rel));
    else out[rel] = createHash('sha256').update(fs.readFileSync(path.join(root, rel))).digest('hex');
  }
  return out;
}

/**
 * One `generate-tree` case. `input.json` declares the shape:
 *   { mode: 'single' | 'targets', lang?, sdkName?, mountRules?, noTests?,
 *     emitterOptions?, publish?, fromIr?, dryRun? }
 * plus, for `targets`, a committed `sdk.json` in the case dir.
 */
async function runGenerateTree(input: Record<string, unknown>, caseDir: string) {
  registerBuiltinEmitters();
  const spec = path.join(REPO_ROOT, PETSTORE);
  const out = fs.mkdtempSync(path.join(os.tmpdir(), 'opensdk-oracle-tree-'));
  const log = vi.spyOn(console, 'log').mockImplementation(() => {});
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  try {
    let source = spec;
    if (input.fromIr) {
      // Exercise the `loadIR` pass-through: a pre-parsed OpenSDK IR.
      source = path.join(out, 'ir.json');
      await parseCommand({ spec, output: source });
    }
    const shared = {
      sdkName: input.sdkName as string | undefined,
      mountRules: input.mountRules as Record<string, string> | undefined,
      noTests: input.noTests as boolean | undefined,
      dryRun: input.dryRun as boolean | undefined,
    };
    if (input.mode === 'targets') {
      const config = await resolveConfig(caseDir);
      await generateTargets({
        ...shared,
        spec: source,
        output: path.join(out, 'sdk'),
        sdk: config?.sdk,
        config: config!,
      });
    } else {
      await generateCommand({
        ...shared,
        spec: source,
        lang: input.lang as string,
        output: path.join(out, 'sdk'),
        emitterOptions: input.emitterOptions as Record<string, unknown> | undefined,
        publish: input.publish as never,
      });
    }
    // The IR staging file is an input, not part of the generated tree.
    if (input.fromIr) fs.rmSync(source, { force: true });
    const files = treeManifest(out);
    return { files, fileCount: Object.keys(files).length };
  } finally {
    log.mockRestore();
    warn.mockRestore();
    fs.rmSync(out, { recursive: true, force: true });
  }
}

// ── build ────────────────────────────────────────────────────────────────────

const GROUPS = [
  'converter-options',
  'load-grouping',
  'resolved-config',
  'cli-split',
  'diff-report',
  'init-templates',
  'publish-identity',
  'generate-tree',
] as const;

async function build(): Promise<Record<string, Record<string, unknown>>> {
  const out: Record<string, Record<string, unknown>> = Object.fromEntries(GROUPS.map((g) => [g, {}]));
  for (const c of cases('converter-options')) {
    const dir = path.join(FIXTURES, 'converter-options', c);
    out['converter-options'][c] = await runConverterOptions(readJson(path.join(dir, 'input.json')), dir);
  }
  for (const c of cases('load-grouping')) {
    const dir = path.join(FIXTURES, 'load-grouping', c);
    out['load-grouping'][c] = await runLoadGrouping(readJson(path.join(dir, 'input.json')), dir);
  }
  for (const c of cases('resolved-config')) {
    const dir = path.join(FIXTURES, 'resolved-config', c);
    out['resolved-config'][c] = await runResolvedConfig(readJson(path.join(dir, 'input.json')), dir);
  }
  for (const c of cases('cli-split')) {
    out['cli-split'][c] = runCliSplit(readJson(path.join(FIXTURES, 'cli-split', c, 'input.json')));
  }
  for (const c of cases('diff-report')) {
    out['diff-report'][c] = await runDiffReport(path.join(FIXTURES, 'diff-report', c));
  }
  for (const c of cases('init-templates')) {
    out['init-templates'][c] = await runInitTemplate(readJson(path.join(FIXTURES, 'init-templates', c, 'input.json')));
  }
  for (const c of cases('publish-identity')) {
    out['publish-identity'][c] = runPublishIdentity(
      readJson(path.join(FIXTURES, 'publish-identity', c, 'input.json')),
    );
  }
  for (const c of cases('generate-tree')) {
    const dir = path.join(FIXTURES, 'generate-tree', c);
    out['generate-tree'][c] = await runGenerateTree(readJson(path.join(dir, 'input.json')), dir);
  }
  return out;
}

const goldenPath = (group: string, c: string) => path.join(FIXTURES, group, c, 'output.json');

// ── generate ─────────────────────────────────────────────────────────────────

// `generate-tree` really generates ~10 SDK trees, so both halves get a generous
// timeout: vitest's 5s default is close enough to the real cost that a loaded
// machine can flake it.
const ORACLE_TIMEOUT_MS = 120_000;

describe.runIf(BUILD)('generate the xyd_opensdk_cli oracle', () => {
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
  }, ORACLE_TIMEOUT_MS);
});

// ── guard ────────────────────────────────────────────────────────────────────

describe.skipIf(BUILD)('xyd_opensdk_cli oracle (regen guard)', () => {
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
  }, ORACLE_TIMEOUT_MS);
});
