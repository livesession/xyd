//! Env-gated e2e for CLI mode: generate a real Java SDK, compile-and-run it
//! against the recording CLI (the subprocess analog of the HTTP
//! RecordingServer), and diff the ACTUAL argv the SDK spawned against
//! expectations — plus error mapping (non-zero exit → CliException) and the
//! timeout kill.
//!
//!   XYD_CLI_SMOKE_JAVA=1 cargo test -p xyd_opensdk_java --test cli_smoke
//!
//! Default `cargo test --workspace` skips this (no Java toolchain required).
//! The driver is ONE Main.java compiled with plain `javac` — the generated SDK
//! is dependency-free vendored Java, so no Maven is involved.

use std::collections::BTreeMap;
use std::path::{Path, PathBuf};
use std::process::Command;

use serde_json::Value;
use xyd_opensdk_cli_common::testkit;
use xyd_opensdk_java::generate_java;

fn gated() -> bool {
    std::env::var("XYD_CLI_SMOKE_JAVA").is_err()
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
        std::env::temp_dir().join(format!("xyd-java-cli-smoke-{}-{name}", std::process::id()));
    if dir.exists() {
        std::fs::remove_dir_all(&dir).expect("clear temp dir");
    }
    std::fs::create_dir_all(&dir).expect("mkdir temp dir");
    dir
}

/// Every generated .java under the project tree (the SDK is dependency-free).
fn java_sources(project: &Path) -> Vec<PathBuf> {
    let mut sources = Vec::new();
    let mut stack = vec![project.join("src")];
    while let Some(dir) = stack.pop() {
        for entry in std::fs::read_dir(&dir).expect("read src dir") {
            let path = entry.expect("dir entry").path();
            if path.is_dir() {
                stack.push(path);
            } else if path.extension().map(|e| e == "java").unwrap_or(false) {
                sources.push(path);
            }
        }
    }
    sources
}

/// `javac -d out <all generated .java> Main.java` — plain javac, no Maven.
fn compile_project(project: &Path) {
    let mut sources = java_sources(project);
    sources.push(project.join("Main.java"));
    let out = Command::new("javac")
        .arg("-d")
        .arg("out")
        .args(&sources)
        .current_dir(project)
        .output()
        .expect("run javac (is a JDK on PATH?)");
    assert!(
        out.status.success(),
        "javac failed:\n{}",
        String::from_utf8_lossy(&out.stderr)
    );
}

/// `java -cp out Main` with the recording CLI wired via the spec's envVar.
fn run_driver(project: &Path, env: &[(&str, String)]) -> (String, String, bool) {
    let mut cmd = Command::new("java");
    cmd.args(["-cp", "out", "Main"]).current_dir(project);
    for (key, value) in env {
        cmd.env(key, value);
    }
    let out = cmd.output().expect("run java driver (is `java` on PATH?)");
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

const NESTED_DRIVER: &str = r#"import com.example.acme.ChatCompletionCreateParams;
import com.example.acme.Client;
import com.example.acme.CliException;
import com.example.acme.CommandResult;

public final class Main {
  public static void main(String[] args) {
    Client.Builder builder = Client.builder();
    String ms = System.getenv("XYD_SMOKE_TIMEOUT_MS");
    if (ms != null && !ms.isEmpty()) {
      builder.timeoutMs(Long.parseLong(ms));
    }
    Client client = builder.build();
    try {
      CommandResult res = client.chat().completions().create(
          "hello world",
          ChatCompletionCreateParams.builder().model("gpt-4").temperature(0.5).build());
      System.out.print(res.stdout());
    } catch (CliException e) {
      System.out.println("CLIERR " + e.exitCode() + " " + e.stderr());
    }
  }
}
"#;

const BASIC_DRIVER: &str = r#"import com.example.acme.Client;
import com.example.acme.ClientStatusParams;
import com.example.acme.CommandResult;

public final class Main {
  public static void main(String[] args) {
    Client client = Client.builder().build();
    CommandResult version = client.optVersion();
    System.out.print(version.stdout());
    System.out.println("---");
    CommandResult status = client.status(ClientStatusParams.builder().format("json").build());
    System.out.print(status.stdout());
  }
}
"#;

const ENUMS_DRIVER: &str = r#"import com.example.acme.Client;
import com.example.acme.ClientConvertParams;
import com.example.acme.CommandResult;
import com.example.acme.ConvertLevel;
import com.example.acme.ConvertTarget;

public final class Main {
  public static void main(String[] args) {
    Client client = Client.builder().build();
    CommandResult res = client.convert(
        ConvertTarget.JSON_PRETTY,
        ClientConvertParams.builder().level(ConvertLevel.DEBUG_VERBOSE).build());
    System.out.print(res.stdout());
  }
}
"#;

#[test]
fn java_sdk_spawns_the_cli_with_the_bound_argv() {
    if gated() {
        eprintln!("skipped (set XYD_CLI_SMOKE_JAVA=1 to run)");
        return;
    }
    let recording = testkit::recording_cli_path();
    let recording = recording.to_string_lossy().to_string();

    // 02.nested — resource-tree method with positional + flags.
    let project = fresh_dir("nested");
    write_project(&generate_java(&shared_input("02.nested")), &project);
    std::fs::write(project.join("Main.java"), NESTED_DRIVER).unwrap();
    compile_project(&project);

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

    // Scenario 2: non-zero exit → CliException with exit code + stderr.
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

    // Scenario 3: timeout → child killed, CliException with exit code -1.
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
        "expected timeout CliException, got: {stdout}"
    );

    // 01.basic — root opt-method + root command with an optional flag.
    let project = fresh_dir("basic");
    write_project(&generate_java(&shared_input("01.basic")), &project);
    std::fs::write(project.join("Main.java"), BASIC_DRIVER).unwrap();
    compile_project(&project);

    let (stdout, stderr, ok) = run_driver(&project, &[("ACME_BIN", recording.clone())]);
    assert!(ok, "driver failed: {stderr}");
    let parts: Vec<&str> = stdout.splitn(2, "---\n").collect();
    assert_eq!(parts.len(), 2, "expected two records: {stdout}");
    assert_eq!(record_argv(parts[0]), vec!["--version"]);
    assert_eq!(record_argv(parts[1]), vec!["status", "--format", "json"]);

    // 06.enums — enum-typed positional + flag must render WIRE literals
    // ("json-pretty"), never the Java member identifiers ("JSON_PRETTY").
    let project = fresh_dir("enums");
    write_project(&generate_java(&shared_input("06.enums")), &project);
    std::fs::write(project.join("Main.java"), ENUMS_DRIVER).unwrap();
    compile_project(&project);

    let (stdout, stderr, ok) = run_driver(&project, &[("ACME_BIN", recording)]);
    assert!(ok, "driver failed: {stderr}");
    assert_eq!(
        record_argv(&stdout),
        vec!["convert", "json-pretty", "--level", "debug-verbose"],
        "enum wire-literal mismatch"
    );
}
