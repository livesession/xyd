//! `resources.py`: the resource classes and functional methods, ported from
//! `resourcesPy` in `project.ts` plus the per-operation plan the framework's
//! `planOperation()` computes (only the fields the Python renderer reads).

use std::collections::HashMap;

use serde_json::Value;

use crate::naming::{pascal_case, snake_case};
use crate::pytype::{is_passthrough_type, optionalize, py_type, PyUses};
use crate::val::{arr, bool_field, pystr, str_field};

type TypeMap<'a> = HashMap<&'a str, &'a Value>;

/// The subset of `planOperation()` the Python resources renderer consumes.
struct Plan<'a> {
    method: &'a Value,
    /// "CursorPage" | "Page" | "OffsetPage" | absent.
    page_name: Option<&'static str>,
    /// The primary 2xx content type when it is not json (binary download).
    binary_content_type: Option<String>,
    /// Body wire encoding: "json" | "multipart" | "form" | absent (no body).
    encoding: Option<&'static str>,
    inject_idempotency_key: bool,
}

/// The FIRST declared 2xx response's content type when it is not json.
fn binary_content_type(method: &Value) -> Option<String> {
    let primary = arr(method, "responses").iter().find(|r| {
        str_field(r, "status")
            .map(|s| s.starts_with('2'))
            .unwrap_or(false)
    });
    match primary.and_then(|r| str_field(r, "contentType")) {
        Some(c) if !c.contains("json") => Some(c.to_string()),
        _ => None,
    }
}

/// The vendored page kind — planOperation's methodPageName gates, verbatim.
fn page_name(method: &Value, binary: &Option<String>) -> Option<&'static str> {
    if binary.is_some() {
        return None;
    }
    let pag = method.get("pagination")?;
    let has_item = pag.get("itemType").map(|v| !v.is_null()).unwrap_or(false);
    if !has_item || str_field(pag, "itemsField") != Some("data") {
        return None;
    }
    match str_field(pag, "style") {
        Some("cursor") => Some("CursorPage"),
        Some("page") => Some("Page"),
        Some("offset") if str_field(pag, "offsetParam").is_some() => Some("OffsetPage"),
        _ => None,
    }
}

fn body_encoding(method: &Value) -> Option<&'static str> {
    let body = method.get("requestBody")?;
    Some(match str_field(body, "encoding") {
        Some("multipart") => "multipart",
        Some("form") => "form",
        _ => "json",
    })
}

fn plan_operation(method: &Value) -> Plan<'_> {
    let binary = binary_content_type(method);
    let page = page_name(method, &binary);
    Plan {
        method,
        page_name: page,
        binary_content_type: binary,
        encoding: body_encoding(method),
        inject_idempotency_key: bool_field(method, "injectIdempotencyKey") == Some(true),
    }
}

/// The Python page container: OffsetPage has no vendored container yet.
fn py_page_name(plan: &Plan) -> Option<&'static str> {
    match plan.page_name {
        Some("CursorPage") => Some("CursorPage"),
        Some("Page") => Some("Page"),
        _ => None,
    }
}

/// Accumulated imports/uses while rendering the resource classes.
struct ResCtx {
    uses: PyUses,
    transport_decode: bool,
    transport_join_csv: bool,
    page_cursor: bool,
    page_page: bool,
    idempotency_auto: bool,
}

fn idempotency_auto(spec: &Value) -> bool {
    spec.get("sdk")
        .and_then(|s| s.get("idempotency"))
        .and_then(|i| i.get("autoGenerateForPost"))
        .and_then(Value::as_bool)
        .unwrap_or(true)
}

pub fn resources_py(spec: &Value) -> String {
    let mut types: TypeMap = HashMap::new();
    for t in arr(spec, "types") {
        if let Some(n) = str_field(t, "name") {
            types.insert(n, t);
        }
    }
    let mut ctx = ResCtx {
        uses: PyUses::new(),
        transport_decode: false,
        transport_join_csv: false,
        page_cursor: false,
        page_page: false,
        idempotency_auto: idempotency_auto(spec),
    };
    let mut classes: Vec<String> = Vec::new();
    emit_resources(arr(spec, "resources"), &[], &types, &mut classes, &mut ctx);

    let mut lines: Vec<String> = vec!["from __future__ import annotations".into(), String::new()];
    if let Some(tl) = ctx.uses.typing_import() {
        lines.push(tl);
        lines.push(String::new());
    }
    if ctx.page_cursor || ctx.page_page {
        let mut names: Vec<&str> = Vec::new();
        if ctx.page_cursor {
            names.push("CursorPage");
        }
        if ctx.page_page {
            names.push("Page");
        }
        lines.push(format!("from ._pagination import {}", names.join(", ")));
    }
    let mut tnames: Vec<&str> = vec!["Transport"];
    if ctx.transport_decode {
        tnames.push("decode");
    }
    if ctx.transport_join_csv {
        tnames.push("join_csv");
    }
    lines.push(format!("from ._transport import {}", tnames.join(", ")));
    lines.push("from .models import *  # noqa: F401,F403".into());
    format!("{}\n\n\n{}\n", lines.join("\n"), classes.join("\n\n\n"))
}

