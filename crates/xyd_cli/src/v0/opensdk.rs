//! Native `opensdk` runner + `components …opensdk` install/uninstall.
//!
//! The opensdk toolchain is installed ON DEMAND into a self-contained, user-global
//! component dir (`~/.config/xyd/components/opensdk`) so the default `xyd` stays lean.
//! State (a `component.json` manifest) and payload live together there.
//!
//! # Two payload kinds
//!
//! The toolchain is now a Rust binary (`crates/xyd_opensdk_cli`, ~5.6 MB, node-free),
//! published as an `opensdk-<triple>` GitHub release asset next to `xyd-<triple>`.
//! [`install`] downloads that. Until a release carrying those assets exists, it falls
//! back to the LEGACY npm payload (`@xyd-js/opensdk-cli`, a `cli.js` needing a JS
//! runtime) so the command keeps working mid-rollout.
//!
//! [`run`] tells them apart by extension — a `.js` bin is spawned under a resolved JS
//! runtime, anything else is executed directly. Inferring rather than reading a manifest
//! field keeps both CLIs interoperable: the TS CLI writes no `kind`, and it only ever
//! reads `binPath`.
//!
//! REMOVE THE FALLBACK (and [`resolve_js_runtime`], and the `pm` import) once a release
//! ships the assets — that is what unblocks deleting the TypeScript toolchain.

use std::path::{Path, PathBuf};
use std::process::Command;

use super::paths;
use super::pm;
use crate::opencli::runtime::Error;

const OPENSDK_PACKAGE: &str = "@xyd-js/opensdk-cli";

/// Release assets live beside the `xyd-<triple>` ones — see
/// `.github/workflows/build-native-binaries.yml`.
const OPENSDK_ASSET_BASE: &str = "https://github.com/livesession/xyd/releases/latest/download";

/// The `opensdk-<triple>` asset for the host, or `None` on a platform whose binary is
/// not built yet (darwin-x64, windows — `compile.ts` supports them; no matrix leg yet).
fn target_triple() -> Option<&'static str> {
    match (std::env::consts::OS, std::env::consts::ARCH) {
        ("linux", "x86_64") => Some("linux-x64"),
        ("linux", "aarch64") => Some("linux-arm64"),
        ("macos", "aarch64") => Some("darwin-arm64"),
        _ => None,
    }
}

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

/// Dev mode: the monorepo's built opensdk, found by walking up from this binary.
///
/// Prefers the native `crates/target/{release,debug}/opensdk` (what ships) and falls
/// back to the legacy `packages/xyd-opensdk-cli/dist/cli.js`, so a dev tree that has
/// only run `pnpm build` still resolves.
fn find_monorepo_opensdk_bin() -> Option<PathBuf> {
    let exe = std::env::current_exe().ok()?;
    let mut dir = exe.parent()?.to_path_buf();
    for _ in 0..6 {
        let candidates = [
            dir.join("crates")
                .join("target")
                .join("release")
                .join("opensdk"),
            dir.join("crates")
                .join("target")
                .join("debug")
                .join("opensdk"),
            dir.join("packages")
                .join("xyd-opensdk-cli")
                .join("dist")
                .join("cli.js"),
        ];
        if let Some(found) = candidates.into_iter().find(|c| c.exists()) {
            return Some(found);
        }
        match dir.parent() {
            Some(parent) if parent != dir => dir = parent.to_path_buf(),
            _ => break,
        }
    }
    None
}

/// Download the `opensdk-<triple>` release asset to `dest` and mark it executable.
///
/// Returns `Ok(false)` when the asset simply isn't published yet (404) — the caller
/// then takes the legacy npm path. Any other failure (network, IO, unexpected status)
/// is a hard error: silently falling back would hide a real outage behind a slower,
/// node-requiring install.
async fn download_opensdk_binary(url: &str, dest: &Path) -> Result<bool, Error> {
    let response = reqwest::get(url)
        .await
        .map_err(|e| Error::Invalid(format!("cannot reach {url}: {e}")))?;

    if response.status() == reqwest::StatusCode::NOT_FOUND {
        return Ok(false);
    }
    if !response.status().is_success() {
        return Err(Error::Invalid(format!(
            "downloading {url} failed with HTTP {}",
            response.status()
        )));
    }

    let bytes = response
        .bytes()
        .await
        .map_err(|e| Error::Invalid(format!("cannot read {url}: {e}")))?;
    std::fs::write(dest, &bytes)
        .map_err(|e| Error::Invalid(format!("cannot write {}: {e}", dest.display())))?;

    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        std::fs::set_permissions(dest, std::fs::Permissions::from_mode(0o755))
            .map_err(|e| Error::Invalid(format!("cannot chmod {}: {e}", dest.display())))?;
    }
    Ok(true)
}

