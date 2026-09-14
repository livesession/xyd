//! Port of the framework `type-plan.ts`: the language-neutral view of one
//! operation's SDK request-params type + response type (the sibling of
//! `example_plan.rs`, which plans example VALUES). `example_go.rs` renders this
//! into the per-language field rows Atlas shows in place of the REST param
//! definitions.

use serde_json::{Map, Value};

use crate::plan::{plan_operation, OperationPlan};

/// Where a request field comes from (query/header params collapse into the
/// params type).
#[derive(Clone, Copy, PartialEq, Eq)]
pub enum FieldLocation {
    Body,
    Query,
    Header,
}

/// One language-neutral field of a request/response type.
pub struct NeutralTypeField {
    /// IR field/param name — the casing SOURCE the emitter derives the Go name
    /// from.
    pub logical_name: String,
    /// Raw IR type — the emitter renders it to its own language type string.
    pub type_ref: Option<Value>,
    pub required: bool,
    pub description: Option<String>,
    pub deprecated: Option<bool>,
    /// For request fields; response fields carry `Body` (ignored).
    pub in_: FieldLocation,
}

/// The neutral type reference for one method: its request params type + its
/// response type.
pub struct NeutralTypeReference {
    /// body ∪ query ∪ header, deduped body-wins (matches the params-struct
    /// field order).
    pub request_fields: Vec<NeutralTypeField>,
    /// The primary response type (or the paginated item type).
    pub response_type_ref: Option<Value>,
    /// Struct field rows when the response is a ref-to-struct; `None` otherwise.
    pub response_fields: Option<Vec<NeutralTypeField>>,
}

fn arr<'a>(v: &'a Value, key: &str) -> &'a [Value] {
    v.get(key)
        .and_then(Value::as_array)
        .map(Vec::as_slice)
        .unwrap_or(&[])
}

/// Resolve a body TypeRef (ref → struct) to its field list; empty otherwise.
fn resolve_body_fields<'a>(body_ref: Option<&Value>, types: &'a Map<String, Value>) -> &'a [Value] {
    let Some(r) = body_ref else { return &[] };
    if r.get("kind").and_then(Value::as_str) != Some("ref") {
        return &[];
    }
    let Some(name) = r
        .get("name")
        .and_then(Value::as_str)
        .filter(|n| !n.is_empty())
    else {
        return &[];
    };
    let Some(named) = types.get(name) else {
        return &[];
    };
    if named.get("kind").and_then(Value::as_str) != Some("struct") {
        return &[];
    }
    arr(named, "fields")
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

fn to_field(source: &Value, loc: FieldLocation) -> NeutralTypeField {
    NeutralTypeField {
        logical_name: source
            .get("name")
            .and_then(Value::as_str)
            .unwrap_or("")
            .to_string(),
        type_ref: source.get("type").cloned(),
        required: source
            .get("required")
            .and_then(Value::as_bool)
            .unwrap_or(false),
        description: source
            .get("description")
            .and_then(Value::as_str)
            .map(str::to_string),
        // An ABSENT key stays absent on the wire; an explicit `false` is
        // serialized, exactly as `JSON.stringify` treats `undefined` vs `false`.
        deprecated: source.get("deprecated").and_then(Value::as_bool),
        in_: loc,
    }
}

/// A paginated list's real payload is the ITEM type, not the page envelope.
fn response_type_ref(method: &Value, op: &OperationPlan) -> Option<Value> {
    if op.page_name.is_some() {
        if let Some(item) = method.get("pagination").and_then(|p| p.get("itemType")) {
            return Some(item.clone());
        }
    }
    method.get("primaryResponse").cloned()
}

fn response_struct_fields(
    ref_: Option<&Value>,
    types: &Map<String, Value>,
) -> Option<Vec<NeutralTypeField>> {
    let r = ref_?;
    if r.get("kind").and_then(Value::as_str) != Some("ref") {
        return None;
    }
    let name = r
        .get("name")
        .and_then(Value::as_str)
        .filter(|n| !n.is_empty())?;
    let named = types.get(name)?;
    if named.get("kind").and_then(Value::as_str) != Some("struct") {
        return None;
    }
    Some(
        arr(named, "fields")
            .iter()
            .map(|f| to_field(f, FieldLocation::Body))
            .collect(),
    )
}

/// The neutral type reference for a method: request = body ∪ query ∪ header
/// (deduped body-wins so rows match the params-struct order); response =
/// primaryResponse (or the paginated item type), with struct fields resolved one
/// level deep — nested refs are LINKED (via [`ref_schema_name`]), not inlined.
pub fn plan_type_reference(method: &Value, types: &Map<String, Value>) -> NeutralTypeReference {
    let op = plan_operation(method, types);

    let mut fields: Vec<NeutralTypeField> = Vec::new();
    let mut seen: Vec<String> = Vec::new();
    for f in resolve_body_fields(method.get("requestBody").and_then(|b| b.get("type")), types) {
        let field = to_field(f, FieldLocation::Body);
        seen.push(field.logical_name.clone());
        fields.push(field);
    }
    for (params, loc) in [
        ("queryParams", FieldLocation::Query),
        ("headerParams", FieldLocation::Header),
    ] {
        for p in arr(method, params) {
            let field = to_field(p, loc);
            if seen.contains(&field.logical_name) {
                continue; // body-wins
            }
            seen.push(field.logical_name.clone());
            fields.push(field);
        }
    }

    let response_ref = response_type_ref(method, &op);
    let response_fields = response_struct_fields(response_ref.as_ref(), types);

    NeutralTypeReference {
        request_fields: fields,
        response_type_ref: response_ref,
        response_fields,
    }
}
