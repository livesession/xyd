//! Byte-golden parity: for every full-tree Python fixture, generate the
//! in-scope files and byte-compare each against the JS emitter's committed
//! `output/` golden. Only the files this port actually emits are compared —
//! the vendored runtime (`_transport.py`, `_pagination.py`) and `tests/*` stay
//! JS-owned and are deliberately NOT asserted here (no faked full-tree match).

use std::fs;
use std::path::{Path, PathBuf};

use xyd_opensdk_python::{generate_python, generate_resources_py};

/// `packages/xyd-opensdk-python/__fixtures__` relative to this crate.
fn fixtures_root() -> PathBuf {
    Path::new(env!("CARGO_MANIFEST_DIR")).join("../../packages/xyd-opensdk-python/__fixtures__")
}

/// Full-tree fixtures: a dir with both `input.json` and `output/pyproject.toml`
/// (excludes the per-method `-2.complex.openai/<op>/` single-file dirs).
fn discover_fixtures() -> Vec<PathBuf> {
    let mut out = Vec::new();
    let root = fixtures_root();
    let entries = fs::read_dir(&root).unwrap_or_else(|e| panic!("read {root:?}: {e}"));
    for entry in entries {
        let dir = entry.unwrap().path();
        if dir.join("input.json").is_file() && dir.join("output/pyproject.toml").is_file() {
            out.push(dir);
        }
    }
    out.sort();
    out
}

/// The 1-based line of the first differing byte-line, with both sides, or None.
fn first_divergence(a: &str, b: &str) -> Option<(usize, String, String)> {
    let al: Vec<&str> = a.split('\n').collect();
    let bl: Vec<&str> = b.split('\n').collect();
    let n = al.len().max(bl.len());
    for i in 0..n {
        let x = al.get(i).copied().unwrap_or("<EOF>");
        let y = bl.get(i).copied().unwrap_or("<EOF>");
        if x != y {
            return Some((i + 1, x.to_string(), y.to_string()));
        }
    }
    None
}

#[test]
fn python_emit_scope_is_byte_exact_vs_goldens() {
    let fixtures = discover_fixtures();
    assert!(
        !fixtures.is_empty(),
        "no full-tree Python fixtures found under {:?}",
        fixtures_root()
    );

    let mut total_files = 0usize;
    let mut matched = 0usize;
    let mut failures: Vec<String> = Vec::new();

    for fixture in &fixtures {
        let name = fixture.file_name().unwrap().to_string_lossy().to_string();
        let input = fs::read_to_string(fixture.join("input.json"))
            .unwrap_or_else(|e| panic!("[{name}] read input.json: {e}"));
        let spec: serde_json::Value = serde_json::from_str(&input)
            .unwrap_or_else(|e| panic!("[{name}] parse input.json: {e}"));

        let files = generate_python(&spec);
        assert!(
            !files.is_empty(),
            "[{name}] generate_python produced no files"
        );

        let mut fixture_matched = 0usize;
        for (rel, got) in &files {
            total_files += 1;
            let golden_path = fixture.join("output").join(rel);
            let golden = match fs::read_to_string(&golden_path) {
                Ok(g) => g,
                Err(e) => {
                    failures.push(format!(
                        "[{name}] {rel}: emitted a file with no golden ({e})"
                    ));
                    continue;
                }
            };
            if *got == golden {
                matched += 1;
                fixture_matched += 1;
            } else {
                let detail = match first_divergence(got, &golden) {
                    Some((line, g, want)) => format!(
                        "first diff at line {line}:\n      got : {g:?}\n      want: {want:?}"
                    ),
                    None => "differ only in length/trailing bytes".to_string(),
                };
                failures.push(format!(
                    "[{name}] {rel}: MISMATCH (got {} bytes, want {} bytes)\n      {detail}",
                    got.len(),
                    golden.len()
                ));
            }
        }
        println!(
            "  {name}: {fixture_matched}/{} emit-scope files byte-exact",
            files.len()
        );
    }

    println!(
        "\nPARITY: {matched}/{total_files} emit-scope files byte-exact across {} fixtures",
        fixtures.len()
    );

    assert!(
        failures.is_empty(),
        "{} file(s) diverged from golden:\n{}",
        failures.len(),
        failures.join("\n")
    );
}

/// Per-method complex corpora: `-2.complex.<name>/<op>/{input.json, output.py}`,
/// where `output.py` is exactly the `resources.py` file for that one-method IR
/// slice. This exercises the resources emitter over the hard forms (deep nested
/// resource trees, unions, aliases, binary/multipart bodies, idempotency) with
/// real emitter output — no harness merge logic involved.
#[test]
fn python_per_method_resources_are_byte_exact_vs_goldens() {
    let root = fixtures_root();
    let mut methods: Vec<PathBuf> = Vec::new();
    for corpus in fs::read_dir(&root).unwrap_or_else(|e| panic!("read {root:?}: {e}")) {
        let corpus = corpus.unwrap().path();
        let cname = corpus.file_name().unwrap().to_string_lossy();
        if !cname.contains("complex") {
            continue;
        }
        let sub = match fs::read_dir(&corpus) {
            Ok(s) => s,
            Err(_) => continue,
        };
        for op in sub {
            let op = op.unwrap().path();
            if op.join("input.json").is_file() && op.join("output.py").is_file() {
                methods.push(op);
            }
        }
    }
    methods.sort();

    // Optional layer: only asserts when the per-method corpora are present.
    if methods.is_empty() {
        println!("PER-METHOD PARITY: no per-method complex corpora found (skipped)");
        return;
    }

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
        let got = generate_resources_py(&spec);
        let golden = fs::read_to_string(op.join("output.py"))
            .unwrap_or_else(|e| panic!("[{rel}] read output.py: {e}"));
        if got == golden {
            matched += 1;
        } else {
            let detail = match first_divergence(&got, &golden) {
                Some((line, g, want)) => {
                    format!("first diff at line {line}:\n      got : {g:?}\n      want: {want:?}")
                }
                None => "differ only in length/trailing bytes".to_string(),
            };
            failures.push(format!("[{rel}] MISMATCH\n      {detail}"));
        }
    }

    println!(
        "PER-METHOD PARITY: {matched}/{} resources.py byte-exact",
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
