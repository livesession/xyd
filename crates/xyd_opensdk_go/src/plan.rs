//! planOperation — port of the framework operation-plan.ts (the per-method
//! semantic plan the Go emitter renders).

use serde_json::Value;

#[derive(Clone, Copy, PartialEq)]
pub enum PageName {
    Cursor,
    Page,
    Offset,
}

impl PageName {
    pub fn as_str(&self) -> &'static str {
        match self {
            PageName::Cursor => "CursorPage",
            PageName::Page => "Page",
            PageName::Offset => "OffsetPage",
        }
    }
}

#[derive(Clone, Copy, PartialEq)]
pub enum PrimaryResponse {
    Struct,
    UnionMapped,
    UnionOpen,
    Scalar,
    None,
}

pub struct OperationPlan {
    pub page_name: Option<PageName>,
    pub binary_content_type: Option<String>,
    pub encoding: Option<String>,
    pub has_body: bool,
    pub primary_response: PrimaryResponse,
}

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

fn page_name(method: &Value, binary: &Option<String>) -> Option<PageName> {
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
        Some("cursor") => Some(PageName::Cursor),
        Some("page") => Some(PageName::Page),
        Some("offset") if pagination.get("offsetParam").is_some() => Some(PageName::Offset),
        _ => None,
    }
}

fn body_encoding(method: &Value) -> Option<String> {
    let rb = method.get("requestBody")?;
    let enc = rb.get("encoding").and_then(|e| e.as_str());
    Some(
        match enc {
            Some("multipart") => "multipart",
            Some("form") => "form",
            _ => "json",
        }
        .to_string(),
    )
}

fn classify_primary(method: &Value, types: &serde_json::Map<String, Value>) -> PrimaryResponse {
    let Some(ref_) = method.get("primaryResponse") else {
        return PrimaryResponse::None;
    };
    if ref_.get("kind").and_then(|k| k.as_str()) == Some("ref") {
        if let Some(name) = ref_.get("name").and_then(|n| n.as_str()) {
            match types.get(name) {
                None => return PrimaryResponse::Struct,
                Some(named) => match named.get("kind").and_then(|k| k.as_str()) {
                    Some("struct") => return PrimaryResponse::Struct,
                    Some("union") => {
                        let disc = named.get("discriminator");
                        let mapped = disc
                            .and_then(|d| d.get("propertyName"))
                            .and_then(|p| p.as_str())
                            .map(|p| !p.is_empty())
                            .unwrap_or(false)
                            && disc
                                .and_then(|d| d.get("mapping"))
                                .and_then(|m| m.as_object())
                                .map(|m| !m.is_empty())
                                .unwrap_or(false);
                        return if mapped {
                            PrimaryResponse::UnionMapped
                        } else {
                            PrimaryResponse::UnionOpen
                        };
                    }
                    _ => return PrimaryResponse::Scalar,
                },
            }
        }
    }
    PrimaryResponse::Scalar
}

pub fn plan_operation(method: &Value, types: &serde_json::Map<String, Value>) -> OperationPlan {
    let binary = binary_content_type(method);
    OperationPlan {
        page_name: page_name(method, &binary),
        encoding: body_encoding(method),
        has_body: method.get("requestBody").is_some(),
        primary_response: classify_primary(method, types),
        binary_content_type: binary,
    }
}
