import fs from 'node:fs';
import * as path from 'node:path';

import { openapi2opensdkFromSource } from '@xyd-js/openapi2opensdk';
import type { OpenApi2OpenSdkOptions } from '@xyd-js/openapi2opensdk';
import { mergeBehaviorOverrides } from '@xyd-js/opensdk-core';
import type { OpensdkSpecJson, SdkBehavior } from '@xyd-js/opensdk-core';
import { generateFileMap, getEmitter, writeProject } from '@xyd-js/opensdk-framework';

import type { ResolvedConfig } from './config/types';
import { type ConverterInputs, converterOptions } from './grouping';

/** Emit an IR through one language's emitter to disk (or print on dry-run). */
async function emitToDisk(
  ir: OpensdkSpecJson,
  lang: string,
  emitterOptions: Record<string, unknown>,
  output: string,
  dryRun?: boolean,
): Promise<void> {
  const emitter = getEmitter(lang); // resolves aliases (typescript -> node, ...)
  // generateFileMap keeps per-file writeMode (skipIfExists/mergeJson) so
  // regenerating into a live repo honors user-owned scaffolds.
  const files = generateFileMap(ir, emitter, emitterOptions);
  if (dryRun) {
    for (const p of Object.keys(files).sort()) console.log(p);
    return;
  }
  await writeProject(files, output);
  console.log(`Generated ${Object.keys(files).length} files in ${output}`);
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
  },
): Promise<void> {
  const ir = await loadIR(opts.spec, converterOptions(opts));
  const emitterOptions = opts.noTests
    ? { ...(opts.emitterOptions ?? {}), tests: false }
    : (opts.emitterOptions ?? {});
  await emitToDisk(ir, opts.lang, emitterOptions, opts.output, opts.dryRun);
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
  const ir = await loadIR(opts.spec, converterOptions({ ...opts, sdk: config.sdk }));
  for (const lang of langs) {
    const target = config.targets?.[lang];
    ir.sdk = mergeBehaviorOverrides(config.sdk, target?.behavior) as SdkBehavior;
    const output = target?.output ?? path.join(opts.output, lang);
    const base = config.emitterOptions?.[lang] ?? {};
    const emitterOptions = opts.noTests ? { ...base, tests: false } : base;
    await emitToDisk(ir, lang, emitterOptions, output, opts.dryRun);
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