fn emit_resources(
    resources: &[Value],
    parent: &[String],
    types: &TypeMap,
    classes: &mut Vec<String>,
    ctx: &mut ResCtx,
) {
    for r in resources {
        let mut segments: Vec<String> = parent.to_vec();
        segments.push(str_field(r, "name").unwrap_or("").to_string());
        classes.push(resource_class(r, &segments, types, ctx));
        let subs = arr(r, "resources");
        if !subs.is_empty() {
            emit_resources(subs, &segments, types, classes, ctx);
        }
    }
}

/// The globally-unique resource class name, path-qualified by the full segment
/// chain from root (mirrors serviceTypeName).
fn resource_class_name(segments: &[String]) -> String {
    let mut s = String::new();
    for seg in segments {
        s.push_str(&pascal_case(seg));
    }
    s.push_str("Resource");
    s
}

fn resource_class(
    resource: &Value,
    segments: &[String],
    types: &TypeMap,
    ctx: &mut ResCtx,
) -> String {
    let cls = resource_class_name(segments);
    let mut ctor_lines: Vec<String> = vec!["        self._transport = transport".into()];
    for sub in arr(resource, "resources") {
        let sub_name = str_field(sub, "name").unwrap_or("");
        let mut sub_segments = segments.to_vec();
        sub_segments.push(sub_name.to_string());
        ctor_lines.push(format!(
            "        self.{} = {}(transport)",
            snake_case(sub_name),
            resource_class_name(&sub_segments)
        ));
    }
    let ctor = format!(
        "    def __init__(self, transport: Transport) -> None:\n{}",
        ctor_lines.join("\n")
    );
    let mut parts: Vec<String> = vec![ctor];
    for m in arr(resource, "methods") {
        parts.push(method_def(m, types, ctx));
    }
    format!("class {cls}:\n{}", parts.join("\n\n"))
}

struct BodyField {
    name: String,
    ty: Value,
    required: bool,
}

fn body_field_list(method: &Value, types: &TypeMap) -> Vec<BodyField> {
    let rb = match method.get("requestBody") {
        Some(r) => r,
        None => return Vec::new(),
    };
    let ref_ = rb.get("type");
    let is_named_ref = ref_
        .map(|t| str_field(t, "kind") == Some("ref"))
        .unwrap_or(false);
    if !is_named_ref {
        return Vec::new();
    }
    let name = match ref_.and_then(|t| str_field(t, "name")) {
        Some(n) if !n.is_empty() => n,
        _ => return Vec::new(),
    };
    let named = match types.get(name) {
        Some(n) => *n,
        None => return Vec::new(),
    };
    arr(named, "fields")
        .iter()
        .map(|f| BodyField {
            name: str_field(f, "name").unwrap_or("").to_string(),
            ty: f.get("type").cloned().unwrap_or(Value::Null),
            required: bool_field(f, "required") == Some(true),
        })
        .collect()
}

/// Whether a TypeRef ultimately carries binary bytes (`format: binary`),
/// following array items and named union/alias refs.
fn is_binary_type_ref(ref_: Option<&Value>, types: &TypeMap, seen: &mut Vec<String>) -> bool {
    let r = match ref_ {
        Some(r) => r,
        None => return false,
    };
    match str_field(r, "kind") {
        Some("scalar") => {
            str_field(r, "scalar") == Some("string") && str_field(r, "format") == Some("binary")
        }
        Some("array") => is_binary_type_ref(r.get("items"), types, seen),
        Some("ref") => {
            let name = match str_field(r, "name") {
                Some(n) => n,
                None => return false,
            };
            if seen.iter().any(|x| x == name) {
                return false;
            }
            seen.push(name.to_string());
            let named = match types.get(name) {
                Some(n) => *n,
                None => return false,
            };
            match str_field(named, "kind") {
                Some("union") => arr(named, "variants")
                    .iter()
                    .any(|v| is_binary_type_ref(Some(v), types, seen)),
                Some("alias") => is_binary_type_ref(named.get("of"), types, seen),
                _ => false,
            }
        }
        _ => false,
    }
}

