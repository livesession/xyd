//! Port of the framework `example-plan.ts`: the shared, language-neutral example
//! -value planner the generated test suites use. It turns a TypeRef into an
//! `ExampleValue` tree; `example.rs` renders that tree into Ruby literals, so the
//! Go/Python/Ruby suites exercise identical shapes and can never drift.

use std::collections::{HashMap, HashSet};

use serde_json::Value;

/// A language-neutral example value; `example.rs` renders it to Ruby syntax.
pub enum ExampleValue {
    Str(String),
    Integer(i64),
    Number(f64),
    Boolean(bool),
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
    pub required: bool,
    pub value: ExampleValue,
}

/// One positional path argument, with its param name (for the guard test).
pub struct PathArg {
    pub name: String,
    pub value: ExampleValue,
}

/// The example call for one method — everything a test needs to invoke it.
pub struct MethodExample {
    pub path_args: Vec<PathArg>,
    pub fields: Vec<ExampleField>,
    pub has_optional: bool,
}

#[derive(Clone, Default)]
struct PlanOpts {
    with_optional: bool,
    string_hint: Option<String>,
    realistic: bool,
}

const MAX_DEPTH: usize = 6;

/// An array field as a slice (empty when absent or not an array).
pub(crate) fn arr<'a>(v: &'a Value, key: &str) -> &'a [Value] {
    v.get(key)
        .and_then(Value::as_array)
        .map(Vec::as_slice)
        .unwrap_or(&[])
}

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

/// Resolve a TypeRef to an example value, expanding named types via the symbol
/// table. Cycle-guarded and depth-capped so recursive schemas stay finite.
fn plan_example(
    ref_: Option<&Value>,
    types: &HashMap<String, Value>,
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
        Some("integer") => ExampleValue::Integer(if realistic { 1 } else { 0 }),
        Some("number") => ExampleValue::Number(if realistic { 1.0 } else { 0.0 }),
        Some("boolean") => ExampleValue::Boolean(true),
        _ => ExampleValue::Str(if realistic {
            realistic_string(&fmt, hint)
        } else {
            hint.unwrap_or("x").to_string()
        }),
    }
}

/// A believable string sample for a known `format`, else the hint or "string".
fn realistic_string(fmt: &str, hint: Option<&str>) -> String {
    match fmt {
        "date-time" => "2024-01-01T00:00:00Z",
        "date" => "2024-01-01",
        "email" => "user@example.com",
        "uri" | "url" => "https://example.com",
        "uuid" => "123e4567-e89b-12d3-a456-426614174000",
        "hostname" => "example.com",
        "ipv4" => "192.0.2.1",
        _ => return hint.unwrap_or("string").to_string(),
    }
    .to_string()
}

fn ref_example(
    r: &Value,
    types: &HashMap<String, Value>,
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
            let val = arr(named, "values")
                .first()
                .and_then(|f| f.get("value"))
                .cloned()
                .unwrap_or_else(|| Value::String(String::new()));
            ExampleValue::Enum(val)
        }
        Some("alias") => plan_example(named.get("of"), types, &drop_hint(opts), seen, depth + 1),
        Some("union") => {
            let variant = arr(named, "variants").first();
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
            let fields = example_fields(arr(named, "fields"), types, opts, &nested, depth + 1);
            ExampleValue::Object(fields)
        }
    }
}

/// Example fields for a struct's field list; required-first, optionals only when
/// `withOptional`.
fn example_fields(
    fields: &[Value],
    types: &HashMap<String, Value>,
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
        .map(|f| {
            let value = opts
                .realistic
                .then(|| realistic_literal(f.get("type"), &[f.get("default")]))
                .flatten()
                .unwrap_or_else(|| plan_example(f.get("type"), types, &nested, seen, depth));
            ExampleField {
                name: str_field(f, "name"),
                required: is_required(f),
                value,
            }
        })
        .collect()
}

/// The spec's own example/default for a scalar/array-typed param or field (skips
/// ref types); the neutral planner walks refs. Only reachable under `realistic`.
fn realistic_literal(type_: Option<&Value>, candidates: &[Option<&Value>]) -> Option<ExampleValue> {
    let t = type_?;
    let kind = t.get("kind").and_then(Value::as_str);
    if kind != Some("scalar") && kind != Some("array") {
        return None;
    }
    candidates
        .iter()
        .flatten()
        .find_map(|c| literal_to_example(c))
}

