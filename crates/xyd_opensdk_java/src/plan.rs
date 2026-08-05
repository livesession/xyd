//! planOperation — port of @xyd-js/opensdk-framework/operation-plan.ts. The
//! shared per-operation semantics (pageName / binaryContentType / encoding /
//! paramGroups / primaryResponse classification).

use serde_json::Value;

use crate::ir::{arr_field, str_field, Types};

#[derive(Clone, Copy, PartialEq)]
pub enum PrimaryKind {
    Struct,
    UnionMapped,
    UnionOpen,
    Scalar,
    None,
}

pub struct OperationPlan<'a> {
    #[allow(dead_code)]
    pub method: &'a Value,
    pub page_name: Option<&'static str>,
    pub binary_content_type: Option<String>,
    pub encoding: Option<&'static str>,
    pub path: Vec<&'a Value>,
    pub query: Vec<&'a Value>,
    pub header: Vec<&'a Value>,
    pub primary_response: PrimaryKind,
}

fn binary_content_type(method: &Value) -> Option<String> {
    let primary = arr_field(method, "responses").into_iter().find(|r| {
        str_field(r, "status")
            .map(|s| s.starts_with('2'))
            .unwrap_or(false)
    });
    let ct = primary.and_then(|p| str_field(p, "contentType"));
    match ct {
        Some(ct) if !ct.contains("json") => Some(ct.to_string()),
        _ => None,
    }
}

fn page_name(method: &Value, binary: &Option<String>) -> Option<&'static str> {
    if binary.is_some() {
        return None;
    }
    let pg = method.get("pagination")?;
    if pg.get("itemType").is_none() || str_field(pg, "itemsField") != Some("data") {
        return None;
    }
    match str_field(pg, "style") {
        Some("cursor") => Some("CursorPage"),
        Some("page") => Some("Page"),
        Some("offset") if pg.get("offsetParam").is_some() => Some("OffsetPage"),
        _ => None,
    }
}

fn body_encoding(method: &Value) -> Option<&'static str> {
    let rb = method.get("requestBody")?;
    match str_field(rb, "encoding") {
        Some("multipart") => Some("multipart"),
        Some("form") => Some("form"),
        _ => Some("json"),
    }
}

fn classify_primary(method: &Value, types: &Types) -> PrimaryKind {
    let Some(ref_) = method.get("primaryResponse") else {
        return PrimaryKind::None;
    };
    if str_field(ref_, "kind") == Some("ref") {
        if let Some(name) = str_field(ref_, "name") {
            let named = types.get(name);
            return match named.and_then(|n| str_field(n, "kind")) {
                None | Some("struct") => PrimaryKind::Struct,
                Some("union") => {
                    let disc = named.unwrap().get("discriminator");
                    let mapped = disc
                        .and_then(|d| d.get("propertyName"))
                        .and_then(|p| p.as_str())
                        .map(|s| !s.is_empty())
                        .unwrap_or(false)
                        && disc
                            .and_then(|d| d.get("mapping"))
                            .and_then(|m| m.as_object())
                            .map(|m| !m.is_empty())
                            .unwrap_or(false);
                    if mapped {
                        PrimaryKind::UnionMapped
                    } else {
                        PrimaryKind::UnionOpen
                    }
                }
                _ => PrimaryKind::Scalar,
            };
        }
    }
    PrimaryKind::Scalar
}

pub fn plan_operation<'a>(method: &'a Value, types: &Types) -> OperationPlan<'a> {
    let binary = binary_content_type(method);
    let page = page_name(method, &binary);
    OperationPlan {
        method,
        page_name: page,
        binary_content_type: binary,
        encoding: body_encoding(method),
        path: arr_field(method, "pathParams"),
        query: arr_field(method, "queryParams"),
        header: arr_field(method, "headerParams"),
        primary_response: classify_primary(method, types),
    }
}
