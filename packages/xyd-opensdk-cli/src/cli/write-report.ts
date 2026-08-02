import type { WriteProjectResult } from '@xyd-js/opensdk-framework';

/**
 * Report a writeProject outcome: file count + the never-silent buckets (merges,
 * conflicts, kept files). Shared by the SDK emit path and the CLI-target path.
 */
export function reportWriteResult(fileCount: number, output: string, result: WriteProjectResult): void {
  console.log(`Generated ${fileCount} files in ${output}`);
  // Merge outcomes (--merge): clean 3-way merges + conflicts to resolve.
  for (const rel of result.merged) {
    console.log(`  ✓ merged your edits into ${rel}`);
  }
  for (const rel of result.mergeConflicts) {
    console.warn(`  ⚠ merge conflict in ${rel} — resolve the <<<<<<< markers`);
  }
  // .sdkignore conflicts + kept-modified orphans: never silently overwritten/lost.
  for (const rel of result.conflicts) {
    console.warn(`  ⚠ .sdkignore: kept your ${rel} — generated output differs (not overwritten)`);
  }
  for (const rel of result.keptModified) {
    console.warn(`  ⚠ kept locally-modified ${rel} — no longer generated, not pruned`);
  }
}
