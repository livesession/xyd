//! operation-plan.ts — the shared per-operation semantic plan (page kind,
//! binary content-type, body encoding, param groups, primary-response class,
//! idempotency) that both the Go and .NET emitters render.

use serde_json::Value;

use crate::cstype::Types;

/// The engine-computed plan for one method (subset the .NET emitter reads).
pub struct OperationPlan {
    /// The vendored page kind for a paginated list method (`CursorPage` /
    /// `Page` / `OffsetPage`), or None.
    pub page_name: Option<&'static str>,
    /// The primary 2xx content type when it is NOT json (binary download), else None.
    pub binary_content_type: Option<String>,
    /// The request body encoding (`json` | `multipart` | `form`), or None without a body.
    pub encoding: Option<String>,
    pub path_params: Vec<Value>,
    pub query_params: Vec<Value>,
    pub header_params: Vec<Value>,
    /// Whether the request body is required.
    pub body_required: bool,
    /// Primary response classification: struct | union-mapped | union-open | scalar | none.
    pub primary_response: &'static str,
}

fn arr(v: Option<&Value>) -> Vec<Value> {
    v.and_then(Value::as_array).cloned().unwrap_or_default()
}

/// Compute the operation plan for one method (`m`) against the symbol table.
pub fn plan_operation(m: &Value, types: Types) -> OperationPlan {
    let binary = binary_content_type(m);
    OperationPlan {
        page_name: page_name(m, binary.is_some()),
        binary_content_type: binary,
        encoding: body_encoding(m),
        path_params: arr(m.get("pathParams")),
        query_params: arr(m.get("queryParams")),
        header_params: arr(m.get("headerParams")),
        body_required: m
            .get("requestBody")
            .and_then(|b| b.get("required"))
            .and_then(Value::as_bool)
            .unwrap_or(false),
        primary_response: classify_primary_response(m, types),
    }
}

/// The FIRST declared 2xx response's content type when it is not json, else None.
fn binary_content_type(m: &Value) -> Option<String> {
    let responses = m.get("responses").and_then(Value::as_array)?;
    let primary = responses.iter().find(|r| {
        r.get("status")
            .and_then(Value::as_str)
            .map(|s| s.starts_with('2'))
            .unwrap_or(false)
    })?;
    let ct = primary.get("contentType").and_then(Value::as_str)?;
    if !ct.contains("json") {
        Some(ct.to_string())
    } else {
        None
    }
}

/// The vendored page kind — the Go emitter's methodPageName gates, verbatim.
fn page_name(m: &Value, binary: bool) -> Option<&'static str> {
    if binary {
        return None;
    }
    let pagination = m.get("pagination")?;
    if pagination.get("itemType").is_none()
        || pagination.get("itemsField").and_then(Value::as_str) != Some("data")
    {
        return None;
    }
    match pagination.get("style").and_then(Value::as_str) {
        Some("cursor") => Some("CursorPage"),
        Some("page") => Some("Page"),
        Some("offset") if pagination.get("offsetParam").is_some() => Some("OffsetPage"),
        _ => None,
    }
}

/// The IR body encoding: json (default) | multipart | form; None without a body.
fn body_encoding(m: &Value) -> Option<String> {
    let body = m.get("requestBody")?;
    let encoding = body.get("encoding").and_then(Value::as_str);
    match encoding {
        Some("multipart") => Some("multipart".to_string()),
        Some("form") => Some("form".to_string()),
        _ => Some("json".to_string()),
    }
}

/// Classify the primary response (struct | union-mapped | union-open | scalar | none).
fn classify_primary_response(m: &Value, types: Types) -> &'static str {
    let ref_ = match m.get("primaryResponse") {
        Some(r) if !r.is_null() => r,
        _ => return "none",
    };
    if ref_.get("kind").and_then(Value::as_str) == Some("ref") {
        if let Some(name) = ref_.get("name").and_then(Value::as_str) {
            if !name.is_empty() {
                let named = match types.get(name) {
                    Some(n) => n,
                    None => return "struct",
                };
                return match named.get("kind").and_then(Value::as_str) {
                    Some("struct") => "struct",
                    Some("union") => {
                        let disc = named.get("discriminator");
                        let mapped = disc
                            .and_then(|d| d.get("propertyName"))
                            .and_then(Value::as_str)
                            .map(|s| !s.is_empty())
                            .unwrap_or(false)
                            && disc
                                .and_then(|d| d.get("mapping"))
                                .and_then(Value::as_object)
                                .map(|m| !m.is_empty())
                                .unwrap_or(false);
                        if mapped {
                            "union-mapped"
                        } else {
                            "union-open"
                        }
                    }
                    _ => "scalar", // enum / alias
                };
            }
        }
    }
    "scalar" // scalar / array / map / any
}
