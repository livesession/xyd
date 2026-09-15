//! Byte-golden parity for the Java emitter.
//!
//! Test 1 (full-tree): `generate_java(input.json)` reproduces each fixture's
//! ENTIRE `output/` tree byte-exact — the generated code AND the vendored runtime
//! (Json, Transport, the status-mapped exception hierarchy, page containers) AND
//! the SDK's own test suite. Bidirectional: (a) every golden is emitted and
//! byte-identical, (b) nothing extra is emitted, (c) counts match. Diffs report
//! the path + first differing line.
//!
//! Test 2 (per-method): the `-2.complex.<name>/<op>/{input.json,output.java}`
//! corpora, where `output.java` is exactly the leaf `<Qualifier>Service.java` for
//! a one-method IR slice — the ~242-case oracle the deleted TypeScript
//! `__tests__/docs.test.ts` regen guard used to own. It exercises the service
//! emitter over the hard forms (deep nested resource trees, unions, aliases,
//! binary/multipart bodies, pagination, idempotency) against real emitter output.

use serde_json::Value;
use std::collections::{BTreeMap, BTreeSet};
use std::fs;
use std::path::{Path, PathBuf};

use xyd_opensdk_java::generate_java;

fn fixtures_dir() -> PathBuf {
    Path::new(env!("CARGO_MANIFEST_DIR")).join("__fixtures__")
}

/// Every file under `output/`, relative to it.
fn golden_files(out_root: &Path) -> BTreeMap<String, String> {
    let mut map = BTreeMap::new();
    fn walk(root: &Path, dir: &Path, map: &mut BTreeMap<String, String>) {
        for entry in std::fs::read_dir(dir).unwrap() {
            let path = entry.unwrap().path();
            if path.is_dir() {
                walk(root, &path, map);
            } else {
                let rel = path
                    .strip_prefix(root)
                    .unwrap()
                    .to_string_lossy()
                    .to_string();
                map.insert(rel, std::fs::read_to_string(&path).unwrap());
            }
        }
    }
    walk(out_root, out_root, &mut map);
    map
}

fn first_diff(a: &str, b: &str) -> String {
    for (i, (la, lb)) in a.lines().zip(b.lines()).enumerate() {
        if la != lb {
            return format!("line {}: rust={la:?} golden={lb:?}", i + 1);
        }
    }
    if a.lines().count() != b.lines().count() {
        return format!(
            "line count rust={} golden={}",
            a.lines().count(),
            b.lines().count()
        );
    }
    "trailing bytes differ".to_string()
}

fn check(fixture: &str) {
    let dir = fixtures_dir().join(fixture);
    let spec: Value =
        serde_json::from_str(&std::fs::read_to_string(dir.join("input.json")).unwrap()).unwrap();
    let emitted: BTreeMap<String, String> = generate_java(&spec);
    let golden = golden_files(&dir.join("output"));

    let mut problems: Vec<String> = Vec::new();

    // (a) every golden emitted + byte-exact
    for (rel, gold) in &golden {
        match emitted.get(rel) {
            Some(got) if got == gold => {}
            Some(got) => problems.push(format!("{rel}: DIFFERS ({})", first_diff(got, gold))),
            None => problems.push(format!("{rel}: in golden tree but NOT emitted")),
        }
    }
    // (b) no extras
    for rel in emitted.keys() {
        if !golden.contains_key(rel) {
            problems.push(format!("{rel}: emitted but NOT in golden tree"));
        }
    }

    let emitted_paths: BTreeSet<&String> = emitted.keys().collect();
    let golden_paths: BTreeSet<&String> = golden.keys().collect();
    let matched = golden
        .iter()
        .filter(|(k, v)| emitted.get(*k).map(|g| g == *v).unwrap_or(false))
        .count();
    println!(
        "[{fixture}] {matched}/{} golden files byte-exact",
        golden.len()
    );

    assert!(
        problems.is_empty(),
        "[{fixture}] {} problem(s):\n{}",
        problems.len(),
        problems.join("\n")
    );
    // (c) count floor — full-tree, both directions
    assert_eq!(
        emitted_paths, golden_paths,
        "[{fixture}] emitted/golden path sets differ"
    );
    assert_eq!(
        emitted.len(),
        golden.len(),
        "[{fixture}] emitted {} files, golden has {}",
        emitted.len(),
        golden.len()
    );
    assert!(!golden.is_empty(), "[{fixture}] empty golden tree");
}

#[test]
fn basic() {
    check("1.basic");
}
#[test]
fn wire() {
    check("2.wire");
}
#[test]
fn unions() {
    check("3.unions");
}
#[test]
fn x_open_sdk() {
    check("9.x-open-sdk");
}
// The sdk-behavior fixtures: every policy dimension set to a NON-default value.
// Without them the emitter could hardcode `defaultSdkBehavior()` and still pass —
// 9.x-open-sdk carries an `sdk` block whose every value EQUALS the default.
#[test]
fn sdk_behavior() {
    check("10.sdk-behavior");
}
#[test]
fn sdk_behavior_pagination() {
    check("11.sdk-behavior-pagination");
}

