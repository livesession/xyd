//! service.ts — <Resource>Service.cs: per-resource command classes with typed
//! async methods, path/query/header/body wiring, pagination + union dispatch.

use serde_json::Value;

use crate::cstype::{cs_type, is_binary_type_ref, nullable, Types};
use crate::cswriter::{cs_doc, cs_file, indent};
use crate::jsrt::{camel_case, json_string, method_name, pascal_case, struct_property_names};
use crate::model::{union_decoder_name, union_mapping};
use crate::plan::{plan_operation, OperationPlan};

/// Resolved idempotency policy the service emitter reads (from sdkBehavior).
pub struct Behavior {
    pub auto_generate_for_post: bool,
    pub max_retries: i64,
}

pub struct DotnetServiceCtx<'a> {
    pub namespace: &'a str,
    pub types: Types<'a>,
    pub behavior: Behavior,
}

fn http_method(m: &str) -> Option<&'static str> {
    match m {
        "get" => Some("HttpMethod.Get"),
        "post" => Some("HttpMethod.Post"),
        "put" => Some("HttpMethod.Put"),
        "patch" => Some("HttpMethod.Patch"),
        "delete" => Some("HttpMethod.Delete"),
        "head" => Some("HttpMethod.Head"),
        "options" => Some("HttpMethod.Options"),
        _ => None,
    }
}

fn is_idempotent_post_like(m: &str) -> bool {
    matches!(m, "post" | "put" | "patch")
}

/// Whether the runtime injects a generated idempotency key for this method.
fn method_injects_idempotency(method: &Value, behavior: &Behavior) -> bool {
    if !method
        .get("injectIdempotencyKey")
        .and_then(Value::as_bool)
        .unwrap_or(false)
    {
        return false;
    }
    let http = method
        .get("httpMethod")
        .and_then(Value::as_str)
        .unwrap_or("");
    if !is_idempotent_post_like(http) {
        return false;
    }
    behavior.auto_generate_for_post && behavior.max_retries > 0
}

/// The globally-unique service class name for a resource, path-qualified.
pub fn service_class_name(segments: &[String]) -> String {
    let joined: String = segments.iter().map(|s| pascal_case(s)).collect();
    format!("{joined}Service")
}

/// Emit one top-level resource (and its whole subtree) into a single C# file.
pub fn render_service_file(resource: &Value, ctx: &DotnetServiceCtx) -> (String, String) {
    let usings = vec![
        "System".to_string(),
        "System.Collections.Generic".to_string(),
        "System.Net.Http".to_string(),
        "System.Threading".to_string(),
        "System.Threading.Tasks".to_string(),
    ];
    let name = resource
        .get("name")
        .and_then(Value::as_str)
        .unwrap_or("")
        .to_string();
    let mut decls: Vec<String> = Vec::new();
    emit_service(resource, std::slice::from_ref(&name), ctx, &mut decls);
    let class_name = service_class_name(std::slice::from_ref(&name));
    (
        format!("{class_name}.cs"),
        cs_file(&usings, ctx.namespace, &decls),
    )
}

fn emit_service(
    resource: &Value,
    segments: &[String],
    ctx: &DotnetServiceCtx,
    decls: &mut Vec<String>,
) {
    let cls = service_class_name(segments);
    let subs = resource
        .get("resources")
        .and_then(Value::as_array)
        .cloned()
        .unwrap_or_default();

    let mut members: Vec<String> = vec!["private readonly Transport _transport;".to_string()];
    for sub in &subs {
        let sub_name = sub.get("name").and_then(Value::as_str).unwrap_or("");
        let mut seg = segments.to_vec();
        seg.push(sub_name.to_string());
        members.push(format!(
            "public {} {} {{ get; }}",
            service_class_name(&seg),
            pascal_case(sub_name)
        ));
    }

    let mut ctor_assignments: Vec<String> = vec!["_transport = transport;".to_string()];
    for sub in &subs {
        let sub_name = sub.get("name").and_then(Value::as_str).unwrap_or("");
        let mut seg = segments.to_vec();
        seg.push(sub_name.to_string());
        ctor_assignments.push(format!(
            "{} = new {}(transport);",
            pascal_case(sub_name),
            service_class_name(&seg)
        ));
    }
    let ctor = format!(
        "internal {cls}(Transport transport)\n{{\n{}\n}}",
        indent(&ctor_assignments.join("\n"))
    );

    let methods: Vec<String> = resource
        .get("methods")
        .and_then(Value::as_array)
        .map(|ms| ms.iter().map(|m| emit_method(m, ctx)).collect())
        .unwrap_or_default();

    let mut parts = vec![members.join("\n"), ctor];
    parts.extend(methods);
    let body = parts.join("\n\n");
    let doc = cs_doc(resource.get("description").and_then(Value::as_str));
    let head = if doc.is_empty() {
        String::new()
    } else {
        format!("{doc}\n")
    };
    decls.push(format!(
        "{head}public sealed class {cls}\n{{\n{}\n}}",
        indent(&body)
    ));

    for sub in &subs {
        let sub_name = sub.get("name").and_then(Value::as_str).unwrap_or("");
        let mut seg = segments.to_vec();
        seg.push(sub_name.to_string());
        emit_service(sub, &seg, ctx, decls);
    }
}

