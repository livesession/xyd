//! `src/cli/write-report.ts` — report a `write_project` outcome: the file count
//! plus the never-silent buckets (merges, conflicts, kept files). Shared by the
//! SDK emit path and the CLI-target path.

use xyd_opensdk_framework::WriteProjectResult;

pub fn report_write_result(file_count: usize, output: &str, result: &WriteProjectResult) {
    println!("Generated {file_count} files in {output}");
    // Merge outcomes (--merge): clean 3-way merges + conflicts to resolve.
    for rel in &result.merged {
        println!("  ✓ merged your edits into {rel}");
    }
    for rel in &result.merge_conflicts {
        eprintln!("  ⚠ merge conflict in {rel} — resolve the <<<<<<< markers");
    }
    // .sdkignore conflicts + kept-modified orphans: never silently overwritten.
    for rel in &result.conflicts {
        eprintln!("  ⚠ .sdkignore: kept your {rel} — generated output differs (not overwritten)");
    }
    for rel in &result.kept_modified {
        eprintln!("  ⚠ kept locally-modified {rel} — no longer generated, not pruned");
    }
}
