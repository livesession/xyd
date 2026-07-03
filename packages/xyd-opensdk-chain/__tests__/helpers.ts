import { openapi2opensdkFromSource } from '@xyd-js/openapi2opensdk';
import { dotnetEmitter } from '@xyd-js/opensdk-dotnet';
import { generateFileMap, getEmitter, registerEmitter, writeProject } from '@xyd-js/opensdk-framework';
import { goEmitter } from '@xyd-js/opensdk-go';
import { javaEmitter } from '@xyd-js/opensdk-java';
import { nodeEmitter } from '@xyd-js/opensdk-node';
import { pythonEmitter } from '@xyd-js/opensdk-python';
import { rubyEmitter } from '@xyd-js/opensdk-ruby';

import { runChain } from '../index';
import type { GenerateTargetOptions } from '../index';

// Chain's runChain injects generate + publish so the package itself stays free of a
// converter/emitter dependency. Its TESTS, however, compose the real primitives (via
// devDeps on the converter + emitters) to exercise the full pipeline — the same
// generation the CLI's `generateCommand` performs (loadIR → generateFileMap →
// writeProject; publish identity is a no-op when no `publish` is set).

let registered = false;
export function registerEmitters(): void {
  if (registered) return;
  for (const e of [goEmitter, pythonEmitter, nodeEmitter, rubyEmitter, javaEmitter, dotnetEmitter]) registerEmitter(e);
  registered = true;
}

/** Generate one SDK: convert the (processed) spec then emit + write it. */
async function testGenerate(opts: GenerateTargetOptions): Promise<void> {
  const ir = await openapi2opensdkFromSource(opts.spec, {
    sdkName: opts.sdkName,
    mountRules: opts.mountRules,
    operationHints: opts.operationHints,
    sdkBehavior: opts.sdk,
  });
  const files = generateFileMap(ir, getEmitter(opts.lang), opts.emitterOptions ?? {});
  await writeProject(files, opts.output);
}

function testPublish(): void {
  throw new Error('publishTarget is not wired in chain fixture tests (they are generate-only)');
}

/** Run a chain (generate-only) with the composed real generator. */
export function runFixtureChain(chain: string, cwd: string, opts: { target?: string; source?: string } = {}) {
  registerEmitters();
  return runChain({ chain, cwd, ...opts, generate: testGenerate, publishTarget: testPublish });
}
