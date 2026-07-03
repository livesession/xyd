import fs from 'node:fs';
import * as path from 'node:path';

import { mergePublishTargets } from '@xyd-js/opensdk-core';
import type { PublishTarget } from '@xyd-js/opensdk-core';
import { type EmitterPublishOptions, resolveLanguage } from '@xyd-js/opensdk-framework';
import { publishDotnet } from '@xyd-js/opensdk-dotnet';
import { publishGo } from '@xyd-js/opensdk-go';
import { publishJava } from '@xyd-js/opensdk-java';
import { publishNode } from '@xyd-js/opensdk-node';
import { publishPython } from '@xyd-js/opensdk-python';
import { publishRuby } from '@xyd-js/opensdk-ruby';

import type { ResolvedConfig } from './config/types';

/**
 * `opensdk publish` — package + publish already-generated SDKs to their language
 * registries. Identity (author/license/...) is baked into the manifests at
 * generate time; this only carries the REGISTRY MECHANICS (registry URL + auth
 * token from `tokenEnv`). The per-language pack/push is the emitter's OWN
 * `publish<Lang>()` — the SAME function the publish e2e drives — so there is one
 * mechanism, not two.
 */

/** Per-language publishers, keyed by canonical language id. */
const PUBLISHERS: Record<string, (dir: string, opts: EmitterPublishOptions) => void> = {
  go: publishGo,
  python: publishPython,
  node: publishNode,
  ruby: publishRuby,
  java: publishJava,
  dotnet: publishDotnet,
};

/** Package + publish ONE already-generated SDK at `dir` for `lang` via its emitter's publisher. */
export function publishTarget(lang: string, dir: string, opts: EmitterPublishOptions): void {
  const canonical = resolveLanguage(lang);
  if (!fs.existsSync(dir)) {
    throw new Error(`No generated SDK at ${dir}. Run \`opensdk generate\` first (or pass --spec to regenerate).`);
  }
  const publisher = PUBLISHERS[canonical];
  if (!publisher) throw new Error(`No publisher for language "${canonical}".`);
  publisher(dir, opts);
}

export interface PublishCommandOptions {
  /** Single language/alias; omit to publish every declared language. */
  lang?: string;
  /** Output dir (single --lang) or base dir for per-language subfolders (multi). */
  output: string;
  /** Registry override (wins over config `publish.registry`). */
  registry?: string;
  /** Pack only — don't push. */
  dryRun?: boolean;
  /** Resolved config (per-language output dirs + publish targets). */
  config: ResolvedConfig | null;
}

/** Resolve token from a publish target's `tokenEnv` (env only; never stored). */
export function resolveToken(publish: PublishTarget | undefined): string | undefined {
  if (!publish?.tokenEnv) return undefined;
  const token = process.env[publish.tokenEnv];
  if (!token) console.warn(`Warning: publish.tokenEnv "${publish.tokenEnv}" is not set in the environment.`);
  return token;
}

/** `opensdk publish` — publish one or every declared language's generated SDK. */
export async function publishCommand(opts: PublishCommandOptions): Promise<void> {
  const { config } = opts;
  const langs = opts.lang
    ? [resolveLanguage(opts.lang)]
    : Object.keys(config?.emitterOptions ?? config?.targets ?? {});
  if (!langs.length) {
    throw new Error('No languages to publish. Pass --lang, or declare language sections in sdk.json.');
  }
  for (const lang of langs) {
    const target = config?.targets?.[lang];
    const publish = mergePublishTargets(config?.publish, target?.publish);
    const dir = opts.lang ? opts.output : (target?.output ?? path.join(opts.output, lang));
    console.log(`Publishing ${lang} from ${dir}${opts.dryRun ? ' (dry-run)' : ''}...`);
    publishTarget(lang, dir, {
      registry: opts.registry ?? publish?.registry,
      token: resolveToken(publish),
      version: publish?.version,
      dryRun: opts.dryRun,
    });
  }
}
