//! The chain SOURCES engine: turn a source's `inputs` (+ optional `overlays`) into ONE
//! processed OpenAPI spec that a target generates from. Everything operates on the RAW
//! doc (never dereferenced) so `$ref`s survive into the converter.

use std::collections::HashMap;
use std::path::{Component, Path, PathBuf};
use std::sync::atomic::{AtomicU64, Ordering};

use serde::{Deserialize, Serialize};
use serde_json::{Map, Value};

use crate::error::{Error, Result};
use crate::jsnum::stringify_pretty;
use crate::overlay::apply_overlay;
use crate::yaml;

/// One `inputs` / `overlays` entry.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChainInput {
    pub location: String,
}

/// A named source: one or more OpenAPI `inputs` (merged when >1) with optional
/// `overlays` applied in order, producing a processed spec at `output` (or a temp file).
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ChainSource {
    #[serde(default)]
    pub inputs: Vec<ChainInput>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub overlays: Option<Vec<ChainInput>>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub output: Option<String>,
}

/// Fetches an `http(s)` location. The TS uses `fetch`; this crate stays HTTP-free and
/// takes the fetcher from its caller.
pub type Fetcher<'a> = &'a dyn Fn(&str) -> std::result::Result<String, String>;

// ── reading ────────────────────────────────────────────────────────────────────

/// Read + parse an OpenAPI/overlay doc from a file path (json or yaml). No dereferencing.
///
/// Errors on an `http(s)` location — use [`read_raw_doc_with`] with a fetcher for those.
pub fn read_raw_doc(location: &str, cwd: &Path) -> Result<Value> {
    read_raw_doc_with(location, cwd, None)
}

/// [`read_raw_doc`] with an injected fetcher for `http(s)` locations.
pub fn read_raw_doc_with(
    location: &str,
    cwd: &Path,
    fetcher: Option<Fetcher<'_>>,
) -> Result<Value> {
    let (mut content, path) = if location.starts_with("http://") || location.starts_with("https://")
    {
        let fetch = fetcher.ok_or_else(|| {
            Error::msg(format!(
                "Refusing to read {location}: this build has no HTTP fetcher (pass one to read_raw_doc_with)"
            ))
        })?;
        let body =
            fetch(location).map_err(|e| Error::msg(format!("Failed to fetch {location}: {e}")))?;
        (body, PathBuf::from(location))
    } else {
        let path = resolve_path(cwd, Path::new(location));
        let body = std::fs::read_to_string(&path).map_err(|e| Error::io(&path, &e))?;
        (body, path)
    };

    // Strip a leading BOM so the JSON parser won't choke.
    if content.starts_with('\u{feff}') {
        content = content['\u{feff}'.len_utf8()..].to_string();
    }
    // Prefer the extension; only sniff when there's none (e.g. a URL). A .yaml that
    // starts with a `{` flow-mapping must NOT be routed to the JSON parser.
    let trimmed = content.trim_start();
    let is_yaml = location.ends_with(".yaml") || location.ends_with(".yml");
    if !is_yaml
        && (location.ends_with(".json") || trimmed.starts_with('{') || trimmed.starts_with('['))
    {
        return serde_json::from_str(&content).map_err(|e| Error::syntax(&path, e));
    }
    yaml::from_str(&content).map_err(|e| Error::syntax(&path, e))
}

/// Serialize a processed doc by output extension (yaml for `.yaml`/`.yml`, else json).
pub fn serialize_doc(doc: &Value, out_path: &Path) -> String {
    let name = out_path.to_string_lossy();
    if name.ends_with(".yaml") || name.ends_with(".yml") {
        yaml::dump(doc)
    } else {
        format!("{}\n", stringify_pretty(doc))
    }
}

// ── JS value helpers ───────────────────────────────────────────────────────────

fn is_object(v: &Value) -> bool {
    v.is_object()
}

/// `Object.entries(value)` — objects yield their pairs in insertion order, arrays and
/// strings yield index keys, everything else yields nothing.
fn object_entries(v: Option<&Value>) -> Vec<(String, Value)> {
    match v {
        Some(Value::Object(m)) => m.iter().map(|(k, v)| (k.clone(), v.clone())).collect(),
        Some(Value::Array(a)) => a
            .iter()
            .enumerate()
            .map(|(i, v)| (i.to_string(), v.clone()))
            .collect(),
        Some(Value::String(s)) => s
            .chars()
            .enumerate()
            .map(|(i, c)| (i.to_string(), Value::String(c.to_string())))
            .collect(),
        _ => Vec::new(),
    }
}

/// `{ ...value }`
fn spread_object(v: Option<&Value>) -> Map<String, Value> {
    let mut out = Map::new();
    for (k, val) in object_entries(v) {
        out.insert(k, val);
    }
    out
}

