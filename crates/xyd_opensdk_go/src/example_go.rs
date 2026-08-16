//! Port of the test-suite path of `example-go.ts`: render the framework's
//! language-neutral `ExampleValue` tree into compilable Go and assemble the
//! SDK's OWN test suite (`generateGoTests`) — one external `package <pkg>_test`
//! file per top-level resource (covering the whole subtree) plus the vendored
//! `internal/testutil`. The example VALUES come from the shared planner
//! (`example_plan.rs`) so the Go/Python/Ruby suites exercise identical shapes;
//! THIS file only decides how Go spells them, mirroring the SAME param-struct
//! field types the service emitter declares (`param.Opt` for optional scalars,
//! plain for the rest) so the whole spec compiles. Docs usage/type-reference
//! outputs are not ported (they aren't part of the generated file tree).

use std::collections::{HashMap, HashSet};

use serde_json::{Map, Value};

use crate::example_plan::{plan_example, plan_method_example, ExampleValue, PlanOpts};
use crate::gotype::{go_type, is_binary_ref, is_scalar_ref};
use crate::gowriter::{go_file, Imports};
use crate::model::{go_const_literal, go_enum_const_name, is_const_field};
use crate::naming::{go_method_name, json_string, pascal_case, slug};
use crate::plan::{plan_operation, OperationPlan};
use crate::service::{query_kind, resource_qualifier, QueryKind};

/// The vendored test helper — faithful to openai-go internal/testutil, stdlib
/// -only (header prepended by the caller's `with_header`).
const GO_TESTUTIL: &str = include_str!("testutil.go.txt");

/// The render context threaded through the test emitter: the symbol table, the
/// module path, the root package qualifier, the option-package qualifier, and
/// the per-file import set the rendered code contributes to.
struct GoExampleCtx<'a> {
    types: &'a Map<String, Value>,
    module_path: String,
    pkg: String,
    option_q: String,
    imports: Imports,
}

fn s<'a>(v: &'a Value, key: &str) -> &'a str {
    v.get(key).and_then(Value::as_str).unwrap_or("")
}

fn arr<'a>(v: &'a Value, key: &str) -> Vec<&'a Value> {
    v.get(key)
        .and_then(Value::as_array)
        .map(|a| a.iter().collect())
        .unwrap_or_default()
}

fn is_required(v: &Value) -> bool {
    v.get("required").and_then(Value::as_bool).unwrap_or(false)
}

/// A JS `String(number)` for the float case: integral floats drop the fraction.
fn js_number(f: f64) -> String {
    if f.fract() == 0.0 {
        format!("{}", f as i64)
    } else {
        format!("{f}")
    }
}

// ---- ExampleValue → Go expression -----------------------------------------

fn render_go_example(ctx: &mut GoExampleCtx, value: &ExampleValue) -> String {
    match value {
        ExampleValue::Str(x) => json_string(x),
        ExampleValue::Integer(n) => n.to_string(),
        ExampleValue::Number(f) => js_number(*f),
        ExampleValue::Boolean(b) => if *b { "true" } else { "false" }.to_string(),
        ExampleValue::Binary => {
            ctx.imports.add("io", None);
            ctx.imports.add("bytes", None);
            "io.Reader(bytes.NewBuffer([]byte(\"Example data\")))".to_string()
        }
        ExampleValue::Enum { type_name, value } => render_enum_const(ctx, type_name, value),
        ExampleValue::Const(v) => go_const_literal(Some(v)),
        ExampleValue::Array(item) => {
            let ty = go_type_of_example(ctx, item);
            let inner = render_go_example(ctx, item);
            format!("[]{ty}{{{inner}}}")
        }
        ExampleValue::Map(v) => {
            let ty = go_type_of_example(ctx, v);
            let inner = render_go_example(ctx, v);
            format!("map[string]{ty}{{\"key\": {inner}}}")
        }
        ExampleValue::Object { .. } => render_object_example(ctx, value),
        ExampleValue::Union { variant, .. } => render_go_example(ctx, variant),
        ExampleValue::Any => "nil".to_string(),
    }
}

