//! Tier-1 byte-golden parity: for each fixture, generate_dotnet() must produce
//! the substantive IR→C# files (`.csproj`, `Client.cs`, `Models.cs`,
//! `<Resource>Service.cs`) BYTE-IDENTICAL to the committed golden `output/` tree
//! from `@xyd-js/opensdk-dotnet`. The vendored runtime (`Transport.cs`,
//! `Pagination.cs`) and generated tests (`<Sdk>.Tests/**`) are DEFERRED and not
//! compared. No faked full-tree match — every file this crate emits is checked
//! against the golden, and the count reported is only the files we own.

use std::path::PathBuf;

use serde_json::Value;
use xyd_opensdk_dotnet::generate_dotnet;

fn fixtures_root() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../../packages/xyd-opensdk-dotnet/__fixtures__")
}

/// Compare every file `generate_dotnet` emits against the golden, byte-for-byte.
/// Returns the number of files verified. Panics on any mismatch/missing golden.
fn check_fixture(name: &str) -> usize {
    let dir = fixtures_root().join(name);
    let input = std::fs::read_to_string(dir.join("input.json"))
        .unwrap_or_else(|e| panic!("read {name}/input.json: {e}"));
    let spec: Value = serde_json::from_str(&input).expect("parse input.json");

    let files = generate_dotnet(&spec);
    assert!(!files.is_empty(), "{name}: emitted no files");

    let out_dir = dir.join("output");
    let mut checked = 0usize;
    for (rel, content) in &files {
        let golden_path = out_dir.join(rel);
        let golden = std::fs::read_to_string(&golden_path).unwrap_or_else(|e| {
            panic!("{name}: golden {rel} missing/unreadable ({e}) — emitted a file the golden tree lacks")
        });
        assert_eq!(content, &golden, "{name}: byte mismatch in {rel}");
        checked += 1;
    }
    checked
}

#[test]
fn parity_1_basic() {
    // Client.cs, Models.cs, PetsService.cs, Petstore.csproj
    let n = check_fixture("1.basic");
    assert_eq!(n, 4, "1.basic: expected 4 owned files, checked {n}");
}

#[test]
fn parity_2_wire() {
    // Client.cs, Models.cs, FilesService.cs, TokensService.cs, WireKitchen.csproj
    let n = check_fixture("2.wire");
    assert_eq!(n, 5, "2.wire: expected 5 owned files, checked {n}");
}

#[test]
fn parity_3_unions() {
    // Client.cs, Models.cs, Events/Logs/ShapesService.cs, UnionDepot.csproj
    let n = check_fixture("3.unions");
    assert_eq!(n, 6, "3.unions: expected 6 owned files, checked {n}");
}

#[test]
fn parity_9_x_open_sdk() {
    // Client.cs, Models.cs, Catalog/System/ThingsService.cs, ExtensionsDemo.csproj
    let n = check_fixture("9.x-open-sdk");
    assert_eq!(n, 6, "9.x-open-sdk: expected 6 owned files, checked {n}");
}