fn emit_method(method: &Value, ctx: &DotnetServiceCtx) -> String {
    let op = plan_operation(method, ctx.types);
    let name = method_name(method.get("action").and_then(Value::as_str).unwrap_or(""));
    let path_params = &op.path_params;
    let query_params = &op.query_params;
    let header_params = &op.header_params;

    // --- signature: required args, then optional args, then CancellationToken ---
    let mut required: Vec<String> = Vec::new();
    let mut optional: Vec<String> = Vec::new();
    for p in path_params {
        required.push(format!(
            "{} {}",
            cs_type(p.get("type"), ctx.types),
            camel_case(p.get("name").and_then(Value::as_str).unwrap_or(""))
        ));
    }

    let body_type = body_model_type(method, ctx.types);
    if let Some(bt) = &body_type {
        if op.body_required {
            required.push(format!("{bt} body"));
        } else {
            optional.push(format!("{} body = null", nullable(bt)));
        }
    }
    for q in query_params.iter().chain(header_params.iter()) {
        let t = cs_type(q.get("type"), ctx.types);
        let arg = camel_case(q.get("name").and_then(Value::as_str).unwrap_or(""));
        if q.get("required").and_then(Value::as_bool).unwrap_or(false) {
            required.push(format!("{t} {arg}"));
        } else {
            optional.push(format!("{} {arg} = null", nullable(&t)));
        }
    }
    let mut args = required;
    args.extend(optional);
    args.push("CancellationToken cancellationToken = default".to_string());

    // --- body statements ------------------------------------------------------
    let mut lines: Vec<String> = Vec::new();
    for p in path_params {
        if cs_type(p.get("type"), ctx.types) != "string" {
            continue;
        }
        let arg = camel_case(p.get("name").and_then(Value::as_str).unwrap_or(""));
        lines.push(format!(
            "if (string.IsNullOrEmpty({arg}))\n{{\n{}\n}}",
            indent(&format!(
                "throw new ArgumentException(\"Expected a non-empty value for {arg}.\", nameof({arg}));"
            ))
        ));
    }

    let http = method
        .get("httpMethod")
        .and_then(Value::as_str)
        .unwrap_or("");
    let http_method_expr = match http_method(http) {
        Some(hm) => hm.to_string(),
        None => format!("new HttpMethod({})", json_string(&http.to_uppercase())),
    };
    let mut call_args: Vec<String> = vec![
        http_method_expr,
        path_expr(
            method.get("path").and_then(Value::as_str).unwrap_or(""),
            path_params,
        ),
    ];

    if !query_params.is_empty() {
        lines.extend(query_lines(query_params, ctx));
        call_args.push("query: query".to_string());
    }

    // Body encoding: json body carrying a binary field → multipart.
    let mut encoding = op.encoding.clone().unwrap_or_else(|| "json".to_string());
    let b_fields = body_fields(method, ctx.types);
    if body_type.is_some()
        && encoding == "json"
        && b_fields
            .iter()
            .any(|f| is_binary_type_ref(f.get("type"), ctx.types, &mut Vec::new()))
    {
        encoding = "multipart".to_string();
    }
    if let Some(bt) = &body_type {
        if encoding == "json" {
            call_args.push("body: body".to_string());
        } else {
            let field_names: Vec<String> = b_fields
                .iter()
                .map(|f| {
                    f.get("name")
                        .and_then(Value::as_str)
                        .unwrap_or("")
                        .to_string()
                })
                .collect();
            let body_idents = struct_property_names(bt, &field_names);
            let entries = b_fields
                .iter()
                .enumerate()
                .map(|(i, f)| {
                    let wire = f.get("name").and_then(Value::as_str).unwrap_or("");
                    format!("[{}] = body.{},", json_string(wire), body_idents[i].1)
                })
                .collect::<Vec<_>>()
                .join("\n");
            lines.push(format!(
                "var bodyMap = new Dictionary<string, object?>\n{{\n{}\n}};",
                indent(&entries)
            ));
            call_args.push("body: bodyMap".to_string());
            call_args.push(format!("encoding: {}", json_string(&encoding)));
        }
    }

    let header_entries: Vec<String> = header_params
        .iter()
        .map(|h| {
            let wire = h
                .get("wireName")
                .and_then(Value::as_str)
                .or_else(|| h.get("name").and_then(Value::as_str))
                .unwrap_or("");
            format!(
                "[{}] = {},",
                json_string(wire),
                camel_case(h.get("name").and_then(Value::as_str).unwrap_or(""))
            )
        })
        .collect();
    if !header_entries.is_empty() {
        lines.push(format!(
            "var headers = new Dictionary<string, string?>\n{{\n{}\n}};",
            indent(&header_entries.join("\n"))
        ));
        call_args.push("headers: headers".to_string());
    }

    if method_injects_idempotency(method, &ctx.behavior) {
        call_args.push("idempotency: true".to_string());
    }

    // --- return / dispatch ----------------------------------------------------
    let (return_type, statements) = return_plan(method, &op, ctx, &call_args);
    lines.extend(statements);

    let doc = cs_doc(method.get("description").and_then(Value::as_str));
    let head = if doc.is_empty() {
        String::new()
    } else {
        format!("{doc}\n")
    };
    let signature = format!("public async {return_type} {name}({})", args.join(", "));
    format!("{head}{signature}\n{{\n{}\n}}", indent(&lines.join("\n")))
}

