import type { OpencliSpecJson } from '@xyd-js/opencli';

import { fish } from './fish';
import type { Shell } from './types';
import { zsh } from './zsh';

export { fish } from './fish';
export { zsh } from './zsh';
export { opencliToTree } from './tree';
export type { Shell, CompletionNode, CompletionOption } from './types';

/** Generate a completion script for the given shell from an OpenCLI document. */
export function completion(spec: OpencliSpecJson, shell: Shell): string {
  switch (shell) {
    case 'fish':
      return fish(spec);
    default:
      return zsh(spec);
  }
}
