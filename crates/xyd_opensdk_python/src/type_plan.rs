//! Port of the framework `type-plan.ts`: the language-neutral view of one
//! operation's SDK request-params type + response type (the sibling of
//! `example_plan.rs`, which plans example VALUES).
//!
//! Only the fields the Python renderers read are carried. Python FLATTENS the
//! params struct into keyword arguments, so the neutral `in` (body/query/header)
//! location and the wire name are irrelevant to what gets rendered — every row's
//! name and type come from `logicalName` + `typeRef` alone. The dedupe still
//! happens body-first so the row order matches `methodDef`'s kwarg order.

use std::collections::{HashMap, HashSet};

use serde_json::Value;

use crate::resources::Plan;
use crate::val::{arr, bool_field, str_field};

type TypeMap<'a> = HashMap<&'a str, &'a Value>;

/// One language-neutral field of a request/response type.
pub(crate) struct NeutralTypeField<'a> {
    /// IR field/param name — the casing SOURCE the Python name is derived from.
    pub logical_name: &'a str,
    /// Raw IR type, rendered by `pytype::py_type`.
    pub type_ref: Option<&'a Value>,
    pub required: bool,
    pub description: Option<&'a str>,
    pub deprecated: Option<bool>,
}

/// The neutral type reference for one method: request params ∪ response type.
pub(crate) struct NeutralTypeReference<'a> {
    /// body ∪ query ∪ header, deduped body-wins.
    pub request_fields: Vec<NeutralTypeField<'a>>,
    /// The primary response type (or the paginated ITEM type).
    pub response_type_ref: Option<&'a Value>,
    /// Struct field rows when the response is a ref-to-struct; `None` otherwise.
    pub response_fields: Option<Vec<NeutralTypeField<'a>>>,
}

fn to_field(source: &Value) -> NeutralTypeField<'_> {
    NeutralTypeField {
        logical_name: str_field(source, "name").unwrap_or(""),
        type_ref: source.get("type"),
        required: bool_field(source, "required") == Some(true),
        description: str_field(source, "description"),
        deprecated: bool_field(source, "deprecated"),
    }
}

/// Resolve a body TypeRef (ref → struct) to its field list; `&[]` otherwise.
fn resolve_body_fields<'a>(body_ref: Option<&'a Value>, types: &TypeMap<'a>) -> &'a [Value] {
    let Some(r) = body_ref else { return &[] };
    if str_field(r, "kind") != Some("ref") {
        return &[];
    }
    let Some(name) = str_field(r, "name").filter(|n| !n.is_empty()) else {
        return &[];
    };
    match types.get(name) {
        Some(named) if str_field(named, "kind") == Some("struct") => arr(named, "fields"),
        _ => &[],
    }
}

/// The ORIGINAL IR schema name behind a field's type, for a cross-type link.
/// Direct refs only (v1).
pub(crate) fn ref_schema_name(type_ref: Option<&Value>) -> Option<&str> {
    let r = type_ref?;
    if str_field(r, "kind") != Some("ref") {
        return None;
    }
    str_field(r, "name").filter(|n| !n.is_empty())
}

/// A paginated list's real payload is the ITEM type, not the page envelope.
fn response_type_ref<'a>(method: &'a Value, plan: &Plan) -> Option<&'a Value> {
    if plan.page_name.is_some() {
        let item = method
            .get("pagination")
            .and_then(|p| p.get("itemType"))
            .filter(|v| !v.is_null());
        if item.is_some() {
            return item;
        }
    }
    method.get("primaryResponse").filter(|v| !v.is_null())
}

fn response_struct_fields<'a>(
    ref_: Option<&'a Value>,
    types: &TypeMap<'a>,
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
    Some(arr(named, "fields").iter().map(to_field).collect())
}

/// The neutral type reference for a method: request = body ∪ query ∪ header
/// (deduped body-wins so rows match the kwarg order); response =
/// `primaryResponse` (or the paginated item type) with struct fields resolved
/// one level deep — nested refs are LINKED (via `ref_schema_name`), not inlined.
pub(crate) fn plan_type_reference<'a>(
    method: &'a Value,
    types: &TypeMap<'a>,
    plan: &Plan,
) -> NeutralTypeReference<'a> {
    let mut request_fields: Vec<NeutralTypeField<'a>> = Vec::new();
    let mut seen: HashSet<&str> = HashSet::new();

    let body_ref = method.get("requestBody").and_then(|b| b.get("type"));
    for f in resolve_body_fields(body_ref, types) {
        let field = to_field(f);
        seen.insert(field.logical_name);
        request_fields.push(field);
    }
    for p in arr(method, "queryParams")
        .iter()
        .chain(arr(method, "headerParams").iter())
    {
        let field = to_field(p);
        if !seen.insert(field.logical_name) {
            continue; // body-wins
        }
        request_fields.push(field);
    }

    let response_type_ref = response_type_ref(method, plan);
    NeutralTypeReference {
        request_fields,
        response_type_ref,
        response_fields: response_struct_fields(response_type_ref, types),
    }
}
