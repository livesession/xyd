//! Port of the framework `example-plan.ts`: turns a TypeRef into a
//! language-neutral `ExampleValue` tree so every language's test suite exercises
//! identical shapes. `example_cs.rs` renders the tree into TYPED C# literals.
//!
//! Two planning modes share this code:
//!   * the generated TEST suite plans NEUTRAL, required-only values (`0`, `"x"`)
//!     — a test only needs the right shape;
//!   * the docs USAGE snippet plans `realistic` + `with_optional` values — the
//!     spec's own `example`/`default` literals and format-aware samples
//!     (`2024-01-01T00:00:00Z`), across ALL fields, because a human reads it.

use std::collections::HashSet;

use serde_json::Value;
use xyd_opensdk_core::example::realistic_string;

use crate::cstype::Types;

/// A language-neutral example value; `example_cs.rs` renders it to C# syntax.
pub enum ExampleValue {
    Str(String),
    Integer(i64),
    Number(f64),
    Boolean(bool),
    /// Only reachable under `realistic`, from a spec `example`/`default` of `null`.
    Null,
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
    /// Prefer the spec's own `example`/`default` and emit format-aware scalar
    /// samples instead of the neutral `0`/`"x"`. Docs-usage only.
    pub realistic: bool,
}

const MAX_DEPTH: usize = 6;

fn is_required(f: &Value) -> bool {
    f.get("required").and_then(Value::as_bool).unwrap_or(false)
}

fn str_field(v: &Value, key: &str) -> String {
    v.get(key).and_then(Value::as_str).unwrap_or("").to_string()
}

/// Drop the per-level stringHint before recursing (keep withOptional + realistic).
fn drop_hint(opts: &PlanOpts) -> PlanOpts {
    PlanOpts {
        with_optional: opts.with_optional,
        string_hint: None,
        realistic: opts.realistic,
    }
}

/// `literalToExample`: coerce a spec `example`/`default` JSON literal into a
/// neutral value — scalar/scalar-array shapes only (a struct/enum/union literal
/// needs the TYPE to render, so it falls through to the type walk).
fn literal_to_example(value: &Value) -> Option<ExampleValue> {
    match value {
        Value::String(s) => Some(ExampleValue::Str(s.clone())),
        Value::Bool(b) => Some(ExampleValue::Boolean(*b)),
        Value::Number(n) => Some(number_example(n)),
        Value::Null => Some(ExampleValue::Null),
        Value::Array(items) => {
            let first = items.first()?;
            literal_to_example(first).map(|item| ExampleValue::Array(Box::new(item)))
        }
        Value::Object(_) => None,
    }
}

/// JS `Number.isInteger(v) ? integer : number` over a JSON number.
fn number_example(n: &serde_json::Number) -> ExampleValue {
    if let Some(i) = n.as_i64() {
        return ExampleValue::Integer(i);
    }
    let f = n.as_f64().unwrap_or(0.0);
    // A whole-valued float (`1.0` in the spec) is an integer to JS.
    if f.fract() == 0.0 && f.abs() < 9.0e18 {
        ExampleValue::Integer(f as i64)
    } else {
        ExampleValue::Number(f)
    }
}

/// `realisticLiteral`: under `realistic`, the spec's own example/default for a
/// scalar/array-typed param or field (ref types render from the type instead).
/// `candidates` are tried in order; an ABSENT key (`None`) is skipped, a JSON
/// `null` is a real value — matching JS's `undefined` vs `null`.
pub fn realistic_literal(
    type_: Option<&Value>,
    candidates: &[Option<&Value>],
) -> Option<ExampleValue> {
    let t = type_?;
    let kind = t.get("kind").and_then(Value::as_str);
    if kind != Some("scalar") && kind != Some("array") {
        return None;
    }
    for candidate in candidates.iter().flatten() {
        if let Some(example) = literal_to_example(candidate) {
            return Some(example);
        }
    }
    None
}

/// The realistic value for a param: its `example`, then its `default`.
pub fn param_literal(p: &Value, realistic: bool) -> Option<ExampleValue> {
    if !realistic {
        return None;
    }
    realistic_literal(p.get("type"), &[p.get("example"), p.get("default")])
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
        Some("scalar") => scalar_example(r, opts.string_hint.as_deref(), opts.realistic),
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

fn scalar_example(r: &Value, hint: Option<&str>, realistic: bool) -> ExampleValue {
    let fmt = r
        .get("format")
        .and_then(Value::as_str)
        .unwrap_or("")
        .to_lowercase();
    if fmt == "binary" {
        return ExampleValue::Binary;
    }
    match r.get("scalar").and_then(Value::as_str) {
        Some("integer") => ExampleValue::Integer(i64::from(realistic)),
        Some("number") => ExampleValue::Number(if realistic { 1.0 } else { 0.0 }),
        Some("boolean") => ExampleValue::Boolean(true),
        _ if realistic => ExampleValue::Str(realistic_string(&fmt, hint)),
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
        realistic: opts.realistic,
    };
    wanted
        .into_iter()
        .map(|f| ExampleField {
            name: str_field(f, "name"),
            // A Field carries only `default` (no `example`); prefer it under
            // `realistic`, else walk the type.
            value: (if opts.realistic {
                realistic_literal(f.get("type"), &[f.get("default")])
            } else {
                None
            })
            .unwrap_or_else(|| plan_example(f.get("type"), types, &nested, seen, depth)),
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
