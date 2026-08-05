//! Port of oas-to-har's parameter style serializer
//! (`src/lib/style-formatting/**`). In xyd's usage the only styled values are
//! query parameters (default style `form`, explode `true`) — primitives and
//! arrays — but the full primitive/array/object matrix for the standard
//! OpenAPI styles is ported so the HAR builder stays faithful. `deepObject`
//! (which upstream delegates to `qs`) is intentionally not implemented.

use serde_json::{Map, Value};

use crate::jsutil::{encode_disallowed_characters, js_string};

/// A resolved parameter (post-dereference) as the serializer needs it.
pub struct Param {
    pub name: String,
    pub location: String, // path | query | header | cookie
    pub style: Option<String>,
    pub explode: Option<bool>,
    pub schema: Option<Value>,
    pub allow_reserved: bool,
    pub required: bool,
}

fn value_encoder(v: &Value, location: &str, is_allowed_reserved: bool) -> String {
    let s = js_string(v);
    let return_if_encoded = location == "query" || location == "body";
    encode_disallowed_characters(&s, return_if_encoded, is_allowed_reserved)
}

fn encode_array(
    location: &str,
    key: &str,
    value: &[Value],
    style: &str,
    explode: bool,
    is_allowed_reserved: bool,
) -> Option<String> {
    let enc = |v: &Value| value_encoder(v, location, is_allowed_reserved);
    let out = match style {
        "simple" => value.iter().map(enc).collect::<Vec<_>>().join(","),
        "label" => format!(".{}", value.iter().map(enc).collect::<Vec<_>>().join(".")),
        "matrix" => value.iter().map(enc).fold(String::new(), |prev, curr| {
            if prev.is_empty() || explode {
                format!("{prev};{key}={curr}")
            } else {
                format!("{prev},{curr}")
            }
        }),
        "form" => {
            let sep = if explode {
                format!("&{key}=")
            } else {
                ",".to_string()
            };
            value.iter().map(enc).collect::<Vec<_>>().join(&sep)
        }
        "spaceDelimited" => {
            let sep = if explode {
                format!(" {key}=")
            } else {
                " ".to_string()
            };
            value.iter().map(enc).collect::<Vec<_>>().join(&sep)
        }
        "pipeDelimited" => {
            let sep = if explode {
                format!("|{key}=")
            } else {
                "|".to_string()
            };
            value.iter().map(enc).collect::<Vec<_>>().join(&sep)
        }
        _ => return None,
    };
    Some(out)
}

fn encode_object(
    location: &str,
    key: &str,
    value: &Map<String, Value>,
    style: &str,
    explode: bool,
    is_allowed_reserved: bool,
) -> Option<String> {
    let enc = |v: &Value| value_encoder(v, location, is_allowed_reserved);
    let keys: Vec<&String> = value.keys().collect();
    let out = match style {
        "simple" => keys.iter().fold(String::new(), |prev, curr| {
            let val = enc(&value[*curr]);
            let middle = if explode { "=" } else { "," };
            let prefix = if prev.is_empty() {
                String::new()
            } else {
                format!("{prev},")
            };
            format!("{prefix}{curr}{middle}{val}")
        }),
        "label" => keys.iter().fold(String::new(), |prev, curr| {
            let val = enc(&value[*curr]);
            let middle = if explode { "=" } else { "." };
            let prefix = if prev.is_empty() {
                ".".to_string()
            } else {
                format!("{prev}.")
            };
            format!("{prefix}{curr}{middle}{val}")
        }),
        "matrix" if explode => keys.iter().fold(String::new(), |prev, curr| {
            let val = enc(&value[*curr]);
            let prefix = if prev.is_empty() {
                ";".to_string()
            } else {
                format!("{prev};")
            };
            format!("{prefix}{curr}={val}")
        }),
        "matrix" => keys.iter().fold(String::new(), |prev, curr| {
            let val = enc(&value[*curr]);
            let prefix = if prev.is_empty() {
                format!(";{key}=")
            } else {
                format!("{prev},")
            };
            format!("{prefix}{curr},{val}")
        }),
        "form" => keys.iter().fold(String::new(), |prev, curr| {
            let val = enc(&value[*curr]);
            let prefix = if prev.is_empty() {
                String::new()
            } else {
                format!("{prev}{}", if explode { "&" } else { "," })
            };
            let sep = if explode { "=" } else { "," };
            format!("{prefix}{curr}{sep}{val}")
        }),
        "spaceDelimited" => keys.iter().fold(String::new(), |prev, curr| {
            let val = enc(&value[*curr]);
            let prefix = if prev.is_empty() {
                String::new()
            } else {
                format!("{prev} ")
            };
            format!("{prefix}{curr} {val}")
        }),
        "pipeDelimited" => keys.iter().fold(String::new(), |prev, curr| {
            let val = enc(&value[*curr]);
            let prefix = if prev.is_empty() {
                String::new()
            } else {
                format!("{prev}|")
            };
            format!("{prefix}{curr}|{val}")
        }),
        _ => return None,
    };
    Some(out)
}

