//! Port of `@xyd-js/opensdk-framework`'s `src/exec.ts` — the shared publish
//! plumbing (`EmitterPublishOptions`, `runCommand`, `commandOutput`,
//! `firstFile`).
//!
//! It lives HERE rather than in `xyd_opensdk_framework` because that crate is
//! the pure write/merge lifecycle and is linked into the `@xyd-js/native`
//! cdylib; a `std::process::Command` dependency does not belong there. The
//! TypeScript keeps it in the framework only because the publish e2e imports it
//! — a constraint this port does not have.

use std::path::Path;
use std::process::{Command, Stdio};

use crate::error::{Error, Result};

/// Options every per-language publisher accepts.
#[derive(Debug, Clone, Default)]
pub struct EmitterPublishOptions {
    /// Registry URL, or a folder/file feed path.
    pub registry: Option<String>,
    /// Auth token (resolved from the config's `tokenEnv` by the caller).
    pub token: Option<String>,
    /// Version for registries with no manifest version (the Go git tag).
    pub version: Option<String>,
    /// Dist-tag for registries that support one (npm).
    pub tag: Option<String>,
    /// Package only (pack/build), never push.
    pub dry_run: bool,
}

/// Run a child synchronously (cwd + inherited stdio). Errors on non-zero unless
/// `tolerant`. Returns the exit status.
pub fn run_command(
    cmd: &str,
    args: &[&str],
    cwd: &Path,
    env: &[(&str, String)],
    tolerant: bool,
) -> Result<i32> {
    let mut command = Command::new(cmd);
    command.args(args).current_dir(cwd);
    for (k, v) in env {
        command.env(k, v);
    }
    let status = command
        .status()
        .map_err(|e| Error::msg(format!("{cmd} failed to start: {e}")))?;
    // `res.status ?? 1` — a signal-killed child reports 1 in the TS.
    let code = status.code().unwrap_or(1);
    if code != 0 && !tolerant {
        return Err(Error::msg(format!(
            "{cmd} {} exited with {code} (cwd {})",
            args.join(" "),
            cwd.display()
        )));
    }
    Ok(code)
}

/// Capture a child's stdout (never fails); `""` on failure.
pub fn command_output(cmd: &str, args: &[&str], cwd: &Path) -> String {
    Command::new(cmd)
        .args(args)
        .current_dir(cwd)
        .stdin(Stdio::null())
        .stderr(Stdio::null())
        .output()
        .ok()
        .map(|o| String::from_utf8_lossy(&o.stdout).to_string())
        .unwrap_or_default()
}

/// First file in `dir` whose name satisfies `matches`, or `None`.
///
/// The TS takes a `RegExp`; every call site uses one of three trivial shapes
/// (suffix / exact name), so this takes a predicate instead of pulling in a
/// regex engine.
pub fn first_file(dir: &Path, matches: impl Fn(&str) -> bool) -> Option<String> {
    let entries = std::fs::read_dir(dir).ok()?;
    // `fs.readdirSync` order is the OS directory order; sorting makes the pick
    // deterministic, which matters when several `.gem`/`.nupkg` files exist.
    let mut names: Vec<String> = entries
        .filter_map(|e| e.ok())
        .map(|e| e.file_name().to_string_lossy().to_string())
        .collect();
    names.sort();
    let hit = names.into_iter().find(|n| matches(n))?;
    Some(dir.join(hit).to_string_lossy().to_string())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn command_output_is_never_fatal() {
        assert_eq!(
            command_output("definitely-not-a-real-binary-xyz", &[], Path::new(".")),
            ""
        );
    }

    #[test]
    fn run_command_reports_a_missing_binary() {
        let err = run_command(
            "definitely-not-a-real-binary-xyz",
            &[],
            Path::new("."),
            &[],
            false,
        )
        .unwrap_err();
        assert!(err.0.contains("failed to start"), "{}", err.0);
    }

    #[test]
    fn first_file_picks_by_predicate_and_returns_a_joined_path() {
        let dir = std::env::temp_dir().join(format!("opensdk-firstfile-{}", std::process::id()));
        std::fs::create_dir_all(&dir).unwrap();
        std::fs::write(dir.join("a.txt"), "x").unwrap();
        std::fs::write(dir.join("pkg.gemspec"), "x").unwrap();
        let hit = first_file(&dir, |n| n.ends_with(".gemspec")).unwrap();
        assert!(hit.ends_with("/pkg.gemspec"), "{hit}");
        assert!(first_file(&dir, |n| n.ends_with(".nope")).is_none());
        std::fs::remove_dir_all(&dir).ok();
    }
}
