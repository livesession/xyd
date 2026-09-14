//! Port of the framework `type-plan.ts` — the language-neutral view of one
//! operation's SDK request/response TYPES (the sibling of `example_plan`, which
//! plans example VALUES). `docs.rs` renders this into the per-language field
//! rows Atlas shows in place of the REST "query params".
//!
//! The TS `NeutralTypeField` also carries `wireName`, and `NeutralTypeReference`
//! also carries `hasBody`/`bodyEncoding`/`kind`/`page`/`binaryContentType`. The
//! .NET renderer reads none of them — it takes those decisions from its own
//! `plan_operation` — so they are omitted here rather than carried dead.

use std::collections::HashSet;

use serde_json::Value;

use crate::cstype::Types;
use crate::plan::plan_operation;

/// Where a request field comes from (query/header params collapse into the
/// flattened .NET argument list; body fields become model properties).
#[derive(Clone, Copy, PartialEq, Eq)]
pub enum FieldLocation {
    Body,
    Query,
    Header,
}

/// One language-neutral field of a request/response type.
pub struct NeutralTypeField {
    /// IR field/param name — the casing SOURCE the emitter derives its name from.
    pub logical_name: String,
    /// Raw IR type, rendered by the emitter into its own type string.
    pub type_ref: Option<Value>,
    pub required: bool,
    pub description: Option<String>,
    pub deprecated: Option<bool>,
    /// Response fields carry `Body` (ignored).
    pub location: FieldLocation,
}

/// The neutral type reference for one method: request params ∪ response.
pub struct NeutralTypeReference {
    /// body ∪ query ∪ header, deduped body-wins (params-interface field order).
    pub request_fields: Vec<NeutralTypeField>,
    /// The primary response type (or the paginated ITEM type).
    pub response_type_ref: Option<Value>,
    /// Struct field rows when the response is a ref-to-struct; `None` otherwise.
    pub response_fields: Option<Vec<NeutralTypeField>>,
}

/// A non-null JSON value, or `None` (JS `undefined`/`null` collapse here).
fn present(v: Option<&Value>) -> Option<&Value> {
    v.filter(|v| !v.is_null())
}

fn opt_string(v: &Value, key: &str) -> Option<String> {
    v.get(key).and_then(Value::as_str).map(str::to_string)
}

/// Resolve a body TypeRef (ref → struct) to its field list; `[]` otherwise.
pub fn resolve_body_fields<'a>(body_ref: Option<&Value>, types: Types<'a>) -> &'a [Value] {
    const EMPTY: &[Value] = &[];
    let Some(br) = present(body_ref) else {
        return EMPTY;
    };
    if br.get("kind").and_then(Value::as_str) != Some("ref") {
        return EMPTY;
    }
    let Some(name) = br
        .get("name")
        .and_then(Value::as_str)
        .filter(|n| !n.is_empty())
    else {
        return EMPTY;
    };
    let Some(named) = types.get(name) else {
        return EMPTY;
    };
    if named.get("kind").and_then(Value::as_str) != Some("struct") {
        return EMPTY;
    }
    named
        .get("fields")
        .and_then(Value::as_array)
        .map(Vec::as_slice)
        .unwrap_or(EMPTY)
}

/// The ORIGINAL IR schema name behind a field's type, for a cross-type link
/// (`symbolDef.canonical → objects/<name>`). Direct refs only (v1).
pub fn ref_schema_name(type_ref: Option<&Value>) -> Option<String> {
    let r = present(type_ref)?;
    if r.get("kind").and_then(Value::as_str) != Some("ref") {
        return None;
    }
    r.get("name")
        .and_then(Value::as_str)
        .filter(|n| !n.is_empty())
        .map(str::to_string)
}

/// `toRequestField`: one IR field/param as a neutral row.
fn to_field(source: &Value, location: FieldLocation) -> NeutralTypeField {
    NeutralTypeField {
        logical_name: source
            .get("name")
            .and_then(Value::as_str)
            .unwrap_or("")
            .to_string(),
        type_ref: present(source.get("type")).cloned(),
        required: source
            .get("required")
            .and_then(Value::as_bool)
            .unwrap_or(false),
        description: opt_string(source, "description"),
        deprecated: source.get("deprecated").and_then(Value::as_bool),
        location,
    }
}

/// Struct field rows for a ref-to-struct response; `None` for anything else.
fn response_struct_fields(ref_: Option<&Value>, types: Types) -> Option<Vec<NeutralTypeField>> {
    let r = present(ref_)?;
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
        named
            .get("fields")
            .and_then(Value::as_array)
            .map(Vec::as_slice)
            .unwrap_or(&[])
            .iter()
            .map(|f| to_field(f, FieldLocation::Body))
            .collect(),
    )
}

/// `planTypeReference`: request = body ∪ query ∪ header (deduped body-wins so
/// rows match the params-interface order); response = primaryResponse (or the
/// paginated item type), struct fields resolved ONE level deep — nested refs are
/// linked via [`ref_schema_name`], not inlined.
pub fn plan_type_reference(method: &Value, types: Types) -> NeutralTypeReference {
    let op = plan_operation(method, types);

    let mut fields: Vec<NeutralTypeField> = Vec::new();
    let mut seen: HashSet<String> = HashSet::new();
    let body_ref = method.get("requestBody").and_then(|b| b.get("type"));
    for f in resolve_body_fields(body_ref, types) {
        let field = to_field(f, FieldLocation::Body);
        seen.insert(field.logical_name.clone());
        fields.push(field);
    }
    for (params, loc) in [
        (&op.query_params, FieldLocation::Query),
        (&op.header_params, FieldLocation::Header),
    ] {
        for p in params {
            let field = to_field(p, loc);
            if !seen.insert(field.logical_name.clone()) {
                continue; // body-wins
            }
            fields.push(field);
        }
    }

    // A paginated list's real payload is the ITEM type, not the page envelope.
    let response_type_ref = if op.page_name.is_some() {
        present(method.get("pagination").and_then(|p| p.get("itemType"))).cloned()
    } else {
        None
    }
    .or_else(|| present(method.get("primaryResponse")).cloned());

    NeutralTypeReference {
        request_fields: fields,
        response_fields: response_struct_fields(response_type_ref.as_ref(), types),
        response_type_ref,
    }
}
