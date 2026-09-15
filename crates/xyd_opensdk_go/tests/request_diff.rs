//! Does the COMPILED Go SDK make the right HTTP request?
//!
//! The last tier, and the only one that observes runtime behavior. The byte
//! goldens check what the emitter wrote; `compile_smoke` checks it builds; the
//! offline binding guard checks the IR→request derivation and the call naming.
//! None of them can catch an SDK that builds cleanly and then hits the wrong
//! endpoint, drops a required body field, or forgets its auth header.
//!
//! Shape: merge the 242 per-method fixture IRs into ONE document, generate ONE
//! SDK plus a driver that switch-dispatches every operation, build it once, then
//! run it 242 times against a local recording server and diff each request
//! against the committed `<op>/recorded.json`.
//!
//! GATED OFF BY DEFAULT (`XYD_E2E_GO=1`). Unlike the compile smoke this builds a
//! whole 242-method SDK and spawns a subprocess per operation — minutes, not
//! seconds. CI sets the gate; `cargo test --workspace` stays fast.
//!
//! Ported from the deleted harness; recover it with
//! `git show 4c9ae3b1^:packages/xyd-opensdk-go/__tests__/e2e/harness.ts`.

use std::collections::BTreeMap;
use std::path::{Path, PathBuf};
use std::process::Command;

use xyd_opensdk_cli_common::{load_per_method_fixtures, RecordedRequest};
use xyd_opensdk_e2e::{diff_request, full_ir, normalize_recorded, RecordingServer};
use xyd_opensdk_go::{generate_go, generate_go_e2e_driver};

/// The module path and package name are NOT ours to choose — the emitter derives
/// them from the IR's `info.title`, and the driver must import exactly what the
/// generated `go.mod` declares. Hardcoding them produced a driver importing
/// `github.com/example/acme` against a module named `github.com/example/openai`,
/// which `go mod tidy` then tried to fetch from the network.
fn module_and_pkg(files: &BTreeMap<String, String>) -> (String, String) {
    let gomod = files.get("go.mod").expect("generated go.mod");
    let module = gomod
        .lines()
        .find_map(|l| l.strip_prefix("module ").map(str::trim))
        .expect("module line in go.mod")
        .to_string();
    let pkg = module.rsplit('/').next().unwrap_or("sdk").to_string();
    (module, pkg)
}

fn corpus_dir() -> PathBuf {
    Path::new(env!("CARGO_MANIFEST_DIR")).join("__fixtures__/-2.complex.openai")
}

fn enabled() -> bool {
    std::env::var("XYD_E2E_GO").as_deref() == Ok("1")
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

#[test]
fn compiled_sdk_makes_the_recorded_requests() {
    if !enabled() {
        eprintln!("XYD_E2E_GO != 1 — real-SDK request diff SKIPPED (builds a whole SDK)");
        return;
    }

    let cases = load_per_method_fixtures(&corpus_dir());
    assert!(
        cases.len() >= 238,
        "only {} fixtures found — the corpus shrank",
        cases.len()
    );

    // ONE SDK for the whole API, not one per operation.
    let ir = full_ir(&corpus_dir(), "sdk");
    let dir = std::env::temp_dir().join("xyd_go_request_diff");
    let _ = std::fs::remove_dir_all(&dir);
    std::fs::create_dir_all(&dir).expect("temp dir");

    let mut files = generate_go(&ir);
    let (module_path, pkg) = module_and_pkg(&files);
    files.insert(
        "cmd/driver/main.go".to_string(),
        generate_go_e2e_driver(&ir, &pkg, &module_path),
    );
    write_project(&files, &dir);

    let tidy = Command::new("go")
        .args(["mod", "tidy"])
        .current_dir(&dir)
        .env("CGO_ENABLED", "0")
        .env("GOFLAGS", "-mod=mod")
        .output()
        .expect("spawn go");
    assert!(
        tidy.status.success(),
        "go mod tidy failed:\n{}",
        String::from_utf8_lossy(&tidy.stderr)
    );
    let build = Command::new("go")
        .args(["build", "-o", "driver", "./cmd/driver"])
        .current_dir(&dir)
        .env("CGO_ENABLED", "0")
        .output()
        .expect("spawn go");
    assert!(
        build.status.success(),
        "driver build failed:\n{}",
        String::from_utf8_lossy(&build.stderr)
    );

    let server = RecordingServer::start().expect("recording server");
    let driver = dir.join("driver");

    let mut checked = 0usize;
    let mut no_request = Vec::new();
    let mut mismatches = Vec::new();

    for c in &cases {
        let call = c.fixture["call"].as_str().unwrap_or_default();
        let fixture: RecordedRequest =
            serde_json::from_value(c.fixture["request"].clone()).expect("fixture request");

        server.reset();
        let _ = Command::new(&driver)
            .arg(call)
            .current_dir(&dir)
            .env("E2E_BASE_URL", server.base_url())
            .env("OPENAI_API_KEY", "sk-e2e-test")
            .output();

        match server.take() {
            None => no_request.push(c.slug.clone()),
            Some(raw) => {
                let errs = diff_request(&normalize_recorded(&raw), &fixture);
                if errs.is_empty() {
                    checked += 1;
                } else {
                    mismatches.push(format!("  [{}] {}", c.slug, errs.join("; ")));
                }
            }
        }
    }

    eprintln!(
        "go request diff: {checked}/{} operations matched their recorded request",
        cases.len()
    );
    let _ = std::fs::remove_dir_all(&dir);

    assert!(
        no_request.is_empty(),
        "{} operation(s) made NO request (driver dispatch missing?): {:?}",
        no_request.len(),
        &no_request[..no_request.len().min(10)]
    );
    assert!(
        mismatches.is_empty(),
        "{} request mismatch(es):\n{}",
        mismatches.len(),
        mismatches
            .iter()
            .take(10)
            .cloned()
            .collect::<Vec<_>>()
            .join("\n")
    );
}