fn encode_primitive(
    location: &str,
    key: &str,
    value: &Value,
    style: &str,
    is_allowed_reserved: bool,
) -> Option<String> {
    let enc = |v: &Value| value_encoder(v, location, is_allowed_reserved);
    let out = match style {
        "simple" => enc(value),
        "label" => format!(".{}", enc(value)),
        "matrix" => {
            if js_string(value).is_empty() {
                format!(";{key}")
            } else {
                format!(";{key}={}", enc(value))
            }
        }
        "form" => enc(value),
        "deepObject" => enc(value),
        _ => return None,
    };
    Some(out)
}

fn stylize(
    location: &str,
    key: &str,
    value: &Value,
    style: &str,
    explode: bool,
    is_allowed_reserved: bool,
) -> Option<Value> {
    match value {
        Value::Array(a) => {
            encode_array(location, key, a, style, explode, is_allowed_reserved).map(Value::String)
        }
        Value::Object(o) => {
            encode_object(location, key, o, style, explode, is_allowed_reserved).map(Value::String)
        }
        _ => encode_primitive(location, key, value, style, is_allowed_reserved).map(Value::String),
    }
}

fn should_not_style_empty_values(param: &Param) -> bool {
    matches!(
        param.style.as_deref(),
        Some("simple") | Some("spaceDelimited") | Some("pipeDelimited") | Some("deepObject")
    )
}

fn should_not_style_reserved_header(param: &Param) -> bool {
    matches!(
        param.name.to_lowercase().as_str(),
        "accept" | "authorization" | "content-type"
    )
}

fn remove_undefined_for_path(value: Value) -> Value {
    // `undefined` never reaches this from serde_json; arrays/objects only get a
    // null→"" pass. Kept for behavioral fidelity.
    match value {
        Value::Array(a) => {
            let filtered: Vec<Value> = a
                .into_iter()
                .map(|v| if v.is_null() { Value::Null } else { v })
                .collect();
            if filtered.is_empty() {
                Value::String(String::new())
            } else {
                Value::Array(filtered)
            }
        }
        other => other,
    }
}

fn stylize_value(value: &Value, param: &Param) -> Option<Value> {
    let mut final_value = value.clone();
    if should_not_style_empty_values(param)
        && (value.is_null() || matches!(value, Value::String(s) if s.is_empty()))
    {
        if param.location == "path" {
            return Some(Value::String(String::new()));
        }
        return None;
    }
    if param.location == "path" {
        final_value = remove_undefined_for_path(final_value);
    }
    if param.location == "header" && should_not_style_reserved_header(param) {
        return Some(value.clone());
    }
    let style = match param.style.clone() {
        Some(s) => s,
        None => match param.location.as_str() {
            "query" => "form".to_string(),
            "path" => "simple".to_string(),
            "header" => "simple".to_string(),
            "cookie" => "form".to_string(),
            _ => String::new(),
        },
    };
    let explode = match param.explode {
        Some(e) => e,
        None => style == "form",
    };
    let is_allowed_reserved = param.location == "query" && param.allow_reserved;
    stylize(
        &param.location,
        &param.name,
        &final_value,
        &style,
        explode,
        is_allowed_reserved,
    )
}

