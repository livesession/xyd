//! Tier-1 byte-golden parity: `generate_node(input.json)` must reproduce every
//! in-scope generated file under each fixture's `output/` tree, byte-for-byte.
//! Self-contained (no shared parity crate) — walks the fixtures package directly.

use std::collections::BTreeMap;
use std::fs;
use std::path::{Path, PathBuf};

use xyd_opensdk_node::generate_node;

const FIXTURES: &[&str] = &["1.basic", "2.wire", "3.unions", "9.x-open-sdk"];

fn fixtures_dir() -> PathBuf {
    Path::new(env!("CARGO_MANIFEST_DIR")).join("../../packages/xyd-opensdk-node/__fixtures__")
}

/// In-scope for this fork: project scaffold + client/types/resources. The
/// deferred runtime (`src/core/**`) and generated tests (`tests/**`,
/// `tsconfig.test.json`) are intentionally NOT produced.
fn is_in_scope(rel: &str) -> bool {
    matches!(rel, "package.json" | "tsconfig.json" | "README.md")
        || (rel.starts_with("src/") && !rel.starts_with("src/core/"))
}

/// Collect the expected in-scope golden files as `{ relPath: contents }`.
fn golden_in_scope(output_dir: &Path) -> BTreeMap<String, String> {
    let mut out = BTreeMap::new();
    walk(output_dir, output_dir, &mut out);
    out.retain(|rel, _| is_in_scope(rel));
    out
}

fn walk(root: &Path, dir: &Path, out: &mut BTreeMap<String, String>) {
    for entry in fs::read_dir(dir).expect("read_dir output/") {
        let entry = entry.unwrap();
        let path = entry.path();
        if path.is_dir() {
            walk(root, &path, out);
        } else {
            let rel = path
                .strip_prefix(root)
                .unwrap()
                .to_string_lossy()
                .replace('\\', "/");
            let content = fs::read_to_string(&path).expect("read golden file");
            out.insert(rel, content);
        }
    }
}

#[test]
fn node_emitter_byte_golden_parity() {
    let mut total_files = 0usize;
    let mut total_match = 0usize;

    for name in FIXTURES {
        let dir = fixtures_dir().join(name);
        let input = fs::read_to_string(dir.join("input.json"))
            .unwrap_or_else(|_| panic!("missing {name}/input.json"));
        let spec: serde_json::Value =
            serde_json::from_str(&input).expect("input.json is not valid JSON");

        let emitted = generate_node(&spec);
        let golden = golden_in_scope(&dir.join("output"));

        // Every in-scope golden must be emitted, and vice versa (no drift).
        let emitted_keys: Vec<&String> = emitted.keys().collect();
        let golden_keys: Vec<&String> = golden.keys().collect();
        assert_eq!(
            emitted_keys, golden_keys,
            "[{name}] emitted file set differs from in-scope golden set\n  emitted: {emitted_keys:?}\n  golden:  {golden_keys:?}"
        );

        let mut fixture_match = 0usize;
        for (rel, want) in &golden {
            total_files += 1;
            let got = emitted
                .get(rel)
                .unwrap_or_else(|| panic!("[{name}] {rel} not emitted"));
            if got == want {
                fixture_match += 1;
                total_match += 1;
            } else {
                // Surface the first differing line for a fast diagnosis.
                let first_diff = got
                    .lines()
                    .zip(want.lines())
                    .enumerate()
                    .find(|(_, (a, b))| a != b);
                let detail = match first_diff {
                    Some((i, (a, b))) => format!(
                        "first diff at line {}:\n  got:  {a:?}\n  want: {b:?}",
                        i + 1
                    ),
                    None => format!(
                        "length differs: got {} bytes, want {} bytes",
                        got.len(),
                        want.len()
                    ),
                };
                panic!("[{name}] {rel} mismatch — {detail}");
            }
        }
        println!(
            "[{name}] {fixture_match}/{} in-scope files byte-exact",
            golden.len()
        );
    }

    println!(
        "TOTAL: {total_match}/{total_files} in-scope files byte-exact across {} fixtures",
        FIXTURES.len()
    );
    assert_eq!(total_match, total_files, "some in-scope files diverged");
}