/// Try the native payload: download `opensdk-<triple>` into `dir`.
///
/// `Ok(None)` means "not available for this host" — either an unbuilt platform or an
/// asset that isn't published yet — and the caller should take the legacy npm path.
/// `XYD_OPENSDK_URL` overrides the asset URL (canary channel, local testing, mirrors).
async fn install_native(dir: &Path) -> Result<Option<PathBuf>, Error> {
    let url = match std::env::var("XYD_OPENSDK_URL") {
        Ok(value) if !value.is_empty() => value,
        _ => match target_triple() {
            Some(triple) => format!("{OPENSDK_ASSET_BASE}/opensdk-{triple}"),
            // Unbuilt platform: fall through to npm rather than erroring, so those
            // users keep a working toolchain.
            None => return Ok(None),
        },
    };

    println!("Downloading opensdk ({url})...");
    let dest = dir.join("opensdk");
    if download_opensdk_binary(&url, &dest).await? {
        Ok(Some(dest))
    } else {
        Ok(None)
    }
}

/// `xyd components install opensdk` — idempotent install of the toolchain.
pub async fn install() -> Result<(), Error> {
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
        // Dev mode: no download, no npm — point at the monorepo build.
        match find_monorepo_opensdk_bin() {
            Some(bin) => {
                bin_path = bin;
                mode = "dev";
                version = "workspace";
            }
            None => {
                return Err(Error::Invalid(
                    "XYD_DEV_MODE is set but no opensdk build was found — run \
                     `cargo build -p xyd_opensdk_cli --bin opensdk` (or `pnpm build` for \
                     the legacy JS toolchain) first."
                        .into(),
                ));
            }
        }
    } else if let Some(native) = install_native(&dir).await? {
        bin_path = native;
        mode = "native";
        version = "latest";
    } else {
        // LEGACY: no `opensdk-<triple>` asset published yet. Delete this branch once
        // a release ships them — see the module docs.
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

    let status = if needs_js_runtime(&bin) {
        let runtime = resolve_js_runtime()?;
        Command::new(&runtime)
            .arg(&bin)
            .args(&passthrough)
            .status()
            .map_err(|e| {
                Error::Invalid(format!(
                    "Failed to run opensdk with {}: {e}",
                    runtime.display()
                ))
            })?
    } else {
        Command::new(&bin)
            .args(&passthrough)
            .status()
            .map_err(|e| Error::Invalid(format!("Failed to run {}: {e}", bin.display())))?
    };
    std::process::exit(status.code().unwrap_or(1));
}

/// Whether a payload is the LEGACY npm toolchain (a `cli.js` needing a JS runtime)
/// rather than the native binary.
///
/// Inferred from the extension, not a manifest field, so the Rust and TS CLIs stay
/// interoperable across an install written by either — the TS CLI writes no `kind` and
/// only ever reads `binPath`.
fn needs_js_runtime(bin: &Path) -> bool {
    bin.extension().is_some_and(|e| e == "js")
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
    use super::{civil_from_days, json_string, needs_js_runtime, target_triple};
    use std::path::Path;

    #[test]
    fn js_payloads_need_a_runtime_native_ones_do_not() {
        // LEGACY npm payload.
        assert!(needs_js_runtime(Path::new("/c/opensdk/cli.js")));
        // Native binary — extensionless, which is how the release asset lands.
        assert!(!needs_js_runtime(Path::new("/c/opensdk/opensdk")));
        assert!(!needs_js_runtime(Path::new(
            "/repo/crates/target/release/opensdk"
        )));
        // A dir named like the asset must not be mistaken for JS.
        assert!(!needs_js_runtime(Path::new("/c/opensdk-darwin-arm64")));
    }

    /// The host must map to a built asset — these are exactly the three triples in
    /// `build-native-binaries.yml`. Guards against the matrix and this table drifting:
    /// a mismatch means `install` silently takes the npm path on a supported platform.
    #[test]
    fn host_triple_matches_a_release_asset() {
        let triple = target_triple();
        if cfg!(all(
            any(target_os = "linux", target_os = "macos"),
            any(target_arch = "x86_64", target_arch = "aarch64")
        )) && !cfg!(all(target_os = "macos", target_arch = "x86_64"))
        {
            let triple = triple.expect("a built platform must resolve a triple");
            assert!(
                ["linux-x64", "linux-arm64", "darwin-arm64"].contains(&triple),
                "unexpected triple {triple}"
            );
        }
    }

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
