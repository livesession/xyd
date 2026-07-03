import * as path from 'node:path';

import { mergeBehaviorOverrides, mergePublishTargets } from '@xyd-js/opensdk-core';
import type { DeepPartial, OperationHint, PublishTarget, SdkBehavior } from '@xyd-js/opensdk-core';
import type { EmitterPublishOptions } from '@xyd-js/opensdk-framework';

import { resolveChain } from './chain';
import { processSource } from './sources';

/**
 * `opensdk run` engine — execute a chain.json pipeline: process each referenced
 * source (merge inputs + apply overlays → one spec) then generate every target's
 * SDK from its source; with `publish`, also publish each. The per-target generate
 * and publish are INJECTED (`generate`/`publishTarget`) — the same primitives the
 * CLI's `generate`/`publish` commands use — so there is no duplicated orchestration
 * and this package stays free of a converter/emitter dependency.
 */

/** Options passed to the injected per-target generator (the CLI's `generateCommand`). */
export interface GenerateTargetOptions {
  spec: string;
  lang: string;
  output: string;
  sdkName?: string;
  mountRules?: Record<string, string>;
  operationHints?: Record<string, OperationHint>;
  sdk?: DeepPartial<SdkBehavior>;
  publish?: PublishTarget;
  emitterOptions?: Record<string, unknown>;
  noTests?: boolean;
  dryRun?: boolean;
}

export interface RunChainOptions {
  /** Path to the chain file. */
  chain: string;
  /** Only this target (else every declared target). */
  target?: string;
  /** Only targets bound to this source. */
  source?: string;
  /** Also publish each generated target (default: generate only). */
  publish?: boolean;
  /** Process + print without writing SDKs or pushing. */
  dryRun?: boolean;
  cwd?: string;
  /** Generate one SDK (injected: the CLI's `generateCommand`). */
  generate: (opts: GenerateTargetOptions) => Promise<void>;
  /** Publish one SDK (injected: the CLI's `publishTarget`, which resolves the language). */
  publishTarget: (lang: string, dir: string, opts: EmitterPublishOptions) => void;
}

export async function runChain(opts: RunChainOptions): Promise<void> {
  const cwd = opts.cwd ?? process.cwd();
  const doc = await resolveChain(opts.chain, cwd);

  if (opts.target && !doc.targets[opts.target]) throw new Error(`Unknown target "${opts.target}"`);
  if (opts.source && !doc.sources[opts.source]) throw new Error(`Unknown source "${opts.source}"`);

  const targetNames = (opts.target ? [opts.target] : Object.keys(doc.targets)).filter(
    (n) => !opts.source || doc.targets[n].source === opts.source,
  );
  if (targetNames.length === 0) throw new Error('No targets to run for the given --target/--source.');

  // Process each referenced source exactly once → a processed spec path.
  const specByName: Record<string, string> = {};
  for (const sname of new Set(targetNames.map((n) => doc.targets[n].source))) {
    specByName[sname] = await processSource(doc.sources[sname], cwd);
    console.log(`Processed source "${sname}" → ${specByName[sname]}`);
  }

  for (const tname of targetNames) {
    const t = doc.targets[tname];
    // Resolve against the run cwd so a relative/default output roots at the caller's cwd.
    const output = path.resolve(cwd, t.output ?? path.join('./sdk', tname));
    const publish = mergePublishTargets(doc.publish, t.publish);

    console.log(`Generating target "${tname}" (${t.target}) → ${output}${opts.dryRun ? ' (dry-run)' : ''}`);
    await opts.generate({
      spec: specByName[t.source],
      lang: t.target,
      output,
      sdkName: t.sdkName,
      mountRules: t.grouping?.mountRules,
      operationHints: t.grouping?.operationHints,
      sdk: mergeBehaviorOverrides(doc.behavior, t.behavior),
      publish,
      emitterOptions: t.options,
      noTests: t.tests === false,
      dryRun: opts.dryRun,
    });

    if (opts.publish) {
      const token = publish?.tokenEnv ? process.env[publish.tokenEnv] : undefined;
      if (publish?.tokenEnv && !token) console.warn(`Warning: publish.tokenEnv "${publish.tokenEnv}" is not set.`);
      console.log(`Publishing target "${tname}" (${t.target}) from ${output}${opts.dryRun ? ' (dry-run)' : ''}`);
      opts.publishTarget(t.target, output, {
        registry: publish?.registry,
        token,
        version: publish?.version,
        dryRun: opts.dryRun,
      });
    }
  }
}