fn render_object_example(ctx: &mut GoExampleCtx, value: &ExampleValue) -> String {
    let ExampleValue::Object { type_name, fields } = value else {
        return "map[string]any{}".to_string();
    };
    let Some(tn) = type_name else {
        return "map[string]any{}".to_string();
    };
    let type_q = format!("{}.{}", ctx.pkg, pascal_case(tn));
    if fields.is_empty() {
        return format!("{type_q}{{}}");
    }
    // Nested request structs carry PLAIN fields — render each against its
    // DECLARED TypeRef (owned clones, so no ctx borrow is held across recursion)
    // so a bottomed-out example becomes the field's Go zero value, never `nil`.
    let by_name: HashMap<String, Value> = ctx
        .types
        .get(tn)
        .and_then(|n| n.get("fields"))
        .and_then(Value::as_array)
        .map(|fs| {
            fs.iter()
                .filter_map(|f| {
                    let n = f.get("name").and_then(Value::as_str)?;
                    let t = f.get("type")?.clone();
                    Some((n.to_string(), t))
                })
                .collect()
        })
        .unwrap_or_default();
    let mut parts = Vec::new();
    for f in fields {
        let ty = by_name.get(&f.name);
        let expr = render_ref_value(ctx, ty, &f.value);
        parts.push(format!("{}: {}", pascal_case(&f.name), expr));
    }
    format!("{type_q}{{{}}}", parts.join(", "))
}

fn render_enum_const(ctx: &GoExampleCtx, type_name: &str, raw: &Value) -> String {
    let ev: Value = ctx
        .types
        .get(type_name)
        .and_then(|n| n.get("values"))
        .and_then(Value::as_array)
        .and_then(|vals| vals.iter().find(|v| v.get("value") == Some(raw)).cloned())
        .unwrap_or_else(|| serde_json::json!({ "value": raw }));
    format!("{}.{}", ctx.pkg, go_enum_const_name(type_name, &ev))
}

/// The Go type of an ExampleValue — used for self-typed container/map literals.
fn go_type_of_example(ctx: &GoExampleCtx, value: &ExampleValue) -> String {
    match value {
        ExampleValue::Str(_) => "string".to_string(),
        ExampleValue::Integer(_) => "int64".to_string(),
        ExampleValue::Number(_) => "float64".to_string(),
        ExampleValue::Boolean(_) => "bool".to_string(),
        ExampleValue::Binary => "io.Reader".to_string(),
        ExampleValue::Enum { type_name, .. } => format!("{}.{}", ctx.pkg, pascal_case(type_name)),
        ExampleValue::Const(v) => match v {
            Value::Number(n) => {
                if n.as_i64().is_some() || n.as_f64().map(|f| f.fract() == 0.0).unwrap_or(false) {
                    "int64".to_string()
                } else {
                    "float64".to_string()
                }
            }
            Value::Bool(_) => "bool".to_string(),
            _ => "string".to_string(),
        },
        ExampleValue::Array(item) => format!("[]{}", go_type_of_example(ctx, item)),
        ExampleValue::Map(v) => format!("map[string]{}", go_type_of_example(ctx, v)),
        ExampleValue::Object { type_name, .. } => match type_name {
            Some(t) => format!("{}.{}", ctx.pkg, pascal_case(t)),
            None => "map[string]any".to_string(),
        },
        ExampleValue::Union { type_name, .. } => format!("{}.{}", ctx.pkg, pascal_case(type_name)),
        _ => "any".to_string(),
    }
}

