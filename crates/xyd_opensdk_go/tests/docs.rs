//! The docs capabilities vs `docs.json` — captured from the TypeScript emitter
//! before the port, so it is a true oracle. Every fixture directory that carries
//! both an `input.json` (the per-operation IR) and a `docs.json` (the frozen
//! `generateUsage` / `generateTypeReference` output) is one case.

use std::path::{Path, PathBuf};

use serde_json::Value;
use xyd_opensdk_go::{generate_go_type_reference, generate_go_usage};

fn fixtures_dir() -> PathBuf {
    Path::new(env!("CARGO_MANIFEST_DIR")).join("__fixtures__")
}

fn read_json(path: &Path) -> Value {
    let text =
        std::fs::read_to_string(path).unwrap_or_else(|e| panic!("read {}: {e}", path.display()));
    serde_json::from_str(&text).unwrap_or_else(|e| panic!("parse {}: {e}", path.display()))
}

fn sorted_dirs(dir: &Path) -> Vec<PathBuf> {
    let Ok(entries) = std::fs::read_dir(dir) else {
        return Vec::new();
    };
    let mut out: Vec<PathBuf> = entries
        .flatten()
        .map(|e| e.path())
        .filter(|p| p.is_dir())
        .collect();
    out.sort();
    out
}

/// Every dir carrying BOTH `input.json` and `docs.json`, at either depth: the
/// small hand-written fixtures (`1.basic/`) and the per-operation corpus
/// (`-2.complex.openai/<op>/`).
fn cases() -> Vec<(String, PathBuf)> {
    let root = fixtures_dir();
    let mut out = Vec::new();
    let mut push = |id: String, dir: &Path| {
        if dir.join("input.json").is_file() && dir.join("docs.json").is_file() {
            out.push((id, dir.to_path_buf()));
        }
    };
    for dir in sorted_dirs(&root) {
        let name = dir.file_name().unwrap().to_string_lossy().to_string();
        if dir.join("input.json").is_file() {
            push(name, &dir);
            continue;
        }
        for sub in sorted_dirs(&dir) {
            let sub_name = sub.file_name().unwrap().to_string_lossy().to_string();
            push(format!("{name}/{sub_name}"), &sub);
        }
    }
    out
}

/// The first (segments, method) in an IR's resource tree — `firstMethod` in the
/// TypeScript harness, which is what `docs.json` describes.
fn first_method(resources: Option<&Vec<Value>>, prefix: &[String]) -> Option<(Vec<String>, Value)> {
    for r in resources? {
        let mut seg = prefix.to_vec();
        seg.push(r.get("name")?.as_str()?.to_string());
        if let Some(methods) = r.get("methods").and_then(Value::as_array) {
            if let Some(first) = methods.first() {
                return Some((seg, first.clone()));
            }
        }
        if let Some(found) = first_method(r.get("resources").and_then(Value::as_array), &seg) {
            return Some(found);
        }
    }
    None
}

/// The 1-based line number and both sides of the first differing line.
fn first_diff_line(got: &str, want: &str) -> String {
    let mut g = got.lines();
    let mut w = want.lines();
    let mut n = 0;
    loop {
        n += 1;
        match (g.next(), w.next()) {
            (None, None) => return "(identical lines; trailing newline differs)".to_string(),
            (a, b) if a == b => continue,
            (a, b) => {
                return format!(
                    "line {n}:\n      got:  {:?}\n      want: {:?}",
                    a.unwrap_or("<eof>"),
                    b.unwrap_or("<eof>")
                )
            }
        }
    }
}

#[test]
fn docs_match_the_typescript_golden() {
    let cases = cases();
    assert!(
        !cases.is_empty(),
        "no docs.json found — the oracle would pass vacuously"
    );
    // A floor, not an equality: the corpus may grow, but a silently shrinking
    // one would quietly narrow the oracle without failing anything.
    assert!(
        cases.len() >= 248,
        "only {} docs fixtures found (expected >= 248) — the corpus shrank",
        cases.len()
    );

    let mut failures: Vec<String> = Vec::new();
    for (id, dir) in &cases {
        let spec = read_json(&dir.join("input.json"));
        let golden = read_json(&dir.join("docs.json"));
        let chain: Vec<String> = golden["chain"]
            .as_array()
            .expect("golden chain")
            .iter()
            .map(|v| v.as_str().expect("chain segment").to_string())
            .collect();
        let (segments, method) = first_method(spec.get("resources").and_then(Value::as_array), &[])
            .unwrap_or_else(|| panic!("{id}: no method in input.json"));
        assert_eq!(segments, chain, "{id}: firstMethod chain disagrees");

        let usage = generate_go_usage(&spec, &chain, &method, &Value::Null);
        let want_usage = golden["usage"].as_str().expect("golden usage");
        if usage != want_usage {
            failures.push(format!(
                "  {id} [usage] {}",
                first_diff_line(&usage, want_usage)
            ));
        }

        let tr = serde_json::to_value(generate_go_type_reference(
            &spec,
            &chain,
            &method,
            &Value::Null,
        ))
        .expect("serialize type reference");
        if tr != golden["typeReference"] {
            failures.push(format!(
                "  {id} [typeReference]\n      got:  {}\n      want: {}",
                tr, golden["typeReference"]
            ));
        }
    }

    assert!(
        failures.is_empty(),
        "{} of {} cases differ:\n{}",
        failures.len(),
        cases.len(),
        failures.join("\n")
    );
}
