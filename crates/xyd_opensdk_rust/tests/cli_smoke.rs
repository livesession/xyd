//! Env-gated e2e for CLI mode: generate a real Rust SDK, compile-and-run it
//! against the recording CLI (the subprocess analog of the HTTP
//! RecordingServer), and diff the ACTUAL argv the SDK spawned against
//! expectations — plus error mapping (non-zero exit → `Error::Cli`) and the
//! timeout kill (→ `Error::Timeout`). The remaining fixtures get a
//! `cargo check` so the boolean/repeat/json/variadic codegen paths are
//! compiler-verified too.
//!
//!   XYD_CLI_SMOKE_RUST=1 cargo test -p xyd_opensdk_rust --test cli_smoke
//!
//! Default `cargo test --workspace` skips this (no network / crates.io
//! required). All cargo invocations share one CARGO_TARGET_DIR so tokio
//! compiles once.

use std::collections::BTreeMap;
use std::path::{Path, PathBuf};
use std::process::Command;

use serde_json::Value;
use xyd_opensdk_cli_common::testkit;
use xyd_opensdk_rust::generate_rust;

fn gated() -> bool {
    std::env::var("XYD_CLI_SMOKE_RUST").is_err()
}

fn shared_input(case: &str) -> Value {
    let path = testkit::common_fixtures_dir().join(case).join("input.json");
    serde_json::from_str(&std::fs::read_to_string(&path).expect("read shared input"))
        .expect("parse shared input")
}

fn write_project(files: &BTreeMap<String, String>, dir: &Path) {
    for (rel, contents) in files {
        let path = dir.join(rel);
        std::fs::create_dir_all(path.parent().unwrap()).expect("mkdir");
        std::fs::write(&path, contents).expect("write generated file");
    }
}

fn fresh_dir(name: &str) -> PathBuf {
    let dir =
        std::env::temp_dir().join(format!("xyd-rust-cli-smoke-{}-{name}", std::process::id()));
    if dir.exists() {
        std::fs::remove_dir_all(&dir).expect("clear temp dir");
    }
    std::fs::create_dir_all(&dir).expect("mkdir temp dir");
    dir
}

/// One shared target dir across every smoke cargo invocation (deps build once).
fn shared_target_dir() -> PathBuf {
    let dir = std::env::temp_dir().join("xyd-rust-cli-smoke-target");
    std::fs::create_dir_all(&dir).expect("mkdir shared target dir");
    dir
}

/// `cargo run -q --bin smoke` with the recording CLI wired via the spec's envVar.
fn run_driver(project: &Path, env: &[(&str, String)]) -> (String, String, bool) {
    let mut cmd = Command::new("cargo");
    cmd.args(["run", "-q", "--bin", "smoke"])
        .current_dir(project)
        .env("CARGO_TARGET_DIR", shared_target_dir());
    for (key, value) in env {
        cmd.env(key, value);
    }
    let out = cmd
        .output()
        .expect("run cargo driver (is `cargo` on PATH?)");
    (
        String::from_utf8_lossy(&out.stdout).to_string(),
        String::from_utf8_lossy(&out.stderr).to_string(),
        out.status.success(),
    )
}

fn record_argv(stdout: &str) -> Vec<String> {
    let record: Value = serde_json::from_str(stdout.trim())
        .unwrap_or_else(|e| panic!("driver stdout is not a record: {e}\n{stdout}"));
    record["argv"]
        .as_array()
        .expect("argv array")
        .iter()
        .map(|v| v.as_str().unwrap().to_string())
        .collect()
}

const NESTED_DRIVER: &str = r#"use acme::{ChatCompletionsCreateParams, Client, Error};

#[tokio::main]
async fn main() {
    let mut builder = Client::builder();
    if let Ok(ms) = std::env::var("XYD_SMOKE_TIMEOUT_MS") {
        if let Ok(ms) = ms.parse::<u64>() {
            builder = builder.timeout_ms(ms);
        }
    }
    let client = builder.build();
    let res = client
        .chat()
        .completions()
        .create(
            "hello world",
            ChatCompletionsCreateParams {
                model: Some("gpt-4".to_string()),
                temperature: Some(0.5),
                ..Default::default()
            },
        )
        .await;
    match res {
        Ok(result) => print!("{}", result.stdout),
        Err(Error::Cli {
            exit_code, stderr, ..
        }) => println!("CLIERR {exit_code} {stderr}"),
        Err(Error::Timeout) => println!("TIMEOUT"),
        Err(err) => {
            eprintln!("{err}");
            std::process::exit(1);
        }
    }
}
"#;

