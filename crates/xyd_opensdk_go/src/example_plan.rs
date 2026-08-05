//! Port of the framework `example-plan.ts`: the shared, language-neutral example
//! -value planner the generated test suites use. It turns a TypeRef into an
//! `ExampleValue` tree; `example_go.rs` renders that tree into Go composite
//! literals, so the Go/Python/Ruby suites exercise identical shapes and can
//! never drift. The docs USAGE `realistic` path is not ported — the Go crate
//! emits only the test suite, which always plans neutral (`0`/`"x"`) values.

use std::collections::HashSet;

use serde_json::{Map, Value};

/// A language-neutral example value; `example_go.rs` renders it to Go syntax.
pub enum ExampleValue {
    Str(String),
    Integer(i64),
    Number(f64),
    Boolean(bool),
    Binary,
    Enum {
        type_name: String,
        value: Value,
    },
    Const(Value),
    Array(Box<ExampleValue>),
    Map(Box<ExampleValue>),
    Object {
        type_name: Option<String>,
        fields: Vec<ExampleField>,
    },
    Union {
        type_name: String,
        variant: Box<ExampleValue>,
    },
    Any,
}

/// One example field of an object/params example.
pub struct ExampleField {
    pub name: String,
    pub value: ExampleValue,
}

/// One positional path argument, carrying its source param (for the type ref and
/// the guard test's param name).
pub struct PathArg {
    pub param: Value,
    pub value: ExampleValue,
}

/// The example call for one method — the path args + whether it has optionals.
pub struct MethodExample {
    pub path_args: Vec<PathArg>,
    pub has_optional: bool,
}

/// Per-level planner options (threaded through recursion).
#[derive(Clone, Default)]
pub struct PlanOpts {
    pub with_optional: bool,
    pub string_hint: Option<String>,
}

const MAX_DEPTH: usize = 6;

fn arr<'a>(v: &'a Value, key: &str) -> &'a [Value] {
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
    types: &Map<String, Value>,
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
    types: &Map<String, Value>,
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
        return ExampleValue::Object {
            type_name: Some(name.to_string()),
            fields: Vec::new(),
        };
    }
    match named.get("kind").and_then(Value::as_str) {
        Some("enum") => {
            let val = arr(named, "values")
                .first()
                .and_then(|f| f.get("value"))
                .cloned()
                .unwrap_or_else(|| Value::String(String::new()));
            ExampleValue::Enum {
                type_name: name.to_string(),
                value: val,
            }
        }
        Some("alias") => plan_example(named.get("of"), types, &drop_hint(opts), seen, depth + 1),
        Some("union") => {
            let variant = arr(named, "variants").first();
            let mut nested = seen.clone();
            nested.insert(name.to_string());
            ExampleValue::Union {
                type_name: name.to_string(),
                variant: Box::new(plan_example(
                    variant,
                    types,
                    &drop_hint(opts),
                    &nested,
                    depth + 1,
                )),
            }
        }
        _ => {
            let mut nested = seen.clone();
            nested.insert(name.to_string());
            let fields = example_fields(arr(named, "fields"), types, opts, &nested, depth + 1);
            ExampleValue::Object {
                type_name: Some(name.to_string()),
                fields,
            }
        }
    }
}

/// Example fields for a struct's field list; required-first, optionals only when
/// `withOptional`.
fn example_fields(
    fields: &[Value],
    types: &Map<String, Value>,
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

fn body_ref(method: &Value) -> Option<&Value> {
    method.get("requestBody").and_then(|b| b.get("type"))
}

fn body_has_optional(body: Option<&Value>, types: &Map<String, Value>) -> bool {
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

/// The example call for a method: positional path args + whether any non
/// -required param/field exists (drives the "WithOptionalParams" variant). The
/// params-struct field literals themselves are re-planned by `example_go.rs`
/// (mirroring the service emitter's struct field order), so only `path_args` and
/// `has_optional` are returned here.
pub fn plan_method_example(method: &Value, types: &Map<String, Value>) -> MethodExample {
    let path_args = arr(method, "pathParams")
        .iter()
        .map(|p| {
            let opts = PlanOpts {
                with_optional: false,
                string_hint: Some(str_field(p, "name")),
            };
            PathArg {
                param: p.clone(),
                value: plan_example(p.get("type"), types, &opts, &HashSet::new(), 0),
            }
        })
        .collect();

    let body = body_ref(method);
    let has_optional = arr(method, "queryParams").iter().any(|p| !is_required(p))
        || arr(method, "headerParams").iter().any(|p| !is_required(p))
        || body_has_optional(body, types);

    MethodExample {
        path_args,
        has_optional,
    }
}
