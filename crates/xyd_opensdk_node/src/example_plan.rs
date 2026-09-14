//! Port of the framework `example-plan.ts`. Turns a `TypeRef` into a
//! language-neutral `ExampleValue` tree; `example.rs` renders it to a TypeScript
//! literal, so every emitter's suite exercises identical shapes.
//!
//! Two callers with different needs share it: `generateTests` plans NEUTRAL
//! required-only values (a test only needs the right shape), while the docs
//! `generateUsage` snippet plans REALISTIC values for ALL fields — spec
//! `example`/`default` literals and format-aware scalar samples. That is the
//! [`ExampleOpts`] pair (`realistic` + `with_optional`).

use std::collections::BTreeSet;

use serde_json::Value;

use crate::ir::{Field, Method, NamedType, Param, TypeRef};

/// A language-neutral example value; `example.rs` renders it to TypeScript.
pub enum ExampleValue {
    Str(String),
    Integer(i64),
    Number(f64),
    Boolean(bool),
    /// A spec `default`/`example` literal that is JSON `null` (realistic only).
    Null,
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

/// The caller-facing planner flags (the TS `{ withOptional, realistic }` bag).
#[derive(Clone, Copy, Default)]
pub struct ExampleOpts {
    /// Include optional struct fields (the "with all params" example).
    pub with_optional: bool,
    /// Prefer the spec's own `example`/`default` and emit format-aware scalar
    /// samples instead of the neutral `0`/`"x"`. Docs snippets only.
    pub realistic: bool,
}

#[derive(Clone, Default)]
struct PlanOpts {
    with_optional: bool,
    string_hint: Option<String>,
    realistic: bool,
}

impl PlanOpts {
    /// The per-level opts for a nested type: flags kept, the string hint dropped.
    fn nested(&self) -> Self {
        Self {
            with_optional: self.with_optional,
            string_hint: None,
            realistic: self.realistic,
        }
    }
}

fn field_required(f: &Field) -> bool {
    f.required == Some(true)
}

/// Coerce a spec `example`/`default` JSON literal into a neutral `ExampleValue`
/// — ONLY for scalar / scalar-array shapes. A struct/enum/union literal needs
/// the TYPE to render correctly, so it yields `None` and the caller walks the
/// type instead.
fn literal_to_example(value: &Value) -> Option<ExampleValue> {
    match value {
        Value::String(s) => Some(ExampleValue::Str(s.clone())),
        Value::Bool(b) => Some(ExampleValue::Boolean(*b)),
        Value::Number(n) => {
            // `Number.isInteger` is about the VALUE, not the JSON spelling:
            // `1.0` is an integer to JS, so test `fract()` rather than `as_i64`.
            let f = n.as_f64().unwrap_or(0.0);
            Some(if f.fract() == 0.0 {
                ExampleValue::Integer(f as i64)
            } else {
                ExampleValue::Number(f)
            })
        }
        Value::Null => Some(ExampleValue::Null),
        Value::Array(items) => {
            let first = items.first()?;
            literal_to_example(first).map(|item| ExampleValue::Array(Box::new(item)))
        }
        Value::Object(_) => None,
    }
}

/// Under `realistic`, the spec's own example/default for a scalar/array-typed
/// param or field (ref types render from the TYPE, so they are skipped).
fn realistic_literal(ty: &TypeRef, candidates: &[&Option<Value>]) -> Option<ExampleValue> {
    if ty.kind() != "scalar" && ty.kind() != "array" {
        return None;
    }
    for candidate in candidates {
        let Some(value) = candidate.as_ref() else {
            continue;
        };
        if let Some(example) = literal_to_example(value) {
            return Some(example);
        }
    }
    None
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
        "scalar" => scalar_example(r, opts.string_hint.as_deref(), opts.realistic),
        "array" => ExampleValue::Array(Box::new(plan_example(
            r.items.as_deref(),
            types,
            &opts.nested(),
            seen,
            depth + 1,
        ))),
        "map" => ExampleValue::Map(Box::new(plan_example(
            r.values.as_deref(),
            types,
            &opts.nested(),
            seen,
            depth + 1,
        ))),
        "any" => ExampleValue::Any,
        "ref" => ref_example(r, types, opts, seen, depth),
        _ => ExampleValue::Any,
    }
}

