//! Tier-1 fixture parity for the OpenAPI → OpenCLI converter. The 5 fixtures
//! are pre-flattened OpenAPI (no $ref/allOf), so read_spec + convert matches
//! the JS `deferencedOpenAPI → openapi2opencli`. (-2.complex.openai is the
//! separate conformance oracle, not a golden fixture.)

use serde_json::Value;
use xyd_openapi2opencli::openapi2opencli_from_file;
use xyd_uniform::canon;

fn run_case(name: &str) {
    let fixtures = xyd_parity::fixtures_dir(env!("CARGO_MANIFEST_DIR"), "xyd-openapi2opencli");
    let case = fixtures.join(name);
    let input = case.join("input.yaml");
    assert!(input.exists(), "{name}: no input.yaml");

    let spec = openapi2opencli_from_file(input.to_str().unwrap(), None)
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
                trunc(a),
                trunc(b)
            ))
            .collect::<Vec<_>>()
            .join("\n")
    );
}

fn trunc(v: &Value) -> String {
    let s = v.to_string();
    if s.len() <= 200 {
        s
    } else {
        let mut e = 200;
        while !s.is_char_boundary(e) {
            e -= 1;
        }
        format!("{}…", &s[..e])
    }
}

macro_rules! c {
    ($t:ident, $n:literal) => {
        #[test]
        fn $t() {
            run_case($n);
        }
    };
}
c!(basic, "1.basic");
c!(crud, "2.crud");
c!(nested, "3.nested");
c!(body_flatten, "4.body-flatten");
c!(responses, "5.responses");