/// goType with named refs QUALIFIED by the root package (for `param.NewOpt[T]`).
fn go_type_qualified(ctx: &GoExampleCtx, ref_: Option<&Value>) -> String {
    let Some(r) = ref_ else {
        return "any".to_string();
    };
    match r.get("kind").and_then(Value::as_str) {
        Some("scalar") => go_type(Some(r)),
        Some("ref") => match r.get("name").and_then(Value::as_str) {
            Some(n) if !n.is_empty() => format!("{}.{}", ctx.pkg, pascal_case(n)),
            _ => "any".to_string(),
        },
        Some("array") => format!("[]{}", go_type_qualified(ctx, r.get("items"))),
        Some("map") => format!("map[string]{}", go_type_qualified(ctx, r.get("values"))),
        _ => "any".to_string(),
    }
}

/// Render an example value against its DECLARED TypeRef, so container element
/// types are exact and a bottomed-out example (`any`/`null`) falls back to the
/// Go ZERO value the field accepts — the invariant that keeps the spec compiling.
fn render_ref_value(ctx: &mut GoExampleCtx, ref_: Option<&Value>, value: &ExampleValue) -> String {
    let Some(r) = ref_ else {
        return render_go_example(ctx, value);
    };
    if matches!(value, ExampleValue::Any) {
        return zero_value_for_ref(ctx, Some(r));
    }
    match r.get("kind").and_then(Value::as_str) {
        Some("array") => {
            let ExampleValue::Array(item) = value else {
                return zero_value_for_ref(ctx, Some(r));
            };
            let qual = go_type_qualified(ctx, r.get("items"));
            let inner = render_ref_value(ctx, r.get("items"), item);
            format!("[]{qual}{{{inner}}}")
        }
        Some("map") => {
            let ExampleValue::Map(v) = value else {
                return zero_value_for_ref(ctx, Some(r));
            };
            let qual = go_type_qualified(ctx, r.get("values"));
            let inner = render_ref_value(ctx, r.get("values"), v);
            format!("map[string]{qual}{{\"key\": {inner}}}")
        }
        Some("ref") => {
            let name = r.get("name").and_then(Value::as_str);
            let named = name.and_then(|n| ctx.types.get(n)).cloned();
            let Some(named) = named else {
                return render_go_example(ctx, value);
            };
            match named.get("kind").and_then(Value::as_str) {
                Some("alias") => render_ref_value(ctx, named.get("of"), value),
                Some("union") => {
                    let ExampleValue::Union { variant, .. } = value else {
                        return zero_value_for_ref(ctx, Some(r));
                    };
                    let first = named
                        .get("variants")
                        .and_then(Value::as_array)
                        .and_then(|a| a.first());
                    render_ref_value(ctx, first, variant)
                }
                Some("enum") => render_go_example(ctx, value),
                _ => {
                    if !matches!(value, ExampleValue::Object { .. }) {
                        return zero_value_for_ref(ctx, Some(r));
                    }
                    render_object_example(ctx, value)
                }
            }
        }
        _ => {
            // A binary reached through a TypeRef is always a `string` Go field.
            if is_binary_ref(Some(r)) {
                json_string("Example data")
            } else {
                render_go_example(ctx, value)
            }
        }
    }
}

/// The compilable Go ZERO value for a TypeRef (the fallback for empty examples).
fn zero_value_for_ref(ctx: &GoExampleCtx, ref_: Option<&Value>) -> String {
    let Some(r) = ref_ else {
        return "nil".to_string();
    };
    match r.get("kind").and_then(Value::as_str) {
        Some("scalar") => {
            if r.get("const").is_some() {
                return go_const_literal(r.get("const"));
            }
            match r.get("scalar").and_then(Value::as_str) {
                Some("integer") | Some("number") => "0".to_string(),
                Some("boolean") => "false".to_string(),
                _ => "\"\"".to_string(),
            }
        }
        Some("array") | Some("map") => "nil".to_string(),
        Some("ref") => {
            let Some(name) = r.get("name").and_then(Value::as_str) else {
                return "nil".to_string();
            };
            let Some(named) = ctx.types.get(name) else {
                return "nil".to_string();
            };
            match named.get("kind").and_then(Value::as_str) {
                Some("enum") => {
                    if named.get("base").and_then(Value::as_str) == Some("integer") {
                        "0".to_string()
                    } else {
                        "\"\"".to_string()
                    }
                }
                Some("union") => "nil".to_string(),
                Some("alias") => zero_value_for_ref(ctx, named.get("of")),
                _ => format!("{}.{}{{}}", ctx.pkg, pascal_case(name)),
            }
        }
        _ => "nil".to_string(),
    }
}

