//! Hand-owned (protected by .sdkignore): shared filesystem-path helpers for native
//! commands. `$HOME` is resolved the same way `engine.rs` resolves its cache dir —
//! from the `HOME` env var, erroring (never panicking) when it is unset.

use std::path::PathBuf;

use crate::gen::runtime::Error;

/// The user's home directory from `$HOME`. Errors when it is unset or empty, flowing
/// through the standard `CliOverrides::print_error` path rather than panicking.
pub fn home_dir() -> Result<PathBuf, Error> {
    match std::env::var("HOME") {
        Ok(home) if !home.is_empty() => Ok(PathBuf::from(home)),
        _ => Err(Error::Invalid(
            "cannot resolve home directory: set HOME".into(),
        )),
    }
}

/// CLI-global components dir: `XYD_COMPONENTS_DIR` override, else
/// `~/.config/xyd/components` (mirrors `componentsBaseDir()` in the TS CLI). This is a
/// user-global home so components survive CLI upgrades and stay permission-safe under
/// root-owned npm prefixes.
pub fn components_base_dir() -> Result<PathBuf, Error> {
    if let Ok(dir) = std::env::var("XYD_COMPONENTS_DIR") {
        if !dir.is_empty() {
            return Ok(PathBuf::from(dir));
        }
    }
    Ok(home_dir()?.join(".config").join("xyd").join("components"))
}

/// The opensdk component dir (`<components base>/opensdk`).
pub fn opensdk_component_dir() -> Result<PathBuf, Error> {
    Ok(components_base_dir()?.join("opensdk"))
}
