//! Tier-1 fixture parity for the MCP → Uniform converter. The harness
//! replicates the JS wrapper's post-fetch state: tools/resources extracted
//! from the fixture's stubbed JSON-RPC responses (or the local manifest),
//! transport derived from the URL exactly like `mcpUrlToReferences`.
//! The 5.auth-bearer header behavior is JS-side (covered by tier 2).

use serde_json::Value;
use xyd_mcp_uniform::{mcp_to_references, McpSurface};
use xyd_uniform::canon;

fn fixture(name: &str) -> std::path::PathBuf {
    xyd_parity::fixtures_dir(env!("CARGO_MANIFEST_DIR"), "xyd-mcp-uniform").join(name)
}

fn read(path: &std::path::Path) -> Value {
    serde_json::from_str(&std::fs::read_to_string(path).unwrap()).expect("parse json")
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

const EMPTY: &Vec<Value> = &Vec::new();

fn list<'a>(v: Option<&'a Value>, key: &str) -> &'a Vec<Value> {
    v.and_then(|x| x.get(key))
        .and_then(|x| x.as_array())
        .unwrap_or(EMPTY)
}

fn run_rpc_case(name: &str) {
    let input = read(&fixture(name).join("input.json"));
    let url = input.get("url").and_then(|u| u.as_str()).unwrap_or("");
    let transport = if url.contains("/sse") { "sse" } else { "http" };
    let responses = input.get("responses");
    let tools = list(responses.and_then(|r| r.get("tools/list")), "tools");
    let resources = list(responses.and_then(|r| r.get("resources/list")), "resources");

    let refs = mcp_to_references(&McpSurface {
        tools,
        resources,
        server_url: url,
        transport,
    });
    assert_case(name, &Value::Array(refs));
}

fn run_manifest_case(name: &str) {
    let manifest = read(&fixture(name).join("manifest.json"));
    let server_url = manifest
        .get("serverUrl")
        .and_then(|u| u.as_str())
        .filter(|u| !u.is_empty())
        .unwrap_or("");
    let tools = list(Some(&manifest), "tools");
    let resources = list(Some(&manifest), "resources");

    let refs = mcp_to_references(&McpSurface {
        tools,
        resources,
        server_url,
        transport: "http",
    });
    assert_case(name, &Value::Array(refs));
}

macro_rules! rpc_case {
    ($test:ident, $name:literal) => {
        #[test]
        fn $test() {
            run_rpc_case($name);
        }
    };
}

rpc_case!(basic, "1.basic");
rpc_case!(nested_schema, "2.nested-schema");
rpc_case!(multiple_tools, "3.multiple-tools");
rpc_case!(resources, "4.resources");
rpc_case!(auth_bearer, "5.auth-bearer");

#[test]
fn local_manifest() {
    run_manifest_case("6.local-manifest");
}