// ---- params-struct assembly ------------------------------------------------

/// Whether the method's signature carries a params struct (mirrors planParams).
fn has_params_struct(method: &Value, op: &OperationPlan) -> bool {
    op.has_body || !arr(method, "queryParams").is_empty() || !arr(method, "headerParams").is_empty()
}

/// Resolve a request body's fields (owned clones, mirrors service.ts bodyFields).
fn body_field_list(method: &Value, types: &Map<String, Value>) -> Vec<Value> {
    let ref_ = method.get("requestBody").and_then(|b| b.get("type"));
    if let Some(r) = ref_ {
        if r.get("kind").and_then(Value::as_str) == Some("ref") {
            if let Some(name) = r.get("name").and_then(Value::as_str) {
                if let Some(fields) = types
                    .get(name)
                    .and_then(|n| n.get("fields"))
                    .and_then(Value::as_array)
                {
                    return fields.clone();
                }
            }
        }
    }
    Vec::new()
}

/// One request-body field literal, matching bodyFieldLine's Go field type.
fn body_field_expr(
    f: &Value,
    encoding: &str,
    with_optional: bool,
    ctx: &mut GoExampleCtx,
) -> String {
    if encoding == "multipart" && is_binary_ref(f.get("type")) {
        ctx.imports.add("io", None);
        ctx.imports.add("bytes", None);
        return "io.Reader(bytes.NewBuffer([]byte(\"Example data\")))".to_string();
    }
    let value = plan_example(
        f.get("type"),
        ctx.types,
        &PlanOpts {
            with_optional,
            string_hint: None,
        },
        &HashSet::new(),
        0,
    );
    if is_const_field(f) {
        return render_ref_value(ctx, f.get("type"), &value);
    }
    if !is_required(f) && is_scalar_ref(f.get("type")) {
        let path = format!("{}/packages/param", ctx.module_path);
        let param_q = ctx.imports.add(&path, None);
        let qual = go_type_qualified(ctx, f.get("type"));
        let inner = render_ref_value(ctx, f.get("type"), &value);
        return format!("{param_q}.NewOpt[{qual}]({inner})");
    }
    render_ref_value(ctx, f.get("type"), &value)
}

/// One query-param field literal, matching queryFieldLine's Go field type.
fn query_field_expr(q: &Value, with_optional: bool, ctx: &mut GoExampleCtx) -> String {
    let kind = query_kind(q.get("type"), ctx.types);
    let value = plan_example(
        q.get("type"),
        ctx.types,
        &PlanOpts {
            with_optional,
            string_hint: Some(s(q, "name").to_string()),
        },
        &HashSet::new(),
        0,
    );
    match kind {
        QueryKind::Array | QueryKind::Map => render_ref_value(ctx, q.get("type"), &value),
        QueryKind::Object => {
            let base = go_type(q.get("type"));
            if is_required(q) || base == "any" {
                return render_ref_value(ctx, q.get("type"), &value);
            }
            if matches!(
                &value,
                ExampleValue::Object {
                    type_name: Some(_),
                    ..
                }
            ) {
                let inner = render_ref_value(ctx, q.get("type"), &value);
                return format!("&{inner}");
            }
            "nil".to_string()
        }
        QueryKind::Scalar => {
            if is_required(q) {
                return render_ref_value(ctx, q.get("type"), &value);
            }
            let path = format!("{}/packages/param", ctx.module_path);
            let param_q = ctx.imports.add(&path, None);
            let qual = go_type_qualified(ctx, q.get("type"));
            let inner = render_ref_value(ctx, q.get("type"), &value);
            format!("{param_q}.NewOpt[{qual}]({inner})")
        }
    }
}

