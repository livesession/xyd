import { runChain as runChainEngine } from '@xyd-js/opensdk-chain';
import type { RunChainOptions } from '@xyd-js/opensdk-chain';

import { generateCommand } from './generate';
import { publishTarget } from './publish';

/** CLI-facing `opensdk run` options: the chain engine's options minus the injected primitives. */
export type RunOptions = Omit<RunChainOptions, 'generate' | 'publishTarget'>;

/**
 * `opensdk run` wired with the CLI's generate + publish primitives. The chain
 * ENGINE (@xyd-js/opensdk-chain) owns the source/target orchestration; the CLI
 * injects `generateCommand`/`publishTarget` so there is a single implementation of
 * each (shared with the `generate`/`publish` commands).
 */
export function runChain(opts: RunOptions): Promise<void> {
  return runChainEngine({ ...opts, generate: generateCommand, publishTarget });
}
