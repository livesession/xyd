//! Env-gated e2e for CLI mode: generate a real Go SDK, compile-and-run it
//! against the recording CLI (the subprocess analog of the HTTP
//! RecordingServer), and diff the ACTUAL argv the SDK spawned against
//! expectations — plus error mapping (non-zero exit → *runner.CliError) and
//! the timeout kill.
//!
//!   XYD_CLI_SMOKE_GO=1 cargo test -p xyd_opensdk_go --test cli_smoke
//!
//! Default `cargo test --workspace` skips this (no Go toolchain required).

use std::collections::BTreeMap;
use std::path::{Path, PathBuf};
use std::process::Command;

use serde_json::Value;
use xyd_opensdk_cli_common::testkit;
use xyd_opensdk_go::generate_go;

fn gated() -> bool {
    std::env::var("XYD_CLI_SMOKE_GO").is_err()
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
    let dir = std::env::temp_dir().join(format!("xyd-go-cli-smoke-{}-{name}", std::process::id()));
    if dir.exists() {
        std::fs::remove_dir_all(&dir).expect("clear temp dir");
    }
    std::fs::create_dir_all(&dir).expect("mkdir temp dir");
    dir
}

/// `go run ./smoke` with the recording CLI wired via the spec's envVar.
fn run_driver(project: &Path, env: &[(&str, String)]) -> (String, String, bool) {
    let mut cmd = Command::new("go");
    cmd.args(["run", "./smoke"]).current_dir(project);
    for (key, value) in env {
        cmd.env(key, value);
    }
    let out = cmd.output().expect("run go driver (is `go` on PATH?)");
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

const NESTED_DRIVER: &str = r#"package main

import (
	"context"
	"errors"
	"fmt"
	"os"
	"strconv"
	"time"

	acme "github.com/example/acme"
	"github.com/example/acme/internal/runner"
	"github.com/example/acme/option"
	"github.com/example/acme/packages/param"
)

func main() {
	var opts []option.CommandOption
	if ms := os.Getenv("XYD_SMOKE_TIMEOUT_MS"); ms != "" {
		n, _ := strconv.Atoi(ms)
		opts = append(opts, option.WithTimeout(time.Duration(n)*time.Millisecond))
	}
	client := acme.NewClient()
	res, err := client.Chat.Completions.New(context.Background(), "hello world", acme.ChatCompletionNewParams{
		Model:       "gpt-4",
		Temperature: param.NewOpt(0.5),
	}, opts...)
	if err != nil {
		var cliErr *runner.CliError
		if errors.As(err, &cliErr) {
			fmt.Printf("CLIERR %d %s\n", cliErr.ExitCode, cliErr.Stderr)
			return
		}
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
	fmt.Print(res.Stdout)
}
"#;

const BASIC_DRIVER: &str = r#"package main

import (
	"context"
	"fmt"
	"os"

	acme "github.com/example/acme"
	"github.com/example/acme/packages/param"
)

func main() {
	client := acme.NewClient()
	version, err := client.OptVersion(context.Background())
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
	fmt.Print(version.Stdout)
	fmt.Println("---")
	status, err := client.Status(context.Background(), acme.ClientStatusParams{
		Format: param.NewOpt("json"),
	})
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
	fmt.Print(status.Stdout)
}
"#;

#[test]
fn go_sdk_spawns_the_cli_with_the_bound_argv() {
    if gated() {
        eprintln!("skipped (set XYD_CLI_SMOKE_GO=1 to run)");
        return;
    }
    let recording = testkit::recording_cli_path();
    let recording = recording.to_string_lossy().to_string();

    // 02.nested — resource-tree method with positional + flags.
    let project = fresh_dir("nested");
    write_project(&generate_go(&shared_input("02.nested")), &project);
    std::fs::create_dir_all(project.join("smoke")).unwrap();
    std::fs::write(project.join("smoke/main.go"), NESTED_DRIVER).unwrap();

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

    // Scenario 2: non-zero exit → *runner.CliError with exit code + stderr.
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

    // Scenario 3: timeout → child killed, CliError with exit code -1.
    let (stdout, stderr, ok) = run_driver(
        &project,
        &[
            ("ACME_BIN", recording.clone()),
            ("XYD_RECORD_SLEEP_MS", "5000".to_string()),
            ("XYD_SMOKE_TIMEOUT_MS", "200".to_string()),
        ],
    );
    assert!(ok, "driver failed: {stderr}");
    assert!(
        stdout.starts_with("CLIERR -1"),
        "expected timeout CliError, got: {stdout}"
    );

    // 01.basic — root opt-method + root command with an optional flag.
    let project = fresh_dir("basic");
    write_project(&generate_go(&shared_input("01.basic")), &project);
    std::fs::create_dir_all(project.join("smoke")).unwrap();
    std::fs::write(project.join("smoke/main.go"), BASIC_DRIVER).unwrap();

    let (stdout, stderr, ok) = run_driver(&project, &[("ACME_BIN", recording)]);
    assert!(ok, "driver failed: {stderr}");
    let parts: Vec<&str> = stdout.splitn(2, "---\n").collect();
    assert_eq!(parts.len(), 2, "expected two records: {stdout}");
    assert_eq!(record_argv(parts[0]), vec!["--version"]);
    assert_eq!(record_argv(parts[1]), vec!["status", "--format", "json"]);
}