/// One header-param field literal, matching headerFieldLine's Go field type.
fn header_field_expr(h: &Value, with_optional: bool, ctx: &mut GoExampleCtx) -> String {
    let value = plan_example(
        h.get("type"),
        ctx.types,
        &PlanOpts {
            with_optional,
            string_hint: Some(s(h, "name").to_string()),
        },
        &HashSet::new(),
        0,
    );
    if is_required(h) {
        return render_ref_value(ctx, h.get("type"), &value);
    }
    let path = format!("{}/packages/param", ctx.module_path);
    let param_q = ctx.imports.add(&path, None);
    let qual = go_type_qualified(ctx, h.get("type"));
    let inner = render_ref_value(ctx, h.get("type"), &value);
    format!("{param_q}.NewOpt[{qual}]({inner})")
}

/// The `Field: expr` lines of a params struct, in the emitted struct's order
/// (body declared order, then query, then header).
fn param_field_literals(
    method: &Value,
    op: &OperationPlan,
    with_optional: bool,
    ctx: &mut GoExampleCtx,
) -> Vec<String> {
    let encoding = op.encoding.clone().unwrap_or_else(|| "json".to_string());
    let mut lits = Vec::new();
    if op.has_body {
        for f in body_field_list(method, ctx.types) {
            if !is_required(&f) && !with_optional {
                continue;
            }
            let expr = body_field_expr(&f, &encoding, with_optional, ctx);
            lits.push(format!("{}: {}", pascal_case(s(&f, "name")), expr));
        }
    }
    for q in arr(method, "queryParams") {
        if !is_required(q) && !with_optional {
            continue;
        }
        let expr = query_field_expr(q, with_optional, ctx);
        lits.push(format!("{}: {}", pascal_case(s(q, "name")), expr));
    }
    for h in arr(method, "headerParams") {
        if !is_required(h) && !with_optional {
            continue;
        }
        let expr = header_field_expr(h, with_optional, ctx);
        lits.push(format!("{}: {}", pascal_case(s(h, "name")), expr));
    }
    lits
}

struct ParamsExpr {
    text: String,
    multiline: bool,
}

/// The params-struct call argument, or None when the method takes none.
fn params_struct_expr(
    segments: &[String],
    method: &Value,
    op: &OperationPlan,
    with_optional: bool,
    method_name: &str,
    ctx: &mut GoExampleCtx,
) -> Option<ParamsExpr> {
    if !has_params_struct(method, op) {
        return None;
    }
    let type_q = format!(
        "{}.{}{method_name}Params",
        ctx.pkg,
        resource_qualifier(segments)
    );
    let field_lits = param_field_literals(method, op, with_optional, ctx);
    if field_lits.is_empty() {
        return Some(ParamsExpr {
            text: format!("{type_q}{{}}"),
            multiline: false,
        });
    }
    let body = field_lits
        .iter()
        .map(|l| format!("\t{l},"))
        .collect::<Vec<_>>()
        .join("\n");
    Some(ParamsExpr {
        text: format!("{type_q}{{\n{body}\n}}"),
        multiline: true,
    })
}

// ---- test-function assembly ------------------------------------------------

/// Prefix every non-empty line of a (possibly multi-line) block with `tabs` tabs.
fn indent_block(text: &str, tabs: usize) -> String {
    let pad = "\t".repeat(tabs);
    text.split('\n')
        .map(|l| {
            if l.is_empty() {
                l.to_string()
            } else {
                format!("{pad}{l}")
            }
        })
        .collect::<Vec<_>>()
        .join("\n")
}