const BASIC_DRIVER: &str = r#"use acme::{Client, ClientStatusParams};

#[tokio::main]
async fn main() {
    let client = Client::new();
    let version = client.opt_version().await.expect("opt_version");
    print!("{}", version.stdout);
    println!("---");
    let status = client
        .status(ClientStatusParams {
            format: Some("json".to_string()),
            ..Default::default()
        })
        .await
        .expect("status");
    print!("{}", status.stdout);
}
"#;

#[test]
fn rust_sdk_spawns_the_cli_with_the_bound_argv() {
    if gated() {
        eprintln!("skipped (set XYD_CLI_SMOKE_RUST=1 to run)");
        return;
    }
    let recording = testkit::recording_cli_path();
    let recording = recording.to_string_lossy().to_string();

    // 02.nested — resource-tree method with positional + flags.
    let project = fresh_dir("nested");
    write_project(&generate_rust(&shared_input("02.nested")), &project);
    std::fs::create_dir_all(project.join("src/bin")).unwrap();
    std::fs::write(project.join("src/bin/smoke.rs"), NESTED_DRIVER).unwrap();

    // Scenario 1: argv binding.
    let (stdout, stderr, ok) = run_driver(&project, &[("ACME_BIN", recording.clone())]);
    assert!(ok, "driver failed: {stderr}");
    assert_eq!(
        record_argv(&stdout),
        vec![
            "chat",
            "completions",
            "create",
            "hello world",
            "--model",
            "gpt-4",
            "--temperature",
            "0.5"
        ],
        "argv mismatch"
    );

    // Scenario 2: non-zero exit → Error::Cli with exit code + stderr.
    let (stdout, stderr, ok) = run_driver(
        &project,
        &[
            ("ACME_BIN", recording.clone()),
            ("XYD_RECORD_EXIT", "3".to_string()),
            ("XYD_RECORD_STDERR", "boom".to_string()),
        ],
    );
    assert!(ok, "driver failed: {stderr}");
    assert_eq!(stdout, "CLIERR 3 boom\n");

    // Scenario 3: timeout → child killed, Error::Timeout.
    let (stdout, stderr, ok) = run_driver(
        &project,
        &[
            ("ACME_BIN", recording.clone()),
            ("XYD_RECORD_SLEEP_MS", "5000".to_string()),
            ("XYD_SMOKE_TIMEOUT_MS", "200".to_string()),
        ],
    );
    assert!(ok, "driver failed: {stderr}");
    assert_eq!(stdout, "TIMEOUT\n", "expected timeout Error::Timeout");

    // 01.basic — root opt-method + root command with an optional flag.
    let project = fresh_dir("basic");
    write_project(&generate_rust(&shared_input("01.basic")), &project);
    std::fs::create_dir_all(project.join("src/bin")).unwrap();
    std::fs::write(project.join("src/bin/smoke.rs"), BASIC_DRIVER).unwrap();

    let (stdout, stderr, ok) = run_driver(&project, &[("ACME_BIN", recording)]);
    assert!(ok, "driver failed: {stderr}");
    let parts: Vec<&str> = stdout.splitn(2, "---\n").collect();
    assert_eq!(parts.len(), 2, "expected two records: {stdout}");
    assert_eq!(record_argv(parts[0]), vec!["--version"]);
    assert_eq!(record_argv(parts[1]), vec!["status", "--format", "json"]);

    // Remaining fixtures: compiler-verify the boolean/repeat/json/variadic
    // codegen paths (cheap — the shared target dir already has the deps).
    for case in ["03.root-opt", "04.booleans", "05.variadic", "06.enums"] {
        let project = fresh_dir(&case.replace('.', "-"));
        write_project(&generate_rust(&shared_input(case)), &project);
        let out = Command::new("cargo")
            .args(["check", "-q"])
            .current_dir(&project)
            .env("CARGO_TARGET_DIR", shared_target_dir())
            .output()
            .expect("cargo check");
        assert!(
            out.status.success(),
            "{case}: cargo check failed:\n{}",
            String::from_utf8_lossy(&out.stderr)
        );
    }
}
