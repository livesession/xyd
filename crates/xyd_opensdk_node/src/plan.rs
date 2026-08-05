//! Per-operation semantic plan. Ports `@xyd-js/opensdk-framework`
//! `operation-plan.ts` (only the fields the Node emitter consumes).

use crate::ir::{Method, NamedType};

#[derive(Clone, Copy, PartialEq)]
pub enum PrimaryResponseKind {
    Struct,
    UnionMapped,
    UnionOpen,
    Scalar,
    None,
}

pub struct OperationPlan {
    /// Vendored page kind (`CursorPage` | `Page` | `OffsetPage`) or None.
    pub page_name: Option<&'static str>,
    /// Non-json primary 2xx content type (binary/stream download), else None.
    pub binary_content_type: Option<String>,
    /// Request body wire encoding, or None when the method has no body.
    pub encoding: Option<&'static str>,
    pub has_body: bool,
    pub body_required: bool,
    pub primary_response: PrimaryResponseKind,
    pub inject_idempotency_key: bool,
}

pub fn plan_operation(method: &Method, types: &[&NamedType]) -> OperationPlan {
    let binary = binary_content_type(method);
    OperationPlan {
        page_name: page_name(method, binary.is_some()),
        encoding: body_encoding(method),
        has_body: method.request_body.is_some(),
        body_required: method
            .request_body
            .as_ref()
            .map(|b| b.required)
            .unwrap_or(false),
        primary_response: classify_primary_response(method, types),
        inject_idempotency_key: method.inject_idempotency_key,
        binary_content_type: binary,
    }
}

fn binary_content_type(method: &Method) -> Option<String> {
    let primary = method.responses.iter().find(|r| {
        r.status
            .as_deref()
            .map(|s| s.starts_with('2'))
            .unwrap_or(false)
    })?;
    let ct = primary.content_type.as_deref()?;
    if !ct.contains("json") {
        Some(ct.to_string())
    } else {
        None
    }
}

fn page_name(method: &Method, binary: bool) -> Option<&'static str> {
    if binary {
        return None;
    }
    let pagination = method.pagination.as_ref()?;
    if pagination.item_type.is_none() || pagination.items_field.as_deref() != Some("data") {
        return None;
    }
    match pagination.style.as_deref() {
        Some("cursor") => Some("CursorPage"),
        Some("page") => Some("Page"),
        Some("offset") if pagination.offset_param.is_some() => Some("OffsetPage"),
        _ => None,
    }
}

fn body_encoding(method: &Method) -> Option<&'static str> {
    let body = method.request_body.as_ref()?;
    Some(match body.encoding.as_deref() {
        Some("multipart") => "multipart",
        Some("form") => "form",
        _ => "json",
    })
}

fn classify_primary_response(method: &Method, types: &[&NamedType]) -> PrimaryResponseKind {
    let Some(r) = method.primary_response.as_ref() else {
        return PrimaryResponseKind::None;
    };
    if r.kind() == "ref" {
        if let Some(name) = r.name.as_deref() {
            let named = types.iter().find(|t| t.name == name);
            return match named {
                None => PrimaryResponseKind::Struct,
                Some(t) if t.kind == "struct" => PrimaryResponseKind::Struct,
                Some(t) if t.kind == "union" => {
                    let mapped = t
                        .discriminator
                        .as_ref()
                        .map(|d| {
                            d.property_name
                                .as_deref()
                                .map(|p| !p.is_empty())
                                .unwrap_or(false)
                                && !d.mapping.is_empty()
                        })
                        .unwrap_or(false);
                    if mapped {
                        PrimaryResponseKind::UnionMapped
                    } else {
                        PrimaryResponseKind::UnionOpen
                    }
                }
                Some(_) => PrimaryResponseKind::Scalar, // enum / alias
            };
        }
    }
    PrimaryResponseKind::Scalar
}
