//! Hand-owned (protected by .sdkignore): package-manager detection + install shell-out.
//!
//! Port of documan's `pmInstall()` / `nodeInstallPackages()`
//! (`packages/xyd-documan/src/utils.ts`). Used by the native `opensdk` install to fetch
//! `@xyd-js/opensdk-cli` into its component dir. Detection order: `XYD_NODE_PM` override
//! → project lockfile (cwd) → running-pm env sniff → bun-if-available → npm.

use std::path::{Path, PathBuf};
use std::process::Command;

use crate::gen::runtime::Error;

/// Detect the package manager program (`npm` / `pnpm` / `bun`) to install with.
pub fn detect_pm() -> &'static str {
    // 1. Explicit override always wins.
    if let Ok(pm) = std::env::var("XYD_NODE_PM") {
        return match pm.as_str() {
            "npm" => "npm",
            "pnpm" => "pnpm",
            "bun" => "bun",
            other => {
                eprintln!("Unknown package manager: {other}, falling back to npm");
                "npm"
            }
        };
    }

    // 2. Respect the project's existing lockfile so we don't introduce a second
    //    package manager mid-tree.
    if let Some(pm) = pick_by_lockfile() {
        return pm;
    }

    // 3. Respect the package manager that invoked the current process.
    let (pnpm, bun) = running_pm();
    if pnpm {
        return "pnpm";
    }
    if bun {
        return "bun";
    }

    // 4. Greenfield — prefer bun for speed if available.
    if which("bun").is_some() {
        return "bun";
    }

    println!("ℹ️ consider install `bun` for better performance \n");
    "npm"
}

/// Run `<pm> install` in `dir`, mirroring `nodeInstallPackages`: blank `NODE_ENV`
/// (so `production` doesn't skip the install), optional registry override, and quiet
/// output unless `XYD_VERBOSE` is set. Returns `Err` on spawn failure or non-zero exit.
pub fn run_install(dir: &Path) -> Result<(), Error> {
    let pm = detect_pm();
    let mut cmd = Command::new(pm);
    cmd.arg("install").current_dir(dir).env("NODE_ENV", "");
    if let Some(registry) = custom_registry() {
        cmd.env("npm_config_registry", registry);
    }

    let spawn_err = |e: std::io::Error| {
        Error::Invalid(format!(
            "cannot run `{pm}`: {e} (is it installed / on PATH?)"
        ))
    };

    if std::env::var_os("XYD_VERBOSE").is_some() {
        let status = cmd.status().map_err(spawn_err)?;
        return exit_result(pm, dir, status.success(), status.code(), None);
    }

    let output = cmd.output().map_err(spawn_err)?;
    let tail = String::from_utf8_lossy(&output.stderr)
        .lines()
        .last()
        .map(str::to_string);
    exit_result(pm, dir, output.status.success(), output.status.code(), tail)
}

fn exit_result(
    pm: &str,
    dir: &Path,
    success: bool,
    code: Option<i32>,
    stderr_tail: Option<String>,
) -> Result<(), Error> {
    if success {
        return Ok(());
    }
    let mut msg = format!("`{pm} install` failed in {}", dir.display());
    if let Some(code) = code {
        msg.push_str(&format!(" (exit {code})"));
    }
    match stderr_tail {
        Some(tail) if !tail.trim().is_empty() => msg.push_str(&format!(": {}", tail.trim())),
        _ => msg.push_str(" — re-run with XYD_VERBOSE=1 for full output"),
    }
    Err(Error::Invalid(msg))
}

fn custom_registry() -> Option<String> {
    for var in ["XYD_NPM_REGISTRY", "npm_config_registry"] {
        if let Ok(v) = std::env::var(var) {
            if !v.is_empty() {
                return Some(v);
            }
        }
    }
    None
}

fn pick_by_lockfile() -> Option<&'static str> {
    let cwd = std::env::current_dir().ok()?;
    if cwd.join("pnpm-lock.yaml").exists() {
        return Some("pnpm");
    }
    if cwd.join("bun.lock").exists() || cwd.join("bun.lockb").exists() {
        return Some("bun");
    }
    if cwd.join("yarn.lock").exists() {
        // No yarn install path; stop lockfile detection and fall through to env sniff.
        return None;
    }
    if cwd.join("package-lock.json").exists() {
        return Some("npm");
    }
    None
}

/// Detect the package manager that invoked this process from env. The TS also inspects
/// `process.execPath` / `argv[1]` for "bun"; in this native binary `current_exe()` is
/// `xyd` and argv is a command, so that path is effectively inert — kept faithful.
fn running_pm() -> (bool, bool) {
    let mut pnpm = false;
    let mut bun = false;
    if let Ok(execpath) = std::env::var("npm_execpath") {
        if execpath.contains("pnpm") {
            pnpm = true;
        } else if execpath.contains("bun") {
            bun = true;
        }
    }
    if let Ok(node_path) = std::env::var("NODE_PATH") {
        if node_path.contains(".pnpm") {
            pnpm = true;
        } else if node_path.contains(".bun") {
            bun = true;
        }
    }
    if let Ok(exe) = std::env::current_exe() {
        if exe.to_string_lossy().contains("bun") {
            bun = true;
        }
    }
    (pnpm, bun)
}

/// First executable named `name` found on `PATH`, or `None`.
pub fn which(name: &str) -> Option<PathBuf> {
    let path_var = std::env::var_os("PATH")?;
    for dir in std::env::split_paths(&path_var) {
        let candidate = dir.join(name);
        if is_executable(&candidate) {
            return Some(candidate);
        }
    }
    None
}

#[cfg(unix)]
fn is_executable(path: &Path) -> bool {
    use std::os::unix::fs::PermissionsExt;
    std::fs::metadata(path)
        .map(|m| m.is_file() && m.permissions().mode() & 0o111 != 0)
        .unwrap_or(false)
}

#[cfg(not(unix))]
fn is_executable(path: &Path) -> bool {
    path.is_file()
}
