//! `chain.json` discovery + validation (`src/chain.ts`).

use std::path::{Path, PathBuf};

use serde_json::Value;

use crate::error::{Error, Result};
use crate::sources::resolve_path;
use crate::yaml;

/// chain.json filenames tried (in order) when no explicit path is given.
const CHAIN_NAMES: [&str; 2] = ["chain.json", ".chain/chain.json"];

/// Locate a chain file: an explicit path (must exist) or the conventional names in `cwd`.
pub fn detect_chain(cwd: &Path, explicit_path: Option<&str>) -> Option<PathBuf> {
    if let Some(explicit) = explicit_path {
        let resolved = resolve_path(cwd, Path::new(explicit));
        return resolved.exists().then_some(resolved);
    }
    CHAIN_NAMES
        .iter()
        .map(|rel| resolve_path(cwd, Path::new(rel)))
        .find(|p| p.exists())
}

/// Load + validate a `chain.json` (json, or yaml by extension).
///
/// Returns the document verbatim — the TS does no shape coercion, and downstream code
/// (`runChain`) reads it as-is — so key order and unknown fields survive.
/// Throws on a bad shape or a dangling source ref.
pub fn resolve_chain(chain_path: &str, cwd: &Path) -> Result<Value> {
    let abs = resolve_path(cwd, Path::new(chain_path));
    if !abs.exists() {
        return Err(Error::msg(format!(
            "Chain file not found: {}",
            abs.display()
        )));
    }
    let raw = std::fs::read_to_string(&abs).map_err(|e| Error::io(&abs, &e))?;

    let name = abs.to_string_lossy();
    let doc: Value = if name.ends_with(".yaml") || name.ends_with(".yml") {
        yaml::from_str(&raw).map_err(|e| Error::parse(&abs, e))?
    } else {
        serde_json::from_str(&raw).map_err(|e| Error::parse(&abs, e))?
    };

    let Some(root) = doc.as_object() else {
        return Err(Error::msg(format!(
            "Invalid chain file {}: expected an object",
            abs.display()
        )));
    };

    let sources = root.get("sources").and_then(Value::as_object);
    if sources.is_none_or(serde_json::Map::is_empty) {
        return Err(Error::msg("chain.json needs at least one `sources` entry"));
    }
    let targets = root.get("targets").and_then(Value::as_object);
    if targets.is_none_or(serde_json::Map::is_empty) {
        return Err(Error::msg("chain.json needs at least one `targets` entry"));
    }
    let (sources, targets) = (sources.expect("checked"), targets.expect("checked"));

    for (name, t) in targets {
        if !truthy(t.get("target")) {
            return Err(Error::msg(format!(
                "target \"{name}\" is missing `target` (the language)"
            )));
        }
        let Some(source) = t.get("source") else {
            return Err(Error::msg(format!("target \"{name}\" is missing `source`")));
        };
        if !truthy(Some(source)) {
            return Err(Error::msg(format!("target \"{name}\" is missing `source`")));
        }
        // `doc.sources[t.source]` — a non-string key is coerced by the property lookup.
        let key = match source {
            Value::String(s) => s.clone(),
            other => js_property_key(other),
        };
        if !truthy(sources.get(&key)) {
            return Err(Error::msg(format!(
                "target \"{name}\" references unknown source \"{key}\" (declare it under `sources`)"
            )));
        }
    }

    Ok(doc)
}

/// JS truthiness for the `!t?.target` / `!doc.sources[...]` guards.
fn truthy(v: Option<&Value>) -> bool {
    match v {
        None | Some(Value::Null) => false,
        Some(Value::Bool(b)) => *b,
        Some(Value::Number(n)) => n.as_f64().is_some_and(|f| f != 0.0 && !f.is_nan()),
        Some(Value::String(s)) => !s.is_empty(),
        Some(_) => true,
    }
}

fn js_property_key(v: &Value) -> String {
    match v {
        Value::String(s) => s.clone(),
        Value::Null => "null".into(),
        Value::Bool(b) => b.to_string(),
        Value::Number(n) => n
            .as_f64()
            .map(crate::jsnum::number_to_string)
            .unwrap_or_else(|| n.to_string()),
        other => crate::jsnum::stringify_pretty(other),
    }
}
