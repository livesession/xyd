//! Port of the framework `example-plan.ts` (the neutral, non-`realistic` path the
//! generated TEST suite exercises): turns a TypeRef into a language-neutral
//! `ExampleValue` tree so every language's test suite exercises identical shapes.
//! `example_cs.rs` renders the tree into TYPED C# literals. The `realistic`
//! branch (spec example/default + format-aware samples) is docs-usage-only and is
//! not ported here — the generated tests always plan with `realistic: false`.

use std::collections::HashSet;

use serde_json::Value;

use crate::cstype::Types;

/// A language-neutral example value; `example_cs.rs` renders it to C# syntax.
/// (The `null` value the JS planner emits only under `realistic` is omitted —
/// the generated tests plan with `realistic: false`, so it never arises.)
pub enum ExampleValue {
    Str(String),
    Integer(i64),
    Number(f64),
    Boolean(bool),
    Binary,
    Enum(Value),
    Const(Value),
    Array(Box<ExampleValue>),
    Map(Box<ExampleValue>),
    Object(Vec<ExampleField>),
    Union(Box<ExampleValue>),
    Any,
}

/// One example field of an object/params example.
pub struct ExampleField {
    pub name: String,
    pub value: ExampleValue,
}

/// Planner options for one level of the recursion.
#[derive(Clone, Default)]
pub struct PlanOpts {
    pub with_optional: bool,
    pub string_hint: Option<String>,
}

const MAX_DEPTH: usize = 6;

fn is_required(f: &Value) -> bool {
    f.get("required").and_then(Value::as_bool).unwrap_or(false)
}

fn str_field(v: &Value, key: &str) -> String {
    v.get(key).and_then(Value::as_str).unwrap_or("").to_string()
}

/// Drop the per-level stringHint before recursing (keep withOptional).
fn drop_hint(opts: &PlanOpts) -> PlanOpts {
    PlanOpts {
        with_optional: opts.with_optional,
        string_hint: None,
    }
}

/// Resolve a TypeRef to an example value, expanding named types via the symbol
/// table. Cycle-guarded and depth-capped so recursive schemas stay finite.
pub fn plan_example(
    ref_: Option<&Value>,
    types: Types,
    opts: &PlanOpts,
    seen: &HashSet<String>,
    depth: usize,
) -> ExampleValue {
    let Some(r) = ref_ else {
        return ExampleValue::Any;
    };
    if depth > MAX_DEPTH {
        return ExampleValue::Any;
    }
    if let Some(c) = r.get("const") {
        return ExampleValue::Const(c.clone());
    }
    match r.get("kind").and_then(Value::as_str) {
        Some("scalar") => scalar_example(r, opts.string_hint.as_deref()),
        Some("array") => ExampleValue::Array(Box::new(plan_example(
            r.get("items"),
            types,
            &drop_hint(opts),
            seen,
            depth + 1,
        ))),
        Some("map") => ExampleValue::Map(Box::new(plan_example(
            r.get("values"),
            types,
            &drop_hint(opts),
            seen,
            depth + 1,
        ))),
        Some("any") => ExampleValue::Any,
        Some("ref") => ref_example(r, types, opts, seen, depth),
        _ => ExampleValue::Any,
    }
}

fn scalar_example(r: &Value, hint: Option<&str>) -> ExampleValue {
    let fmt = r
        .get("format")
        .and_then(Value::as_str)
        .unwrap_or("")
        .to_lowercase();
    if fmt == "binary" {
        return ExampleValue::Binary;
    }
    match r.get("scalar").and_then(Value::as_str) {
        Some("integer") => ExampleValue::Integer(0),
        Some("number") => ExampleValue::Number(0.0),
        Some("boolean") => ExampleValue::Boolean(true),
        _ => ExampleValue::Str(hint.unwrap_or("x").to_string()),
    }
}

fn ref_example(
    r: &Value,
    types: Types,
    opts: &PlanOpts,
    seen: &HashSet<String>,
    depth: usize,
) -> ExampleValue {
    let name = match r
        .get("name")
        .and_then(Value::as_str)
        .filter(|n| !n.is_empty())
    {
        Some(n) => n,
        None => return ExampleValue::Any,
    };
    let Some(named) = types.get(name) else {
        return ExampleValue::Any;
    };
    if seen.contains(name) {
        return ExampleValue::Object(Vec::new());
    }
    match named.get("kind").and_then(Value::as_str) {
        Some("enum") => {
            let val = named
                .get("values")
                .and_then(Value::as_array)
                .and_then(|a| a.first())
                .and_then(|f| f.get("value"))
                .cloned()
                .unwrap_or_else(|| Value::String(String::new()));
            ExampleValue::Enum(val)
        }
        Some("alias") => plan_example(named.get("of"), types, &drop_hint(opts), seen, depth + 1),
        Some("union") => {
            let variant = named
                .get("variants")
                .and_then(Value::as_array)
                .and_then(|a| a.first());
            let mut nested = seen.clone();
            nested.insert(name.to_string());
            ExampleValue::Union(Box::new(plan_example(
                variant,
                types,
                &drop_hint(opts),
                &nested,
                depth + 1,
            )))
        }
        _ => {
            let mut nested = seen.clone();
            nested.insert(name.to_string());
            let fields = example_fields(field_list(named), types, opts, &nested, depth + 1);
            ExampleValue::Object(fields)
        }
    }
}

fn field_list(named: &Value) -> &[Value] {
    named
        .get("fields")
        .and_then(Value::as_array)
        .map(Vec::as_slice)
        .unwrap_or(&[])
}

/// Example fields for a struct's field list; required-first, optionals only when
/// `withOptional`.
pub fn example_fields(
    fields: &[Value],
    types: Types,
    opts: &PlanOpts,
    seen: &HashSet<String>,
    depth: usize,
) -> Vec<ExampleField> {
    let mut wanted: Vec<&Value> = fields
        .iter()
        .filter(|f| is_required(f) || opts.with_optional)
        .collect();
    // required first, then optional — stable so declaration order is preserved.
    wanted.sort_by_key(|f| usize::from(!is_required(f)));

    let nested = PlanOpts {
        with_optional: opts.with_optional,
        string_hint: None,
    };
    wanted
        .into_iter()
        .map(|f| ExampleField {
            name: str_field(f, "name"),
            value: plan_example(f.get("type"), types, &nested, seen, depth),
        })
        .collect()
}

/// The request-body struct ref of a method, if any.
fn body_ref(method: &Value) -> Option<&Value> {
    method.get("requestBody").and_then(|b| b.get("type"))
}

fn body_has_optional(body: Option<&Value>, types: Types) -> bool {
    let Some(br) = body else { return false };
    if br.get("kind").and_then(Value::as_str) != Some("ref") {
        return false;
    }
    let Some(name) = br.get("name").and_then(Value::as_str) else {
        return false;
    };
    types
        .get(name)
        .map(|named| field_list(named).iter().any(|f| !is_required(f)))
        .unwrap_or(false)
}

fn arr<'a>(v: &'a Value, key: &str) -> &'a [Value] {
    v.get(key)
        .and_then(Value::as_array)
        .map(Vec::as_slice)
        .unwrap_or(&[])
}

/// `planMethodExample(...).hasOptional`: any non-required query/header param or
/// any optional request-body field — drives the "with all params" variant.
pub fn method_has_optional(method: &Value, types: Types) -> bool {
    arr(method, "queryParams").iter().any(|p| !is_required(p))
        || arr(method, "headerParams").iter().any(|p| !is_required(p))
        || body_has_optional(body_ref(method), types)
}