// ---- Test 2: per-method regen guard (`<op>/output.java`) ------------------

/// The depth of the first method in the IR — i.e. how many resources sit on the
/// chain from the root to the one declaring it (the TS `firstMethod` walk). A
/// one-method slice emits exactly one service file per link of that chain.
fn first_method_depth(resources: Option<&Vec<Value>>, depth: usize) -> Option<usize> {
    for r in resources? {
        let here = depth + 1;
        if r.get("methods")
            .and_then(Value::as_array)
            .is_some_and(|m| !m.is_empty())
        {
            return Some(here);
        }
        if let Some(found) = first_method_depth(r.get("resources").and_then(Value::as_array), here)
        {
            return Some(found);
        }
    }
    None
}

/// The leaf resource's `<Qualifier>Service.java` — the file that actually declares
/// this operation's method, i.e. the same selection `resourceFileKey()` made in the
/// TypeScript `docs.test.ts`. Java emits ONE service file per resource along the
/// chain (`AdminService`, `AdminOrganizationService`,
/// `AdminOrganizationAdminApiKeyService`), and each parent qualifier is a proper
/// prefix of its child's, so the leaf is the unique candidate whose qualifier
/// starts with every other candidate's. `<Qualifier>ServiceTest.java` (the SDK's
/// own suite) and the fixed runtime files are not `…Service.java`, so they never
/// match.
fn leaf_service_key(files: &BTreeMap<String, String>) -> Result<String, String> {
    // (key, qualifier) — the class name with the `Service.java` suffix stripped.
    let candidates: Vec<(&String, &str)> = files
        .keys()
        .filter_map(|k| {
            let file = k.rsplit('/').next().unwrap_or(k);
            file.strip_suffix("Service.java").map(|q| (k, q))
        })
        .collect();
    if candidates.is_empty() {
        return Err("no <Qualifier>Service.java generated".to_string());
    }
    let leaf: Vec<&(&String, &str)> = candidates
        .iter()
        .filter(|(_, q)| candidates.iter().all(|(_, other)| q.starts_with(other)))
        .collect();
    match leaf.as_slice() {
        [only] => Ok(only.0.clone()),
        _ => Err(format!(
            "ambiguous leaf service among {:?}",
            candidates.iter().map(|(_, q)| *q).collect::<Vec<_>>()
        )),
    }
}

/// Per-method complex corpora: `-2.complex.<name>/<op>/{input.json, output.java}`.
/// The IR slice carries exactly one operation, so its leaf service file is the whole
/// generated surface for that operation — byte equality against the committed golden
/// is the regen guard. Ported from the TypeScript `docs.test.ts` "regen guard" block
/// so that coverage survives the deletion of `packages/xyd-opensdk-java`.
#[test]
fn java_per_method_service_files_are_byte_exact_vs_goldens() {
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
            if op.join("input.json").is_file() && op.join("output.java").is_file() {
                methods.push(op);
            }
        }
    }
    methods.sort();

    // A floor, not an equality: the corpus may grow, but a silently shrinking one
    // would quietly narrow the oracle without failing anything. 242 dirs carry both
    // files today; 238 leaves a small margin for churn (same margin as the Go crate).
    assert!(
        methods.len() >= 238,
        "only {} per-method java fixtures found (expected >= 238) — the corpus shrank",
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

        let emitted = generate_java(&spec);
        let key = match leaf_service_key(&emitted) {
            Ok(k) => k,
            Err(why) => {
                failures.push(format!("[{rel}] {why}"));
                continue;
            }
        };
        // Tie the string-shape selection back to the IR: one service file per link
        // of the chain, so a dropped (or spurious) service would not pass silently.
        let depth = first_method_depth(spec.get("resources").and_then(Value::as_array), 0);
        let services = emitted
            .keys()
            .filter(|k| k.ends_with("Service.java"))
            .count();
        if depth != Some(services) {
            failures.push(format!(
                "[{rel}] {services} service file(s) for a chain of depth {depth:?}"
            ));
            continue;
        }

        let golden = fs::read_to_string(op.join("output.java"))
            .unwrap_or_else(|e| panic!("[{rel}] read output.java: {e}"));
        let got = &emitted[&key];
        if got == &golden {
            matched += 1;
        } else {
            failures.push(format!("[{rel}] {key}: {}", first_diff(got, &golden)));
        }
    }

    eprintln!(
        "PER-METHOD PARITY: {matched}/{} leaf Service.java byte-exact",
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
