//! Byte-golden parity for the Node emitter.
//!
//! Test 1 (full-tree): `generate_node(input.json)` must reproduce EVERY file
//! under each fixture's `output/` tree — byte-for-byte — with no missing and no
//! extra files. Self-contained (no shared parity crate): walks the fixtures
//! package directly. Diffs report the path + first differing line.
//!
//! Test 2 (per-method): the `-2.complex.<name>/<op>/{input.json,output.ts}`
//! corpora, where `output.ts` is exactly the single top-level
//! `src/resources/<resource>.ts` for a one-method IR slice. WHY it exists: this
//! is the ONLY layer that exercises the resources emitter across the ~242 hard
//! real-world operation shapes (deep resource trees, unions, aliases,
//! binary/multipart bodies, pagination, idempotency). It was carried by
//! `packages/xyd-opensdk-node/__tests__/docs.test.ts`, which is being deleted —
//! without this port that coverage would vanish silently, so the guard also
//! asserts a corpus floor.

use std::collections::BTreeMap;
use std::fs;
use std::path::{Path, PathBuf};

use xyd_opensdk_node::generate_node;

/// Fixtures with a complete `output/` tree (the full runtime + tests set).
///
/// `10.sdk-behavior` / `11.sdk-behavior-pagination` set every policy dimension to
/// a NON-default value. Without them the emitter could hardcode
/// `defaultSdkBehavior()` and still pass, since `9.x-open-sdk` carries an `sdk`
/// block whose every value EQUALS the default.
const FIXTURES: &[&str] = &[
    "1.basic",
    "2.wire",
    "3.unions",
    "9.x-open-sdk",
    "10.sdk-behavior",
    "11.sdk-behavior-pagination",
];

fn fixtures_dir() -> PathBuf {
    Path::new(env!("CARGO_MANIFEST_DIR")).join("__fixtures__")
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

/// The single top-level resource `.ts` file in a generated project (the
/// interesting bit) — mirrors `resourceFileKey` in the TypeScript test: anything
/// under `src/resources/` except the barrel, which excludes the vendored runtime
/// (`src/core/**`), `src/client.ts` and `src/models.ts`.
fn resource_file_key(files: &BTreeMap<String, String>) -> Option<&String> {
    files.keys().find(|k| {
        k.starts_with("src/resources/") && k.ends_with(".ts") && *k != "src/resources/index.ts"
    })
}

/// Per-method complex corpora: `-2.complex.<name>/<op>/{input.json, output.ts}`,
/// where `output.ts` is exactly the top-level resource file for that one-method
/// IR slice. Pure (committed OpenSDK IR in → node out), so it needs neither the
/// OpenAPI converter nor the encrypted oracle spec.
#[test]
fn node_per_method_resources_are_byte_exact_vs_goldens() {
    let root = fixtures_dir();
    let mut methods: Vec<PathBuf> = Vec::new();
    for corpus in fs::read_dir(&root).unwrap_or_else(|e| panic!("read {root:?}: {e}")) {
        let corpus = corpus.unwrap().path();
        let cname = corpus.file_name().unwrap().to_string_lossy().to_string();
        if !cname.contains("complex") {
            continue;
        }
        let Ok(sub) = fs::read_dir(&corpus) else {
            continue;
        };
        for op in sub {
            let op = op.unwrap().path();
            if op.join("input.json").is_file() && op.join("output.ts").is_file() {
                methods.push(op);
            }
        }
    }
    methods.sort();

    // Floor: the corpus is 242 operations today. A handful below that absorbs
    // legitimate churn in the vendored spec; anything lower means fixtures were
    // dropped, which must NOT pass silently (this guard replaces the deleted
    // TypeScript `docs.test.ts` regen guard).
    assert!(
        methods.len() >= 235,
        "only {} per-method fixtures found (expected >= 235) — the corpus shrank",
        methods.len()
    );

    let mut matched = 0usize;
    let mut failures: Vec<String> = Vec::new();
    for op in &methods {
        let rel = op
            .strip_prefix(&root)
            .unwrap_or(op)
            .to_string_lossy()
            .to_string();
        let input = fs::read_to_string(op.join("input.json"))
            .unwrap_or_else(|e| panic!("[{rel}] read input.json: {e}"));
        let spec: serde_json::Value = serde_json::from_str(&input)
            .unwrap_or_else(|e| panic!("[{rel}] parse input.json: {e}"));

        let emitted = generate_node(&spec);
        let Some(key) = resource_file_key(&emitted) else {
            failures.push(format!("[{rel}] no resource .ts generated"));
            continue;
        };
        let got = &emitted[key];
        let want = fs::read_to_string(op.join("output.ts"))
            .unwrap_or_else(|e| panic!("[{rel}] read output.ts: {e}"));
        if *got == want {
            matched += 1;
        } else {
            failures.push(format!(
                "[{rel}] {key} MISMATCH — {}",
                first_divergence(got, &want)
            ));
        }
    }

    println!(
        "PER-METHOD PARITY: {matched}/{} resource .ts byte-exact",
        methods.len()
    );
    assert!(
        failures.is_empty(),
        "{} per-method file(s) diverged from golden (showing up to 10):\n{}",
        failures.len(),
        failures
            .iter()
            .take(10)
            .cloned()
            .collect::<Vec<_>>()
            .join("\n")
    );
}
