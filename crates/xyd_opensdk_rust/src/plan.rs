//! planOperation — port of the framework's operation-plan.ts (the subset the
//! Rust service emitter consumes: pageName / binaryContentType / encoding /
//! param groups / idempotency).

use serde_json::Value;

pub struct OperationPlan {
    pub page_name: Option<&'static str>, // "CursorPage" | "Page" | "OffsetPage"
    pub binary_content_type: Option<String>,
    pub encoding: Option<&'static str>, // "json" | "multipart" | "form"
    pub path_params: Vec<Value>,
    pub query_params: Vec<Value>,
    pub header_params: Vec<Value>,
    pub inject_idempotency_key: bool,
}

fn arr(method: &Value, key: &str) -> Vec<Value> {
    method
        .get(key)
        .and_then(|v| v.as_array())
        .cloned()
        .unwrap_or_default()
}

pub fn plan_operation(method: &Value) -> OperationPlan {
    let binary = binary_content_type(method);
    let page = page_name(method, binary.is_some());
    OperationPlan {
        page_name: page,
        binary_content_type: binary,
        encoding: body_encoding(method),
        path_params: arr(method, "pathParams"),
        query_params: arr(method, "queryParams"),
        header_params: arr(method, "headerParams"),
        inject_idempotency_key: method
            .get("injectIdempotencyKey")
            .and_then(|v| v.as_bool())
            .unwrap_or(false),
    }
}

/// FIRST declared 2xx response's contentType when it is not json, else None.
fn binary_content_type(method: &Value) -> Option<String> {
    let responses = method.get("responses").and_then(|r| r.as_array())?;
    let primary = responses.iter().find(|r| {
        r.get("status")
            .and_then(|s| s.as_str())
            .map(|s| s.starts_with('2'))
            .unwrap_or(false)
    })?;
    let ct = primary.get("contentType").and_then(|c| c.as_str())?;
    if !ct.contains("json") {
        Some(ct.to_string())
    } else {
        None
    }
}

/// The vendored page kind (methodPageName gates, verbatim).
fn page_name(method: &Value, binary: bool) -> Option<&'static str> {
    if binary {
        return None;
    }
    let pagination = method.get("pagination")?;
    if pagination.get("itemType").is_none()
        || pagination.get("itemsField").and_then(|f| f.as_str()) != Some("data")
    {
        return None;
    }
    match pagination.get("style").and_then(|s| s.as_str()) {
        Some("cursor") => Some("CursorPage"),
        Some("page") => Some("Page"),
        Some("offset") if pagination.get("offsetParam").is_some() => Some("OffsetPage"),
        _ => None,
    }
}

/// json (default) | multipart | form; None without a body.
fn body_encoding(method: &Value) -> Option<&'static str> {
    let body = method.get("requestBody")?;
    match body.get("encoding").and_then(|e| e.as_str()) {
        Some("multipart") => Some("multipart"),
        Some("form") => Some("form"),
        _ => Some("json"),
    }
}
