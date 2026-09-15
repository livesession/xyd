//! Byte-golden parity for the Rust emitter.
//!
//! Test 1 (full-tree): generate_rust(input.json) === the committed output/ tree,
//! byte-exact. Now that the emitter produces the FULL tree (adds the vendored
//! reqwest/tokio runtime + the #[tokio::test] suite), each fixture is checked
//! three ways: (a) every golden file under output/ is emitted and byte-exact,
//! (b) every emitted file has a matching golden (no extras), and (c) a
//! per-fixture floor equal to the golden file count so a silent drop can't pass.
//! Diffs report the path + first differing line. (Self-contained; no xyd_parity.)
//!
//! Test 2 (per-method): the `-2.complex.<name>/<op>/{input.json,output.rs}`
//! corpora, where `output.rs` is exactly the `src/<resource>.rs` for a one-method
//! IR slice — ~239 real OpenAI operations. This is the coverage the (now retired)
//! TypeScript `packages/xyd-opensdk-rust/__tests__/docs.test.ts` regen guard used
//! to carry; without it here, deleting that package would have silently dropped
//! the emitter's widest oracle.

use std::collections::BTreeMap;
use std::fs;
use std::path::{Path, PathBuf};

use serde_json::Value;
use xyd_opensdk_rust::generate_rust;

fn fixtures_dir() -> PathBuf {
    Path::new(env!("CARGO_MANIFEST_DIR")).join("__fixtures__")
}

/// Every file under `root`, keyed by its path relative to `root` (posix slashes).
fn read_golden_tree(root: &Path) -> BTreeMap<String, String> {
    let mut out = BTreeMap::new();
    let mut stack = vec![root.to_path_buf()];
    while let Some(dir) = stack.pop() {
        for entry in std::fs::read_dir(&dir).unwrap() {
            let path = entry.unwrap().path();
            if path.is_dir() {
                stack.push(path);
            } else {
                let rel = path
                    .strip_prefix(root)
                    .unwrap()
                    .to_string_lossy()
                    .replace('\\', "/");
                out.insert(rel, std::fs::read_to_string(&path).unwrap());
            }
        }
    }
    out
}

/// The 1-based first differing line, with both sides, for a precise report.
fn first_diff(golden: &str, got: &str) -> String {
    let g: Vec<&str> = golden.split('\n').collect();
    let r: Vec<&str> = got.split('\n').collect();
    for i in 0..g.len().max(r.len()) {
        let a = g.get(i).copied().unwrap_or("<EOF>");
        let b = r.get(i).copied().unwrap_or("<EOF>");
        if a != b {
            return format!("first diff line {}: golden={a:?} rust={b:?}", i + 1);
        }
    }
    "(identical by line; length/tail differs)".to_string()
}

fn run_case(name: &str) {
    let case = fixtures_dir().join(name);
    let input: Value =
        serde_json::from_str(&std::fs::read_to_string(case.join("input.json")).unwrap()).unwrap();
    let emitted = generate_rust(&input);
    let golden = read_golden_tree(&case.join("output"));

    let mut problems: Vec<String> = Vec::new();

    // (a) every golden is emitted and byte-exact.
    for (rel, want) in &golden {
        match emitted.get(rel) {
            None => problems.push(format!("  MISSING {rel} (golden not emitted)")),
            Some(got) if got != want => {
                problems.push(format!("  DIFF {rel}: {}", first_diff(want, got)))
            }
            Some(_) => {}
        }
    }
    // (b) every emitted file has a golden (no extras).
    for rel in emitted.keys() {
        if !golden.contains_key(rel) {
            problems.push(format!("  EXTRA {rel} (emitted with no golden)"));
        }
    }

    assert!(
        problems.is_empty(),
        "{name}: {} problem(s) vs golden tree ({} golden / {} emitted):\n{}",
        problems.len(),
        golden.len(),
        emitted.len(),
        problems.join("\n")
    );
    // (c) floor: the full golden tree must be emitted, nothing silently dropped.
    assert_eq!(
        emitted.len(),
        golden.len(),
        "{name}: emitted {} files but golden tree has {} — count drift",
        emitted.len(),
        golden.len()
    );
}

