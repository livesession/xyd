//! Port of the framework `type-plan.ts`: the language-NEUTRAL view of one
//! operation's SDK request-params type + response type. The sibling of
//! `example_plan.rs` (which plans example VALUES); `docs.rs` renders this into
//! the per-language field rows Atlas shows in place of the REST param
//! definitions.
//!
//! Only the fields the Node emitter reads are modeled. The TS interface also
//! carries `wireName`, `in`, `hasBody`/`bodyEncoding` and the response
//! `kind`/`page`/`binaryContentType`; Node re-derives all of those from its own
//! `OperationPlan`, so carrying them here would be dead weight.

use crate::ir::{Field, Method, NamedType, TypeRef};
use crate::plan::{plan_operation, OperationPlan};

/// One language-neutral field of a request/response type.
pub struct NeutralTypeField {
    /// IR field/param name — the casing SOURCE the emitter derives its name from.
    pub logical_name: String,
    /// Raw IR type — the emitter renders it to its own language type string.
    pub type_ref: TypeRef,
    pub required: bool,
    pub description: Option<String>,
    pub deprecated: Option<bool>,
}

/// The neutral type reference for one method: request params ∪ response type.
pub struct NeutralTypeReference {
    /// body ∪ query ∪ header, deduped body-wins (the params-interface order).
    pub request_fields: Vec<NeutralTypeField>,
    /// The primary response type (or the paginated ITEM type).
    pub response_type: Option<TypeRef>,
    /// Struct field rows when the response is a ref-to-struct; `None` otherwise.
    pub response_fields: Option<Vec<NeutralTypeField>>,
}

/// Resolve a body `TypeRef` (ref → struct) to its field list; empty otherwise.
pub fn resolve_body_fields<'a>(
    body_ref: Option<&TypeRef>,
    types: &'a [&'a NamedType],
) -> Vec<&'a Field> {
    let Some(r) = body_ref.filter(|r| r.kind() == "ref") else {
        return Vec::new();
    };
    let Some(name) = r.name.as_deref().filter(|n| !n.is_empty()) else {
        return Vec::new();
    };
    types
        .iter()
        .find(|t| t.name == name)
        .filter(|t| t.kind == "struct")
        .map(|t| t.fields.iter().collect())
        .unwrap_or_default()
}

/// The ORIGINAL IR schema name behind a field's type, for a cross-type link
/// (`symbolDef.canonical → objects/<name>`). Direct refs only (v1).
pub fn ref_schema_name(type_ref: &TypeRef) -> Option<String> {
    if type_ref.kind() != "ref" {
        return None;
    }
    type_ref
        .name
        .as_deref()
        .filter(|n| !n.is_empty())
        .map(str::to_string)
}

fn field_to_neutral(f: &Field) -> NeutralTypeField {
    NeutralTypeField {
        logical_name: f.name.clone(),
        type_ref: f.ty.clone(),
        required: f.required == Some(true),
        description: f.description.clone(),
        deprecated: f.deprecated,
    }
}

/// A paginated list's real payload is the ITEM type, not the page envelope.
fn response_type_ref(method: &Method, op: &OperationPlan) -> Option<TypeRef> {
    if op.page_name.is_some() {
        if let Some(item) = method
            .pagination
            .as_ref()
            .and_then(|p| p.item_type.as_ref())
        {
            return Some(item.clone());
        }
    }
    method.primary_response.clone()
}

fn response_struct_fields(
    ref_: Option<&TypeRef>,
    types: &[&NamedType],
) -> Option<Vec<NeutralTypeField>> {
    let r = ref_.filter(|r| r.kind() == "ref")?;
    let name = r.name.as_deref().filter(|n| !n.is_empty())?;
    let named = types.iter().find(|t| t.name == name)?;
    if named.kind != "struct" {
        return None;
    }
    Some(named.fields.iter().map(field_to_neutral).collect())
}

/// The neutral type reference for a method: request = body ∪ query ∪ header
/// (deduped body-wins so the rows match the params-interface order); response =
/// primaryResponse (or the paginated item type), with struct fields resolved ONE
/// level deep — nested refs are LINKED (via [`ref_schema_name`]), not inlined.
pub fn plan_type_reference(method: &Method, types: &[&NamedType]) -> NeutralTypeReference {
    let op = plan_operation(method, types);

    let mut fields: Vec<NeutralTypeField> = Vec::new();
    let mut seen: Vec<String> = Vec::new();
    for f in resolve_body_fields(method.request_body.as_ref().map(|b| &b.ty), types) {
        fields.push(field_to_neutral(f));
        seen.push(f.name.clone());
    }
    for p in method
        .query_params
        .iter()
        .chain(method.header_params.iter())
    {
        if seen.iter().any(|n| n == &p.name) {
            continue; // body-wins
        }
        seen.push(p.name.clone());
        fields.push(NeutralTypeField {
            logical_name: p.name.clone(),
            type_ref: p.ty.clone(),
            required: p.required == Some(true),
            description: p.description.clone(),
            deprecated: p.deprecated,
        });
    }

    let response_type = response_type_ref(method, &op);
    NeutralTypeReference {
        request_fields: fields,
        response_fields: response_struct_fields(response_type.as_ref(), types),
        response_type,
    }
}
