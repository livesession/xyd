//! The SHARED half of the e2e offline binding guard — a faithful port of the
//! pure-IR derivation in `packages/xyd-opensdk-ci/src/e2e.ts`
//! (`expectedRequest` + `loadPerMethod`/`firstMethod`).
//!
//! The guard itself is two assertions per committed per-method fixture:
//!
//! 1. `expected_request(ir, leaf_method)` == the fixture's `request` object;
//! 2. `<lang>_call_key(leaf_segments, leaf_method)` == the fixture's `call`.
//!
//! (1) is language-agnostic, so it lives here ONCE instead of being re-derived
//! in each of the seven emitter crates; (2) is the per-language seam each
//! emitter's test supplies (the analog of the TS `DriverAdapter.callKey`).
//!
//! Unlike [`crate::testkit`] — whose inputs are the CLI-mode fixtures vendored
//! under `crates/` — this module is corpus-agnostic: callers pass the per-method
//! corpus directory, so nothing here hardcodes a path outside the crate.
//!
//! Everything works on `serde_json::Value`, matching how every other crate in
//! this workspace reads the OpenSDK IR.

use std::path::{Path, PathBuf};

use serde::{Deserialize, Serialize};
use serde_json::Value;

/// The request a correct SDK sends for a minimal call (path args +
/// required-only params). Serializes to exactly the shape of the `request`
/// object in a committed `recorded.json`.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct RecordedRequest {
    pub method: String,
    pub path: String,
    pub query: Vec<String>,
    #[serde(rename = "bodyFields")]
    pub body_fields: Vec<String>,
    pub auth: String,
    /// Present ONLY when the method has a request body — an absent key is a
    /// real difference from `Some("application/json")`.
    #[serde(
        rename = "contentType",
        default,
        skip_serializing_if = "Option::is_none"
    )]
    pub content_type: Option<String>,
}

/// One committed per-method fixture: the IR, its single leaf operation, and the
/// `recorded.json` to check against.
#[derive(Debug, Clone)]
pub struct PerMethodFixture {
    /// Fixture directory name (e.g. `chat__completions__create`).
    pub slug: String,
    /// Parsed `input.json` — the per-method OpenSDK IR.
    pub ir: Value,
    /// Resource-name chain to the leaf, root..leaf.
    pub leaf_segments: Vec<String>,
    /// The leaf `Method` object.
    pub leaf_method: Value,
    /// Parsed `recorded.json` (`{ call, request }`).
    pub fixture: Value,
}

/// JS `||` truthiness for the string fields this port reads: missing, `null`
/// and `""` all fall through to the next alternative.
fn non_empty_str(v: Option<&Value>) -> Option<&str> {
    v.and_then(Value::as_str).filter(|s| !s.is_empty())
}

/// `spec.security?.[0]?.kind` — the first entry's `kind`, if non-empty.
fn first_security_kind(owner: &Value) -> Option<&str> {
    non_empty_str(
        owner
            .get("security")
            .and_then(Value::as_array)
            .and_then(|a| a.first())
            .and_then(|s| s.get("kind")),
    )
}

/// The request a correct SDK sends for a minimal call (path args +
/// required-only params).
///
/// Port of `expectedRequest(spec, method)` in `xyd-opensdk-ci/src/e2e.ts`.
pub fn expected_request(spec: &Value, method: &Value) -> RecordedRequest {
    // Empty params struct -> required body fields marshal; optionals omitted.
    let mut body_fields: Vec<String> = Vec::new();
    if let Some(body_type) = method.get("requestBody").and_then(|b| b.get("type")) {
        let is_ref = body_type.get("kind").and_then(Value::as_str) == Some("ref");
        if let (true, Some(name)) = (is_ref, non_empty_str(body_type.get("name"))) {
            let fields = spec
                .get("types")
                .and_then(Value::as_array)
                .into_iter()
                .flatten()
                .find(|t| t.get("name").and_then(Value::as_str) == Some(name))
                .and_then(|t| t.get("fields"))
                .and_then(Value::as_array);
            for f in fields.into_iter().flatten() {
                if f.get("required").and_then(Value::as_bool) == Some(true) {
                    body_fields.push(
                        f.get("name")
                            .and_then(Value::as_str)
                            .unwrap_or_default()
                            .to_string(),
                    );
                }
            }
        }
    }
    body_fields.sort();

    // Required query params marshal too — bound by the raw HTTP wire name
    // (`Param.name` is only the identifier-safe name; `ids` may ride as `ids[]`).
    let mut query: Vec<String> = method
        .get("queryParams")
        .and_then(Value::as_array)
        .into_iter()
        .flatten()
        .filter(|q| q.get("required").and_then(Value::as_bool) == Some(true))
        .map(|q| {
            // `wireName ?? name`: nullish coalescing, so a present-but-empty
            // wireName still wins over `name`.
            q.get("wireName")
                .filter(|v| !v.is_null())
                .or_else(|| q.get("name"))
                .and_then(Value::as_str)
                .unwrap_or_default()
                .to_string()
        })
        .collect();
    query.sort();

    let kind = first_security_kind(spec)
        .or_else(|| first_security_kind(method))
        .unwrap_or("bearer");

    RecordedRequest {
        method: non_empty_str(method.get("httpMethod"))
            .unwrap_or("get")
            .to_lowercase(),
        path: method
            .get("path")
            .and_then(Value::as_str)
            .unwrap_or_default()
            .to_string(),
        query,
        body_fields,
        auth: if kind.starts_with("apiKey") {
            "apikey".to_string()
        } else {
            kind.to_string()
        },
        content_type: method
            .get("requestBody")
            .filter(|v| !v.is_null())
            .map(|_| "application/json".to_string()),
    }
}