/// `[ ...value ]` for the shapes a `tags` field can realistically hold. A non-iterable
/// (a number, a plain object) throws a `TypeError` in JS; there is no OpenAPI document
/// that reaches it, so it degrades to an empty list here.
fn spread_array(v: Option<&Value>) -> Vec<Value> {
    match v {
        Some(Value::Array(a)) => a.clone(),
        Some(Value::String(s)) => s.chars().map(|c| Value::String(c.to_string())).collect(),
        _ => Vec::new(),
    }
}

/// JS `===` restricted to what JSON can express: numbers compare by `f64` value (JS has
/// no int/float distinction), and two distinct objects/arrays are never `===`.
fn strict_equal(a: &Value, b: &Value) -> bool {
    match (a, b) {
        (Value::Null, Value::Null) => true,
        (Value::Bool(x), Value::Bool(y)) => x == y,
        (Value::String(x), Value::String(y)) => x == y,
        (Value::Number(x), Value::Number(y)) => match (x.as_f64(), y.as_f64()) {
            (Some(x), Some(y)) => x == y,
            _ => false,
        },
        _ => false,
    }
}

/// `deepEqual` from `sources.ts`.
pub(crate) fn deep_equal(a: &Value, b: &Value) -> bool {
    if strict_equal(a, b) {
        return true;
    }
    match (a, b) {
        (Value::Array(x), Value::Array(y)) => {
            x.len() == y.len() && x.iter().zip(y).all(|(a, b)| deep_equal(a, b))
        }
        (Value::Object(x), Value::Object(y)) => {
            // `ka.every(k => deepEqual(a[k], b[k]))` — a key missing from `b` yields
            // `undefined`, which never deep-equals a JSON value.
            x.len() == y.len()
                && x.iter()
                    .all(|(k, av)| y.get(k).is_some_and(|bv| deep_equal(av, bv)))
        }
        _ => false,
    }
}

const OPERATION_KEYS: [&str; 8] = [
    "get", "put", "post", "delete", "options", "head", "patch", "trace",
];

// ── merge ──────────────────────────────────────────────────────────────────────

