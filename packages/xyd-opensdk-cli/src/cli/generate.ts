import fs from 'node:fs';
import * as path from 'node:path';

import { openapi2opensdkFromSource } from '@xyd-js/openapi2opensdk';
import type { OpenApi2OpenSdkOptions } from '@xyd-js/openapi2opensdk';
import { mergeBehaviorOverrides, mergePublishTargets } from '@xyd-js/opensdk-core';
import type { OpensdkSpecJson, PublishTarget, SdkBehavior, SdkInfo } from '@xyd-js/opensdk-core';
import { generateFileMap, getEmitter, writeProject } from '@xyd-js/opensdk-framework';

import { generateCliTarget, isCliTarget } from './cli-targets';
import type { ResolvedConfig } from './config/types';
import { type ConverterInputs, converterOptions } from './grouping';
import { reportWriteResult } from './write-report';

/**
 * Override the IR's package identity (`spec.info`) from a merged publish target.
 * The converter already fills `version`/`contact`/`license` from the OpenAPI
 * `info`; a `publish` block's identity fields win over those so one `sdk.json`
 * controls what every manifest renders. Returns a NEW SdkInfo (never mutates the
 * converter's `info`, so per-language calls in `generateTargets` don't leak).
 */
function applyPublishIdentity(info: SdkInfo, publish?: PublishTarget): SdkInfo {
  if (!publish) return info;
  const next: SdkInfo = { ...info };
  if (publish.version) next.version = publish.version;
  if (publish.homepage) next.homepage = publish.homepage;
  if (publish.repository) next.repository = publish.repository;
  if (publish.author) next.contact = { ...next.contact, name: publish.author };
  if (publish.license) next.license = { ...next.license, identifier: publish.license };
  return next;
}

/** Emit an IR through one language's emitter to disk (or print on dry-run). */
async function emitToDisk(
  ir: OpensdkSpecJson,
  lang: string,
  emitterOptions: Record<string, unknown>,
  output: string,
  dryRun?: boolean,
  merge?: boolean,
): Promise<void> {
  const emitter = getEmitter(lang); // resolves aliases (typescript -> node, ...)
  // generateFileMap keeps per-file writeMode (skipIfExists/mergeJson) so
  // regenerating into a live repo honors user-owned scaffolds.
  const files = generateFileMap(ir, emitter, emitterOptions);
  if (dryRun) {
    for (const p of Object.keys(files).sort()) console.log(p);
    return;
  }
  const result = await writeProject(files, output, { merge });
  reportWriteResult(Object.keys(files).length, output, result);
}

/** `opensdk generate --lang <x>` — single target. Behavior is threaded through the converter. */
export async function generateCommand(
  opts: ConverterInputs & {
    spec: string;
    lang: string;
    output: string;
    dryRun?: boolean;
    /** Opt OUT of the emitted self-test suite ({ tests: false } on the per-language bag). */
    noTests?: boolean;
    /** Language-specific option bag for the active emitter (from config). */
    emitterOptions?: Record<string, unknown>;
    /** Publish identity (global + per-language, pre-merged by the caller) threaded onto spec.info. */
    publish?: PublishTarget;
    /** 3-way merge hand-edits into regenerated files instead of overwriting (`--merge`). */
    merge?: boolean;
  },
): Promise<void> {
  // CLI output targets (go-cli/rust-cli) branch off BEFORE the OpenSDK IR: they
  // consume the raw OpenAPI doc via the OpenCLI pipeline. This single seam also
  // covers chain targets — the chain engine calls this same function.
  if (isCliTarget(opts.lang)) {
    return generateCliTarget({
      spec: opts.spec,
      lang: opts.lang,
      output: opts.output,
      sdkName: opts.sdkName,
      options: opts.emitterOptions,
      publish: opts.publish,
      mountRules: opts.mountRules,
      operationHints: opts.operationHints,
      groupingFile: opts.grouping,
      dryRun: opts.dryRun,
      merge: opts.merge,
    });
  }
  const ir = await loadIR(opts.spec, converterOptions(opts));
  ir.info = applyPublishIdentity(ir.info, opts.publish);
  const emitterOptions = opts.noTests
    ? { ...(opts.emitterOptions ?? {}), tests: false }
    : (opts.emitterOptions ?? {});
  await emitToDisk(ir, opts.lang, emitterOptions, opts.output, opts.dryRun, opts.merge);
}

