//! Port of the framework `example-plan.ts`: turn a TypeRef into a
//! language-neutral `ExampleValue` tree that `example.rs` renders into Python
//! literals, so the Go/Python/Ruby suites exercise identical shapes and can
//! never drift.
//!
//! Two planning modes share this code:
//!   * NEUTRAL (`realistic: false`) — what the generated TEST suite plans:
//!     `0` / `"x"` placeholders, required fields only unless `with_optional`.
//!   * REALISTIC (`realistic: true`) — what the docs USAGE snippet plans: the
//!     spec's own `example`/`default` literals when they exist, else
//!     format-aware samples (`2024-01-01T00:00:00Z`, …) via the SHARED
//!     `xyd_opensdk_core::example::realistic_string` table.

use std::collections::HashSet;

use serde_json::Value;

use crate::val::{arr, bool_field, str_field};

type TypeMap<'a> = std::collections::HashMap<&'a str, &'a Value>;

/// A language-neutral example value; `example.rs` renders it to Python syntax.
pub enum ExampleValue {
    Str(String),
    Integer(i64),
    Number(f64),
    Boolean(bool),
    /// A spec `example`/`default` that is literally `null` (realistic only).
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
    /// Prefer the spec's own `example`/`default` and emit format-aware scalar
    /// samples. OFF for the generated tests, ON for the docs usage snippet.
    realistic: bool,
}

/// The two planner knobs a caller picks (the TS `{ withOptional, realistic }`).
#[derive(Clone, Copy, Default)]
pub struct MethodExampleOpts {
    pub with_optional: bool,
    pub realistic: bool,
}

impl MethodExampleOpts {
    /// The generated TEST suite's mode: neutral values, optionals on demand.
    pub fn neutral(with_optional: bool) -> Self {
        Self {
            with_optional,
            realistic: false,
        }
    }

    /// The docs USAGE snippet's mode: every field, realistic values.
    pub fn realistic_all() -> Self {
        Self {
            with_optional: true,
            realistic: true,
        }
    }
}

const MAX_DEPTH: usize = 6;

fn is_required(f: &Value) -> bool {
    bool_field(f, "required") == Some(true)
}

fn name_of(v: &Value) -> String {
    str_field(v, "name").unwrap_or("").to_string()
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
    types: &TypeMap,
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
        Some("ref") => ref_example(r, types, opts, seen, depth),
        _ => ExampleValue::Any,
    }
}

fn scalar_example(r: &Value, hint: Option<&str>, realistic: bool) -> ExampleValue {
    let fmt = str_field(r, "format").unwrap_or("").to_lowercase();
    if fmt == "binary" {
        return ExampleValue::Binary;
    }
    match str_field(r, "scalar") {
        Some("integer") => ExampleValue::Integer(if realistic { 1 } else { 0 }),
        Some("number") => ExampleValue::Number(if realistic { 1.0 } else { 0.0 }),
        Some("boolean") => ExampleValue::Boolean(true),
        _ if realistic => {
            ExampleValue::Str(xyd_opensdk_core::example::realistic_string(&fmt, hint))
        }
        _ => ExampleValue::Str(hint.unwrap_or("x").to_string()),
    }
}

/// Coerce a spec `example`/`default` JSON literal into a neutral ExampleValue —
/// ONLY for scalar/scalar-array shapes (a struct/enum/union literal would need
/// the type to render correctly). `None` when it can't safely coerce.
fn literal_to_example(value: &Value) -> Option<ExampleValue> {
    match value {
        Value::String(s) => Some(ExampleValue::Str(s.clone())),
        Value::Bool(b) => Some(ExampleValue::Boolean(*b)),
        Value::Number(n) => Some(match n.as_i64() {
            // JS `Number.isInteger` — an integral float is an integer too.
            Some(i) => ExampleValue::Integer(i),
            None => match n.as_f64() {
                Some(f) if f.fract() == 0.0 && f.is_finite() => ExampleValue::Integer(f as i64),
                Some(f) => ExampleValue::Number(f),
                None => return None,
            },
        }),
        Value::Null => Some(ExampleValue::Null),
        Value::Array(items) => {
            let first = items.first()?;
            let item = literal_to_example(first)?;
            Some(ExampleValue::Array(Box::new(item)))
        }
        Value::Object(_) => None,
    }
}

