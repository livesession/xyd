//! Env-gated e2e for CLI mode: generate a real .NET SDK, compile-and-run it
//! against the recording CLI (the subprocess analog of the HTTP
//! RecordingServer), and diff the ACTUAL argv the SDK spawned against
//! expectations — plus error mapping (non-zero exit → CliException) and the
//! timeout kill.
//!
//!   XYD_CLI_SMOKE_DOTNET=1 cargo test -p xyd_opensdk_dotnet --test cli_smoke
//!
//! Default `cargo test --workspace` skips this (no dotnet toolchain required).

use std::collections::BTreeMap;
use std::path::{Path, PathBuf};
use std::process::Command;

use serde_json::Value;
use xyd_opensdk_cli_common::testkit;
use xyd_opensdk_dotnet::generate_dotnet;

fn gated() -> bool {
    std::env::var("XYD_CLI_SMOKE_DOTNET").is_err()
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
    let dir = std::env::temp_dir().join(format!(
        "xyd-dotnet-cli-smoke-{}-{name}",
        std::process::id()
    ));
    if dir.exists() {
        std::fs::remove_dir_all(&dir).expect("clear temp dir");
    }
    std::fs::create_dir_all(&dir).expect("mkdir temp dir");
    dir
}

/// The driver console project: references the generated SDK as a SIBLING
/// project (`sdk/` next to `smoke/`) so the SDK csproj's default `**/*.cs`
/// glob never swallows the driver sources.
const SMOKE_CSPROJ: &str = r#"<Project Sdk="Microsoft.NET.Sdk">

  <PropertyGroup>
    <OutputType>Exe</OutputType>
    <TargetFramework>net8.0</TargetFramework>
    <LangVersion>latest</LangVersion>
    <Nullable>enable</Nullable>
    <ImplicitUsings>disable</ImplicitUsings>
  </PropertyGroup>

  <ItemGroup>
    <ProjectReference Include="../sdk/Acme.csproj" />
  </ItemGroup>

</Project>
"#;

const NESTED_DRIVER: &str = r#"using System;
using System.Globalization;
using System.Threading.Tasks;

using Example.Acme;

class Program
{
    static async Task Main()
    {
        int? timeoutMs = null;
        string? raw = Environment.GetEnvironmentVariable("XYD_SMOKE_TIMEOUT_MS");
        if (!string.IsNullOrEmpty(raw))
        {
            timeoutMs = int.Parse(raw, CultureInfo.InvariantCulture);
        }
        var client = new AcmeClient(timeoutMs: timeoutMs);
        try
        {
            CommandResult res = await client.Chat.Completions.Create("hello world", "gpt-4", temperature: 0.5);
            Console.Write(res.Stdout);
        }
        catch (CliException ex)
        {
            Console.Write($"CLIERR {ex.ExitCode} {ex.Stderr}\n");
        }
    }
}
"#;

const BASIC_DRIVER: &str = r#"using System;
using System.Threading.Tasks;

using Example.Acme;

class Program
{
    static async Task Main()
    {
        var client = new AcmeClient();
        CommandResult version = await client.OptVersion();
        Console.Write(version.Stdout);
        Console.Write("---\n");
        CommandResult status = await client.Status(format: "json");
        Console.Write(status.Stdout);
    }
}
"#;

/// Generate the SDK into `<root>/sdk`, write the driver into `<root>/smoke`,
/// and build once (`dotnet build`); scenarios then run the built apphost
/// directly so build chatter never pollutes the driver's stdout.
fn setup(case: &str, short: &str, driver: &str) -> PathBuf {
    let root = fresh_dir(short);
    write_project(&generate_dotnet(&shared_input(case)), &root.join("sdk"));
    std::fs::create_dir_all(root.join("smoke")).unwrap();
    std::fs::write(root.join("smoke/Program.cs"), driver).unwrap();
    std::fs::write(root.join("smoke/smoke.csproj"), SMOKE_CSPROJ).unwrap();
    let out = Command::new("dotnet")
        .args(["build", "smoke", "-nologo", "-v", "q"])
        .current_dir(&root)
        .env("DOTNET_CLI_TELEMETRY_OPTOUT", "1")
        .env("DOTNET_NOLOGO", "1")
        .output()
        .expect("run dotnet build (is `dotnet` on PATH?)");
    assert!(
        out.status.success(),
        "dotnet build failed:\n{}\n{}",
        String::from_utf8_lossy(&out.stdout),
        String::from_utf8_lossy(&out.stderr)
    );
    root
}

fn smoke_bin(root: &Path) -> PathBuf {
    root.join("smoke/bin/Debug/net8.0")
        .join(if cfg!(windows) { "smoke.exe" } else { "smoke" })
}

fn run_driver(root: &Path, env: &[(&str, String)]) -> (String, String, bool) {
    let mut cmd = Command::new(smoke_bin(root));
    cmd.current_dir(root);
    for (key, value) in env {
        cmd.env(key, value);
    }
    let out = cmd.output().expect("run smoke driver");
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

#[test]
fn dotnet_sdk_spawns_the_cli_with_the_bound_argv() {
    if gated() {
        eprintln!("skipped (set XYD_CLI_SMOKE_DOTNET=1 to run)");
        return;
    }
    let recording = testkit::recording_cli_path();
    let recording = recording.to_string_lossy().to_string();

    // 02.nested — resource-tree method with positional + flags.
    let root = setup("02.nested", "nested", NESTED_DRIVER);

    // Scenario 1: argv binding (incl. invariant-culture "0.5").
    let (stdout, stderr, ok) = run_driver(&root, &[("ACME_BIN", recording.clone())]);
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
        &root,
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
        &root,
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
    let root = setup("01.basic", "basic", BASIC_DRIVER);
    let (stdout, stderr, ok) = run_driver(&root, &[("ACME_BIN", recording)]);
    assert!(ok, "driver failed: {stderr}");
    let parts: Vec<&str> = stdout.splitn(2, "---\n").collect();
    assert_eq!(parts.len(), 2, "expected two records: {stdout}");
    assert_eq!(record_argv(parts[0]), vec!["--version"]);
    assert_eq!(record_argv(parts[1]), vec!["status", "--format", "json"]);
}
