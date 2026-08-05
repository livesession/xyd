//! Port of the framework `example-plan.ts` (the test-suite path: `realistic` is
//! never set by `generateTests`, so the spec-example/`default` branch — which the
//! typed IR here does not carry — is intentionally omitted). Turns a `TypeRef`
//! into a language-neutral `ExampleValue` tree; `example.rs` renders it to a
//! TypeScript literal, so every emitter's suite exercises identical shapes.

use std::collections::BTreeSet;

use crate::ir::{Field, Method, NamedType, Param, TypeRef};

/// A language-neutral example value; `example.rs` renders it to TypeScript.
pub enum ExampleValue {
    Str(String),
    Integer(i64),
    Number(f64),
    Boolean(bool),
    // Note: the `null` example (from a spec `default`/`example` literal) is only
    // produced by the `realistic` planner path, which `generateTests` never
    // enables — so it is intentionally not modeled in this test-suite fork.
    Binary,
    Enum(serde_json::Value),
    Const(serde_json::Value),
    Array(Box<ExampleValue>),
    Map(Box<ExampleValue>),
    Object(Vec<ExampleField>),
    Union(Box<ExampleValue>),
    Any,
}

/// One example field of an object/params example.
pub struct ExampleField {
    pub name: String,
    pub required: bool,
    pub value: ExampleValue,
}

/// One positional path argument, with its param name (for the guard test).
pub struct PathArg {
    pub param_name: String,
    pub value: ExampleValue,
}

/// The example call for one method — everything a test needs to invoke it.
pub struct MethodExample {
    pub path_args: Vec<PathArg>,
    pub fields: Vec<ExampleField>,
    pub has_optional: bool,
}

const MAX_DEPTH: usize = 6;

#[derive(Clone, Default)]
struct PlanOpts {
    with_optional: bool,
    string_hint: Option<String>,
}

fn field_required(f: &Field) -> bool {
    f.required == Some(true)
}

/// Resolve a `TypeRef` to an example value, expanding named types via the symbol
/// table. Cycle-guarded and depth-capped so recursive schemas stay finite.
fn plan_example(
    ref_: Option<&TypeRef>,
    types: &[&NamedType],
    opts: &PlanOpts,
    seen: &BTreeSet<String>,
    depth: usize,
) -> ExampleValue {
    let Some(r) = ref_ else {
        return ExampleValue::Any;
    };
    if depth > MAX_DEPTH {
        return ExampleValue::Any;
    }
    if let Some(c) = &r.const_val {
        return ExampleValue::Const(c.clone());
    }
    match r.kind() {
        "scalar" => scalar_example(r, opts.string_hint.as_deref()),
        "array" => ExampleValue::Array(Box::new(plan_example(
            r.items.as_deref(),
            types,
            &drop_hint(opts),
            seen,
            depth + 1,
        ))),
        "map" => ExampleValue::Map(Box::new(plan_example(
            r.values.as_deref(),
            types,
            &drop_hint(opts),
            seen,
            depth + 1,
        ))),
        "any" => ExampleValue::Any,
        "ref" => ref_example(r, types, opts, seen, depth),
        _ => ExampleValue::Any,
    }
}

fn scalar_example(r: &TypeRef, hint: Option<&str>) -> ExampleValue {
    let fmt = r.format.as_deref().unwrap_or("").to_lowercase();
    if fmt == "binary" {
        return ExampleValue::Binary;
    }
    match r.scalar.as_deref() {
        Some("integer") => ExampleValue::Integer(0),
        Some("number") => ExampleValue::Number(0.0),
        Some("boolean") => ExampleValue::Boolean(true),
        _ => ExampleValue::Str(hint.unwrap_or("x").to_string()),
    }
}

fn ref_example(
    r: &TypeRef,
    types: &[&NamedType],
    opts: &PlanOpts,
    seen: &BTreeSet<String>,
    depth: usize,
) -> ExampleValue {
    let Some(name) = r.name.as_deref().filter(|n| !n.is_empty()) else {
        return ExampleValue::Any;
    };
    let Some(named) = types.iter().find(|t| t.name == name) else {
        return ExampleValue::Any;
    };
    if seen.contains(name) {
        return ExampleValue::Object(Vec::new());
    }
    match named.kind.as_str() {
        "enum" => {
            let val = named
                .values
                .first()
                .map(|v| v.value.clone())
                .unwrap_or_else(|| serde_json::Value::String(String::new()));
            ExampleValue::Enum(val)
        }
        "alias" => plan_example(named.of.as_ref(), types, &drop_hint(opts), seen, depth + 1),
        "union" => {
            let mut nested = seen.clone();
            nested.insert(name.to_string());
            ExampleValue::Union(Box::new(plan_example(
                named.variants.first(),
                types,
                &drop_hint(opts),
                &nested,
                depth + 1,
            )))
        }
        _ => {
            let mut nested = seen.clone();
            nested.insert(name.to_string());
            ExampleValue::Object(example_fields(
                &named.fields,
                types,
                opts,
                &nested,
                depth + 1,
            ))
        }
    }
}