/**
 * `opensdk generate` (no --lang) — MULTI target. Converts the spec ONCE (with the
 * global behavior) then emits every declared language, re-stamping `ir.sdk` per
 * language so per-language behavior overrides land. Emitters read
 * `sdkBehavior(spec)` lazily at emit time, so the re-stamp is sufficient — no
 * re-conversion. Caveat: idempotency param-stripping is baked at convert time,
 * so it always uses the GLOBAL behavior; per-language overrides affect the
 * runtime-constant policies (retry/timeout/user-agent/errors/logging/…).
 */
export async function generateTargets(
  opts: ConverterInputs & {
    spec: string;
    output: string;
    dryRun?: boolean;
    noTests?: boolean;
    /** 3-way merge hand-edits into regenerated files instead of overwriting (`--merge`). */
    merge?: boolean;
    config: ResolvedConfig;
  },
): Promise<void> {
  const { config } = opts;
  const langs = Object.keys(config.emitterOptions ?? config.targets ?? {});
  if (!langs.length) {
    throw new Error(
      'No languages declared in the config. Add a language section (e.g. "typescript": { "output": "./sdk/ts" }) or pass --lang.',
    );
  }

  // CLI output targets don't consume the OpenSDK IR — generate them first, and
  // only run the converter when SDK languages remain (a CLI-only config must
  // not pay for — or fail on — the IR conversion).
  const sdkLangs = langs.filter((lang) => !isCliTarget(lang));
  for (const lang of langs.filter(isCliTarget)) {
    const target = config.targets?.[lang];
    await generateCliTarget({
      spec: opts.spec,
      lang,
      output: target?.output ?? path.join(opts.output, lang),
      sdkName: opts.sdkName,
      options: config.emitterOptions?.[lang],
      publish: mergePublishTargets(config.publish, target?.publish),
      mountRules: opts.mountRules,
      operationHints: opts.operationHints,
      groupingFile: opts.grouping,
      dryRun: opts.dryRun,
      merge: target?.merge ?? opts.merge,
    });
  }
  if (!sdkLangs.length) return;

  const ir = await loadIR(opts.spec, converterOptions({ ...opts, sdk: config.sdk }));
  // Snapshot the converter's info so each language re-derives identity from a
  // clean base (a per-language publish never leaks into the next language).
  const baseInfo = ir.info;
  for (const lang of sdkLangs) {
    const target = config.targets?.[lang];
    ir.sdk = mergeBehaviorOverrides(config.sdk, target?.behavior) as SdkBehavior;
    ir.info = applyPublishIdentity(baseInfo, mergePublishTargets(config.publish, target?.publish));
    const output = target?.output ?? path.join(opts.output, lang);
    const base = config.emitterOptions?.[lang] ?? {};
    const emitterOptions = opts.noTests ? { ...base, tests: false } : base;
    await emitToDisk(ir, lang, emitterOptions, output, opts.dryRun, target?.merge ?? opts.merge);
  }
}

/** Accept either an OpenAPI spec (yaml/json) or an already-parsed OpenSDK IR json. */
export async function loadIR(source: string, options: OpenApi2OpenSdkOptions): Promise<OpensdkSpecJson> {
  if (source.endsWith('.json')) {
    const doc = JSON.parse(fs.readFileSync(source, 'utf8'));
    if (typeof doc.opensdk === 'string') return doc as OpensdkSpecJson;
  }
  return openapi2opensdkFromSource(source, options);
}