/// A call statement (one tab-indented), args on their own lines when multi-line.
fn call_statement(
    bind: &str,
    chain: &str,
    method_name: &str,
    args: &[String],
    multiline: bool,
) -> String {
    let call = format!("{chain}.{method_name}");
    if !multiline {
        return format!("\t{bind} {call}({})", args.join(", "));
    }
    let inner = args
        .iter()
        .map(|a| indent_block(a, 2))
        .collect::<Vec<_>>()
        .join(",\n");
    format!("\t{bind} {call}(\n{inner},\n\t)")
}

/// Whether the method returns a value (drives `_, err :=` vs `err :=`).
fn method_has_result(method: &Value, op: &OperationPlan) -> bool {
    op.binary_content_type.is_some()
        || op.page_name.is_some()
        || (method.get("primaryResponse").is_some()
            && op.primary_response != crate::plan::PrimaryResponse::None)
}

/// The `client.<Field>.<Sub>…` receiver chain — the generated client, exactly.
fn client_chain(segments: &[String]) -> String {
    format!(
        "client.{}",
        segments
            .iter()
            .map(|s| pascal_case(s))
            .collect::<Vec<_>>()
            .join(".")
    )
}

/// The typed-error check block (one tab-indented), openai-go shaped.
fn error_check_block(ctx: &mut GoExampleCtx) -> String {
    let path = format!("{}/internal/requestconfig", ctx.module_path);
    let req_q = ctx.imports.add(&path, None);
    ctx.imports.add("errors", None);
    format!(
        "\tif err != nil {{\n\t\tvar apierr *{req_q}.APIError\n\t\tif errors.As(err, &apierr) {{\n\t\t\tt.Log(apierr.Error())\n\t\t}}\n\t\tt.Fatalf(\"err should be nil: %s\", err.Error())\n\t}}"
    )
}

/// The `client := <pkg>.NewClient(WithBaseURL(baseURL), WithAPIKey(...))` block.
fn client_block(ctx: &GoExampleCtx) -> String {
    format!(
        "\tclient := {}.NewClient(\n\t\t{}.WithBaseURL(baseURL),\n\t\t{}.WithAPIKey(\"My API Key\"),\n\t)",
        ctx.pkg, ctx.option_q, ctx.option_q
    )
}

/// The standard mock-server preamble (baseURL + TEST_API_BASE_URL + skip probe).
fn mock_preamble(ctx: &mut GoExampleCtx) -> String {
    ctx.imports.add("os", None);
    let path = format!("{}/internal/testutil", ctx.module_path);
    let testutil_q = ctx.imports.add(&path, None);
    format!(
        "\tbaseURL := \"http://localhost:4010\"\n\tif envURL, ok := os.LookupEnv(\"TEST_API_BASE_URL\"); ok {{\n\t\tbaseURL = envURL\n\t}}\n\tif !{testutil_q}.CheckTestServer(t, baseURL) {{\n\t\treturn\n\t}}"
    )
}

/// The call arguments: ctx, path args, then the params struct (if any).
fn call_args(path_arg_exprs: &[String], params: &Option<ParamsExpr>) -> (Vec<String>, bool) {
    let mut args = vec!["context.TODO()".to_string()];
    args.extend(path_arg_exprs.iter().cloned());
    let mut multiline = false;
    if let Some(p) = params {
        args.push(p.text.clone());
        multiline = p.multiline;
    }
    (args, multiline)
}

/// A standard (mock-skipped) method test.
#[allow(clippy::too_many_arguments)]
fn render_main_test(
    func_name: &str,
    segments: &[String],
    method_name: &str,
    path_arg_exprs: &[String],
    params: &Option<ParamsExpr>,
    method: &Value,
    op: &OperationPlan,
    ctx: &mut GoExampleCtx,
) -> String {
    let preamble = mock_preamble(ctx);
    let bind = if method_has_result(method, op) {
        "_, err :="
    } else {
        "err :="
    };
    let (args, multiline) = call_args(path_arg_exprs, params);
    let call = call_statement(bind, &client_chain(segments), method_name, &args, multiline);
    let client = client_block(ctx);
    let errchk = error_check_block(ctx);
    [
        format!("func {func_name}(t *testing.T) {{"),
        preamble,
        client,
        call,
        errchk,
        "}".to_string(),
    ]
    .join("\n")
}

