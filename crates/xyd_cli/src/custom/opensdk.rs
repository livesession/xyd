//! Native `opensdk` runner + `components …opensdk` install/uninstall.
//!
//! Port of `packages/xyd-cli/src/components/opensdk.ts`. The opensdk toolchain
//! (`@xyd-js/opensdk-cli`) is installed ON DEMAND into a self-contained, user-global
//! component dir (`~/.config/xyd/components/opensdk`) so the default `xyd` stays lean.
//! State (a `component.json` manifest) and payload live together there.
//!
//! One divergence from the TS CLI: that spawns Node (`process.execPath`) on the bin JS.
//! This binary is NODE-FREE, so `run()` resolves a JS runtime from PATH (or an override)
//! to execute the toolchain — see [`resolve_js_runtime`].

use std::path::{Path, PathBuf};
use std::process::Command;

use super::paths;
use super::pm;
use crate::gen::runtime::Error;

const OPENSDK_PACKAGE: &str = "@xyd-js/opensdk-cli";

fn manifest_path() -> Result<PathBuf, Error> {
    Ok(paths::opensdk_component_dir()?.join("component.json"))
}

/// The installed opensdk bin from the manifest, iff it still exists on disk.
fn resolve_opensdk_bin() -> Option<PathBuf> {
    let manifest = std::fs::read_to_string(manifest_path().ok()?).ok()?;
    let value: serde_json::Value = serde_json::from_str(&manifest).ok()?;
    let bin = value.get("binPath").and_then(serde_json::Value::as_str)?;
    let path = PathBuf::from(bin);
    path.exists().then_some(path)
}

/// Dev mode: the monorepo's built opensdk-cli, found by walking up from the binary.
fn find_monorepo_opensdk_bin() -> Option<PathBuf> {
    let exe = std::env::current_exe().ok()?;
    let mut dir = exe.parent()?.to_path_buf();
    for _ in 0..6 {
        let candidate = dir
            .join("packages")
            .join("xyd-opensdk-cli")
            .join("dist")
            .join("cli.js");
        if candidate.exists() {
            return Some(candidate);
        }
        match dir.parent() {
            Some(parent) if parent != dir => dir = parent.to_path_buf(),
            _ => break,
        }
    }
    None
}

/// `xyd components install opensdk` — idempotent install of the toolchain.
pub fn install() -> Result<(), Error> {
    if let Some(existing) = resolve_opensdk_bin() {
        println!("✓ opensdk is already installed ({})", existing.display());
        return Ok(());
    }

    let dir = paths::opensdk_component_dir()?;
    std::fs::create_dir_all(&dir)
        .map_err(|e| Error::Invalid(format!("cannot create {}: {e}", dir.display())))?;

    let bin_path: PathBuf;
    let mode: &str;
    let version: &str;

    if std::env::var_os("XYD_DEV_MODE").is_some() {
        // Dev mode: no npm — point at the monorepo build.
        match find_monorepo_opensdk_bin() {
            Some(bin) => {
                bin_path = bin;
                mode = "dev";
                version = "workspace";
            }
            None => {
                return Err(Error::Invalid(
                    "XYD_DEV_MODE is set but packages/xyd-opensdk-cli/dist/cli.js was not \
                     found — run `pnpm build` first."
                        .into(),
                ));
            }
        }
    } else {
        println!("Installing {OPENSDK_PACKAGE}...");
        // Written in the same key order as the TS CLI (name, private, dependencies).
        let package_json = format!(
            "{{\n  \"name\": \"xyd-component-opensdk\",\n  \"private\": true,\n  \
             \"dependencies\": {{\n    {}: \"latest\"\n  }}\n}}\n",
            json_string(OPENSDK_PACKAGE)
        );
        std::fs::write(dir.join("package.json"), package_json)
            .map_err(|e| Error::Invalid(format!("cannot write package.json: {e}")))?;
        pm::run_install(&dir)
            .map_err(|e| Error::Invalid(format!("Failed to install {OPENSDK_PACKAGE}: {e}")))?;
        bin_path = dir
            .join("node_modules")
            .join("@xyd-js")
            .join("opensdk-cli")
            .join("dist")
            .join("cli.js");
        mode = "published";
        version = "latest";
        if !bin_path.exists() {
            return Err(Error::Invalid(format!(
                "Install finished but the opensdk bin is missing at {}.",
                bin_path.display()
            )));
        }
    }

    write_manifest(mode, version, &bin_path)?;
    println!("✓ opensdk installed.");
    println!("Run `xyd opensdk --help` to get started.");
    Ok(())
}

/// `xyd components uninstall opensdk` — remove the component dir.
pub fn uninstall() -> Result<(), Error> {
    let dir = paths::opensdk_component_dir()?;
    if !dir.exists() {
        println!("opensdk is not installed — nothing to remove.");
        return Ok(());
    }
    std::fs::remove_dir_all(&dir)
        .map_err(|e| Error::Invalid(format!("cannot remove {}: {e}", dir.display())))?;
    println!("✓ opensdk uninstalled.");
    Ok(())
}

