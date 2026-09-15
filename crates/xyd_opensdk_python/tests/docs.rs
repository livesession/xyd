//! The docs capabilities vs `docs.json` — captured from the TypeScript
//! emitter before the port, so it is a true oracle.

use std::path::{Path, PathBuf};

use serde_json::Value;
use xyd_opensdk_python::{generate_python_type_reference, generate_python_usage};

fn fixtures_dir() -> PathBuf {
    Path::new(env!("CARGO_MANIFEST_DIR")).join("__fixtures__")
}

/// Every dir carrying BOTH `input.json` and `docs.json`, at either depth: the
/// small hand-written fixtures (`1.basic/`) and the per-operation corpus
/// entries (`-2.complex.openai/<op>/`).
fn cases() -> Vec<(String, PathBuf)> {
    let root = fixtures_dir();
    let mut out = Vec::new();
    let Ok(entries) = std::fs::read_dir(&root) else {
        return out;
    };
    let mut tops: Vec<PathBuf> = entries.flatten().map(|e| e.path()).collect();
    tops.sort();
    for dir in tops {
        if !dir.is_dir() {
            continue;
        }
        let name = dir.file_name().unwrap().to_string_lossy().to_string();
        if dir.join("input.json").is_file() {
            if dir.join("docs.json").is_file() {
                out.push((name, dir));
            }
            continue;
        }
        let Ok(subs) = std::fs::read_dir(&dir) else {
            continue;
        };
        let mut subs: Vec<PathBuf> = subs.flatten().map(|e| e.path()).collect();
        subs.sort();
        for sub in subs {
            if !sub.is_dir() {
                continue;
            }
            if sub.join("input.json").is_file() && sub.join("docs.json").is_file() {
                let leaf = sub.file_name().unwrap().to_string_lossy().to_string();
                out.push((format!("{name}/{leaf}"), sub));
            }
        }
    }
    out
}

/// Resolve the method the golden describes: walk the resource tree by `chain`
/// and take the node's first method (what the TS `firstMethod` picked).
fn method_at<'a>(spec: &'a Value, chain: &[String]) -> Option<&'a Value> {
    let mut level: &[Value] = spec.get("resources")?.as_array()?;
    let mut node: Option<&Value> = None;
    for segment in chain {
        let found = level
            .iter()
            .find(|r| r.get("name").and_then(Value::as_str) == Some(segment.as_str()))?;
        node = Some(found);
        level = found
            .get("resources")
            .and_then(Value::as_array)
            .map(Vec::as_slice)
            .unwrap_or(&[]);
    }
    node?.get("methods")?.as_array()?.first()
}

/// The first line on which two strings differ, rendered for a test failure.
fn first_diff(got: &str, want: &str) -> String {
    let g: Vec<&str> = got.lines().collect();
    let w: Vec<&str> = want.lines().collect();
    for i in 0..g.len().max(w.len()) {
        let (a, b) = (g.get(i).copied(), w.get(i).copied());
        if a != b {
            return format!("line {}:\n     got {:?}\n    want {:?}", i + 1, a, b);
        }
    }
    "(only trailing-newline differs)".to_string()
}

#[test]
fn docs_match_the_typescript_golden() {
    let cases = cases();
    assert!(
        !cases.is_empty(),
        "no docs.json found — the oracle would pass vacuously"
    );

    let mut failures: Vec<String> = Vec::new();
    for (id, dir) in &cases {
        let spec: Value =
            serde_json::from_str(&std::fs::read_to_string(dir.join("input.json")).unwrap())
                .unwrap();
        let golden: Value =
            serde_json::from_str(&std::fs::read_to_string(dir.join("docs.json")).unwrap()).unwrap();
        let chain: Vec<String> = golden["chain"]
            .as_array()
            .unwrap()
            .iter()
            .map(|v| v.as_str().unwrap().to_string())
            .collect();
        let method = method_at(&spec, &chain)
            .unwrap_or_else(|| panic!("{id}: no method at chain {chain:?}"));

        let usage = generate_python_usage(&spec, &chain, method, &Value::Null);
        let want_usage = golden["usage"].as_str().unwrap();
        if usage != want_usage {
            failures.push(format!("{id}: usage {}", first_diff(&usage, want_usage)));
        }

        let tr = serde_json::to_value(generate_python_type_reference(
            &spec,
            &chain,
            method,
            &Value::Null,
        ))
        .unwrap();
        if tr != golden["typeReference"] {
            failures.push(format!(
                "{id}: typeReference\n     got {}\n    want {}",
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

/// `baseUrlEnv` is the one DOCS-only emitter option: it adds a `base_url=` line
/// so the snippet can target a recording server. No golden covers it (the docs
/// pipeline passes `emitterOptions: {}`), so it is pinned against the golden it
/// must differ from by EXACTLY that one line.
#[test]
fn base_url_env_adds_one_line_to_the_golden_snippet() {
    let dir = fixtures_dir().join("1.basic");
    let spec: Value =
        serde_json::from_str(&std::fs::read_to_string(dir.join("input.json")).unwrap()).unwrap();
    let golden: Value =
        serde_json::from_str(&std::fs::read_to_string(dir.join("docs.json")).unwrap()).unwrap();
    let chain = vec!["pets".to_string()];
    let method = method_at(&spec, &chain).unwrap();

    let want = golden["usage"].as_str().unwrap().replace(
        "    api_key=os.environ.get(\"PETSTORE_API_KEY\"),\n",
        "    api_key=os.environ.get(\"PETSTORE_API_KEY\"),\n    base_url=os.environ.get(\"XYD_BASE\"),\n",
    );
    let got = generate_python_usage(
        &spec,
        &chain,
        method,
        &serde_json::json!({ "baseUrlEnv": "XYD_BASE" }),
    );
    assert_eq!(got, want, "{}", first_diff(&got, &want));
}