/// A binary-response method test: httptest server returns "abc"; read + compare.
fn render_binary_test(
    func_name: &str,
    segments: &[String],
    method_name: &str,
    path_arg_exprs: &[String],
    params: &Option<ParamsExpr>,
    ctx: &mut GoExampleCtx,
) -> String {
    ctx.imports.add("net/http", None);
    ctx.imports.add("net/http/httptest", None);
    ctx.imports.add("io", None);
    ctx.imports.add("bytes", None);
    let (args, multiline) = call_args(path_arg_exprs, params);
    let call = call_statement(
        "resp, err :=",
        &client_chain(segments),
        method_name,
        &args,
        multiline,
    );
    let client = client_block(ctx);
    let errchk1 = error_check_block(ctx);
    let errchk2 = error_check_block(ctx);
    [
        format!("func {func_name}(t *testing.T) {{"),
        "\tserver := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {".to_string(),
        "\t\tw.WriteHeader(200)".to_string(),
        "\t\tw.Write([]byte(\"abc\"))".to_string(),
        "\t}))".to_string(),
        "\tdefer server.Close()".to_string(),
        "\tbaseURL := server.URL".to_string(),
        client,
        call,
        errchk1,
        "\tdefer resp.Body.Close()".to_string(),
        String::new(),
        "\tb, err := io.ReadAll(resp.Body)".to_string(),
        errchk2,
        "\tif !bytes.Equal(b, []byte(\"abc\")) {".to_string(),
        "\t\tt.Fatalf(\"return value not %s: %s\", \"abc\", b)".to_string(),
        "\t}".to_string(),
        "}".to_string(),
    ]
    .join("\n")
}

/// A guard test: the empty string for a required path param must be rejected.
fn render_path_guard_test(
    base_func_name: &str,
    segments: &[String],
    method_name: &str,
    method: &Value,
    op: &OperationPlan,
    string_path_idx: usize,
    ctx: &mut GoExampleCtx,
) -> String {
    ctx.imports.add("strings", None);
    let bind = if method_has_result(method, op) {
        "_, err :="
    } else {
        "err :="
    };
    let mut path_args = Vec::new();
    for (i, p) in arr(method, "pathParams").iter().enumerate() {
        if i == string_path_idx {
            path_args.push("\"\"".to_string());
        } else {
            let value = plan_example(
                p.get("type"),
                ctx.types,
                &PlanOpts {
                    with_optional: false,
                    string_hint: Some(s(p, "name").to_string()),
                },
                &HashSet::new(),
                0,
            );
            path_args.push(render_ref_value(ctx, p.get("type"), &value));
        }
    }
    let params = params_struct_expr(segments, method, op, false, method_name, ctx);
    let (args, multiline) = call_args(&path_args, &params);
    let call = call_statement(bind, &client_chain(segments), method_name, &args, multiline);
    [
        format!("func {base_func_name}PathParams(t *testing.T) {{"),
        format!("\tclient := {}.NewClient(", ctx.pkg),
        format!(
            "\t\t{}.WithBaseURL(\"http://localhost:4010\"),",
            ctx.option_q
        ),
        format!("\t\t{}.WithAPIKey(\"My API Key\"),", ctx.option_q),
        "\t)".to_string(),
        call,
        "\tif err == nil || !strings.Contains(err.Error(), \"missing required\") {".to_string(),
        "\t\tt.Fatal(\"expected a missing required path param error\")".to_string(),
        "\t}".to_string(),
        "}".to_string(),
    ]
    .join("\n")
}