/// The first `(segments, method)` in an IR's resource tree — a per-method IR's
/// single operation. Port of `firstMethod` in `xyd-opensdk-ci/src/spec.ts`;
/// the walk order fixes the call key, so it must stay identical.
pub fn first_method(
    resources: Option<&Vec<Value>>,
    prefix: &[String],
) -> Option<(Vec<String>, Value)> {
    for r in resources? {
        let mut seg = prefix.to_vec();
        seg.push(r.get("name")?.as_str()?.to_string());
        if let Some(first) = r
            .get("methods")
            .and_then(Value::as_array)
            .and_then(|m| m.first())
        {
            return Some((seg, first.clone()));
        }
        if let Some(found) = first_method(r.get("resources").and_then(Value::as_array), &seg) {
            return Some(found);
        }
    }
    None
}

/// Sorted `<slug>/` directories of a per-method corpus carrying BOTH
/// `input.json` and `recorded.json`, loaded and walked to their leaf method.
///
/// Slugs whose IR has no method at all are skipped (mirroring `loadPerMethod`,
/// which drops entries `firstMethod` returns null for).
pub fn load_per_method_fixtures(corpus_dir: &Path) -> Vec<PerMethodFixture> {
    let mut dirs: Vec<PathBuf> = match std::fs::read_dir(corpus_dir) {
        Ok(entries) => entries
            .flatten()
            .map(|e| e.path())
            .filter(|p| p.is_dir() && p.join("input.json").is_file())
            .collect(),
        Err(_) => return Vec::new(),
    };
    dirs.sort();

    let mut out = Vec::new();
    for dir in dirs {
        let recorded_path = dir.join("recorded.json");
        if !recorded_path.is_file() {
            continue;
        }
        let slug = dir
            .file_name()
            .unwrap_or_default()
            .to_string_lossy()
            .to_string();
        let ir = read_json(&dir.join("input.json"));
        let Some((leaf_segments, leaf_method)) =
            first_method(ir.get("resources").and_then(Value::as_array), &[])
        else {
            continue;
        };
        out.push(PerMethodFixture {
            slug,
            ir,
            leaf_segments,
            leaf_method,
            fixture: read_json(&recorded_path),
        });
    }
    out
}

