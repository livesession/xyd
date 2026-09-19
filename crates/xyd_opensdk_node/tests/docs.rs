//! The docs capabilities vs `docs.json` — captured from the TypeScript emitter
//! before the port, so it is a true oracle.
//!
//! One golden per fixture operation: `{ chain, action, usage, typeReference }`.
//! `chain` is the resource-NAME path (root→owner) of the method the golden
//! describes, which is the first method `firstMethod` finds walking the resource
//! tree depth-first.

use std::path::{Path, PathBuf};

use serde_json::Value;
use xyd_opensdk_node::{generate_node_type_reference, generate_node_usage};

fn fixtures_dir() -> PathBuf {
    Path::new(env!("CARGO_MANIFEST_DIR")).join("__fixtures__")
}

/// Every dir carrying BOTH `input.json` and `docs.json`, at either depth: the
/// small hand-written fixtures (`1.basic/`) and the per-operation corpus
/// (`-2.complex.openai/<op>/`).
fn cases() -> Vec<(String, PathBuf)> {
    let root = fixtures_dir();
    let mut out = Vec::new();
    let Ok(entries) = std::fs::read_dir(&root) else {
        return out;
    };
    let mut dirs: Vec<PathBuf> = entries
        .filter_map(|e| e.ok())
        .map(|e| e.path())
        .filter(|p| p.is_dir())
        .collect();
    dirs.sort();
    for dir in dirs {
        let name = dir.file_name().unwrap().to_string_lossy().to_string();
        if dir.join("input.json").exists() {
            if dir.join("docs.json").exists() {
                out.push((name, dir));
            }
            continue;
        }
        let Ok(subs) = std::fs::read_dir(&dir) else {
            continue;
        };
        let mut subdirs: Vec<PathBuf> = subs
            .filter_map(|e| e.ok())
            .map(|e| e.path())
            .filter(|p| p.is_dir())
            .collect();
        subdirs.sort();
        for sub in subdirs {
            if sub.join("input.json").exists() && sub.join("docs.json").exists() {
                let leaf = sub.file_name().unwrap().to_string_lossy().to_string();
                out.push((format!("{name}/{leaf}"), sub));
            }
        }
    }
    out
}

/// Walk the resource tree by the golden's `chain` and take that resource's FIRST
/// method — exactly the method `firstMethod` handed the TypeScript emitter.
fn method_for<'a>(spec: &'a Value, chain: &[String]) -> &'a Value {
    let mut resources = spec.get("resources").and_then(Value::as_array);
    let mut found: Option<&Value> = None;
    for segment in chain {
        let list = resources.expect("chain walks past the resource tree");
        let resource = list
            .iter()
            .find(|r| r.get("name").and_then(Value::as_str) == Some(segment.as_str()))
            .expect("chain names a resource that is not in the IR");
        found = Some(resource);
        resources = resource.get("resources").and_then(Value::as_array);
    }
    found
        .expect("empty chain")
        .get("methods")
        .and_then(Value::as_array)
        .and_then(|m| m.first())
        .expect("the chained resource carries no method")
}

/// The first line at which two strings differ, rendered for a failure message.
fn first_diff(got: &str, want: &str) -> String {
    let (mut g, mut w) = (got.lines(), want.lines());
    let mut line = 1;
    loop {
        match (g.next(), w.next()) {
            (None, None) => return "(identical line-wise; trailing newline differs)".to_string(),
            (a, b) if a == b => line += 1,
            (a, b) => {
                return format!(
                    "line {line}:\n     got: {:?}\n    want: {:?}",
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

    let mut failures = Vec::new();
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
        let method = method_for(&spec, &chain).clone();

        let usage = generate_node_usage(&spec, &chain, &method, &Value::Null);
        let want_usage = golden["usage"].as_str().unwrap();
        if usage != want_usage {
            failures.push(format!("{id} [usage] {}", first_diff(&usage, want_usage)));
        }

        let tr = serde_json::to_value(generate_node_type_reference(
            &spec,
            &chain,
            &method,
            &Value::Null,
        ))
        .unwrap();
        if tr != golden["typeReference"] {
            failures.push(format!(
                "{id} [typeReference]\n     got: {}\n    want: {}",
                serde_json::to_string(&tr).unwrap(),
                serde_json::to_string(&golden["typeReference"]).unwrap()
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

/// `baseUrlEnv` — the DOCS-ONLY emitter option, exercised only during a snippet
/// RUN — is invisible to the goldens (they are all captured with an empty bag),
/// so it needs its own guard: SET it adds exactly one `baseURL` line, and the
/// unset/empty cases must stay byte-identical to the golden.
#[test]
fn base_url_env_adds_one_client_option_and_is_otherwise_inert() {
    let dir = fixtures_dir().join("1.basic");
    let spec: Value =
        serde_json::from_str(&std::fs::read_to_string(dir.join("input.json")).unwrap()).unwrap();
    let golden: Value =
        serde_json::from_str(&std::fs::read_to_string(dir.join("docs.json")).unwrap()).unwrap();
    let chain = vec!["pets".to_string()];
    let method = method_for(&spec, &chain).clone();
    let baseline = golden["usage"].as_str().unwrap();

    let with_env = generate_node_usage(
        &spec,
        &chain,
        &method,
        &serde_json::json!({ "baseUrlEnv": "TEST_API_BASE_URL" }),
    );
    assert!(
        with_env.contains("  baseURL: process.env[\"TEST_API_BASE_URL\"],\n"),
        "baseUrlEnv did not reach the client options:\n{with_env}"
    );
    assert_eq!(
        with_env.replace("  baseURL: process.env[\"TEST_API_BASE_URL\"],\n", ""),
        baseline,
        "baseUrlEnv changed more than the one baseURL line"
    );

    // An empty bag and an EMPTY string are both falsy in the TS original.
    for options in [
        serde_json::json!({}),
        serde_json::json!({ "baseUrlEnv": "" }),
    ] {
        assert_eq!(
            generate_node_usage(&spec, &chain, &method, &options),
            baseline,
            "an unset/empty baseUrlEnv must leave the golden untouched"
        );
    }
}
