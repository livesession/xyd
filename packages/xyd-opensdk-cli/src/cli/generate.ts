import fs from 'node:fs';

import { openapi2opensdkFromSource } from '@xyd-js/openapi2opensdk';
import type { OpenApi2OpenSdkOptions } from '@xyd-js/openapi2opensdk';
import type { OpensdkSpecJson } from '@xyd-js/opensdk-core';
import { generateFileMap, getEmitter, writeProject } from '@xyd-js/opensdk-framework';

import { type ConverterInputs, converterOptions } from './grouping';

/** `opensdk generate` — spec (or pre-parsed IR) → registered emitter → SDK on disk. */
export async function generateCommand(
  opts: ConverterInputs & {
    spec: string;
    lang: string;
    output: string;
    dryRun?: boolean;
    /**
     * Opt OUT of the emitted self-test suite for the active language. Threaded
     * onto the per-language emitterOptions bag as `{ tests: false }` (emitters
     * emit their test suite unless `tests === false`).
     */
    noTests?: boolean;
    /** Language-specific option bag for the active emitter (from config). */
    emitterOptions?: Record<string, unknown>;
  },
): Promise<void> {
  const ir = await loadIR(opts.spec, converterOptions(opts));
  const emitter = getEmitter(opts.lang);
  // --no-tests rides the per-language emitterOptions bag as { tests: false };
  // the config bag can carry other emitter options (modulePath, packageName, ...).
  const emitterOptions = opts.noTests
    ? { ...(opts.emitterOptions ?? {}), tests: false }
    : (opts.emitterOptions ?? {});
  // generateFileMap keeps per-file writeMode (skipIfExists/mergeJson) so
  // regenerating into a live repo honors user-owned scaffolds.
  const files = generateFileMap(ir, emitter, emitterOptions);

  if (opts.dryRun) {
    for (const path of Object.keys(files).sort()) console.log(path);
    return;
  }
  await writeProject(files, opts.output);
  console.log(`Generated ${Object.keys(files).length} files in ${opts.output}`);
}

/** Accept either an OpenAPI spec (yaml/json) or an already-parsed OpenSDK IR json. */
export async function loadIR(source: string, options: OpenApi2OpenSdkOptions): Promise<OpensdkSpecJson> {
  if (source.endsWith('.json')) {
    const doc = JSON.parse(fs.readFileSync(source, 'utf8'));
    if (typeof doc.opensdk === 'string') return doc as OpensdkSpecJson;
  }
  return openapi2opensdkFromSource(source, options);
}
