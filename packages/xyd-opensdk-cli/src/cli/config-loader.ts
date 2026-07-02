import { existsSync } from 'node:fs';
import * as path from 'node:path';
import { pathToFileURL } from 'node:url';

import type { OperationHint } from '@xyd-js/openapi2opensdk';
import type { DeepPartial, SdkBehavior } from '@xyd-js/opensdk-core';
import type { Emitter } from '@xyd-js/opensdk-framework';

/** The `opensdk.config.*` shape a consumer project exports (oagen-style plugin bundle). */
export interface OpensdkCliConfig {
  /** Extra emitter plugins to register (may override the built-in go/python). */
  emitters?: Emitter[];
  /** Language-specific emitter options; only the active language's bag is passed on generate. */
  emitterOptions?: Record<string, Record<string, unknown>>;
  /** Default SDK name passed to the converter (overridable per command with --sdk-name). */
  sdkName?: string;
  /**
   * Resource-level mount rules for grouping not present in the spec paths
   * (Stainless-style `{ assistants: 'beta/assistants' }`). A `--grouping`
   * file overrides these.
   */
  mountRules?: Record<string, string>;
  /**
   * Per-operation mount/action overrides keyed by `"METHOD /path"`
   * (e.g. `{ 'POST /assistants': { mountOn: 'beta/assistants' } }`).
   * A `--grouping` file overrides these.
   */
  operationHints?: Record<string, OperationHint>;
  /**
   * Declarative runtime behavior of the generated SDKs (retry, timeout,
   * errors, user-agent, ...), deep-merged over opensdk-core's canonical
   * `defaultSdkBehavior()` — arrays replace entirely. The converter stamps the
   * merged result on the IR as `spec.sdk`, so every emitter sees it.
   */
  sdk?: DeepPartial<SdkBehavior>;
}

const CONFIG_NAMES = ['opensdk.config.ts', 'opensdk.config.js', 'opensdk.config.mjs'];

/**
 * Load an opensdk config file. With an explicit `configPath`, only that file is
 * attempted; otherwise each name in CONFIG_NAMES is tried in `cwd`.
 */
export async function loadConfig(configPath?: string, cwd: string = process.cwd()): Promise<OpensdkCliConfig | null> {
  const attempt = async (resolved: string): Promise<OpensdkCliConfig> => {
    try {
      const mod = await import(pathToFileURL(resolved).href);
      return (mod.default ?? mod) as OpensdkCliConfig;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const hint = resolved.endsWith('.ts')
        ? 'TypeScript config files require tsx or ts-node. Use .mjs instead, or run via `npx tsx`.'
        : 'Check that the config file is valid ESM.';
      throw new Error(`Failed to load ${resolved}: ${message}\n${hint}`);
    }
  };

  if (configPath) {
    const resolved = path.resolve(cwd, configPath);
    if (!existsSync(resolved)) {
      throw new Error(`Config file not found: ${resolved}. Check the path passed to --config.`);
    }
    return attempt(resolved);
  }

  for (const name of CONFIG_NAMES) {
    const resolved = path.resolve(cwd, name);
    if (existsSync(resolved)) return attempt(resolved);
  }
  return null;
}
