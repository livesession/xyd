import type { OpensdkSpecJson } from '@xyd-js/opensdk-core';
import { generate } from '@xyd-js/opensdk-framework';

import { goEmitter } from './emitter';
import type { OpensdkGoOptions } from './types';

/**
 * Generate a buildable, openai-go-shaped Go SDK from an OpenSDK IR.
 * Back-compat wrapper: drives the `goEmitter` plugin through the framework
 * orchestrator. Pure: returns a virtual file map `{ relativePath: contents }`.
 */
export function opensdkGo(spec: OpensdkSpecJson, options: OpensdkGoOptions = {}): Record<string, string> {
  return generate(spec, goEmitter, options as Record<string, unknown>);
}
