//! Does the generated Rust SDK actually COMPILE?
//!
//! The byte-exact goldens (`parity.rs`) prove the emitter produces the same output
//! it always did — but a syntax error emitted CONSISTENTLY matches its golden
//! perfectly, and a regenerated golden simply blesses it. This tier is the
//! independent check that does not depend on the golden being right.
//!
//! RUST IS THE AWKWARD ONE. The generated project is itself a cargo crate whose
//! manifest pulls reqwest/tokio/serde from crates.io, so a plain `cargo build`
//! needs the network. That gives two very different failure modes, and conflating
//! them would make the tier useless in either direction:
//!
//!   * dependencies cannot be fetched  -> SKIP (an environment problem)
//!   * the generated code is malformed -> FAIL (the bug this exists to catch)
//!
//! `cargo check` is used rather than `build` (type-checks without codegen — same
//! diagnostics, much faster), and a shared CARGO_TARGET_DIR lets repeated cases
//! reuse the dependency build instead of recompiling reqwest four times.
//!
//! Ported from the deleted `@xyd-js/opensdk-ci`; recover the original with
//! `git show 4c9ae3b1^:packages/xyd-opensdk-ci/src/compile-smoke.ts`.

use std::collections::BTreeMap;
use std::path::{Path, PathBuf};
use std::process::Command;

use serde_json::Value;
use xyd_opensdk_rust::generate_rust;

fn fixtures_dir() -> PathBuf {
    Path::new(env!("CARGO_MANIFEST_DIR")).join("__fixtures__")
}

fn write_project(files: &BTreeMap<String, String>, dir: &Path) {
    for (rel, contents) in files {
        let path = dir.join(rel);
        if let Some(parent) = path.parent() {
            std::fs::create_dir_all(parent).expect("create dir");
        }
        std::fs::write(&path, contents).expect("write generated file");
    }
}

/// Does this stderr describe a dependency-resolution problem rather than bad code?
///
/// Deliberately narrow: only registry/network phrasing counts. Anything else —
/// including any `error[EXXXX]` rustc diagnostic — is a real compile failure.
fn is_dependency_failure(stderr: &str) -> bool {
    const NETWORK: &[&str] = &[
        "failed to get ",
        "failed to download",
        "failed to fetch",
        "no matching package named",
        "network failure",
        "could not connect",
        "unable to get packages from source",
        "registry index was not found",
    ];
    if stderr.contains("error[") {
        return false; // a real rustc diagnostic wins over any network phrasing
    }
    NETWORK.iter().any(|n| stderr.contains(n))
}

fn compile_case(case: &str) {
    let input = fixtures_dir().join(case).join("input.json");
    let ir: Value = serde_json::from_str(
        &std::fs::read_to_string(&input)
            .unwrap_or_else(|e| panic!("read {}: {e}", input.display())),
    )
    .expect("parse IR");

    let dir = std::env::temp_dir().join(format!("xyd_rs_smoke_{case}"));
    let _ = std::fs::remove_dir_all(&dir);
    std::fs::create_dir_all(&dir).expect("temp dir");
    write_project(&generate_rust(&ir), &dir);

    // One shared target dir across cases: the dependency graph is identical, so
    // this turns four full reqwest builds into one.
    let shared_target = std::env::temp_dir().join("xyd_rs_smoke_target");

    let out = Command::new("cargo")
        .args(["check", "--quiet"])
        .current_dir(&dir)
        .env("CARGO_TARGET_DIR", &shared_target)
        .output()
        .unwrap_or_else(|e| panic!("spawn cargo: {e}"));

    let ok = out.status.success();
    let stderr = String::from_utf8_lossy(&out.stderr).to_string();
    let _ = std::fs::remove_dir_all(&dir);

    if ok {
        return;
    }
    if is_dependency_failure(&stderr) {
        eprintln!("[{case}] cargo could not fetch dependencies — compile smoke SKIPPED");
        if std::env::var("XYD_SMOKE_RUST").as_deref() == Ok("1") {
            panic!("XYD_SMOKE_RUST=1 but dependencies could not be fetched:\n{stderr}");
        }
        return;
    }
    panic!("[{case}] generated Rust does not compile:\n{stderr}");
}

fn gated_skip() -> bool {
    let has_cargo = Command::new("cargo")
        .arg("--version")
        .stdout(std::process::Stdio::null())
        .stderr(std::process::Stdio::null())
        .status()
        .map(|s| s.success())
        .unwrap_or(false);
    if has_cargo {
        return false;
    }
    if std::env::var("XYD_SMOKE_RUST").as_deref() == Ok("1") {
        panic!("XYD_SMOKE_RUST=1 but cargo is not installed");
    }
    eprintln!("cargo absent — compile smoke SKIPPED");
    true
}

#[test]
fn basic_sdk_compiles() {
    if gated_skip() {
        return;
    }
    compile_case("1.basic");
}

#[test]
fn wire_sdk_compiles() {
    if gated_skip() {
        return;
    }
    compile_case("2.wire");
}

#[test]
fn unions_sdk_compiles() {
    if gated_skip() {
        return;
    }
    compile_case("3.unions");
}

#[test]
fn sdk_behavior_overrides_compile() {
    if gated_skip() {
        return;
    }
    compile_case("10.sdk-behavior");
}

#[cfg(test)]
mod classifier {
    use super::is_dependency_failure;

    #[test]
    fn a_rustc_diagnostic_is_never_a_dependency_skip() {
        // The dangerous confusion: a real compile error that merely mentions a
        // crate name must NOT be waved through as a network problem.
        assert!(!is_dependency_failure(
            "error[E0432]: unresolved import `reqwest::Client`"
        ));
        assert!(!is_dependency_failure("error: expected one of `,` or `}`"));
    }

    #[test]
    fn registry_failures_are_recognised() {
        assert!(is_dependency_failure(
            "error: failed to get `reqwest` as a dependency"
        ));
        assert!(is_dependency_failure(
            "warning: could not connect to registry"
        ));
    }
}
