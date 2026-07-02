import type { ResolvedConfig } from './types';
import { opensdkConfigSource } from './sources/opensdk-config';
import { sdkJsonSource } from './sources/sdk-json';

/**
 * A config schema adapter. The CLI stays open to multiple config schemas
 * (sdk.json today; a future chain.json / publish profiles) by treating each as
 * a ConfigSource that detects its file, loads it, and normalizes it to the
 * common `ResolvedConfig`. New schemas are just another entry in `configSources`.
 */
export interface ConfigSource {
  /** Stable id ('sdk-json' | 'opensdk-config' | ...). */
  kind: string;
  /**
   * Return the resolved file path this source owns for the given cwd, or null.
   * With an explicit `--config` path, a source claims it iff it recognizes the
   * file (typically by extension). Without one, it searches conventional names.
   */
  detect(cwd: string, explicitPath?: string): string | null;
  /** Read + parse the file into its raw schema object. */
  load(filePath: string): Promise<unknown>;
  /** Normalize the raw schema into the common ResolvedConfig. */
  normalize(raw: unknown, ctx: { filePath: string; cwd: string }): ResolvedConfig | Promise<ResolvedConfig>;
}

/**
 * Config sources in PRECEDENCE order — the first whose `detect` matches wins.
 * sdk.json (declarative) is preferred over opensdk.config.* (JS plugin bundle).
 */
export const configSources: ConfigSource[] = [sdkJsonSource, opensdkConfigSource];

/**
 * Resolve the effective config for a cwd. With `explicitPath` (from --config),
 * the owning source is chosen by extension; otherwise sources are tried in
 * order. Returns null when no config is present (and no explicit path was given).
 */
export async function resolveConfig(
  cwd: string = process.cwd(),
  explicitPath?: string,
): Promise<ResolvedConfig | null> {
  for (const source of configSources) {
    const filePath = source.detect(cwd, explicitPath);
    if (!filePath) continue;
    const raw = await source.load(filePath);
    const resolved = await source.normalize(raw, { filePath, cwd });
    return { ...resolved, source: { kind: source.kind, filePath } };
  }
  if (explicitPath) {
    throw new Error(
      `Unsupported config file: ${explicitPath}. Expected sdk.json or opensdk.config.{ts,js,mjs}.`,
    );
  }
  return null;
}