/// Example fields for a struct's field list; required-first, optionals only when
/// `withOptional`.
fn example_fields(
    fields: &[Field],
    types: &[&NamedType],
    opts: &PlanOpts,
    seen: &BTreeSet<String>,
    depth: usize,
) -> Vec<ExampleField> {
    let mut wanted: Vec<&Field> = fields
        .iter()
        .filter(|f| field_required(f) || opts.with_optional)
        .collect();
    // required first, then optional — stable so declaration order is preserved.
    wanted.sort_by_key(|f| usize::from(!field_required(f)));

    let nested = PlanOpts {
        with_optional: opts.with_optional,
        string_hint: None,
    };
    wanted
        .into_iter()
        .map(|f| ExampleField {
            name: f.name.clone(),
            required: field_required(f),
            value: plan_example(Some(&f.ty), types, &nested, seen, depth),
        })
        .collect()
}

/// Drop the per-level `stringHint` before recursing (keep `withOptional`).
fn drop_hint(opts: &PlanOpts) -> PlanOpts {
    if opts.string_hint.is_none() {
        opts.clone()
    } else {
        PlanOpts {
            with_optional: opts.with_optional,
            string_hint: None,
        }
    }
}

fn push_param(
    p: &Param,
    types: &[&NamedType],
    with_optional: bool,
    fields: &mut Vec<ExampleField>,
) {
    let required = p.required == Some(true);
    if !required && !with_optional {
        return;
    }
    let opts = PlanOpts {
        with_optional,
        string_hint: Some(p.name.clone()),
    };
    fields.push(ExampleField {
        name: p.name.clone(),
        required,
        value: plan_example(Some(&p.ty), types, &opts, &BTreeSet::new(), 0),
    });
}

fn body_has_optional(method: &Method, types: &[&NamedType]) -> bool {
    let Some(body) = method.request_body.as_ref() else {
        return false;
    };
    if body.ty.kind() != "ref" {
        return false;
    }
    let Some(name) = body.ty.name.as_deref() else {
        return false;
    };
    types
        .iter()
        .find(|t| t.name == name)
        .map(|named| named.fields.iter().any(|f| !field_required(f)))
        .unwrap_or(false)
}

/// The example call for a method: positional path args + params-struct fields
/// (query ∪ header ∪ request-body fields), required-first.
pub fn plan_method_example(
    method: &Method,
    types: &[&NamedType],
    with_optional: bool,
) -> MethodExample {
    let path_args = method
        .path_params
        .iter()
        .map(|p| {
            let opts = PlanOpts {
                with_optional: false,
                string_hint: Some(p.name.clone()),
            };
            PathArg {
                param_name: p.name.clone(),
                value: plan_example(Some(&p.ty), types, &opts, &BTreeSet::new(), 0),
            }
        })
        .collect();

    let mut fields: Vec<ExampleField> = Vec::new();
    for p in &method.query_params {
        push_param(p, types, with_optional, &mut fields);
    }
    for p in &method.header_params {
        push_param(p, types, with_optional, &mut fields);
    }

    // request body: flatten its struct fields into the params struct.
    if let Some(body) = method.request_body.as_ref() {
        if body.ty.kind() == "ref" {
            if let Some(name) = body.ty.name.as_deref() {
                if let Some(named) = types.iter().find(|t| t.name == name) {
                    if named.kind == "struct" {
                        let opts = PlanOpts {
                            with_optional,
                            string_hint: None,
                        };
                        for f in example_fields(&named.fields, types, &opts, &BTreeSet::new(), 0) {
                            fields.push(f);
                        }
                    }
                }
            }
        }
    }

    // required-first for stable, readable output.
    fields.sort_by_key(|f| usize::from(!f.required));

    let has_optional = method.query_params.iter().any(|p| p.required != Some(true))
        || method
            .header_params
            .iter()
            .any(|p| p.required != Some(true))
        || body_has_optional(method, types);

    MethodExample {
        path_args,
        fields,
        has_optional,
    }
}
