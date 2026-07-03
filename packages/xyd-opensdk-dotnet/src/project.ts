import type { OpensdkSpecJson } from '@xyd-js/opensdk-core';
import { generate } from '@xyd-js/opensdk-framework';

import { dotnetEmitter } from './emitter';
import type { OpensdkDotnetOptions } from './types';

/**
 * Generate a buildable, openai-dotnet-shaped C# SDK from an OpenSDK IR.
 * Back-compat wrapper: drives the `dotnetEmitter` plugin through the framework
 * orchestrator. Pure: returns a virtual file map `{ relativePath: contents }`.
 */
export function opensdkDotnet(spec: OpensdkSpecJson, options: OpensdkDotnetOptions = {}): Record<string, string> {
  return generate(spec, dotnetEmitter, options as Record<string, unknown>);
}
