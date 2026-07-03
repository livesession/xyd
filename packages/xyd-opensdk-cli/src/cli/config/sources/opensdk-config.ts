import { existsSync } from 'node:fs';
import * as path from 'node:path';

import { CONFIG_NAMES, type OpensdkCliConfig, loadConfigFile } from '../../config-loader';
import type { ConfigSource } from '../source';
import type { ResolvedConfig } from '../types';

const CONFIG_EXTS = ['.ts', '.js', '.mjs'];

/**
 * The JS/TS plugin-bundle config source (`opensdk.config.{ts,js,mjs}`). It can
 * ship custom emitters (which a declarative sdk.json cannot), so it stays
 * supported; it has no per-language output/behavior targets yet.
 */
export const opensdkConfigSource: ConfigSource = {
  kind: 'opensdk-config',

  detect(cwd, explicitPath) {
    if (explicitPath) {
      const resolved = path.resolve(cwd, explicitPath);
      return CONFIG_EXTS.includes(path.extname(resolved)) ? resolved : null;
    }
    for (const name of CONFIG_NAMES) {
      const resolved = path.resolve(cwd, name);
      if (existsSync(resolved)) return resolved;
    }
    return null;
  },

  async load(filePath) {
    return loadConfigFile(filePath);
  },

  normalize(raw): ResolvedConfig {
    const config = raw as OpensdkCliConfig;
    return {
      emitters: config.emitters,
      emitterOptions: config.emitterOptions,
      sdkName: config.sdkName,
      mountRules: config.mountRules,
      operationHints: config.operationHints,
      sdk: config.sdk,
      publish: config.publish,
    };
  },
};
