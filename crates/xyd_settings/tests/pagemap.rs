//! Tier-1 fixture for the nav→pagepath walk: a real content tree + nav →
//! expected mapping. md-wins-over-mdx, nested groups, SidebarRoute children,
//! and silent omission of missing files are all exercised. (End-to-end parity
//! vs JS is additionally proven by the engine byte-diff on i18n/nested/route
//! sites.)

use serde_json::Value;
use xyd_settings::pagemap::{find_index_page, map_navigation};

#[test]
fn pagemap_fixture() {
    let dir = std::path::Path::new(env!("CARGO_MANIFEST_DIR")).join("fixtures/pagemap");
    let nav: Value =
        serde_json::from_str(&std::fs::read_to_string(dir.join("nav.json")).unwrap()).unwrap();
    let expected: Value =
        serde_json::from_str(&std::fs::read_to_string(dir.join("expected.json")).unwrap()).unwrap();

    let mapping = map_navigation(&nav, &dir);
    assert_eq!(Value::Object(mapping), expected);

    assert_eq!(find_index_page(&dir), "index.md");
    assert_eq!(
        find_index_page(std::path::Path::new(env!("CARGO_MANIFEST_DIR"))),
        ""
    );
}