/// Under `realistic`, the spec's own example/default for a scalar/array-typed
/// param or field (skips ref types — enum/struct/union render from the type).
fn realistic_literal(type_: Option<&Value>, candidates: &[Option<&Value>]) -> Option<ExampleValue> {
    let t = type_?;
    let kind = str_field(t, "kind");
    if kind != Some("scalar") && kind != Some("array") {
        return None;
    }
    for candidate in candidates.iter().copied().flatten() {
        if let Some(example) = literal_to_example(candidate) {
            return Some(example);
        }
    }
    None
}

fn ref_example(
    r: &Value,
    types: &TypeMap,
    opts: &PlanOpts,
    seen: &HashSet<String>,
    depth: usize,
) -> ExampleValue {
    let name = match str_field(r, "name").filter(|n| !n.is_empty()) {
        Some(n) => n,
        None => return ExampleValue::Any,
    };
    let Some(named) = types.get(name) else {
        return ExampleValue::Any;
    };
    if seen.contains(name) {
        return ExampleValue::Object(Vec::new());
    }
    match str_field(named, "kind") {
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
    types: &TypeMap,
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
            name: name_of(f),
            required: is_required(f),
            // A field carries only `default` (no `example`); prefer it under
            // `realistic`, else walk the type.
            value: opts
                .realistic
                .then(|| realistic_literal(f.get("type"), &[f.get("default")]))
                .flatten()
                .unwrap_or_else(|| plan_example(f.get("type"), types, &nested, seen, depth)),
        })
        .collect()
}

fn push_param(p: &Value, types: &TypeMap, o: MethodExampleOpts, fields: &mut Vec<ExampleField>) {
    let req = is_required(p);
    if !req && !o.with_optional {
        return;
    }
    let opts = PlanOpts {
        with_optional: o.with_optional,
        string_hint: Some(name_of(p)),
        realistic: o.realistic,
    };
    fields.push(ExampleField {
        name: name_of(p),
        required: req,
        // A param carries both `example` and `default`; prefer them under `realistic`.
        value: o
            .realistic
            .then(|| realistic_literal(p.get("type"), &[p.get("example"), p.get("default")]))
            .flatten()
            .unwrap_or_else(|| plan_example(p.get("type"), types, &opts, &HashSet::new(), 0)),
    });
}

fn body_ref(method: &Value) -> Option<&Value> {
    method.get("requestBody").and_then(|b| b.get("type"))
}

fn body_has_optional(body: Option<&Value>, types: &TypeMap) -> bool {
    let Some(br) = body else { return false };
    if str_field(br, "kind") != Some("ref") {
        return false;
    }
    let Some(name) = str_field(br, "name") else {
        return false;
    };
    types
        .get(name)
        .map(|named| arr(named, "fields").iter().any(|f| !is_required(f)))
        .unwrap_or(false)
}

/// The example call for a method: positional path args + params-struct / keyword
/// fields (query ∪ header ∪ request-body fields), required-first.
pub fn plan_method_example(method: &Value, types: &TypeMap, o: MethodExampleOpts) -> MethodExample {
    let path_args = arr(method, "pathParams")
        .iter()
        .map(|p| {
            let opts = PlanOpts {
                with_optional: false,
                string_hint: Some(name_of(p)),
                realistic: o.realistic,
            };
            PathArg {
                name: name_of(p),
                value: o
                    .realistic
                    .then(|| {
                        realistic_literal(p.get("type"), &[p.get("example"), p.get("default")])
                    })
                    .flatten()
                    .unwrap_or_else(|| {
                        plan_example(p.get("type"), types, &opts, &HashSet::new(), 0)
                    }),
            }
        })
        .collect();

    let mut fields: Vec<ExampleField> = Vec::new();
    for p in arr(method, "queryParams") {
        push_param(p, types, o, &mut fields);
    }
    for p in arr(method, "headerParams") {
        push_param(p, types, o, &mut fields);
    }

    // request body: flatten its struct fields into the params struct / kwargs.
    let body = body_ref(method);
    if let Some(br) = body {
        if str_field(br, "kind") == Some("ref") {
            if let Some(name) = str_field(br, "name") {
                if let Some(named) = types.get(name) {
                    if str_field(named, "kind") == Some("struct") {
                        let opts = PlanOpts {
                            with_optional: o.with_optional,
                            string_hint: None,
                            realistic: o.realistic,
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