/// Merge several raw OpenAPI docs into one.
///
/// `openapi`/`info`/`servers` come from the first. `paths` union at OPERATION
/// granularity (two inputs can split methods of the SAME path); a path present in both
/// with the SAME method defined differently is a real conflict. Every `components.*`
/// bucket is unioned (differing content = conflict; identical = deduped); `tags` dedup
/// by name; `security` concatenated + deduped. Conflict messages name the actual pair of
/// inputs. Never mutates the input docs.
pub fn merge_openapi_docs(docs: &[Value]) -> Result<Value> {
    let Some(first) = docs.first() else {
        return Err(Error::msg("mergeOpenApiDocs: no inputs"));
    };

    let mut merged = spread_object(Some(first));
    merged.insert(
        "paths".into(),
        Value::Object(spread_object(nonnull(first.get("paths")))),
    );
    // `structuredClone` of a non-object yields that value unchanged.
    merged.insert(
        "components".into(),
        nonnull(first.get("components"))
            .cloned()
            .unwrap_or(Value::Object(Map::new())),
    );
    merged.insert(
        "tags".into(),
        Value::Array(spread_array(nonnull(first.get("tags")))),
    );
    if matches!(first.get("security"), Some(Value::Array(_))) {
        merged.insert("security".into(), first["security"].clone());
    }

    // Which input first contributed each path/component (so a conflict names the RIGHT pair).
    let mut path_origin: HashMap<String, usize> = merged["paths"]
        .as_object()
        .expect("just inserted an object")
        .keys()
        .map(|k| (k.clone(), 0usize))
        .collect();
    let mut comp_origin: HashMap<String, usize> = HashMap::new();
    for (bucket, entries) in object_entries(merged.get("components")) {
        if is_object(&entries) {
            for name in entries.as_object().expect("checked").keys() {
                comp_origin.insert(format!("{bucket}.{name}"), 0);
            }
        }
    }

    for (i, doc) in docs.iter().enumerate().skip(1) {
        // paths — union at operation granularity
        for (p, item) in object_entries(nonnull(doc.get("paths"))) {
            let existing = merged["paths"].get(&p).cloned();
            match existing {
                None => {
                    merged["paths"]
                        .as_object_mut()
                        .expect("paths is an object")
                        .insert(p.clone(), item);
                    path_origin.insert(p, i);
                }
                Some(existing) if is_object(&existing) && is_object(&item) => {
                    let mut merged_item = existing.as_object().expect("checked").clone();
                    for (k, v) in item.as_object().expect("checked") {
                        match merged_item.get(k) {
                            None => {
                                merged_item.insert(k.clone(), v.clone());
                            }
                            Some(cur) if !deep_equal(cur, v) => {
                                let what = if OPERATION_KEYS.contains(&k.as_str()) {
                                    format!("method \"{}\"", k.to_uppercase())
                                } else {
                                    format!("field \"{k}\"")
                                };
                                return Err(Error::msg(format!(
                                    "Merge conflict: path \"{p}\" {what} differs in inputs[{}] and inputs[{i}]",
                                    path_origin.get(&p).copied().unwrap_or(0)
                                )));
                            }
                            Some(_) => {}
                        }
                    }
                    merged["paths"]
                        .as_object_mut()
                        .expect("paths is an object")
                        .insert(p, Value::Object(merged_item));
                }
                Some(existing) if !deep_equal(&existing, &item) => {
                    return Err(Error::msg(format!(
                        "Merge conflict: path \"{p}\" differs in inputs[{}] and inputs[{i}]",
                        path_origin.get(&p).copied().unwrap_or(0)
                    )));
                }
                Some(_) => {}
            }
        }

        // components.* — per-bucket union, conflict on differing content
        for (bucket, entries) in object_entries(nonnull(doc.get("components"))) {
            if !is_object(&entries) {
                continue;
            }
            let components = merged.get_mut("components").expect("just inserted");
            let Some(components) = components.as_object_mut() else {
                // JS assigns onto the primitive and throws a TypeError.
                let name = entries
                    .as_object()
                    .expect("checked")
                    .keys()
                    .next()
                    .cloned()
                    .unwrap_or_default();
                return Err(Error::msg(cannot_create_property(
                    &name,
                    merged.get("components").expect("present"),
                )));
            };
            if !components.get(&bucket).is_some_and(Value::is_object) {
                if components.get(&bucket).is_some_and(|v| !v.is_null()) {
                    // `merged.components[bucket] ?? (…= {})` leaves a primitive in place,
                    // then assigning a property on it throws.
                    let name = entries
                        .as_object()
                        .expect("checked")
                        .keys()
                        .next()
                        .cloned()
                        .unwrap_or_default();
                    return Err(Error::msg(cannot_create_property(
                        &name,
                        &components[&bucket],
                    )));
                }
                components.insert(bucket.clone(), Value::Object(Map::new()));
            }
            let target = components
                .get_mut(&bucket)
                .expect("present")
                .as_object_mut()
                .expect("just ensured an object");
            for (name, def) in entries.as_object().expect("checked") {
                let key = format!("{bucket}.{name}");
                match target.get(name) {
                    Some(cur) if !deep_equal(cur, def) => {
                        return Err(Error::msg(format!(
                            "Merge conflict: components.{bucket}.{name} differs in inputs[{}] and inputs[{i}]",
                            comp_origin.get(&key).copied().unwrap_or(0)
                        )));
                    }
                    Some(_) => {}
                    None => {
                        comp_origin.insert(key, i);
                    }
                }
                target.insert(name.clone(), def.clone());
            }
        }

        // tags — dedup by name
        if let Some(Value::Array(incoming)) = nonnull(doc.get("tags")) {
            let incoming = incoming.clone();
            let tags = merged
                .get_mut("tags")
                .expect("just inserted")
                .as_array_mut()
                .expect("tags is an array");
            for tag in incoming {
                let name = tag.get("name");
                let seen = tags.iter().any(|t| same_name(t.get("name"), name));
                if !seen {
                    tags.push(tag);
                }
            }
        }

        // security — concat + dedup (on a clone; never mutate docs[0])
        if let Some(Value::Array(incoming)) = doc.get("security") {
            let incoming = incoming.clone();
            if !merged.get("security").is_some_and(Value::is_array) {
                merged.insert("security".into(), Value::Array(Vec::new()));
            }
            let sec = merged
                .get_mut("security")
                .expect("just ensured")
                .as_array_mut()
                .expect("security is an array");
            for req in incoming {
                if !sec.iter().any(|s| deep_equal(s, &req)) {
                    sec.push(req);
                }
            }
        }
    }

    Ok(Value::Object(merged))
}

/// `t.name === tag.name` with `undefined === undefined` being true, and two distinct
/// objects never being `===`.
fn same_name(a: Option<&Value>, b: Option<&Value>) -> bool {
    match (a, b) {
        (None, None) => true,
        (Some(a), Some(b)) => strict_equal(a, b),
        _ => false,
    }
}

/// `x ?? y` — only `null`/`undefined` fall through.
fn nonnull(v: Option<&Value>) -> Option<&Value> {
    match v {
        Some(Value::Null) | None => None,
        other => other,
    }
}

/// V8's `TypeError: Cannot create property '<k>' on <type> '<value>'`.
fn cannot_create_property(key: &str, target: &Value) -> String {
    let (ty, shown) = match target {
        Value::String(s) => ("string", s.clone()),
        Value::Number(n) => (
            "number",
            n.as_f64()
                .map(crate::jsnum::number_to_string)
                .unwrap_or_else(|| n.to_string()),
        ),
        Value::Bool(b) => ("boolean", b.to_string()),
        other => ("object", stringify_pretty(other)),
    };
    format!("Cannot create property '{key}' on {ty} '{shown}'")
}