fn method_def(method: &Value, types: &TypeMap, ctx: &mut ResCtx) -> String {
    let plan = plan_operation(method);
    let name = snake_case(str_field(method, "action").unwrap_or(""));
    let path_params = arr(method, "pathParams");
    let query_params = arr(method, "queryParams");
    let header_params = arr(method, "headerParams");
    let raw_content_type = plan.binary_content_type.clone();

    // Signature: positional path args, then keyword-only query/header/body params.
    let mut positional: Vec<String> = Vec::new();
    for p in path_params {
        positional.push(format!(
            "{}: {}",
            snake_case(str_field(p, "name").unwrap_or("")),
            py_type(p.get("type"), &mut ctx.uses)
        ));
    }
    let mut kw_args: Vec<String> = Vec::new();
    for p in query_params.iter().chain(header_params.iter()) {
        kw_args.push(param_arg(p, ctx));
    }
    let body_params = body_field_list(method, types);
    for b in &body_params {
        let ty = py_type(Some(&b.ty), &mut ctx.uses);
        if b.required {
            kw_args.push(format!("{}: {ty}", snake_case(&b.name)));
        } else {
            kw_args.push(format!(
                "{}: {} = None",
                snake_case(&b.name),
                optionalize(&ty, &mut ctx.uses)
            ));
        }
    }
    let mut params: Vec<String> = vec!["self".into()];
    params.extend(positional);
    if !kw_args.is_empty() {
        params.push("*".into());
        params.extend(kw_args);
    }
    let params_str = params.join(", ");

    let http_method = str_field(method, "httpMethod").unwrap_or("").to_uppercase();
    let mut call_args: Vec<String> = vec![
        pystr(&http_method),
        path_expr(
            str_field(method, "path").unwrap_or(""),
            !path_params.is_empty(),
        ),
    ];
    if !query_params.is_empty() {
        let entries: Vec<String> = query_params.iter().map(|q| query_entry(q, ctx)).collect();
        call_args.push(format!("query={{{}}}", entries.join(", ")));
    }
    if !body_params.is_empty() {
        let entries: Vec<String> = body_params
            .iter()
            .map(|b| format!("{}: {}", pystr(&b.name), snake_case(&b.name)))
            .collect();
        call_args.push(format!("body={{{}}}", entries.join(", ")));
    }
    // Header params go on the wire under their raw names; binary downloads also
    // send an Accept header for the primary content type (user params win).
    let mut header_entries: Vec<String> = header_params
        .iter()
        .map(|h| {
            let wire =
                str_field(h, "wireName").unwrap_or_else(|| str_field(h, "name").unwrap_or(""));
            format!(
                "{}: {}",
                pystr(wire),
                snake_case(str_field(h, "name").unwrap_or(""))
            )
        })
        .collect();
    if let Some(rct) = &raw_content_type {
        header_entries.insert(0, format!("\"Accept\": {}", pystr(rct)));
    }
    if !header_entries.is_empty() {
        call_args.push(format!("headers={{{}}}", header_entries.join(", ")));
    }
    // Body encoding: a body carrying a binary field must not be json.dumps'd even
    // when the spec labels it json — route it through the multipart encoder.
    let mut encoding: &str = plan.encoding.unwrap_or("json");
    if !body_params.is_empty()
        && encoding == "json"
        && body_params
            .iter()
            .any(|b| is_binary_type_ref(Some(&b.ty), types, &mut Vec::new()))
    {
        encoding = "multipart";
    }
    if !body_params.is_empty() && encoding != "json" {
        call_args.push(format!("encoding={}", pystr(encoding)));
    }
    if raw_content_type.is_some() {
        call_args.push("raw=True".into());
    }
    // sdk.idempotency: flagged methods get a transport-generated key.
    if plan.inject_idempotency_key && ctx.idempotency_auto {
        call_args.push("idempotency=True".into());
    }

    let call = format!("self._transport.request({})", call_args.join(", "));
    let (annotation, body) = return_plan(&plan, &call, ctx);
    let guards = path_param_guards(path_params);
    let full_body = if guards.is_empty() {
        body
    } else {
        format!("{guards}\n{body}")
    };
    format!("    def {name}({params_str}) -> {annotation}:\n{full_body}")
}

