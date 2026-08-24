//! Local-path resolution + directory cleaning for `migrateme` (the non-GitHub half of
//! `utils.ts`). Path resolution mirrors `resolveResourcePath`; `clean_directory` mirrors
//! `cleanDirectory` (remove each entry, keep the dir itself).

use std::path::{Path, PathBuf};

use crate::v0::paths;

/// Resolve a docs-source path: `.`/`./` → cwd, `~/…` → under `$HOME`, absolute → as-is,
/// otherwise relative to cwd.
pub fn resolve_resource_path(resource: &str) -> PathBuf {
    if resource == "." || resource == "./" {
        return current_dir();
    }
    if let Some(rest) = resource.strip_prefix("~/") {
        if let Ok(home) = paths::home_dir() {
            return home.join(rest);
        }
    }
    let path = PathBuf::from(resource);
    if path.is_absolute() {
        return path;
    }
    current_dir().join(resource)
}

/// Remove every entry inside `dir` (files and subdirectories) but keep `dir` itself.
pub fn clean_directory(dir: &Path) {
    println!("Cleaning folder before processing...");
    match std::fs::read_dir(dir) {
        Ok(entries) => {
            for entry in entries.flatten() {
                let path = entry.path();
                let _ = if path.is_dir() {
                    std::fs::remove_dir_all(&path)
                } else {
                    std::fs::remove_file(&path)
                };
            }
            println!("Directory cleaned successfully");
        }
        Err(e) => println!("Warning: Could not clean directory: {e}"),
    }
}

fn current_dir() -> PathBuf {
    std::env::current_dir().unwrap_or_else(|_| PathBuf::from("."))
}
