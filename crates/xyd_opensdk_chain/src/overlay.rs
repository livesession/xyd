//! `applyOverlay` — OpenAPI Overlay 1.0.0 against a raw spec, in place.

use serde_json::Value;

use crate::error::{Error, Result};
use crate::jsonpath::{self, Segment};

/// Apply an OpenAPI Overlay 1.0.0 document to a raw spec, mutating it in place.
///
/// Each action's JSONPath `target` selects nodes; `remove: true` deletes them,
/// otherwise `update` is deep-merged into each matched node (or assigned through the
/// parent when the match is not an object).
pub fn apply_overlay(doc: &mut Value, overlay: &Value) -> Result<()> {
    let version = match overlay.get("overlay") {
        // TS: `String(overlay.overlay ?? '')`
        None | Some(Value::Null) => String::new(),
        Some(Value::String(s)) => s.clone(),
        Some(other) => js_string(other),
    };
    if version != "1.0.0" {
        return Err(Error::msg(format!(
            "Unsupported overlay version \"{version}\" (expected \"1.0.0\")"
        )));
    }

    let empty = Vec::new();
    let actions = match overlay.get("actions") {
        Some(Value::Array(a)) => a,
        _ => &empty,
    };

    for action in actions {
        let target = match action.get("target") {
            Some(Value::String(s)) if !s.is_empty() => s.clone(),
            // TS: `if (!action.target) throw` — any falsy value (missing, "", null, 0).
            _ => return Err(Error::msg("Overlay action is missing a `target` JSONPath")),
        };

        let matches = jsonpath::query_located(&target, doc).map_err(|reason| {
            Error::msg(format!(
                "unsupported JSONPath extension in overlay target \"{target}\": {reason}"
            ))
        })?;

        if truthy(action.get("remove")) {
            // Reverse so array splices do not shift the indices of later matches.
            for m in matches.iter().rev() {
                remove_at(doc, &m.path);
            }
        } else if let Some(update) = action.get("update") {
            // TS: `else if (action.update !== undefined)` — an explicit `null` still enters
            // this branch, and then fails both `isObject(update)` and the assignment guard
            // only when the match is the root, so it can replace a non-root node with null.
            for m in matches.iter() {
                apply_update(doc, &m.path, update);
            }
        }
    }
    Ok(())
}

/// JS truthiness, used for `action.remove`.
fn truthy(v: Option<&Value>) -> bool {
    match v {
        None | Some(Value::Null) => false,
        Some(Value::Bool(b)) => *b,
        Some(Value::Number(n)) => n.as_f64().is_some_and(|f| f != 0.0 && !f.is_nan()),
        Some(Value::String(s)) => !s.is_empty(),
        Some(_) => true, // objects and arrays are always truthy
    }
}

/// `String(value)` for the non-string values an `overlay` field could hold.
fn js_string(v: &Value) -> String {
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

fn node_at<'a>(root: &'a mut Value, path: &[Segment]) -> Option<&'a mut Value> {
    let mut cur = root;
    for seg in path {
        cur = match seg {
            Segment::Name(name) => cur.as_object_mut()?.get_mut(name)?,
            Segment::Index(i) => cur.as_array_mut()?.get_mut(*i)?,
        };
    }
    Some(cur)
}

/// `delete parent[prop]` / `parent.splice(index, 1)`. A root match has no parent, which
/// the TS skips (`if (m.parent == null) continue`).
fn remove_at(root: &mut Value, path: &[Segment]) {
    let Some((last, parent_path)) = path.split_last() else {
        return;
    };
    let Some(parent) = node_at(root, parent_path) else {
        return;
    };
    match last {
        Segment::Name(name) => {
            if let Some(obj) = parent.as_object_mut() {
                // `delete` preserves the order of the remaining keys, so `shift_remove`
                // (not `swap_remove`) is the faithful operation.
                obj.shift_remove(name);
            }
        }
        Segment::Index(i) => {
            if let Some(arr) = parent.as_array_mut() {
                if *i < arr.len() {
                    arr.remove(*i);
                }
            }
        }
    }
}

fn apply_update(root: &mut Value, path: &[Segment], update: &Value) {
    let matched_is_object = node_at(root, path).is_some_and(|v| v.is_object());
    if matched_is_object && update.is_object() {
        if let Some(node) = node_at(root, path) {
            deep_merge(node, update);
        }
        return;
    }
    // Otherwise assign through the parent; the root has no parent, so it is skipped.
    let Some((last, parent_path)) = path.split_last() else {
        return;
    };
    let Some(parent) = node_at(root, parent_path) else {
        return;
    };
    match last {
        Segment::Name(name) => {
            if let Some(obj) = parent.as_object_mut() {
                obj.insert(name.clone(), update.clone());
            }
        }
        Segment::Index(i) => {
            if let Some(arr) = parent.as_array_mut() {
                if let Some(slot) = arr.get_mut(*i) {
                    *slot = update.clone();
                }
            }
        }
    }
}

/// `deepMerge(target, source)` — objects merge, arrays and scalars replace.
pub(crate) fn deep_merge(target: &mut Value, source: &Value) {
    let (Some(src), Some(_)) = (source.as_object(), target.as_object()) else {
        return;
    };
    let entries: Vec<(String, Value)> = src.iter().map(|(k, v)| (k.clone(), v.clone())).collect();
    let Some(dst) = target.as_object_mut() else {
        return;
    };
    for (k, v) in entries {
        match (v.is_object(), dst.get(&k).is_some_and(Value::is_object)) {
            (true, true) => {
                let slot = dst.get_mut(&k).expect("checked present");
                deep_merge(slot, &v);
            }
            _ => {
                dst.insert(k, v);
            }
        }
    }
}
