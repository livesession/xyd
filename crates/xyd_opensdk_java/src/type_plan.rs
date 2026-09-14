//! Port of the framework `type-plan.ts`: the language-neutral view of one
//! operation's SDK request-params type + response type (the sibling of
//! `example_plan.rs`, which plans example VALUES). `docs.rs` renders this into
//! the Java field rows Atlas shows in place of the REST param definitions.

use serde_json::Value;

use crate::ir::{str_field, Types};
use crate::plan::OperationPlan;

/// One language-neutral field of a request/response type.
pub struct NeutralTypeField<'a> {
    /// IR field/param name — the casing SOURCE the Java name derives from.
    pub logical_name: String,
    /// Raw IR type — rendered to a Java type string by the caller.
    pub type_ref: Option<&'a Value>,
    pub required: bool,
    pub description: Option<String>,
    pub deprecated: Option<bool>,
}

/// The neutral type reference for one method: request params ∪ response type.
pub struct NeutralTypeReference<'a> {
    /// body ∪ query ∪ header, deduped body-wins (params-interface field order).
    pub request_fields: Vec<NeutralTypeField<'a>>,
    /// The primary response type (or the paginated item type).
    pub response_type_ref: Option<&'a Value>,
    /// Struct field rows when the response is a ref-to-struct; absent otherwise.
    pub response_fields: Option<Vec<NeutralTypeField<'a>>>,
}

/// Resolve a body TypeRef (ref → struct) to its field list; `[]` otherwise.
fn resolve_body_fields<'a>(body_ref: Option<&'a Value>, types: &'a Types) -> Vec<&'a Value> {
    let Some(r) = body_ref else { return Vec::new() };
    if str_field(r, "kind") != Some("ref") {
        return Vec::new();
    }
    let Some(name) = str_field(r, "name").filter(|n| !n.is_empty()) else {
        return Vec::new();
    };
    let Some(named) = types.get(name) else {
        return Vec::new();
    };
    if str_field(named, "kind") != Some("struct") {
        return Vec::new();
    }
    named
        .get("fields")
        .and_then(Value::as_array)
        .map(|a| a.iter().collect())
        .unwrap_or_default()
}

/// The ORIGINAL IR schema name behind a field's type, for a cross-type link.
/// Direct refs only (v1).
pub fn ref_schema_name(type_ref: Option<&Value>) -> Option<String> {
    let r = type_ref?;
    if str_field(r, "kind") != Some("ref") {
        return None;
    }
    str_field(r, "name")
        .filter(|n| !n.is_empty())
        .map(str::to_string)
}

fn to_request_field(source: &Value) -> NeutralTypeField<'_> {
    NeutralTypeField {
        logical_name: str_field(source, "name").unwrap_or("").to_string(),
        type_ref: source.get("type"),
        required: source
            .get("required")
            .and_then(Value::as_bool)
            .unwrap_or(false),
        description: str_field(source, "description").map(str::to_string),
        deprecated: source.get("deprecated").and_then(Value::as_bool),
    }
}

/// A paginated list's real payload is the ITEM type, not the page envelope.
fn response_type_ref<'a>(method: &'a Value, op: &OperationPlan<'a>) -> Option<&'a Value> {
    if op.page_name.is_some() {
        if let Some(item) = method.get("pagination").and_then(|p| p.get("itemType")) {
            return Some(item);
        }
    }
    method.get("primaryResponse")
}

fn response_struct_fields<'a>(
    ref_: Option<&'a Value>,
    types: &'a Types,
) -> Option<Vec<NeutralTypeField<'a>>> {
    let r = ref_?;
    if str_field(r, "kind") != Some("ref") {
        return None;
    }
    let name = str_field(r, "name").filter(|n| !n.is_empty())?;
    let named = types.get(name)?;
    if str_field(named, "kind") != Some("struct") {
        return None;
    }
    Some(
        named
            .get("fields")
            .and_then(Value::as_array)
            .map(|a| a.iter().map(to_request_field).collect())
            .unwrap_or_default(),
    )
}

/// The neutral type reference for a method: request = body ∪ query ∪ header
/// (deduped body-wins so rows match the params-class order); response =
/// primaryResponse (or the paginated item type), with struct fields resolved one
/// level deep — nested refs are LINKED (via `ref_schema_name`), not inlined.
pub fn plan_type_reference<'a>(
    method: &'a Value,
    op: &OperationPlan<'a>,
    types: &'a Types,
) -> NeutralTypeReference<'a> {
    let mut fields: Vec<NeutralTypeField<'a>> = Vec::new();
    let mut seen: Vec<String> = Vec::new();

    let body_ref = method.get("requestBody").and_then(|b| b.get("type"));
    for f in resolve_body_fields(body_ref, types) {
        let nf = to_request_field(f);
        seen.push(nf.logical_name.clone());
        fields.push(nf);
    }
    for group in [&op.query, &op.header] {
        for p in group {
            let nf = to_request_field(p);
            if seen.contains(&nf.logical_name) {
                continue; // body-wins
            }
            seen.push(nf.logical_name.clone());
            fields.push(nf);
        }
    }

    // `primaryResponse === 'none'` still carries the ref through here; the
    // renderer is what collapses it to `void` (mirrors the TS split).
    let response_ref = response_type_ref(method, op);

    NeutralTypeReference {
        request_fields: fields,
        response_type_ref: response_ref,
        response_fields: response_struct_fields(response_ref, types),
    }
}
