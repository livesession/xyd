//! Port of the framework `type-plan.ts`: the language-NEUTRAL view of one
//! operation's SDK request-params type + response type. The sibling of
//! `example_plan.rs` (which plans example VALUES); `docs.rs` renders this into
//! the per-language field rows Atlas shows in place of the REST param tables.
//!
//! Two fields of the TS `NeutralTypeField` are deliberately absent: `wireName`
//! and `in` (the body/query/header location). Ruby flattens the params struct to
//! keyword args and is duck-typed, so its renderer derives BOTH the row name and
//! the documented type from `logicalName` + `typeRef` alone and never reads
//! either — carrying them here would be unreachable state.

use std::collections::{HashMap, HashSet};

use serde_json::Value;

use crate::plan::plan_operation;

/// One language-neutral field of a request/response type.
pub struct NeutralTypeField {
    /// IR field/param name — the casing SOURCE the emitter derives its name from.
    pub logical_name: String,
    /// Raw IR type; the emitter renders it to its own language type string.
    pub type_ref: Option<Value>,
    pub required: bool,
    pub description: Option<String>,
    pub deprecated: Option<bool>,
}

/// The request half: body ∪ query ∪ header, deduped body-wins.
pub struct NeutralRequest {
    pub fields: Vec<NeutralTypeField>,
}

/// The response half: the primary response type (or the paginated ITEM type),
/// with its struct fields resolved one level deep when it is a ref-to-struct.
pub struct NeutralResponse {
    pub type_ref: Option<Value>,
    pub fields: Option<Vec<NeutralTypeField>>,
}

/// The neutral type reference for one method.
pub struct NeutralTypeReference {
    pub request: NeutralRequest,
    pub response: NeutralResponse,
}

/// A present, non-null object field (JS `?.` / `??` semantics: an explicit
/// `null` reads the same as an absent key).
fn opt<'a>(v: &'a Value, key: &str) -> Option<&'a Value> {
    v.get(key).filter(|x| !x.is_null())
}

fn name_of(v: &Value) -> &str {
    v.get("name").and_then(Value::as_str).unwrap_or("")
}

fn is_required(v: &Value) -> bool {
    v.get("required").and_then(Value::as_bool).unwrap_or(false)
}

/// The named type behind a `ref` TypeRef, or `None`.
fn named_of<'a>(type_ref: Option<&Value>, types: &'a HashMap<String, Value>) -> Option<&'a Value> {
    let r = type_ref?;
    if r.get("kind").and_then(Value::as_str) != Some("ref") {
        return None;
    }
    let name = r
        .get("name")
        .and_then(Value::as_str)
        .filter(|n| !n.is_empty())?;
    types.get(name)
}

/// Resolve a body TypeRef (ref → struct) to its field list; `[]` otherwise.
pub fn resolve_body_fields<'a>(
    body_ref: Option<&Value>,
    types: &'a HashMap<String, Value>,
) -> &'a [Value] {
    let Some(named) = named_of(body_ref, types) else {
        return &[];
    };
    if named.get("kind").and_then(Value::as_str) != Some("struct") {
        return &[];
    }
    named
        .get("fields")
        .and_then(Value::as_array)
        .map(Vec::as_slice)
        .unwrap_or(&[])
}

/// The ORIGINAL IR schema name behind a field's type, for a cross-type link
/// (`symbolDef.canonical → objects/<name>`). Direct refs only (v1).
pub fn ref_schema_name(type_ref: Option<&Value>) -> Option<String> {
    let r = type_ref?;
    if r.get("kind").and_then(Value::as_str) != Some("ref") {
        return None;
    }
    r.get("name")
        .and_then(Value::as_str)
        .filter(|n| !n.is_empty())
        .map(str::to_string)
}

/// One IR field/param → a neutral field row.
fn to_field(source: &Value) -> NeutralTypeField {
    NeutralTypeField {
        logical_name: name_of(source).to_string(),
        type_ref: opt(source, "type").cloned(),
        required: is_required(source),
        description: source
            .get("description")
            .and_then(Value::as_str)
            .map(str::to_string),
        deprecated: source.get("deprecated").and_then(Value::as_bool),
    }
}

/// A paginated list's real payload is the ITEM type, not the page envelope.
fn response_type_ref(method: &Value, page_name: Option<&str>) -> Option<Value> {
    if page_name.is_some() {
        if let Some(item) = method.get("pagination").and_then(|p| opt(p, "itemType")) {
            return Some(item.clone());
        }
    }
    opt(method, "primaryResponse").cloned()
}

fn response_struct_fields(
    type_ref: Option<&Value>,
    types: &HashMap<String, Value>,
) -> Option<Vec<NeutralTypeField>> {
    let named = named_of(type_ref, types)?;
    if named.get("kind").and_then(Value::as_str) != Some("struct") {
        return None;
    }
    Some(
        named
            .get("fields")
            .and_then(Value::as_array)
            .map(Vec::as_slice)
            .unwrap_or(&[])
            .iter()
            .map(to_field)
            .collect(),
    )
}

/// The neutral type reference for a method: request = body ∪ query ∪ header
/// (deduped body-wins so rows match the kwarg order); response = primaryResponse
/// (or the paginated item type), struct fields resolved one level deep — nested
/// refs are LINKED (via [`ref_schema_name`]), not inlined.
pub fn plan_type_reference(method: &Value, types: &HashMap<String, Value>) -> NeutralTypeReference {
    let op = plan_operation(method, types);

    let mut fields: Vec<NeutralTypeField> = Vec::new();
    let mut seen: HashSet<String> = HashSet::new();

    let body_ref = method.get("requestBody").and_then(|b| opt(b, "type"));
    for f in resolve_body_fields(body_ref, types) {
        seen.insert(name_of(f).to_string());
        fields.push(to_field(f));
    }
    for p in op.query_params.iter().chain(op.header_params.iter()) {
        // body-wins
        if !seen.insert(name_of(p).to_string()) {
            continue;
        }
        fields.push(to_field(p));
    }

    let response_ref = response_type_ref(method, op.page_name);
    let response_fields = response_struct_fields(response_ref.as_ref(), types);

    NeutralTypeReference {
        request: NeutralRequest { fields },
        response: NeutralResponse {
            type_ref: response_ref,
            fields: response_fields,
        },
    }
}