#[test]
fn basic() {
    run_case("1.basic");
}
#[test]
fn wire() {
    run_case("2.wire");
}
#[test]
fn unions() {
    run_case("3.unions");
}
#[test]
fn x_open_sdk() {
    run_case("9.x-open-sdk");
}
// The sdk-behavior fixtures: every policy dimension set to a NON-default value.
// Without them the emitter could hardcode `defaultSdkBehavior()` and still pass —
// 9.x-open-sdk carries an `sdk` block whose every value EQUALS the default.
#[test]
fn sdk_behavior() {
    run_case("10.sdk-behavior");
}
#[test]
fn sdk_behavior_pagination() {
    run_case("11.sdk-behavior-pagination");
}

// ---- Test 2: per-method regen guard (`<op>/output.rs`) --------------------

/// The single top-level resource `.rs` file in a generated project — the same
/// selection `resourceFileKey()` makes in the TypeScript `docs.test.ts`: a
/// `src/<name>.rs` that is none of the fixed runtime/plumbing files. The `src/`
/// anchor also excludes the SDK's own `tests/<resource>.rs` siblings.
fn resource_file_keys(files: &BTreeMap<String, String>) -> Vec<&String> {
    const RUNTIME: [&str; 5] = [
        "src/lib.rs",
        "src/client.rs",
        "src/models.rs",
        "src/error.rs",
        "src/transport.rs",
    ];
    files
        .keys()
        .filter(|k| {
            k.strip_prefix("src/")
                .is_some_and(|rest| rest.ends_with(".rs") && !rest.contains('/'))
                && !RUNTIME.contains(&k.as_str())
        })
        .collect()
}

/// Per-method complex corpora: `-2.complex.<name>/<op>/{input.json, output.rs}`,
/// where `output.rs` is exactly the `src/<resource>.rs` file for that one-method
/// IR slice. This exercises the service emitter over the hard forms (deep nested
/// resource trees, unions, aliases, binary/multipart bodies, pagination,
/// idempotency) with real emitter output — no harness merge logic involved.
#[test]
fn rust_per_method_resource_files_are_byte_exact_vs_goldens() {
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
            if op.join("input.json").is_file() && op.join("output.rs").is_file() {
                methods.push(op);
            }
        }
    }
    methods.sort();

    // A floor, not an equality: the corpus may grow, but a silently shrinking
    // one would quietly narrow the oracle without failing anything. 239 dirs
    // carry both files today; 230 leaves a small margin for churn.
    assert!(
        methods.len() >= 230,
        "only {} per-method rust fixtures found (expected >= 230) — the corpus shrank",
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
        let spec: Value = serde_json::from_str(&input)
            .unwrap_or_else(|e| panic!("[{rel}] parse input.json: {e}"));

        let emitted = generate_rust(&spec);
        let keys = resource_file_keys(&emitted);
        // Exactly one, or the fixture's single `output.rs` is ambiguous —
        // stricter than the TS `.find()`, which would silently take the first.
        let key = match keys.as_slice() {
            [only] => (*only).clone(),
            [] => {
                failures.push(format!("[{rel}] no resource .rs generated"));
                continue;
            }
            many => {
                failures.push(format!("[{rel}] ambiguous resource .rs: {many:?}"));
                continue;
            }
        };

        let golden = fs::read_to_string(op.join("output.rs"))
            .unwrap_or_else(|e| panic!("[{rel}] read output.rs: {e}"));
        let got = &emitted[&key];
        if got == &golden {
            matched += 1;
        } else {
            failures.push(format!("[{rel}] {key}: {}", first_diff(&golden, got)));
        }
    }

    eprintln!(
        "PER-METHOD PARITY: {matched}/{} resource .rs byte-exact",
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
