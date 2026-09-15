//! Does the generated TypeScript SDK actually TYPE-CHECK?
//!
//! The byte-exact goldens (`parity.rs`, `docs.rs`) prove the emitter produces the
//! same output it always did — but a type error emitted CONSISTENTLY matches its
//! golden perfectly, and a regenerated golden simply blesses it. This tier is the
//! independent check that does not depend on the golden being right.
//!
//! NODE IS THE ONE LANGUAGE `xyd_opensdk_e2e` DOES NOT HANDLE: locating `tsc`
//! needs the JS toolchain's own module resolution, and that crate deliberately
//! carries no JS dependency. So the compile lives here.
//!
//! Ported from the deleted `@xyd-js/opensdk-ci`; recover the original with
//! `git show 4c9ae3b1^:packages/xyd-opensdk-ci/src/compile-smoke.ts`.
//!
//! Skips when no `tsc` can be found so `cargo test --workspace` stays offline. Set
//! `XYD_SMOKE_NODE=1` to turn that into a FAILURE — that is what CI uses, so the
//! tier cannot silently stop running there.

use std::collections::BTreeMap;
use std::path::{Path, PathBuf};
use std::process::Command;

use serde_json::Value;
use xyd_opensdk_node::generate_node;

fn fixtures_dir() -> PathBuf {
    Path::new(env!("CARGO_MANIFEST_DIR")).join("__fixtures__")
}

/// Find a `tsc` binary by walking up from this crate looking for a hoisted
/// `node_modules/.bin/tsc`. Returns None when the JS toolchain isn't installed —
/// which is a SKIP, not a failure.
fn find_tsc() -> Option<PathBuf> {
    let mut dir: Option<&Path> = Some(Path::new(env!("CARGO_MANIFEST_DIR")));
    while let Some(d) = dir {
        let candidate = d.join("node_modules/.bin/tsc");
        if candidate.exists() {
            return Some(candidate);
        }
        dir = d.parent();
    }
    None
}

/// Recursively collect `.ts` files (used when the emitter writes no tsconfig).
fn ts_files(dir: &Path, out: &mut Vec<String>) {
    let Ok(entries) = std::fs::read_dir(dir) else {
        return;
    };
    let mut paths: Vec<PathBuf> = entries.filter_map(Result::ok).map(|e| e.path()).collect();
    paths.sort(); // deterministic argv — a type error should name the same file every run
    for p in paths {
        if p.is_dir() {
            ts_files(&p, out);
        } else if p.to_string_lossy().ends_with(".ts") {
            out.push(p.to_string_lossy().to_string());
        }
    }
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

fn compile_case(case: &str) {
    let Some(tsc) = find_tsc() else {
        return; // gated_skip already decided this is acceptable
    };
    let input = fixtures_dir().join(case).join("input.json");
    let ir: Value = serde_json::from_str(
        &std::fs::read_to_string(&input)
            .unwrap_or_else(|e| panic!("read {}: {e}", input.display())),
    )
    .expect("parse IR");

    let dir = std::env::temp_dir().join(format!("xyd_node_smoke_{case}"));
    let _ = std::fs::remove_dir_all(&dir);
    std::fs::create_dir_all(&dir).expect("temp dir");
    write_project(&generate_node(&ir), &dir);

    // Prefer the emitted tsconfig — it carries the strictness the SDK is meant to
    // satisfy. Fall back to naming the files when the emitter wrote none.
    let mut args: Vec<String> = vec!["--noEmit".into()];
    if dir.join("tsconfig.json").exists() {
        args.push("-p".into());
        args.push("tsconfig.json".into());
    } else {
        ts_files(&dir.join("src"), &mut args);
    }

    let out = Command::new(&tsc)
        .args(&args)
        .current_dir(&dir)
        .output()
        .unwrap_or_else(|e| panic!("spawn tsc: {e}"));
    let ok = out.status.success();
    let stdout = String::from_utf8_lossy(&out.stdout).to_string();
    let stderr = String::from_utf8_lossy(&out.stderr).to_string();
    let _ = std::fs::remove_dir_all(&dir);
    assert!(
        ok,
        "[{case}] generated TypeScript does not type-check:\n--- stdout ---\n{stdout}\n--- stderr ---\n{stderr}"
    );
}

/// An absent toolchain is a SKIP locally but a FAILURE under the gate — otherwise
/// the whole tier could stop running in CI and nothing would say so.
fn gated_skip() -> bool {
    if find_tsc().is_some() {
        return false;
    }
    if std::env::var("XYD_SMOKE_NODE").as_deref() == Ok("1") {
        panic!("XYD_SMOKE_NODE=1 but no node_modules/.bin/tsc was found");
    }
    eprintln!("tsc not found — compile smoke SKIPPED");
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