fn should_explode(param: &Param) -> bool {
    let base = param.explode == Some(true)
        || (param.explode != Some(false) && param.style.as_deref() == Some("form"))
        || param.style.as_deref() == Some("deepObject");
    base && param.location != "header" && param.location != "path"
}

fn handle_explode(value: &Value, param: &Param) -> Value {
    match value {
        Value::Array(a) => Value::Array(
            a.iter()
                .map(|v| stylize_value(v, param).unwrap_or(Value::Null))
                .collect(),
        ),
        Value::Object(o) => {
            let mut newobj = Map::new();
            for (k, v) in o {
                newobj.insert(k.clone(), stylize_value(v, param).unwrap_or(Value::Null));
            }
            Value::Object(newobj)
        }
        _ => stylize_value(value, param).unwrap_or(Value::Null),
    }
}

/// Port of `formatStyle(value, parameter)`.
pub fn format_style(value: &Value, param: &Param) -> Option<Value> {
    if param.style.as_deref() == Some("deepObject")
        && (value.is_null() || !value.is_object() || param.explode == Some(false))
    {
        return None;
    }
    if should_explode(param) {
        // In the object/array explode paths the JS may return null members; the
        // HAR appender then coerces via String(). We keep Null placeholders.
        return Some(handle_explode(value, param));
    }
    stylize_value(value, param)
}

/// Port of `formatter(values, param, type, onlyIfExists)` for the HAR builder.
/// `values_for_type` is the `values[type]` object (may be absent).
pub fn formatter(
    values_for_type: Option<&Map<String, Value>>,
    param: &Param,
    kind: &str,
    only_if_exists: bool,
) -> Option<Value> {
    // Branch 1: explicit style → formatStyle over the raw value.
    if param.style.is_some() {
        let v = values_for_type
            .and_then(|m| m.get(&param.name))
            .cloned()
            .unwrap_or(Value::Null);
        return format_style(&v, param);
    }

    let existing = values_for_type.and_then(|m| m.get(&param.name));

    // Mirrors the JS if/else-if ladder that resolves `value`.
    let mut value: Option<Value> = None;
    if let Some(v) = existing {
        value = Some(v.clone());
    } else if only_if_exists && !param.required {
        value = None;
    } else if param.required {
        // `param.required && param.schema && !isRef && param.schema.default`
        let default = param
            .schema
            .as_ref()
            .filter(|s| s.get("$ref").is_none())
            .and_then(|s| s.get("default"))
            .cloned();
        if let Some(def) = default {
            value = Some(def);
        } else if kind == "path" {
            return Some(Value::String(param.name.clone()));
        }
    } else if kind == "path" {
        return Some(Value::String(param.name.clone()));
    }

    // Array-of-binary special case.
    if let Some(schema) = &param.schema {
        if schema.get("type").and_then(|t| t.as_str()) == Some("array") {
            if let Some(items) = schema.get("items") {
                if items.get("format").and_then(|f| f.as_str()) == Some("binary") {
                    if let Some(Value::Array(_)) = &value {
                        return value;
                    }
                    return Some(Value::String(
                        serde_json::to_string(&value.unwrap_or(Value::Null)).unwrap_or_default(),
                    ));
                }
            }
        }
    }

    match value {
        Some(v) => {
            if kind == "query" {
                format_style(&v, param)
            } else {
                Some(v)
            }
        }
        None => None,
    }
}
