//! Tier-1 fixture parity for the OpenAPI → OpenSDK IR converter.
//! All 9 fixtures run — the converter is pure data-in/data-out with no
//! JS-closure post-processing, so there is no skip-list.

use serde_json::Value;
use xyd_openapi2opensdk::openapi2opensdk_from_json_file;
use xyd_uniform::canon;

fn run_case(name: &str) {
    let fixtures = xyd_parity::fixtures_dir(env!("CARGO_MANIFEST_DIR"), "xyd-openapi2opensdk");
    let case = fixtures.join(name);
    let input = case.join("input.json");
    assert!(input.exists(), "{name}: no input.json");

    let spec = openapi2opensdk_from_json_file(input.to_str().unwrap(), None)
        .unwrap_or_else(|e| panic!("{name}: convert failed: {e}"));
    let actual = serde_json::to_value(&spec).expect("serialize");

    let oracle: Value = xyd_parity::read_oracle(&case);

    if std::env::var("XYD_PARITY_DUMP").as_deref() == Ok("1") {
        std::fs::write(
            case.join("output.rust.json"),
            serde_json::to_string_pretty(&actual).unwrap(),
        )
        .unwrap();
    }

    let diffs = canon::diff_paths(&actual, &oracle, 12);
    assert!(
        diffs.is_empty(),
        "{name}: PARITY FAILED — first divergences:\n{}",
        diffs
            .iter()
            .map(|(p, a, b)| format!(
                "  at {p}\n    rust:   {}\n    oracle: {}",
                truncate(&a.to_string()),
                truncate(&b.to_string())
            ))
            .collect::<Vec<_>>()
            .join("\n")
    );
}

fn truncate(s: &str) -> String {
    if s.len() <= 220 {
        s.to_string()
    } else {
        let mut end = 220;
        while !s.is_char_boundary(end) {
            end -= 1;
        }
        format!("{}…", &s[..end])
    }
}

macro_rules! parity_case {
    ($test:ident, $name:literal) => {
        #[test]
        fn $test() {
            run_case($name);
        }
    };
}

parity_case!(basic, "1.basic");
parity_case!(allof, "2.allof");
parity_case!(wire_name, "3.wire-name");
parity_case!(discriminator, "4.discriminator");
parity_case!(const_literal, "5.const-literal");
parity_case!(offset_pagination, "6.offset-pagination");
parity_case!(allof_envelope, "7.allof-envelope");
parity_case!(idempotency, "8.idempotency");
parity_case!(x_open_sdk, "9.x-open-sdk");
