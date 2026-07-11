import { existsSync, readFileSync } from 'node:fs';
import * as path from 'node:path';

import type { LanguageSection, SdkJson } from '@xyd-js/opensdk-core';
import { resolveLanguage } from '@xyd-js/opensdk-framework';

import type { ConfigSource } from '../source';
import type { ResolvedConfig, ResolvedTarget } from '../types';

// SdkJson / LanguageSection are defined in @xyd-js/opensdk-core (the config
// schema is language-agnostic); this adapter just loads + normalizes them.

/** Top-level keys that are NOT language sections. */
const RESERVED_KEYS = new Set(['$schema', 'version', 'api', 'spec', 'sdk', 'behavior', 'sdkName', 'grouping', 'publish']);

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/** The sdk.json (`.sdk/sdk.json`) declarative config source. */
export const sdkJsonSource: ConfigSource = {
  kind: 'sdk-json',

  detect(cwd, explicitPath) {
    if (explicitPath) {
      const resolved = path.resolve(cwd, explicitPath);
      return path.extname(resolved) === '.json' && existsSync(resolved) ? resolved : null;
    }
    for (const rel of ['sdk.json', path.join('.sdk', 'sdk.json')]) {
      const resolved = path.resolve(cwd, rel);
      if (existsSync(resolved)) return resolved;
    }
    return null;
  },

  async load(filePath) {
    try {
      return JSON.parse(readFileSync(filePath, 'utf8'));
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      throw new Error(`Failed to parse ${filePath}: ${message}`);
    }
  },

  normalize(raw, ctx): ResolvedConfig {
    const doc = raw as SdkJson;
    const emitterOptions: Record<string, Record<string, unknown>> = {};
    const targets: Record<string, ResolvedTarget> = {};

    for (const [key, value] of Object.entries(doc)) {
      if (RESERVED_KEYS.has(key) || !isPlainObject(value)) continue;
      const lang = resolveLanguage(key);
      const { output, behavior, publish, ...opts } = value as LanguageSection;
      emitterOptions[lang] = opts;
      if (output !== undefined || behavior !== undefined || publish !== undefined) {
        targets[lang] = {
          ...(output !== undefined ? { output } : {}),
          ...(behavior ? { behavior } : {}),
          ...(publish ? { publish } : {}),
        };
      }
    }

    const config: ResolvedConfig = {
      sdk: doc.behavior,
      sdkName: doc.sdkName,
      mountRules: doc.grouping?.mountRules,
      operationHints: doc.grouping?.operationHints,
      publish: doc.publish,
    };
    // A predefined spec is resolved relative to this config file so `generate`
    // works from any cwd; --spec still overrides it. `api` supersedes the legacy
    // `spec` key (kept as a fallback for old sdk.json files).
    const apiRef = doc.api ?? doc.spec;
    if (apiRef) {
      config.spec = path.isAbsolute(apiRef) ? apiRef : path.resolve(path.dirname(ctx.filePath), apiRef);
    }
    if (Object.keys(emitterOptions).length) config.emitterOptions = emitterOptions;
    if (Object.keys(targets).length) config.targets = targets;
    return config;
  },
};