// ── processSource ──────────────────────────────────────────────────────────────

/// Process one chain source: read its `inputs` (merged when >1), apply `overlays` in
/// order, then write the processed raw spec to `output` (or a temp file) and return that
/// path. Targets generate from this path.
pub fn process_source(source: &ChainSource, cwd: &Path) -> Result<PathBuf> {
    process_source_with(source, cwd, None)
}

/// [`process_source`] with an injected fetcher for `http(s)` inputs.
pub fn process_source_with(
    source: &ChainSource,
    cwd: &Path,
    fetcher: Option<Fetcher<'_>>,
) -> Result<PathBuf> {
    if source.inputs.is_empty() {
        return Err(Error::msg("chain source has no `inputs`"));
    }
    let mut docs = Vec::with_capacity(source.inputs.len());
    for input in &source.inputs {
        docs.push(read_raw_doc_with(&input.location, cwd, fetcher)?);
    }
    let mut doc = if docs.len() > 1 {
        merge_openapi_docs(&docs)?
    } else {
        docs.swap_remove(0)
    };
    for ov in source.overlays.iter().flatten() {
        let overlay = read_raw_doc_with(&ov.location, cwd, fetcher)?;
        apply_overlay(&mut doc, &overlay)?;
    }

    let out_path = match &source.output {
        Some(out) => resolve_path(cwd, Path::new(out)),
        None => temp_dir()?.join("openapi.json"),
    };
    if let Some(parent) = out_path.parent() {
        std::fs::create_dir_all(parent).map_err(|e| Error::io(parent, &e))?;
    }
    std::fs::write(&out_path, serialize_doc(&doc, &out_path))
        .map_err(|e| Error::io(&out_path, &e))?;
    Ok(out_path)
}

/// `fs.mkdtempSync(path.join(os.tmpdir(), 'opensdk-chain-src-'))`.
fn temp_dir() -> Result<PathBuf> {
    static COUNTER: AtomicU64 = AtomicU64::new(0);
    let base = std::env::temp_dir();
    for _ in 0..64 {
        let nonce = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .map(|d| d.as_nanos())
            .unwrap_or(0)
            ^ u128::from(COUNTER.fetch_add(1, Ordering::Relaxed))
            ^ u128::from(std::process::id());
        let dir = base.join(format!("opensdk-chain-src-{nonce:x}"));
        match std::fs::create_dir(&dir) {
            Ok(()) => return Ok(dir),
            Err(e) if e.kind() == std::io::ErrorKind::AlreadyExists => continue,
            Err(e) => return Err(Error::io(&dir, &e)),
        }
    }
    Err(Error::msg(
        "could not create a temporary directory for the processed spec",
    ))
}

/// `path.resolve(cwd, p)` — absolute `p` wins, and the result is lexically normalised
/// (`./out/x.json` → `<cwd>/out/x.json`) because those paths land in goldens.
pub(crate) fn resolve_path(cwd: &Path, p: &Path) -> PathBuf {
    let joined = if p.is_absolute() {
        p.to_path_buf()
    } else {
        cwd.join(p)
    };
    let mut out = PathBuf::new();
    for comp in joined.components() {
        match comp {
            Component::CurDir => {}
            Component::ParentDir => {
                out.pop();
            }
            other => out.push(other.as_os_str()),
        }
    }
    out
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn deep_equal_treats_numbers_as_js_does() {
        // `{"x":1}` and `{"x":1.0}` are the SAME document in JS, so components dedup
        // rather than conflict.
        let a: Value = serde_json::from_str(r#"{"x":1,"y":[1,2]}"#).unwrap();
        let b: Value = serde_json::from_str(r#"{"x":1.0,"y":[1.0,2e0]}"#).unwrap();
        assert!(deep_equal(&a, &b));

        let c: Value = serde_json::from_str(r#"{"x":1}"#).unwrap();
        let d: Value = serde_json::from_str(r#"{"x":1,"z":null}"#).unwrap();
        assert!(!deep_equal(&c, &d));
    }

    #[test]
    fn resolve_path_normalises() {
        let cwd = Path::new("/tmp/work");
        assert_eq!(
            resolve_path(cwd, Path::new("./out/x.json")),
            PathBuf::from("/tmp/work/out/x.json")
        );
        assert_eq!(
            resolve_path(cwd, Path::new("a/../b")),
            PathBuf::from("/tmp/work/b")
        );
        assert_eq!(
            resolve_path(cwd, Path::new("/abs/x")),
            PathBuf::from("/abs/x")
        );
    }
}
