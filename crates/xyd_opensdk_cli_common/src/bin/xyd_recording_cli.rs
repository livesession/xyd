//! The recording CLI — the subprocess analog of the HTTP RecordingServer.
//! Generated SDKs under test are pointed at this binary (via the spec's
//! `x-cli.envVar`); it prints one JSON record of exactly how it was invoked,
//! so tests can diff the actual argv against expectations.
//!
//! Scriptable via env:
//!   XYD_RECORD_EXIT=<n>      exit with code n (default 0)
//!   XYD_RECORD_STDOUT=<s>    print s instead of the JSON record (json() tests)
//!   XYD_RECORD_STDERR=<s>    write s to stderr
//!   XYD_RECORD_SLEEP_MS=<n>  sleep before exiting (timeout-kill tests)

use std::io::Write;

fn main() {
    if let Ok(ms) = std::env::var("XYD_RECORD_SLEEP_MS") {
        if let Ok(ms) = ms.parse::<u64>() {
            std::thread::sleep(std::time::Duration::from_millis(ms));
        }
    }

    let argv: Vec<String> = std::env::args().skip(1).collect();
    let mut env = serde_json::Map::new();
    for (key, value) in std::env::vars() {
        if key.starts_with("XYD_RECORD_") {
            env.insert(key, serde_json::Value::String(value));
        }
    }
    let record = serde_json::json!({
        "argv": argv,
        "env": env,
        "cwd": std::env::current_dir()
            .map(|p| p.display().to_string())
            .unwrap_or_default(),
    });

    match std::env::var("XYD_RECORD_STDOUT") {
        Ok(s) => println!("{s}"),
        Err(_) => println!("{record}"),
    }
    if let Ok(s) = std::env::var("XYD_RECORD_STDERR") {
        eprint!("{s}");
        std::io::stderr().flush().ok();
    }

    let code = std::env::var("XYD_RECORD_EXIT")
        .ok()
        .and_then(|c| c.parse::<i32>().ok())
        .unwrap_or(0);
    std::process::exit(code);
}