#[derive(PartialEq)]
enum QueryKind {
    Scalar,
    Array,
    Map,
    Object,
}

fn query_kind(ref_: Option<&Value>, types: Types) -> QueryKind {
    let r = match ref_ {
        Some(r) => r,
        None => return QueryKind::Scalar,
    };
    match r.get("kind").and_then(Value::as_str) {
        Some("scalar") => QueryKind::Scalar,
        Some("array") => QueryKind::Array,
        Some("map") => QueryKind::Map,
        Some("ref") => {
            if let Some(name) = r.get("name").and_then(Value::as_str) {
                if let Some(named) = types.get(name) {
                    return match named.get("kind").and_then(Value::as_str) {
                        Some("enum") => QueryKind::Scalar,
                        Some("alias") => query_kind(named.get("of"), types),
                        _ => QueryKind::Object,
                    };
                }
            }
            QueryKind::Object
        }
        _ => QueryKind::Object,
    }
}

fn query_lines(query_params: &[Value], ctx: &DotnetServiceCtx) -> Vec<String> {
    let mut literal_entries: Vec<String> = Vec::new();
    let mut expansions: Vec<String> = Vec::new();
    for q in query_params {
        let arg = camel_case(q.get("name").and_then(Value::as_str).unwrap_or(""));
        let wire = q
            .get("wireName")
            .and_then(Value::as_str)
            .or_else(|| q.get("name").and_then(Value::as_str))
            .unwrap_or("");
        let kind = query_kind(q.get("type"), ctx.types);
        let deep_object = q.get("style").and_then(Value::as_str) == Some("deepObject");

        if kind == QueryKind::Map && deep_object {
            let inner = format!(
                "foreach (var entry in {arg})\n{{\n{}\n}}",
                indent(&format!("query[$\"{wire}[{{entry.Key}}]\"] = entry.Value;"))
            );
            expansions.push(format!("if ({arg} != null)\n{{\n{}\n}}", indent(&inner)));
            continue;
        }

        let value = if kind == QueryKind::Array
            && q.get("explode").and_then(Value::as_bool) == Some(false)
        {
            format!("Transport.JoinCsv({arg})")
        } else if kind == QueryKind::Map || kind == QueryKind::Object {
            format!("Transport.JsonQuery({arg})")
        } else {
            arg.clone()
        };
        literal_entries.push(format!("[{}] = {value},", json_string(wire)));
    }

    let decl = if !literal_entries.is_empty() {
        format!(
            "var query = new Dictionary<string, object?>\n{{\n{}\n}};",
            indent(&literal_entries.join("\n"))
        )
    } else {
        "var query = new Dictionary<string, object?>();".to_string()
    };
    let mut out = vec![decl];
    out.extend(expansions);
    out
}

/// The request-body model type, or None when the method has no body.
fn body_model_type(method: &Value, types: Types) -> Option<String> {
    let ref_ = method.get("requestBody").and_then(|b| b.get("type"))?;
    Some(cs_type(Some(ref_), types))
}

/// Resolve a request body's fields by following its TypeRef into the symbol table.
fn body_fields(method: &Value, types: Types) -> Vec<Value> {
    if let Some(ref_) = method.get("requestBody").and_then(|b| b.get("type")) {
        if ref_.get("kind").and_then(Value::as_str) == Some("ref") {
            if let Some(name) = ref_.get("name").and_then(Value::as_str) {
                if let Some(named) = types.get(name) {
                    if let Some(fields) = named.get("fields").and_then(Value::as_array) {
                        return fields.clone();
                    }
                }
            }
        }
    }
    Vec::new()
}

