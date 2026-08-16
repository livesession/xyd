//! mapResponses + sampleFromSchema — port of response.ts. Emits the
//! x-openapi.responses example binding for the chosen success response.
//! Schemas already `ctx.resolve()`d (the caller resolves before sampling).

use serde_json::{Map, Value};
use std::collections::HashSet;

use crate::jsrt::js_object_keys;
use crate::model::XOpenApiResponse;
use crate::schema::{array_items, get_default, merge_all_of};

const MAX_SAMPLE_DEPTH: usize = 8;

fn is_json_media_type(m: &str) -> bool {
    m == "application/json" || m.ends_with("+json")
}

/// A representative example value for a schema (curated example/default/enum
/// win, then per-type placeholders). Bounded by depth.
fn sample_from_schema(schema: Option<&Value>, depth: usize) -> Option<Value> {
    let schema = schema?;
    if depth > MAX_SAMPLE_DEPTH {
        return None;
    }
    if let Some(ex) = schema.get("example") {
        return Some(ex.clone());
    }
    if let Some(def) = get_default(Some(schema)) {
        return Some(def.clone());
    }
    if let Some(Value::Array(e)) = schema.get("enum") {
        if !e.is_empty() {
            return Some(e[0].clone());
        }
    }

    let mut seen = HashSet::new();
    let merged = merge_all_of(schema, &mut seen);

    let branches = merged
        .get("oneOf")
        .or_else(|| merged.get("anyOf"))
        .and_then(|b| b.as_array());
    if let Some(branches) = branches {
        if !branches.is_empty() {
            return sample_from_schema(Some(&branches[0]), depth + 1);
        }
    }

    let type_str = merged.get("type").and_then(|t| t.as_str());
    if type_str == Some("array") {
        let item = sample_from_schema(array_items(Some(&merged)), depth + 1);
        return Some(match item {
            Some(v) => Value::Array(vec![v]),
            None => Value::Array(vec![]),
        });
    }

    if type_str == Some("object") || merged.get("properties").is_some() {
        let mut obj = Map::new();
        if let Some(props) = merged.get("properties").and_then(|p| p.as_object()) {
            for key in js_object_keys(props) {
                if key.starts_with("__") {
                    continue;
                }
                if let Some(v) = sample_from_schema(props.get(key), depth + 1) {
                    obj.insert(key.clone(), v);
                }
            }
        }
        return Some(Value::Object(obj));
    }

    match type_str {
        Some("string") => Some(Value::String(
            merged
                .get("format")
                .and_then(|f| f.as_str())
                .map(|f| format!("<{f}>"))
                .unwrap_or_else(|| "string".to_string()),
        )),
        Some("integer") | Some("number") => Some(Value::Number(0.into())),
        Some("boolean") => Some(Value::Bool(true)),
        _ => None,
    }
}

fn pick_response_content(content: Option<&Value>) -> Option<(String, Value)> {
    let map = content?.as_object()?;
    let keys = js_object_keys(map);
    if keys.is_empty() {
        return None;
    }
    let json = keys
        .iter()
        .find(|k| k.as_str() == "application/json")
        .or_else(|| keys.iter().find(|k| k.ends_with("+json")));
    let media_type = json
        .map(|k| (*k).clone())
        .unwrap_or_else(|| keys[0].clone());
    Some((media_type.clone(), map[&media_type].clone()))
}

fn example_for(media: &Value, jsonish: bool) -> Option<Value> {
    if let Some(ex) = media.get("example") {
        return Some(ex.clone());
    }
    if let Some(named) = media.get("examples").and_then(|e| e.as_object()) {
        // Object.values(named)[0]
        if let Some(first_key) = js_object_keys(named).into_iter().next() {
            if let Some(v) = named[first_key].get("value") {
                return Some(v.clone());
            }
        }
    }
    if jsonish {
        sample_from_schema(media.get("schema"), 0)
    } else {
        None
    }
}

fn is_2xx(status: &str) -> bool {
    // /^2(\d\d|XX)$/i
    let b = status.as_bytes();
    if b.len() != 3 || b[0] != b'2' {
        return false;
    }
    (b[1].is_ascii_digit() && b[2].is_ascii_digit())
        || ((b[1] == b'X' || b[1] == b'x') && (b[2] == b'X' || b[2] == b'x'))
}

/// `responses` is the (resolved) ResponsesObject.
pub fn map_responses(responses: Option<&Value>) -> Vec<XOpenApiResponse> {
    let Some(responses) = responses.and_then(|r| r.as_object()) else {
        return vec![];
    };

    // withContent, in Object.entries order.
    let with_content: Vec<(&String, &Value)> = js_object_keys(responses)
        .into_iter()
        .filter_map(|k| {
            let r = &responses[k];
            if r.is_object() && r.get("content").is_some() {
                Some((k, r))
            } else {
                None
            }
        })
        .collect();
    if with_content.is_empty() {
        return vec![];
    }

    let mut success: Vec<(&String, &Value)> = with_content
        .iter()
        .copied()
        .filter(|(s, _)| is_2xx(s))
        .collect();
    success.sort_by_key(|(a, _)| *a);
    let fallback: Vec<(&String, &Value)> = with_content
        .iter()
        .copied()
        .filter(|(s, _)| s.as_str() == "default")
        .collect();

    let chosen: Vec<(&String, &Value)> = if !success.is_empty() {
        success
    } else if !fallback.is_empty() {
        fallback
    } else {
        vec![with_content[0]]
    };

    let mut out = Vec::new();
    for (status, response) in chosen {
        let Some((media_type, media)) = pick_response_content(response.get("content")) else {
            continue;
        };
        let example = example_for(&media, is_json_media_type(&media_type));
        let Some(example) = example else { continue };
        if example.is_null() {
            continue;
        }
        out.push(XOpenApiResponse {
            status: (*status).clone(),
            content_type: media_type,
            description: response
                .get("description")
                .and_then(|d| d.as_str())
                .filter(|d| !d.is_empty())
                .map(|d| d.to_string()),
            example,
        });
    }
    out
}
