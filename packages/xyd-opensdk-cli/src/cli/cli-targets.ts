import fs from 'node:fs';

import { openapi2opencliFromSource } from '@xyd-js/openapi2opencli';
import type { OpenApi2OpenCliOptions } from '@xyd-js/openapi2opencli';
import type { OpencliSpecJson } from '@xyd-js/opencli';
import { opencli2go } from '@xyd-js/opencli2go';
import { opencli2rust } from '@xyd-js/opencli2rust';
import type { OperationHint, PublishTarget } from '@xyd-js/opensdk-core';
import { type ProjectFileMap, writeProject } from '@xyd-js/opensdk-framework';

import { reportWriteResult } from './write-report';

/**
 * CLI output targets ("go-cli" / "rust-cli"): the OpenCLI pipeline
 * (openapi2opencli → opencli2go/rust) surfaced as pseudo-language target ids.
 * Routed BEFORE the emitter registry — CLI generation consumes the raw OpenAPI
 * document, not the OpenSDK IR, so these are a parallel branch, not Emitters.
 * Both backends write through the framework's writeProject, so the regen
 * lifecycle (lock, stale-prune, .sdkignore, --merge) applies to CLI outputs too.
 */

interface CliBackend {
  /** Generator name recorded in the .sdk/sdk.lock manifest. */
  generator: string;
  /** The backend's own option keys (disjoint from CONVERTER_KEYS — unit-tested). */
  backendKeys: readonly string[];
  generate(spec: OpencliSpecJson, options: Record<string, unknown>): ProjectFileMap;
}

const CLI_BACKENDS: Record<string, CliBackend> = {
  'go-cli': {
    generator: 'opencli2go',
    backendKeys: ['modulePath', 'binName', 'goVersion', 'baseURL'],
    generate: (spec, options) => opencli2go(spec, options),
  },
  'rust-cli': {
    generator: 'opencli2rust',
    backendKeys: ['crateName', 'binName', 'edition', 'baseURL'],
    generate: (spec, options) => opencli2rust(spec, options),
  },
};

/** The OpenApi2OpenCliOptions keys accepted in a CLI target's flat option bag. */
export const CLI_CONVERTER_KEYS = [
  'cliName',
  'version',
  'grouping',
  'bodyStrategy',
  'includeMethods',
  'includeHeaders',
  'flagCase',
  'actionAliases',
  'verbMap',
  'customActionVerbs',
  'includePaths',
  'maxBodyDepth',
  'authEnvVar',
] as const;

/** The backend option keys for a CLI target id (exposed for tests). */
export function cliBackendKeys(lang: string): readonly string[] {
  return CLI_BACKENDS[lang.toLowerCase()]?.backendKeys ?? [];
}

/** Is this --lang / section key / chain target a CLI output target? Exact ids, no aliases. */
export function isCliTarget(lang: string | undefined): boolean {
  return !!lang && lang.toLowerCase() in CLI_BACKENDS;
}

/**
 * Split a CLI target's FLAT option bag (sdk.json section / ChainTarget.options)
 * into converter options (openapi2opencli) and backend options (opencli2go/rust).
 * The key sets are disjoint, so the split is unambiguous; unknown keys fail loud.
 */
export function splitCliOptions(
  lang: string,
  bag: Record<string, unknown> = {},
): { converter: OpenApi2OpenCliOptions; backend: Record<string, unknown> } {
  const def = CLI_BACKENDS[lang.toLowerCase()];
  if (!def) throw new Error(`Not a CLI target: ${lang}`);
  const converter: Record<string, unknown> = {};
  const backend: Record<string, unknown> = {};
  const unknown: string[] = [];
  for (const [key, value] of Object.entries(bag)) {
    if (value === undefined) continue;
    if (key === 'tests') continue; // shared LanguageSection knob; CLI backends emit no self-test suite
    if ((CLI_CONVERTER_KEYS as readonly string[]).includes(key)) converter[key] = value;
    else if (def.backendKeys.includes(key)) backend[key] = value;
    else unknown.push(key);
  }
  if (unknown.length) {
    throw new Error(
      `Unknown option(s) for "${lang}": ${unknown.join(', ')}. Valid: ${[...CLI_CONVERTER_KEYS, ...def.backendKeys].join(', ')}`,
    );
  }
  return { converter: converter as OpenApi2OpenCliOptions, backend };
}

export interface CliTargetOptions {
  /** OpenAPI spec path (yaml/json). A pre-parsed OpenSDK IR is rejected. */
  spec: string;
  /** CLI target id: "go-cli" | "rust-cli". */
  lang: string;
  output: string;
  /** Defaults the emitted CLI's name (converter `cliName`) when unset. */
  sdkName?: string;
  /** The flat option bag (converter + backend keys, split by allowlist). */
  options?: Record<string, unknown>;
  /** Only `version` is consumed (defaults the converter `version`). */
  publish?: PublishTarget;
  /** SDK-tree grouping — meaningless for CLI targets; warned once + ignored. */
  mountRules?: Record<string, string>;
  operationHints?: Record<string, OperationHint>;
  /** `--grouping` file path — SDK-tree grouping; warned once + ignored. */
  groupingFile?: string;
  dryRun?: boolean;
  merge?: boolean;
}

let warnedSdkGrouping = false;

/** Generate one CLI output target: openapi2opencli → backend → framework writeProject. */
export async function generateCliTarget(opts: CliTargetOptions): Promise<void> {
  const lang = opts.lang.toLowerCase();
  const backend = CLI_BACKENDS[lang];
  if (!backend) throw new Error(`Not a CLI target: ${opts.lang}`);

  // Mirror loadIR's sniff: a pre-parsed OpenSDK IR cannot feed the OpenCLI pipeline.
  if (opts.spec.endsWith('.json')) {
    const doc = JSON.parse(fs.readFileSync(opts.spec, 'utf8'));
    if (typeof doc.opensdk === 'string') {
      throw new Error(
        `CLI targets ("${lang}") generate from the OpenAPI document, not a pre-parsed OpenSDK IR. Pass the OpenAPI spec (yaml/json) as --spec.`,
      );
    }
  }

  // SDK-tree grouping flows into every generateCommand call in mixed configs —
  // warn once instead of erroring so mixed SDK+CLI setups keep working.
  if ((opts.mountRules || opts.operationHints || opts.groupingFile) && !warnedSdkGrouping) {
    warnedSdkGrouping = true;
    console.warn(`note: mountRules/operationHints apply to SDK targets only — ignored for "${lang}".`);
  }

  const { converter, backend: backendOptions } = splitCliOptions(lang, opts.options);
  if (converter.cliName === undefined && opts.sdkName) converter.cliName = opts.sdkName;
  if (converter.version === undefined && opts.publish?.version) converter.version = opts.publish.version;

  const cliSpec = await openapi2opencliFromSource(opts.spec, converter);
  const files = backend.generate(cliSpec, backendOptions);

  if (opts.dryRun) {
    for (const p of Object.keys(files).sort()) console.log(p);
    return;
  }
  const result = await writeProject(files, opts.output, { generator: backend.generator, merge: opts.merge });
  reportWriteResult(Object.keys(files).length, opts.output, result);
}
