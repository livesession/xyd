//! Does the generated Python SDK actually COMPILE?
//!
//! The byte-exact goldens (`parity.rs`, `docs.rs`) prove the emitter produces the
//! same output it always did — but a syntax error emitted consistently matches its
//! golden perfectly. This is the tier that catches that, ported from the deleted
//! `@xyd-js/opensdk-python` `O2S_PY_SMOKE` suite.
//!
//! Skips when python3 is absent, so `cargo test --workspace` stays offline. Set
//! `XYD_SMOKE_PYTHON=1` to make a missing toolchain a FAILURE instead — that is
//! what CI uses, so the tier cannot silently stop running there.

use std::collections::BTreeMap;
use std::path::{Path, PathBuf};

use serde_json::Value;
use xyd_opensdk_e2e::{compile_smoke, toolchain_available};
use xyd_opensdk_python::generate_python;

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

    let dir = std::env::temp_dir().join(format!("xyd_py_smoke_{case}"));
    let _ = std::fs::remove_dir_all(&dir);
    std::fs::create_dir_all(&dir).expect("temp dir");
    write_project(&generate_python(&ir), &dir);

    let result = compile_smoke("python", &dir);
    let _ = std::fs::remove_dir_all(&dir);
    match result {
        Ok(true) => {}
        Ok(false) => panic!("python3 vanished mid-test"),
        Err(e) => panic!("[{case}] generated Python does not compile:\n{e}"),
    }
}

/// The gate exists so an absent toolchain is a SKIP locally but a FAILURE in CI —
/// otherwise the whole tier could stop running and nothing would say so.
fn gated_skip() -> bool {
    if toolchain_available("python") {
        return false;
    }
    if std::env::var("XYD_SMOKE_PYTHON").as_deref() == Ok("1") {
        panic!("XYD_SMOKE_PYTHON=1 but python3 is not installed");
    }
    eprintln!("python3 absent — compile smoke SKIPPED");
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
