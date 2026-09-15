//! Does the generated Go SDK actually COMPILE?
//!
//! The byte-exact goldens (`parity.rs`, `docs.rs`) prove the emitter produces the
//! same output it always did — but a syntax error emitted CONSISTENTLY matches its
//! golden perfectly, and a regenerated golden simply blesses it. This tier is the
//! independent check that does not depend on the golden being right.
//!
//! Ported from the deleted `@xyd-js/opensdk-ci`; recover the original with
//! `git show 4c9ae3b1^:packages/xyd-opensdk-ci/src/compile-smoke.ts`.
//!
//! Skips when go is absent so `cargo test --workspace` stays offline. Set
//! `XYD_SMOKE_GO=1` to turn a missing toolchain into a FAILURE — that is what CI
//! uses, so the tier cannot silently stop running there.

use std::collections::BTreeMap;
use std::path::{Path, PathBuf};

use serde_json::Value;
use xyd_opensdk_e2e::{compile_smoke, toolchain_available};
use xyd_opensdk_go::generate_go;

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

/// Generate `case` into a fresh temp dir and compile it.
fn compile_case(case: &str) {
    let input = fixtures_dir().join(case).join("input.json");
    let ir: Value = serde_json::from_str(
        &std::fs::read_to_string(&input)
            .unwrap_or_else(|e| panic!("read {}: {e}", input.display())),
    )
    .expect("parse IR");

    let dir = std::env::temp_dir().join(format!("xyd_go_smoke_{case}"));
    let _ = std::fs::remove_dir_all(&dir);
    std::fs::create_dir_all(&dir).expect("temp dir");
    write_project(&generate_go(&ir), &dir);

    let result = compile_smoke("go", &dir);
    let _ = std::fs::remove_dir_all(&dir);
    match result {
        Ok(true) => {}
        Ok(false) => panic!("go vanished mid-test"),
        Err(e) => panic!("[{case}] generated Go does not compile:\n{e}"),
    }
}

/// An absent toolchain is a SKIP locally but a FAILURE under the gate — otherwise
/// the whole tier could stop running in CI and nothing would say so.
fn gated_skip() -> bool {
    if toolchain_available("go") {
        return false;
    }
    if std::env::var("XYD_SMOKE_GO").as_deref() == Ok("1") {
        panic!("XYD_SMOKE_GO=1 but go is not installed");
    }
    eprintln!("go absent — compile smoke SKIPPED");
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
