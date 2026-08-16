//! Full-tree byte-golden parity: `generate_node(input.json)` must reproduce
//! EVERY file under each fixture's `output/` tree — byte-for-byte — with no
//! missing and no extra files. Self-contained (no shared parity crate): walks
//! the fixtures package directly. Diffs report the path + first differing line.

use std::collections::BTreeMap;
use std::fs;
use std::path::{Path, PathBuf};

use xyd_opensdk_node::generate_node;

/// Fixtures with a complete `output/` tree (the full runtime + tests set).
const FIXTURES: &[&str] = &["1.basic", "2.wire", "3.unions", "9.x-open-sdk"];

fn fixtures_dir() -> PathBuf {
    Path::new(env!("CARGO_MANIFEST_DIR")).join("../../packages/xyd-opensdk-node/__fixtures__")
}

/// Collect every golden file under `output/` as `{ relPath: contents }`.
fn golden_tree(output_dir: &Path) -> BTreeMap<String, String> {
    let mut out = BTreeMap::new();
    walk(output_dir, output_dir, &mut out);
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
            out.insert(rel, fs::read_to_string(&path).expect("read golden file"));
        }
    }
}

/// The first differing line (1-based) between two strings, or a length note.
fn first_divergence(got: &str, want: &str) -> String {
    match got
        .lines()
        .zip(want.lines())
        .enumerate()
        .find(|(_, (a, b))| a != b)
    {
        Some((i, (a, b))) => format!(
            "first diff at line {}:\n  got:  {a:?}\n  want: {b:?}",
            i + 1
        ),
        None => format!(
            "length differs: got {} bytes, want {} bytes",
            got.len(),
            want.len()
        ),
    }
}

#[test]
fn node_emitter_full_tree_byte_golden_parity() {
    let mut total_files = 0usize;
    let mut total_match = 0usize;

    for name in FIXTURES {
        let dir = fixtures_dir().join(name);
        let input = fs::read_to_string(dir.join("input.json"))
            .unwrap_or_else(|_| panic!("missing {name}/input.json"));
        let spec: serde_json::Value =
            serde_json::from_str(&input).expect("input.json is not valid JSON");

        let emitted = generate_node(&spec);
        let golden = golden_tree(&dir.join("output"));

        // (a)+(b) bidirectional set equality — every golden emitted, no extras.
        let emitted_keys: Vec<&String> = emitted.keys().collect();
        let golden_keys: Vec<&String> = golden.keys().collect();
        assert_eq!(
            emitted_keys, golden_keys,
            "[{name}] emitted file set differs from golden set\n  emitted: {emitted_keys:?}\n  golden:  {golden_keys:?}"
        );

        // (c) len floor — the two maps must be the same size.
        assert_eq!(
            emitted.len(),
            golden.len(),
            "[{name}] emitted {} files, golden has {}",
            emitted.len(),
            golden.len()
        );

        for (rel, want) in &golden {
            total_files += 1;
            let got = emitted
                .get(rel)
                .unwrap_or_else(|| panic!("[{name}] {rel} not emitted"));
            if got == want {
                total_match += 1;
            } else {
                panic!("[{name}] {rel} mismatch — {}", first_divergence(got, want));
            }
        }
        println!(
            "[{name}] {}/{} files byte-exact",
            golden.len(),
            golden.len()
        );
    }

    println!(
        "TOTAL: {total_match}/{total_files} files byte-exact across {} fixtures",
        FIXTURES.len()
    );
    assert_eq!(total_match, total_files, "some files diverged");
}
