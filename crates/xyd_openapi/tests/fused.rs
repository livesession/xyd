//! Tier-1 parity for the fused uniform endpoint: {sidebar, pageFrontMatter,
//! pages} against fused.golden.json — goldens generated FROM THE JS IMPLS
//! (XYD_NATIVE=0 bun scripts/build-fused-goldens.ts in packages/xyd-openapi).
//! 5.xdocs.sidebar exercises the ported x-docs sidebar plugin end-to-end
//! (canonical rewrites, group paths, endpoint + object pages).

use serde_json::{json, Value};
use xyd_openapi::fused::{uniform_oas_pages, FusedInput};
use xyd_uniform::canon;

fn run_case(name: &str) {
    let fixtures = xyd_parity::fixtures_dir(env!("CARGO_MANIFEST_DIR"), "xyd-openapi");
    let case = fixtures.join(name);
    let golden_path = case.join("fused.golden.json");
    let golden: Value =
        serde_json::from_str(&std::fs::read_to_string(&golden_path).unwrap()).unwrap();
    let url_prefix = golden.get("urlPrefix").and_then(|u| u.as_str()).unwrap();

    let out = uniform_oas_pages(&FusedInput {
        source: case.join("input.yaml").to_string_lossy().to_string(),
        url_prefix: url_prefix.to_string(),
        match_route: String::new(),
        options_url_prefix: String::new(),
        store: false,
    })
    .unwrap_or_else(|e| panic!("{name}: fused failed: {e}"));

    let actual = json!({
        "urlPrefix": out.url_prefix,
        "sidebar": out.sidebar,
        "pageFrontMatter": out.page_front_matter,
        "pages": out.pages,
    });

    if std::env::var("XYD_PARITY_DUMP").as_deref() == Ok("1") {
        std::fs::write(
            case.join("fused.rust.json"),
            serde_json::to_string_pretty(&actual).unwrap(),
        )
        .unwrap();
    }

    let diffs = canon::diff_paths(&actual, &golden, 12);
    assert!(
        diffs.is_empty(),
        "{name}: FUSED PARITY FAILED — first divergences:\n{}",
        diffs
            .iter()
            .map(|(p, a, b)| format!("  at {p}\n    rust:   {a}\n    oracle: {b}"))
            .collect::<Vec<_>>()
            .join("\n")
    );
}

macro_rules! fused_case {
    ($test:ident, $name:literal) => {
        #[test]
        fn $test() {
            run_case($name);
        }
    };
}

fused_case!(basic, "1.basic");
fused_case!(more, "2.more");
fused_case!(multiple_responses, "3.multiple-responses");
fused_case!(xdocs_sidebar, "5.xdocs.sidebar");
fused_case!(enums, "8.enums");