fn read_json(path: &Path) -> Value {
    let text =
        std::fs::read_to_string(path).unwrap_or_else(|e| panic!("read {}: {e}", path.display()));
    serde_json::from_str(&text).unwrap_or_else(|e| panic!("parse {}: {e}", path.display()))
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    /// The Go emitter's per-method OpenAI corpus — the largest committed set of
    /// `recorded.json` files, and the one every language's fixtures are derived
    /// from (the `request` object is language-agnostic).
    fn openai_corpus() -> PathBuf {
        Path::new(env!("CARGO_MANIFEST_DIR"))
            .join("../xyd_opensdk_go/__fixtures__/-2.complex.openai")
    }

    #[test]
    fn expected_request_reproduces_every_committed_fixture() {
        let cases = load_per_method_fixtures(&openai_corpus());
        assert!(
            cases.len() >= 20,
            "expected ≥20 committed recorded.json fixtures, found {} — the guard would pass vacuously",
            cases.len()
        );

        let mut failures: Vec<String> = Vec::new();
        for case in &cases {
            let got = serde_json::to_value(expected_request(&case.ir, &case.leaf_method))
                .expect("serialize expected request");
            let want = &case.fixture["request"];
            // Value equality is key-order independent but key-SET exact, so a
            // missing/extra `contentType` is caught.
            if &got != want {
                failures.push(format!(
                    "  {}\n      got:  {got}\n      want: {want}",
                    case.slug
                ));
            }
        }
        assert!(
            failures.is_empty(),
            "{} of {} fixtures diverge:\n{}",
            failures.len(),
            cases.len(),
            failures.join("\n")
        );
    }

    #[test]
    fn corpus_covers_the_interesting_shapes() {
        // Guards the guard: if the corpus ever stopped carrying bodies, queries
        // or body-less GETs, the sweep above could pass without exercising them.
        let cases = load_per_method_fixtures(&openai_corpus());
        let req = |c: &PerMethodFixture| expected_request(&c.ir, &c.leaf_method);
        assert!(cases.iter().any(|c| req(c).content_type.is_some()));
        assert!(cases.iter().any(|c| req(c).content_type.is_none()));
        assert!(cases.iter().any(|c| !req(c).body_fields.is_empty()));
        assert!(cases.iter().any(|c| !req(c).query.is_empty()));
        assert!(cases.iter().any(|c| c.leaf_segments.len() > 1));
    }

    #[test]
    fn missing_corpus_yields_no_cases() {
        assert!(load_per_method_fixtures(Path::new("/nonexistent/corpus")).is_empty());
    }

    #[test]
    fn body_fields_are_required_only_and_sorted() {
        let spec = json!({
            "types": [{
                "name": "CreateParams",
                "fields": [
                    { "name": "model", "required": true },
                    { "name": "temperature", "required": false },
                    { "name": "input", "required": true },
                ],
            }],
        });
        let method = json!({
            "httpMethod": "POST",
            "path": "/audio/speech",
            "requestBody": { "type": { "kind": "ref", "name": "CreateParams" } },
        });
        let req = expected_request(&spec, &method);
        assert_eq!(req.body_fields, ["input", "model"]);
        assert_eq!(req.method, "post");
        assert_eq!(req.content_type.as_deref(), Some("application/json"));
        assert_eq!(req.auth, "bearer");
    }

    #[test]
    fn inline_body_types_contribute_no_fields_but_still_set_content_type() {
        let method = json!({
            "httpMethod": "post",
            "path": "/x",
            "requestBody": { "type": { "kind": "map" } },
        });
        let req = expected_request(&json!({}), &method);
        assert!(req.body_fields.is_empty());
        assert_eq!(req.content_type.as_deref(), Some("application/json"));
    }

    #[test]
    fn query_is_required_only_wire_named_and_sorted() {
        let method = json!({
            "queryParams": [
                { "name": "limit", "required": false },
                { "name": "ids", "wireName": "ids[]", "required": true },
                { "name": "after", "required": true },
            ],
        });
        let req = expected_request(&json!({}), &method);
        assert_eq!(req.query, ["after", "ids[]"]);
        // Defaults when the method carries nothing else.
        assert_eq!(req.method, "get");
        assert_eq!(req.path, "");
        assert!(req.content_type.is_none());
    }

    #[test]
    fn auth_falls_back_spec_then_method_then_bearer() {
        let apikey = json!({ "security": [{ "kind": "apiKey-header" }] });
        assert_eq!(expected_request(&apikey, &json!({})).auth, "apikey");

        let method_only = json!({ "security": [{ "kind": "basic" }] });
        assert_eq!(expected_request(&json!({}), &method_only).auth, "basic");

        // Spec-level security wins over the method's.
        let spec = json!({ "security": [{ "kind": "bearer" }] });
        assert_eq!(expected_request(&spec, &method_only).auth, "bearer");

        assert_eq!(expected_request(&json!({}), &json!({})).auth, "bearer");
    }

    #[test]
    fn content_type_key_is_omitted_when_there_is_no_body() {
        let got = serde_json::to_value(expected_request(&json!({}), &json!({ "path": "/x" })))
            .expect("serialize");
        assert!(got.get("contentType").is_none(), "{got}");
        assert_eq!(
            got,
            json!({ "method": "get", "path": "/x", "query": [], "bodyFields": [], "auth": "bearer" })
        );
    }

    #[test]
    fn first_method_takes_the_first_leaf_depth_first() {
        let resources = json!([
            { "name": "admin", "resources": [
                { "name": "organization", "methods": [{ "action": "list" }] },
            ]},
            { "name": "chat", "methods": [{ "action": "create" }] },
        ]);
        let (segments, method) = first_method(resources.as_array(), &[]).expect("a leaf");
        assert_eq!(segments, ["admin", "organization"]);
        assert_eq!(method["action"], "list");
    }
}
