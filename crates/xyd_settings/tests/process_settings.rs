//! Tier-1 parity for the settings data plane (env substitution + sync presets).
//! Each `fixtures/process_settings/<case>/` holds `input.json` (a real or
//! synthetic docs.json), `env.json` (the `process.env` snapshot), and
//! `output.json` — the JS-OWNED oracle produced by the live `postLoadSetupJS`
//! (`SETTINGS_BUILD_FIXTURES=1 pnpm --filter @xyd-js/plugin-docs test`). Rust
//! must reproduce that byte-for-byte. The same fixtures drive the through-shim
//! both-mode vitest test, so JS, Rust, and the shim can never silently drift.

use serde_json::{Map, Value};
use xyd_parity::{assert_parity, fixture_cases};

#[test]
fn process_settings_fixtures() {
    let fixtures =
        std::path::Path::new(env!("CARGO_MANIFEST_DIR")).join("fixtures/process_settings");
    let cases = fixture_cases(&fixtures);
    assert!(!cases.is_empty(), "no process_settings fixtures found");

    for case in cases {
        let input: Value = serde_json::from_str(
            &std::fs::read_to_string(case.join("input.json")).expect("read input.json"),
        )
        .expect("parse input.json");

        let env: Map<String, Value> = match serde_json::from_str::<Value>(
            &std::fs::read_to_string(case.join("env.json")).expect("read env.json"),
        )
        .expect("parse env.json")
        {
            Value::Object(m) => m,
            _ => panic!("env.json must be an object in {}", case.display()),
        };

        let actual = xyd_settings::process_settings(&input, &env);
        assert_parity(&case, &actual);
    }
}