/// The `Task<T>` return type + the transport statement(s) for a method.
fn return_plan(
    method: &Value,
    op: &OperationPlan,
    ctx: &DotnetServiceCtx,
    call_args: &[String],
) -> (String, Vec<String>) {
    let tail = "cancellationToken: cancellationToken";
    let joined = |extra: &[&str]| -> String {
        let mut v: Vec<String> = call_args.to_vec();
        for e in extra {
            v.push(e.to_string());
        }
        v.join(", ")
    };

    if let Some(bct) = &op.binary_content_type {
        let accept = format!("accept: {}", json_string(bct));
        return (
            "Task<byte[]>".to_string(),
            vec![format!(
                "return await _transport.RequestRawAsync({}).ConfigureAwait(false);",
                joined(&[&accept, tail])
            )],
        );
    }

    // Paginated list: a typed page container.
    if let Some(page) = op.page_name {
        let item = cs_type(
            method.get("pagination").and_then(|p| p.get("itemType")),
            ctx.types,
        );
        let ty = format!("{page}<{item}>");
        return (
            format!("Task<{ty}>"),
            vec![format!(
                "return await _transport.RequestAsync<{ty}>({}).ConfigureAwait(false);",
                joined(&[tail])
            )],
        );
    }

    let ref_ = method.get("primaryResponse");
    if ref_.map(|r| r.is_null()).unwrap_or(true) || op.primary_response == "none" {
        return (
            "Task".to_string(),
            vec![format!(
                "await _transport.RequestAsync({}).ConfigureAwait(false);",
                joined(&[tail])
            )],
        );
    }
    let ref_ = ref_.unwrap();

    // A mapped discriminated union decodes through its generated helper.
    if op.primary_response == "union-mapped"
        && ref_.get("kind").and_then(Value::as_str) == Some("ref")
    {
        if let Some(rname) = ref_.get("name").and_then(Value::as_str) {
            if let Some(union) = ctx.types.get(rname) {
                if union_mapping(union).is_some() {
                    let uname = union.get("name").and_then(Value::as_str).unwrap_or("");
                    return (
                        "Task<object?>".to_string(),
                        vec![
                            format!(
                                "string content = await _transport.RequestStringAsync({}).ConfigureAwait(false);",
                                joined(&[tail])
                            ),
                            format!("return {}.Decode(content);", union_decoder_name(uname)),
                        ],
                    );
                }
            }
        }
    }

    let ty = cs_type(Some(ref_), ctx.types);
    (
        format!("Task<{ty}>"),
        vec![format!(
            "return await _transport.RequestAsync<{ty}>({}).ConfigureAwait(false);",
            joined(&[tail])
        )],
    )
}

/// The path as a C# string literal, or an interpolated string when it has params.
fn path_expr(path: &str, path_params: &[Value]) -> String {
    let p = if path.starts_with('/') {
        path.to_string()
    } else {
        format!("/{path}")
    };
    if !p.contains('{') {
        return json_string(&p);
    }
    // wireName (or name) → camelCase(name)
    let by_wire: Vec<(String, String)> = path_params
        .iter()
        .map(|param| {
            let name = param.get("name").and_then(Value::as_str).unwrap_or("");
            let wire = param
                .get("wireName")
                .and_then(Value::as_str)
                .unwrap_or(name);
            (wire.to_string(), camel_case(name))
        })
        .collect();
    let interpolated = replace_braces(&p, &by_wire);
    format!("${}", json_string(&interpolated))
}

/// Replace each `{wire}` with `{<mapped>}` (fallback: camelCase(wire)).
fn replace_braces(p: &str, by_wire: &[(String, String)]) -> String {
    let mut out = String::with_capacity(p.len());
    let mut rest = p;
    while let Some(open) = rest.find('{') {
        out.push_str(&rest[..open]);
        let after = &rest[open + 1..];
        match after.find('}') {
            Some(close) => {
                let wire = &after[..close];
                let mapped = by_wire
                    .iter()
                    .find(|(w, _)| w == wire)
                    .map(|(_, v)| v.clone())
                    .unwrap_or_else(|| camel_case(wire));
                out.push('{');
                out.push_str(&mapped);
                out.push('}');
                rest = &after[close + 1..];
            }
            None => {
                // Unbalanced brace: emit the rest verbatim.
                out.push('{');
                rest = after;
            }
        }
    }
    out.push_str(rest);
    out
}