fn literal_to_example(v: &Value) -> Option<ExampleValue> {
    match v {
        Value::String(s) => Some(ExampleValue::Str(s.clone())),
        Value::Bool(b) => Some(ExampleValue::Boolean(*b)),
        Value::Number(n) => {
            if let Some(i) = n.as_i64() {
                Some(ExampleValue::Integer(i))
            } else {
                n.as_f64().map(|f| {
                    if f.fract() == 0.0 {
                        ExampleValue::Integer(f as i64)
                    } else {
                        ExampleValue::Number(f)
                    }
                })
            }
        }
        Value::Null => Some(ExampleValue::Null),
        Value::Array(a) => a
            .first()
            .and_then(literal_to_example)
            .map(|it| ExampleValue::Array(Box::new(it))),
        _ => None,
    }
}

fn push_param(
    p: &Value,
    types: &HashMap<String, Value>,
    with_optional: bool,
    realistic: bool,
    fields: &mut Vec<ExampleField>,
) {
    let req = is_required(p);
    if !req && !with_optional {
        return;
    }
    let opts = PlanOpts {
        with_optional,
        string_hint: Some(str_field(p, "name")),
        realistic,
    };
    let value = realistic
        .then(|| realistic_literal(p.get("type"), &[p.get("example"), p.get("default")]))
        .flatten()
        .unwrap_or_else(|| plan_example(p.get("type"), types, &opts, &HashSet::new(), 0));
    fields.push(ExampleField {
        name: str_field(p, "name"),
        required: req,
        value,
    });
}

fn body_ref(method: &Value) -> Option<&Value> {
    method.get("requestBody").and_then(|b| b.get("type"))
}

fn body_has_optional(body: Option<&Value>, types: &HashMap<String, Value>) -> bool {
    let Some(br) = body else { return false };
    if br.get("kind").and_then(Value::as_str) != Some("ref") {
        return false;
    }
    let Some(name) = br.get("name").and_then(Value::as_str) else {
        return false;
    };
    types
        .get(name)
        .map(|named| arr(named, "fields").iter().any(|f| !is_required(f)))
        .unwrap_or(false)
}

/// The example call for a method: positional path args + params-struct / keyword
/// fields (query ∪ header ∪ request-body fields), required-first.
pub fn plan_method_example(
    method: &Value,
    types: &HashMap<String, Value>,
    with_optional: bool,
    realistic: bool,
) -> MethodExample {
    let path_args = arr(method, "pathParams")
        .iter()
        .map(|p| {
            let opts = PlanOpts {
                with_optional: false,
                string_hint: Some(str_field(p, "name")),
                realistic,
            };
            let value = realistic
                .then(|| realistic_literal(p.get("type"), &[p.get("example"), p.get("default")]))
                .flatten()
                .unwrap_or_else(|| plan_example(p.get("type"), types, &opts, &HashSet::new(), 0));
            PathArg {
                name: str_field(p, "name"),
                value,
            }
        })
        .collect();

    let mut fields: Vec<ExampleField> = Vec::new();
    for p in arr(method, "queryParams") {
        push_param(p, types, with_optional, realistic, &mut fields);
    }
    for p in arr(method, "headerParams") {
        push_param(p, types, with_optional, realistic, &mut fields);
    }

    // request body: flatten its struct fields into the params struct / kwargs.
    let body = body_ref(method);
    if let Some(br) = body {
        if br.get("kind").and_then(Value::as_str) == Some("ref") {
            if let Some(name) = br.get("name").and_then(Value::as_str) {
                if let Some(named) = types.get(name) {
                    if named.get("kind").and_then(Value::as_str) == Some("struct") {
                        let opts = PlanOpts {
                            with_optional,
                            string_hint: None,
                            realistic,
                        };
                        for f in
                            example_fields(arr(named, "fields"), types, &opts, &HashSet::new(), 0)
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

    let has_optional = arr(method, "queryParams").iter().any(|p| !is_required(p))
        || arr(method, "headerParams").iter().any(|p| !is_required(p))
        || body_has_optional(body, types);

    MethodExample {
        path_args,
        fields,
        has_optional,
    }
}
