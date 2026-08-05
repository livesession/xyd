//! Port of the framework operation-plan.ts `planOperation` — the shared
//! per-operation semantic plan the emitters render.

use serde_json::Value;
use std::collections::HashMap;

#[derive(PartialEq)]
pub enum PrimaryResponse {
    Struct,
    UnionMapped,
    UnionOpen,
    Scalar,
    None,
}

pub struct OperationPlan {
    pub page_name: Option<&'static str>,
    pub binary_content_type: Option<String>,
    pub encoding: Option<&'static str>,
    pub path_params: Vec<Value>,
    pub query_params: Vec<Value>,
    pub header_params: Vec<Value>,
    pub has_body: bool,
    pub primary_response: PrimaryResponse,
    pub inject_idempotency_key: bool,
}

fn arr(method: &Value, key: &str) -> Vec<Value> {
    method
        .get(key)
        .and_then(|v| v.as_array())
        .cloned()
        .unwrap_or_default()
}

/// The FIRST declared 2xx response's content type when it is not json.
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

fn page_name(method: &Value, binary: &Option<String>) -> Option<&'static str> {
    if binary.is_some() {
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

fn body_encoding(method: &Value) -> Option<&'static str> {
    let rb = method.get("requestBody")?;
    match rb.get("encoding").and_then(|e| e.as_str()) {
        Some("multipart") => Some("multipart"),
        Some("form") => Some("form"),
        _ => Some("json"),
    }
}

fn classify_primary_response(method: &Value, types: &HashMap<String, Value>) -> PrimaryResponse {
    let Some(ref_) = method.get("primaryResponse") else {
        return PrimaryResponse::None;
    };
    if ref_.get("kind").and_then(|k| k.as_str()) == Some("ref") {
        if let Some(name) = ref_.get("name").and_then(|n| n.as_str()) {
            match types.get(name) {
                None => return PrimaryResponse::Struct,
                Some(named) => {
                    let kind = named.get("kind").and_then(|k| k.as_str());
                    if kind == Some("struct") {
                        return PrimaryResponse::Struct;
                    }
                    if kind == Some("union") {
                        let mapped = named
                            .get("discriminator")
                            .map(|d| {
                                d.get("propertyName")
                                    .and_then(|p| p.as_str())
                                    .map(|s| !s.is_empty())
                                    .unwrap_or(false)
                                    && d.get("mapping")
                                        .and_then(|m| m.as_object())
                                        .map(|m| !m.is_empty())
                                        .unwrap_or(false)
                            })
                            .unwrap_or(false);
                        return if mapped {
                            PrimaryResponse::UnionMapped
                        } else {
                            PrimaryResponse::UnionOpen
                        };
                    }
                    return PrimaryResponse::Scalar; // enum / alias
                }
            }
        }
    }
    PrimaryResponse::Scalar
}

pub fn plan_operation(method: &Value, types: &HashMap<String, Value>) -> OperationPlan {
    let binary = binary_content_type(method);
    OperationPlan {
        page_name: page_name(method, &binary),
        encoding: body_encoding(method),
        path_params: arr(method, "pathParams"),
        query_params: arr(method, "queryParams"),
        header_params: arr(method, "headerParams"),
        has_body: method.get("requestBody").is_some(),
        primary_response: classify_primary_response(method, types),
        inject_idempotency_key: method
            .get("injectIdempotencyKey")
            .and_then(|v| v.as_bool())
            .unwrap_or(false),
        binary_content_type: binary,
    }
}
