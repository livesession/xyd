import { existsSync } from 'node:fs';
import * as path from 'node:path';
import { pathToFileURL } from 'node:url';

import type { DeepPartial, OperationHint, PublishTarget, SdkBehavior } from '@xyd-js/opensdk-core';
import type { Emitter } from '@xyd-js/opensdk-framework';

/** The `opensdk.config.*` shape a consumer project exports (oagen-style plugin bundle). */
export interface OpensdkCliConfig {
  /** Extra emitter plugins to register (may override the built-in go/python). */
  emitters?: Emitter[];
  /**
   * Language-specific emitter options; only the active language's bag is passed
   * on generate (e.g. `{ go: { modulePath }, python: { packageName } }`).
   *
   * Reserved key — `tests`: emitters ship a self-test suite by default; set
   * `emitterOptions.<lang>.tests: false` to opt that language's generated SDK
   * out of the emitted tests (the same effect as the `generate --no-tests`
   * flag, which threads `{ tests: false }` onto this bag for the active
   * language). Emitters emit their test suite unless `tests` is `false`.
   */
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
  /**
   * Publish targets: package identity (author/license/repository/homepage/
   * version) threaded onto the IR before emit, plus per-registry mechanics
   * (registry/tokenEnv/packageName) consumed by `opensdk publish`. This is the
   * global default; a per-language `emitterOptions.<lang>` bundle can't carry it
   * (use a sdk.json language section's `publish` for per-language overrides).
   */
  publish?: PublishTarget;
}

/** The `opensdk.config.*` filenames tried (in order) when no explicit path is given. */
export const CONFIG_NAMES = ['opensdk.config.ts', 'opensdk.config.js', 'opensdk.config.mjs'];

/** Dynamic-import one resolved config file into an `OpensdkCliConfig` (with a helpful error). */
export async function loadConfigFile(resolved: string): Promise<OpensdkCliConfig> {
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
}

/**
 * Load an opensdk config file. With an explicit `configPath`, only that file is
 * attempted; otherwise each name in CONFIG_NAMES is tried in `cwd`.
 * (Back-compat entry; the config-source registry wraps this — see config/.)
 */
export async function loadConfig(configPath?: string, cwd: string = process.cwd()): Promise<OpensdkCliConfig | null> {
  if (configPath) {
    const resolved = path.resolve(cwd, configPath);
    if (!existsSync(resolved)) {
      throw new Error(`Config file not found: ${resolved}. Check the path passed to --config.`);
    }
    return loadConfigFile(resolved);
  }

  for (const name of CONFIG_NAMES) {
    const resolved = path.resolve(cwd, name);
    if (existsSync(resolved)) return loadConfigFile(resolved);
  }
  return null;
}