/// `xyd opensdk <args…>` — spawn the installed toolchain, propagating its exit code.
/// Terminal: exits the process with the child's status; returns `Err` only if the
/// toolchain couldn't be launched (no runtime resolved).
pub fn run() -> Result<(), Error> {
    let args: Vec<String> = std::env::args().skip(1).collect();
    // args[0] == "opensdk" (guaranteed by the main.rs pre-clap shim); forward the tail.
    let passthrough: Vec<&String> = args.iter().skip(1).collect();

    let bin = match resolve_opensdk_bin() {
        Some(bin) => bin,
        None => {
            eprintln!("The opensdk toolchain is not installed.");
            eprintln!("Install it with: xyd components install opensdk");
            std::process::exit(1);
        }
    };

    let runtime = resolve_js_runtime()?;
    let status = Command::new(&runtime)
        .arg(&bin)
        .args(&passthrough)
        .status()
        .map_err(|e| {
            Error::Invalid(format!(
                "Failed to run opensdk with {}: {e}",
                runtime.display()
            ))
        })?;
    std::process::exit(status.code().unwrap_or(1));
}

/// Resolve a JS runtime to execute the toolchain's `cli.js` in this node-free binary:
/// `XYD_OPENSDK_RUNTIME` / `XYD_NODE` override → `node` on PATH → `bun` on PATH → error.
fn resolve_js_runtime() -> Result<PathBuf, Error> {
    for var in ["XYD_OPENSDK_RUNTIME", "XYD_NODE"] {
        if let Ok(value) = std::env::var(var) {
            if !value.is_empty() {
                return Ok(PathBuf::from(value));
            }
        }
    }
    if let Some(node) = pm::which("node") {
        return Ok(node);
    }
    if let Some(bun) = pm::which("bun") {
        return Ok(bun);
    }
    Err(Error::Invalid(
        "opensdk needs a JavaScript runtime to run, but neither node nor bun was found on \
         PATH. Install Node.js or Bun (or set XYD_OPENSDK_RUNTIME)."
            .into(),
    ))
}

fn write_manifest(mode: &str, version: &str, bin_path: &Path) -> Result<(), Error> {
    // Same key order as the TS manifest (name, package, version, mode, binPath, installedAt).
    let manifest = format!(
        "{{\n  \"name\": \"opensdk\",\n  \"package\": {},\n  \"version\": {},\n  \
         \"mode\": {},\n  \"binPath\": {},\n  \"installedAt\": {}\n}}\n",
        json_string(OPENSDK_PACKAGE),
        json_string(version),
        json_string(mode),
        json_string(&bin_path.to_string_lossy()),
        json_string(&now_iso8601()),
    );
    std::fs::write(manifest_path()?, manifest)
        .map_err(|e| Error::Invalid(format!("cannot write manifest: {e}")))
}

/// A JSON-escaped, double-quoted string literal (for hand-assembled JSON above).
fn json_string(s: &str) -> String {
    serde_json::to_string(s).unwrap_or_else(|_| "\"\"".to_string())
}

/// Current UTC time as an ISO-8601 timestamp (`YYYY-MM-DDTHH:MM:SSZ`), zero-dep. The
/// manifest's `installedAt` is informational only (never read back), so second precision
/// (no millis) is sufficient.
fn now_iso8601() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};
    let secs = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_secs())
        .unwrap_or(0);
    let days = (secs / 86_400) as i64;
    let rem = secs % 86_400;
    let (h, mi, s) = (rem / 3600, (rem % 3600) / 60, rem % 60);
    let (y, m, d) = civil_from_days(days);
    format!("{y:04}-{m:02}-{d:02}T{h:02}:{mi:02}:{s:02}Z")
}

/// Howard Hinnant's civil-from-days: days since the Unix epoch → (year, month, day).
fn civil_from_days(z: i64) -> (i64, u32, u32) {
    let z = z + 719_468;
    let era = if z >= 0 { z } else { z - 146_096 } / 146_097;
    let doe = (z - era * 146_097) as u64; // [0, 146096]
    let yoe = (doe - doe / 1460 + doe / 36_524 - doe / 146_096) / 365; // [0, 399]
    let y = yoe as i64 + era * 400;
    let doy = doe - (365 * yoe + yoe / 4 - yoe / 100); // [0, 365]
    let mp = (5 * doy + 2) / 153; // [0, 11]
    let d = (doy - (153 * mp + 2) / 5 + 1) as u32; // [1, 31]
    let m = if mp < 10 { mp + 3 } else { mp - 9 } as u32; // [1, 12]
    (if m <= 2 { y + 1 } else { y }, m, d)
}

#[cfg(test)]
mod tests {
    use super::{civil_from_days, json_string};

    #[test]
    fn civil_from_days_known_dates() {
        assert_eq!(civil_from_days(0), (1970, 1, 1)); // Unix epoch
        assert_eq!(civil_from_days(18_993), (2022, 1, 1));
        assert_eq!(civil_from_days(19_723), (2024, 1, 1)); // leap-year boundary
    }

    #[test]
    fn json_string_escapes() {
        assert_eq!(
            json_string("@xyd-js/opensdk-cli"),
            "\"@xyd-js/opensdk-cli\""
        );
        assert_eq!(json_string("a\"b\\c"), "\"a\\\"b\\\\c\"");
    }
}
