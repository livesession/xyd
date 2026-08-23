//! Framework detection + dispatch (port of `migration.ts`). Scans the docs root
//! (non-recursive) for a framework-config file. Only Mintlify is implemented; the TS
//! Docusaurus/Nextra/VitePress detectors always return false (throwing migrators), so
//! they are dropped here — behavior-preserving.

use std::path::Path;

use super::mintlify;
use crate::gen::runtime::Error;

/// Detect the docs framework in `docs_path` and run its migration.
pub async fn run(docs_path: &Path) -> Result<(), Error> {
    println!("Detecting framework in repository...");

    let entries = match std::fs::read_dir(docs_path) {
        Ok(entries) => entries,
        Err(e) => {
            eprintln!("Error detecting framework: {e}");
            return Ok(());
        }
    };

    for entry in entries.flatten() {
        if !entry.file_type().map(|t| t.is_file()).unwrap_or(false) {
            continue;
        }
        let name = entry.file_name().to_string_lossy().to_lowercase();
        if mintlify::is_mintlify(docs_path, &name) {
            return mintlify::migrate(docs_path);
        }
    }

    println!("❌ No supported documentation framework detected in root directory");
    println!("📋 Supported frameworks: Mintlify, Nextra, Docusaurus, VuePress");
    Ok(())
}
