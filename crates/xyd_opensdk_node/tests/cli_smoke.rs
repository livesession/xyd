//! Env-gated e2e for CLI mode: generate a real TypeScript SDK, compile it with
//! the repo's tsc, run it under Node against the recording CLI (the subprocess
//! analog of the HTTP RecordingServer), and diff the ACTUAL argv the SDK
//! spawned against expectations — plus error mapping (non-zero exit →
//! `CliError`) and the timeout kill.
//!
//!   XYD_CLI_SMOKE_NODE=1 cargo test -p xyd_opensdk_node --test cli_smoke
//!
//! Default `cargo test --workspace` skips this (no Node toolchain required).

use std::collections::BTreeMap;
use std::path::{Path, PathBuf};
use std::process::Command;

use serde_json::Value;
use xyd_opensdk_cli_common::testkit;
use xyd_opensdk_node::generate_node;

fn gated() -> bool {
    std::env::var("XYD_CLI_SMOKE_NODE").is_err()
}

fn repo_root() -> PathBuf {
    Path::new(env!("CARGO_MANIFEST_DIR"))
        .join("../..")
        .canonicalize()
        .expect("repo root")
}

/// The repo's TypeScript compiler (absolute path — the generated project is
/// compiled OUTSIDE the repo, in a temp dir).
fn tsc_path() -> PathBuf {
    repo_root().join("node_modules/.bin/tsc")
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
        std::env::temp_dir().join(format!("xyd-node-cli-smoke-{}-{name}", std::process::id()));
    if dir.exists() {
        std::fs::remove_dir_all(&dir).expect("clear temp dir");
    }
    std::fs::create_dir_all(&dir).expect("mkdir temp dir");
    dir
}

/// The driver-side tsconfig: the generated SDK declares an ESM package built
/// for bundlers, so the smoke compiles SDK + driver together as CommonJS
/// (which Node runs directly) and pulls @types/node from the repo.
fn driver_tsconfig() -> String {
    let type_roots = repo_root().join("node_modules/@types");
    format!(
        r#"{{
  "compilerOptions": {{
    "target": "ES2022",
    "module": "commonjs",
    "moduleResolution": "node",
    "lib": ["ES2022"],
    "types": ["node"],
    "typeRoots": [{}],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "rootDir": ".",
    "outDir": "./dist"
  }},
  "include": ["driver.ts", "sdk/src"]
}}
"#,
        serde_json::to_string(&type_roots.display().to_string()).unwrap()
    )
}

/// Generate `case` into `<dir>/sdk`, write the driver, and compile everything
/// once with the repo's tsc.
fn setup_project(case: &str, driver: &str, name: &str) -> PathBuf {
    let dir = fresh_dir(name);
    write_project(&generate_node(&shared_input(case)), &dir.join("sdk"));
    std::fs::write(dir.join("driver.ts"), driver).expect("write driver");
    std::fs::write(dir.join("package.json"), "{ \"type\": \"commonjs\" }\n").expect("write pkg");
    std::fs::write(dir.join("tsconfig.json"), driver_tsconfig()).expect("write tsconfig");
    let out = Command::new(tsc_path())
        .arg("-p")
        .arg(&dir)
        .output()
        .expect("run tsc (is the repo's node_modules installed?)");
    assert!(
        out.status.success(),
        "tsc failed:\n{}{}",
        String::from_utf8_lossy(&out.stdout),
        String::from_utf8_lossy(&out.stderr)
    );
    dir
}

/// `node dist/driver.js` with the recording CLI wired via the spec's envVar.
fn run_driver(project: &Path, env: &[(&str, String)]) -> (String, String, bool) {
    let mut cmd = Command::new("node");
    cmd.arg(project.join("dist/driver.js")).current_dir(project);
    for (key, value) in env {
        cmd.env(key, value);
    }
    let out = cmd.output().expect("run node driver (is `node` on PATH?)");
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

const NESTED_DRIVER: &str = r#"import Acme, { CliError } from './sdk/src/index';

async function main(): Promise<void> {
  const timeoutMs = process.env.XYD_SMOKE_TIMEOUT_MS;
  const client = new Acme(timeoutMs ? { timeoutMs: Number(timeoutMs) } : {});
  try {
    const res = await client.chat.completions.create('hello world', {
      model: 'gpt-4',
      temperature: 0.5,
    });
    process.stdout.write(res.stdout);
  } catch (err) {
    if (err instanceof CliError) {
      console.log(`CLIERR ${err.exitCode} ${err.stderr}`);
      return;
    }
    throw err;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
"#;

const BASIC_DRIVER: &str = r#"import Acme from './sdk/src/index';

async function main(): Promise<void> {
  const client = new Acme();
  const version = await client.optVersion();
  process.stdout.write(version.stdout);
  console.log('---');
  const status = await client.status({ format: 'json' });
  process.stdout.write(status.stdout);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
"#;

#[test]
fn node_sdk_spawns_the_cli_with_the_bound_argv() {
    if gated() {
        eprintln!("skipped (set XYD_CLI_SMOKE_NODE=1 to run)");
        return;
    }
    let recording = testkit::recording_cli_path();
    let recording = recording.to_string_lossy().to_string();

    // 02.nested — resource-tree method with positional + flags.
    let project = setup_project("02.nested", NESTED_DRIVER, "nested");

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

    // Scenario 2: non-zero exit → CliError with exit code + stderr.
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
    let project = setup_project("01.basic", BASIC_DRIVER, "basic");

    let (stdout, stderr, ok) = run_driver(&project, &[("ACME_BIN", recording)]);
    assert!(ok, "driver failed: {stderr}");
    let parts: Vec<&str> = stdout.splitn(2, "---\n").collect();
    assert_eq!(parts.len(), 2, "expected two records: {stdout}");
    assert_eq!(record_argv(parts[0]), vec!["--version"]);
    assert_eq!(record_argv(parts[1]), vec!["status", "--format", "json"]);
}
