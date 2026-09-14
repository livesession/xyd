//! The docs capabilities vs `docs.json` — captured from the TypeScript emitter
//! before the port, so it is a true oracle. `usage` must match BYTE-EXACTLY and
//! `typeReference` must serialize to exactly the golden's JSON shape.

use std::path::{Path, PathBuf};

use serde_json::Value;
use xyd_opensdk_dotnet::{generate_dotnet_type_reference, generate_dotnet_usage};

fn fixtures_dir() -> PathBuf {
    Path::new(env!("CARGO_MANIFEST_DIR")).join("../../packages/xyd-opensdk-dotnet/__fixtures__")
}

fn has(dir: &Path, file: &str) -> bool {
    dir.join(file).is_file()
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
    let mut tops: Vec<PathBuf> = entries.flatten().map(|e| e.path()).collect();
    tops.sort();
    for dir in tops {
        if !dir.is_dir() {
            continue;
        }
        let top = dir.file_name().unwrap().to_string_lossy().to_string();
        if has(&dir, "input.json") && has(&dir, "docs.json") {
            out.push((top, dir));
            continue;
        }
        let Ok(subs) = std::fs::read_dir(&dir) else {
            continue;
        };
        let mut subs: Vec<PathBuf> = subs.flatten().map(|e| e.path()).collect();
        subs.sort();
        for sub in subs {
            if sub.is_dir() && has(&sub, "input.json") && has(&sub, "docs.json") {
                let name = sub.file_name().unwrap().to_string_lossy().to_string();
                out.push((format!("{top}/{name}"), sub));
            }
        }
    }
    out
}

fn read_json(path: PathBuf) -> Value {
    let text = std::fs::read_to_string(&path).unwrap_or_else(|e| panic!("{}: {e}", path.display()));
    serde_json::from_str(&text).unwrap_or_else(|e| panic!("{}: {e}", path.display()))
}

/// `firstMethod` (opensdk-ci `spec.ts`): depth-first, the first resource with a
/// method wins — exactly the method the golden's `chain` describes.
fn first_method(resources: Option<&Value>, prefix: &[String]) -> Option<(Vec<String>, Value)> {
    for r in resources.and_then(Value::as_array)?.iter() {
        let mut seg = prefix.to_vec();
        seg.push(r.get("name").and_then(Value::as_str)?.to_string());
        if let Some(m) = r
            .get("methods")
            .and_then(Value::as_array)
            .and_then(|ms| ms.first())
        {
            return Some((seg, m.clone()));
        }
        if let Some(found) = first_method(r.get("resources"), &seg) {
            return Some(found);
        }
    }
    None
}

/// The first line at which two strings diverge, with both sides, for a readable
/// failure against a 20-line snippet.
fn first_diff_line(got: &str, want: &str) -> String {
    let (g, w): (Vec<&str>, Vec<&str>) = (got.lines().collect(), want.lines().collect());
    for i in 0..g.len().max(w.len()) {
        let (a, b) = (g.get(i), w.get(i));
        if a != b {
            return format!(
                "line {}:\n      got  {:?}\n      want {:?}",
                i + 1,
                a.unwrap_or(&"<eof>"),
                b.unwrap_or(&"<eof>")
            );
        }
    }
    "trailing-whitespace-only difference".to_string()
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
        let spec = read_json(dir.join("input.json"));
        let golden = read_json(dir.join("docs.json"));

        let chain: Vec<String> = golden["chain"]
            .as_array()
            .expect("golden chain")
            .iter()
            .map(|v| v.as_str().expect("chain segment").to_string())
            .collect();
        let Some((found_chain, method)) = first_method(spec.get("resources"), &[]) else {
            failures.push(format!("{id}: no method in the IR, but docs.json exists"));
            continue;
        };
        assert_eq!(found_chain, chain, "{id}: resolved a different method");

        let usage = generate_dotnet_usage(&spec, &chain, &method, &Value::Null);
        let want_usage = golden["usage"].as_str().expect("golden usage");
        if usage != want_usage {
            failures.push(format!(
                "{id}: usage {}",
                first_diff_line(&usage, want_usage)
            ));
        }

        let tr = serde_json::to_value(generate_dotnet_type_reference(
            &spec,
            &chain,
            &method,
            &Value::Null,
        ))
        .expect("serialize type reference");
        if tr != golden["typeReference"] {
            failures.push(format!(
                "{id}: typeReference\n      got  {}\n      want {}",
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

/// The DOCS-ONLY `baseUrlEnv` option, which the frozen goldens cannot cover:
/// they were captured with an empty options bag. Setting it must add a `baseUrl:`
/// argument reading that env var and change NOTHING else.
#[test]
fn base_url_env_only_adds_the_base_url_argument() {
    let dir = fixtures_dir().join("1.basic");
    let spec = read_json(dir.join("input.json"));
    let (chain, method) = first_method(spec.get("resources"), &[]).expect("a method");

    let default = generate_dotnet_usage(&spec, &chain, &method, &Value::Null);
    let with_env = generate_dotnet_usage(
        &spec,
        &chain,
        &method,
        &serde_json::json!({ "baseUrlEnv": "XYD_BASE_URL" }),
    );

    assert_eq!(
        default,
        with_env.replace(
            ", baseUrl: Environment.GetEnvironmentVariable(\"XYD_BASE_URL\")",
            ""
        ),
        "baseUrlEnv must only insert the baseUrl argument"
    );
    assert!(
        with_env.contains(
            "new PetstoreClient(apiKey: Environment.GetEnvironmentVariable(\"PETSTORE_API_KEY\"), \
             baseUrl: Environment.GetEnvironmentVariable(\"XYD_BASE_URL\"));"
        ),
        "{with_env}"
    );
}
