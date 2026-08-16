//! Tier-1 fixture parity for the portable uniform runtime: the
//! uniformToInputJsonSchema converter, pluginJsonView, and pluginNavigation.
//! Oracles regen JS-side only: UNIFORM_BUILD_FIXTURES=1 pnpm vitest run.

use serde_json::{json, Value};
use xyd_uniform::canon;
use xyd_uniform::converters::uniform_to_input_json_schema;
use xyd_uniform::plugins::{plugin_json_view, plugin_navigation};

fn fixture(name: &str) -> std::path::PathBuf {
    xyd_parity::fixtures_dir(env!("CARGO_MANIFEST_DIR"), "xyd-uniform").join(name)
}

fn read(path: &std::path::Path) -> Value {
    serde_json::from_str(&std::fs::read_to_string(path).unwrap_or_else(|e| {
        panic!("read {}: {e}", path.display());
    }))
    .expect("parse json")
}

fn assert_case(name: &str, actual: &Value) {
    let case = fixture(name);
    let oracle = xyd_parity::read_oracle(&case);
    if std::env::var("XYD_PARITY_DUMP").as_deref() == Ok("1") {
        std::fs::write(
            case.join("output.rust.json"),
            serde_json::to_string_pretty(actual).unwrap(),
        )
        .unwrap();
    }
    let diffs = canon::diff_paths(actual, &oracle, 12);
    assert!(
        diffs.is_empty(),
        "{name}: PARITY FAILED — first divergences:\n{}",
        diffs
            .iter()
            .map(|(p, a, b)| format!("  at {p}\n    rust:   {a}\n    oracle: {b}"))
            .collect::<Vec<_>>()
            .join("\n")
    );
}

fn run_converters(name: &str) {
    let input = read(&fixture(name).join("input.json"));
    // Mirrors the vitest harness: an ARRAY input maps the converter over each
    // element, dropping nulls; a single object converts directly.
    let actual = match &input {
        Value::Array(items) => Value::Array(
            items
                .iter()
                .filter_map(uniform_to_input_json_schema)
                .collect(),
        ),
        other => uniform_to_input_json_schema(other).unwrap_or(Value::Null),
    };
    assert_case(name, &actual);
}

fn run_json_view(name: &str) {
    let input = read(&fixture(name).join("input.json"));
    let refs = input.as_array().expect("Reference[] input");
    let views = plugin_json_view(refs);
    let actual = Value::Array(views.into_iter().map(Value::String).collect());
    assert_case(name, &actual);
}

fn run_navigation(name: &str) {
    let input = read(&fixture(name).join("input.json"));
    let settings = input.get("settings").cloned().unwrap_or(json!({}));
    let url_prefix = input
        .get("options")
        .and_then(|o| o.get("urlPrefix"))
        .and_then(|u| u.as_str())
        .unwrap_or("");
    let refs: Vec<Value> = input
        .get("references")
        .and_then(|r| r.as_array())
        .cloned()
        .expect("references input");
    let out = plugin_navigation(&settings, url_prefix, &refs).expect("plugin ok");
    let actual = json!({
        "pageFrontMatter": out.page_front_matter,
        "sidebar": out.sidebar,
    });
    assert_case(name, &actual);
}

macro_rules! case {
    ($test:ident, $runner:ident, $name:literal) => {
        #[test]
        fn $test() {
            $runner($name);
        }
    };
}

case!(converters_basic, run_converters, "1.converters.basic");
case!(converters_advanced, run_converters, "1.converters.advanced");
case!(
    converters_advanced_livesession,
    run_converters,
    "1.converters.advanced-livesession"
);
case!(
    json_view_quoted,
    run_json_view,
    "2.plugin-json-view.quoted-examples"
);
case!(
    json_view_unquoted,
    run_json_view,
    "2.plugin-json-view.unquoted-examples"
);
case!(
    json_view_reordered,
    run_json_view,
    "2.plugin-json-view.reordered-props"
);
case!(
    navigation_nested,
    run_navigation,
    "4.plugin-navigation.nested-subgroup"
);
case!(
    navigation_flat,
    run_navigation,
    "4.plugin-navigation.flat-groups"
);
case!(
    navigation_url_prefix,
    run_navigation,
    "4.plugin-navigation.url-prefix"
);
case!(
    navigation_store_mode,
    run_navigation,
    "4.plugin-navigation.store-mode"
);
