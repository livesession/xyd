import { registerEmitter } from '@xyd-js/opensdk-framework';

import type { OpensdkCliConfig } from './config-loader';

/** Register everything a config's plugin bundle ships (mirrors oagen's plugin-loader). */
export function applyConfig(config: OpensdkCliConfig): void {
  for (const emitter of config.emitters ?? []) {
    registerEmitter(emitter);
  }
}
