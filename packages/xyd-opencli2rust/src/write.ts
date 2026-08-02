// The framework's full regen lifecycle (per-file writeMode, `.sdk/sdk.lock`
// manifest, guarded stale-prune, `.sdkignore` user-owned protection, and opt-in
// `{ merge: true }` 3-way merge of hand-edits) — with this generator's identity.

import {
  writeProject as frameworkWriteProject,
  type ProjectFileMap,
  type WriteProjectOptions,
  type WriteProjectResult,
} from '@xyd-js/opensdk-framework';

export async function writeProject(
  files: ProjectFileMap,
  outDir: string,
  options: WriteProjectOptions = {},
): Promise<WriteProjectResult> {
  return frameworkWriteProject(files, outDir, { generator: 'opencli2rust', ...options });
}
