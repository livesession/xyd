//! Port of `remove-undefined-objects@5.0.0`. serde_json already lacks
//! `undefined`, so the `JSON.parse(JSON.stringify(...))` clone is implicit; the
//! meaningful part is `stripEmptyObjects` — prune empty objects/arrays
//! recursively, drop null (and pruned-empty) ARRAY members, keep null OBJECT
//! members, and collapse a wholly-empty result to `None`.

use serde_json::{Map, Value};

fn is_empty_container(v: &Value) -> bool {
    match v {
        Value::Object(o) => o.is_empty(),
        Value::Array(a) => a.is_empty(),
        _ => false,
    }
}

fn strip(v: Value) -> Value {
    match v {
        Value::Object(map) => {
            let mut out = Map::new();
            for (k, val) in map {
                if matches!(val, Value::Object(_) | Value::Array(_)) {
                    let stripped = strip(val);
                    if is_empty_container(&stripped) {
                        // delete the key
                    } else {
                        out.insert(k, stripped);
                    }
                } else {
                    // null and primitives are kept on objects.
                    out.insert(k, val);
                }
            }
            Value::Object(out)
        }
        Value::Array(arr) => {
            let mut out = Vec::new();
            for el in arr {
                match el {
                    Value::Object(_) | Value::Array(_) => {
                        let stripped = strip(el);
                        if !is_empty_container(&stripped) {
                            out.push(stripped);
                        }
                    }
                    Value::Null => { /* dropped from arrays */ }
                    other => out.push(other),
                }
            }
            Value::Array(out)
        }
        other => other,
    }
}

/// `removeUndefinedObjects(obj)` → `None` when the whole thing collapses to an
/// empty container.
pub fn remove_undefined_objects(v: &Value) -> Option<Value> {
    let stripped = strip(v.clone());
    if is_empty_container(&stripped) {
        return None;
    }
    Some(stripped)
}