/// Guard statements: reject an empty required string path param before building
/// the path (matches openai-python / the Go emitter's guard).
fn path_param_guards(path_params: &[Value]) -> String {
    let mut lines: Vec<String> = Vec::new();
    for p in path_params {
        let is_string_scalar = p
            .get("type")
            .map(|t| {
                str_field(t, "kind") == Some("scalar") && str_field(t, "scalar") == Some("string")
            })
            .unwrap_or(false);
        if !is_string_scalar || bool_field(p, "required") == Some(false) {
            continue;
        }
        let n = snake_case(str_field(p, "name").unwrap_or(""));
        lines.push(format!("        if not {n}:"));
        lines.push(format!(
            "            raise ValueError(f\"Expected a non-empty value for `{n}` but received {{{n}!r}}\")"
        ));
    }
    lines.join("\n")
}

fn param_arg(p: &Value, ctx: &mut ResCtx) -> String {
    let ty = py_type(p.get("type"), &mut ctx.uses);
    let n = snake_case(str_field(p, "name").unwrap_or(""));
    if bool_field(p, "required") == Some(true) {
        format!("{n}: {ty}")
    } else {
        format!("{n}: {} = None", optionalize(&ty, &mut ctx.uses))
    }
}

/// One `wire-name: value` query entry; explode=false arrays comma-join.
fn query_entry(q: &Value, ctx: &mut ResCtx) -> String {
    let wire =
        pystr(str_field(q, "wireName").unwrap_or_else(|| str_field(q, "name").unwrap_or("")));
    let value = snake_case(str_field(q, "name").unwrap_or(""));
    let is_array = q
        .get("type")
        .map(|t| str_field(t, "kind") == Some("array"))
        .unwrap_or(false);
    if is_array && bool_field(q, "explode") == Some(false) {
        ctx.transport_join_csv = true;
        format!("{wire}: join_csv({value})")
    } else {
        format!("{wire}: {value}")
    }
}

/// The return annotation plus the method body (indented statement lines).
fn return_plan(plan: &Plan, call: &str, ctx: &mut ResCtx) -> (String, String) {
    if plan.binary_content_type.is_some() {
        return ("bytes".to_string(), format!("        return {call}"));
    }
    if let Some(page) = py_page_name(plan) {
        match page {
            "CursorPage" => ctx.page_cursor = true,
            "Page" => ctx.page_page = true,
            _ => {}
        }
        let item = py_type(
            plan.method
                .get("pagination")
                .and_then(|p| p.get("itemType")),
            &mut ctx.uses,
        );
        return (
            format!("{page}[{item}]"),
            format!("        return {page}.from_response({item}, {call})"),
        );
    }
    let primary = match plan.method.get("primaryResponse") {
        Some(p) if !p.is_null() => p,
        _ => return ("None".to_string(), format!("        {call}")),
    };
    let ty = py_type(Some(primary), &mut ctx.uses);
    if is_passthrough_type(&ty) {
        return (ty.clone(), format!("        return {call}"));
    }
    ctx.transport_decode = true;
    (ty.clone(), format!("        return decode({ty}, {call})"))
}

/// The path expression: a plain string, or an f-string when it has params.
fn path_expr(path: &str, has_params: bool) -> String {
    let p = if path.starts_with('/') {
        path.to_string()
    } else {
        format!("/{path}")
    };
    if !has_params {
        return pystr(&p);
    }
    format!("f{}", pystr(&replace_path_params(&p)))
}

/// Replace `{wire}` with `{snake}` (matches `/\{([^}]+)\}/g`; empty `{}` is left).
fn replace_path_params(p: &str) -> String {
    let chars: Vec<char> = p.chars().collect();
    let mut out = String::new();
    let mut i = 0;
    while i < chars.len() {
        if chars[i] == '{' {
            if let Some(rel) = chars[i + 1..].iter().position(|&c| c == '}') {
                if rel >= 1 {
                    let name: String = chars[i + 1..i + 1 + rel].iter().collect();
                    out.push('{');
                    out.push_str(&snake_case(&name));
                    out.push('}');
                    i = i + 1 + rel + 1;
                    continue;
                }
            }
        }
        out.push(chars[i]);
        i += 1;
    }
    out
}