/// All test funcs for one method: the main test + an optional path-param guard.
fn render_method_tests(segments: &[String], method: &Value, ctx: &mut GoExampleCtx) -> Vec<String> {
    let op = plan_operation(method, ctx.types);
    let plan = plan_method_example(method, ctx.types);
    let with_optional = plan.has_optional;
    let qualifier = resource_qualifier(segments);
    let method_name = go_method_name(s(method, "action"));
    let base_func_name = format!("Test{qualifier}{method_name}");
    let func_name = format!(
        "{base_func_name}{}",
        if with_optional {
            "WithOptionalParams"
        } else {
            ""
        }
    );

    let mut path_arg_exprs = Vec::new();
    for pa in &plan.path_args {
        path_arg_exprs.push(render_ref_value(ctx, pa.param.get("type"), &pa.value));
    }
    let params = params_struct_expr(segments, method, &op, with_optional, &method_name, ctx);

    let mut out = Vec::new();
    if op.binary_content_type.is_some() {
        out.push(render_binary_test(
            &func_name,
            segments,
            &method_name,
            &path_arg_exprs,
            &params,
            ctx,
        ));
    } else {
        out.push(render_main_test(
            &func_name,
            segments,
            &method_name,
            &path_arg_exprs,
            &params,
            method,
            &op,
            ctx,
        ));
    }

    let string_path_idx = arr(method, "pathParams")
        .iter()
        .position(|p| go_type(p.get("type")) == "string");
    if let Some(idx) = string_path_idx {
        out.push(render_path_guard_test(
            &base_func_name,
            segments,
            &method_name,
            method,
            &op,
            idx,
            ctx,
        ));
    }
    out
}

/// Walk a resource subtree, collecting method-test funcs into `decls`.
fn emit_resource_tests(
    resource: &Value,
    segments: &[String],
    ctx: &mut GoExampleCtx,
    decls: &mut Vec<String>,
) {
    for method in arr(resource, "methods") {
        decls.extend(render_method_tests(segments, method, ctx));
    }
    for sub in arr(resource, "resources") {
        let mut seg = segments.to_vec();
        seg.push(s(sub, "name").to_string());
        emit_resource_tests(sub, &seg, ctx, decls);
    }
}

/// The SDK's OWN test suite: one external `package <pkg>_test` file per top-level
/// resource (covering the whole subtree) plus the vendored internal/testutil.
/// Returns header-less content (the caller's `with_header` prepends the marker).
pub fn generate_go_tests(
    spec: &Value,
    types: &Map<String, Value>,
    module_path: &str,
    pkg: &str,
) -> Vec<(String, String)> {
    let mut files: Vec<(String, String)> = Vec::new();
    if let Some(resources) = spec.get("resources").and_then(|r| r.as_array()) {
        for resource in resources {
            let mut imports = Imports::new();
            imports.add(module_path, None); // the ROOT package under test
            let option_q = imports.add(&format!("{module_path}/option"), None);
            imports.add("context", None);
            imports.add("testing", None);
            let mut ctx = GoExampleCtx {
                types,
                module_path: module_path.to_string(),
                pkg: pkg.to_string(),
                option_q,
                imports,
            };

            let mut decls: Vec<String> = Vec::new();
            let name = s(resource, "name").to_string();
            emit_resource_tests(resource, std::slice::from_ref(&name), &mut ctx, &mut decls);
            if decls.is_empty() {
                continue;
            }
            let path = format!(
                "{}_test.go",
                if slug(&name).is_empty() {
                    "service".to_string()
                } else {
                    slug(&name)
                }
            );
            files.push((path, go_file(&format!("{pkg}_test"), &ctx.imports, &decls)));
        }
    }
    if files.is_empty() {
        return Vec::new();
    }
    // Vendored once, alongside the runtime's other internal/ packages.
    files.insert(
        0,
        (
            "internal/testutil/testutil.go".to_string(),
            GO_TESTUTIL.to_string(),
        ),
    );
    files
}