fn scalar_example(r: &TypeRef, hint: Option<&str>, realistic: bool) -> ExampleValue {
    let fmt = r.format.as_deref().unwrap_or("").to_lowercase();
    if fmt == "binary" {
        return ExampleValue::Binary;
    }
    match r.scalar.as_deref() {
        Some("integer") => ExampleValue::Integer(i64::from(realistic)),
        Some("number") => ExampleValue::Number(if realistic { 1.0 } else { 0.0 }),
        Some("boolean") => ExampleValue::Boolean(true),
        _ => ExampleValue::Str(if realistic {
            // Shared with the other six emitters so a `uuid` sample cannot drift.
            xyd_opensdk_core::example::realistic_string(&fmt, hint)
        } else {
            hint.unwrap_or("x").to_string()
        }),
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
        "alias" => plan_example(named.of.as_ref(), types, &opts.nested(), seen, depth + 1),
        "union" => {
            let mut nested = seen.clone();
            nested.insert(name.to_string());
            ExampleValue::Union(Box::new(plan_example(
                named.variants.first(),
                types,
                &opts.nested(),
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

    let nested = opts.nested();
    wanted
        .into_iter()
        .map(|f| ExampleField {
            name: f.name.clone(),
            required: field_required(f),
            // A Field carries only `default` (no `example`); prefer it under
            // `realistic`, else walk the type.
            value: opts
                .realistic
                .then(|| realistic_literal(&f.ty, &[&f.default]))
                .flatten()
                .unwrap_or_else(|| plan_example(Some(&f.ty), types, &nested, seen, depth)),
        })
        .collect()
}

fn push_param(p: &Param, types: &[&NamedType], opts: ExampleOpts, fields: &mut Vec<ExampleField>) {
    let required = p.required == Some(true);
    if !required && !opts.with_optional {
        return;
    }
    let plan_opts = PlanOpts {
        with_optional: opts.with_optional,
        string_hint: Some(p.name.clone()),
        realistic: opts.realistic,
    };
    fields.push(ExampleField {
        name: p.name.clone(),
        required,
        // A Param carries both `example` and `default`; prefer them (example
        // first) under `realistic`.
        value: opts
            .realistic
            .then(|| realistic_literal(&p.ty, &[&p.example, &p.default]))
            .flatten()
            .unwrap_or_else(|| plan_example(Some(&p.ty), types, &plan_opts, &BTreeSet::new(), 0)),
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
    opts: ExampleOpts,
) -> MethodExample {
    let path_args = method
        .path_params
        .iter()
        .map(|p| {
            // NB: path args plan with `withOptional` unset (matches the TS call).
            let plan_opts = PlanOpts {
                with_optional: false,
                string_hint: Some(p.name.clone()),
                realistic: opts.realistic,
            };
            PathArg {
                param_name: p.name.clone(),
                value: opts
                    .realistic
                    .then(|| realistic_literal(&p.ty, &[&p.example, &p.default]))
                    .flatten()
                    .unwrap_or_else(|| {
                        plan_example(Some(&p.ty), types, &plan_opts, &BTreeSet::new(), 0)
                    }),
            }
        })
        .collect();

    let mut fields: Vec<ExampleField> = Vec::new();
    for p in &method.query_params {
        push_param(p, types, opts, &mut fields);
    }
    for p in &method.header_params {
        push_param(p, types, opts, &mut fields);
    }

    // request body: flatten its struct fields into the params struct.
    if let Some(body) = method.request_body.as_ref() {
        if body.ty.kind() == "ref" {
            if let Some(name) = body.ty.name.as_deref() {
                if let Some(named) = types.iter().find(|t| t.name == name) {
                    if named.kind == "struct" {
                        let plan_opts = PlanOpts {
                            with_optional: opts.with_optional,
                            string_hint: None,
                            realistic: opts.realistic,
                        };
                        for f in
                            example_fields(&named.fields, types, &plan_opts, &BTreeSet::new(), 0)
                        {
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
