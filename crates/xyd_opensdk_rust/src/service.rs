//! src/<resource>.rs — port of service.ts. One top-level resource (+ its nested
//! subtree) per file: the resource struct, its impl (constructor + sub-resource
//! accessors + async methods), and per-method params structs.

use serde_json::{Map, Value};

use crate::naming::{pascal_case, rust_method_name, snake_case};
use crate::plan::{plan_operation, OperationPlan};
use crate::rstype::{is_binary_ref, rs_type};
use crate::rswriter::{braced, rs_doc, rs_string};

pub struct RustCtx<'a> {
    pub types: &'a Map<String, Value>,
}

fn s<'v>(v: &'v Value, k: &str) -> &'v str {
    v.get(k).and_then(|x| x.as_str()).unwrap_or("")
}

pub fn resource_class_name(segments: &[String]) -> String {
    segments.iter().map(|s| pascal_case(s)).collect()
}

pub fn render_service_file(resource: &Value, ctx: &RustCtx) -> (String, String) {
    let mut items: Vec<String> = Vec::new();
    emit_resource(
        resource,
        &[s(resource, "name").to_string()],
        ctx,
        &mut items,
    );
    let uses = "use std::sync::Arc;\n\nuse crate::error::Error;\nuse crate::models::*;\nuse crate::transport::{Page, Transport};";
    let content = format!("{uses}\n\n{}\n", items.join("\n\n"));
    (
        format!("src/{}.rs", snake_case(s(resource, "name"))),
        content,
    )
}

fn emit_resource(resource: &Value, segments: &[String], ctx: &RustCtx, out: &mut Vec<String>) {
    let cls = resource_class_name(segments);
    let empty = Vec::new();
    let subs = resource
        .get("resources")
        .and_then(|r| r.as_array())
        .unwrap_or(&empty);

    let mut impl_members: Vec<String> = Vec::new();
    impl_members.push(braced(
        "pub(crate) fn new(transport: Arc<Transport>) -> Self",
        &format!("{cls} {{ transport }}"),
    ));
    for sub in subs {
        let mut seg = segments.to_vec();
        seg.push(s(sub, "name").to_string());
        let sub_cls = resource_class_name(&seg);
        impl_members.push(braced(
            &format!("pub fn {}(&self) -> {sub_cls}", snake_case(s(sub, "name"))),
            &format!("{sub_cls}::new(self.transport.clone())"),
        ));
    }

    let mut params_structs: Vec<String> = Vec::new();
    for method in resource
        .get("methods")
        .and_then(|m| m.as_array())
        .unwrap_or(&empty)
    {
        let (func, params_struct) = emit_method(method, &cls, ctx);
        impl_members.push(func);
        if let Some(ps) = params_struct {
            params_structs.push(ps);
        }
    }

    let doc = rs_doc(resource.get("description").and_then(|d| d.as_str()));
    let head = if doc.is_empty() {
        String::new()
    } else {
        format!("{doc}\n")
    };
    out.push(format!(
        "{head}pub struct {cls} {{\n    transport: Arc<Transport>,\n}}"
    ));
    out.push(braced(&format!("impl {cls}"), &impl_members.join("\n\n")));
    for ps in params_structs {
        out.push(ps);
    }

    for sub in subs {
        let mut seg = segments.to_vec();
        seg.push(s(sub, "name").to_string());
        emit_resource(sub, &seg, ctx, out);
    }
}

fn scalar_string(param: &Value) -> bool {
    let t = param.get("type");
    t.and_then(|t| t.get("kind")).and_then(|k| k.as_str()) == Some("scalar")
        && t.and_then(|t| t.get("scalar")).and_then(|x| x.as_str()) == Some("string")
}

fn emit_method(method: &Value, cls: &str, ctx: &RustCtx) -> (String, Option<String>) {
    let op = plan_operation(method);
    let name = rust_method_name(s(method, "action"));
    let path_params = &op.path_params;
    let query_params = &op.query_params;
    let header_params = &op.header_params;
    let body_fields = body_field_list(method, ctx.types);
    let encoding = op.encoding.unwrap_or("json");

    let has_params = query_params.len() + header_params.len() + body_fields.len() > 0;
    let params_name = params_struct_name(cls, s(method, "action"));
    let will_mutate = has_params || op.inject_idempotency_key;

    let mut args: Vec<String> = path_params.iter().map(path_arg).collect();
    if has_params {
        args.push(format!("params: {params_name}"));
    }
    let arg_list = if args.is_empty() {
        String::new()
    } else {
        format!(", {}", args.join(", "))
    };
    let signature = format!(
        "pub async fn {name}(&self{arg_list}) -> Result<{}, Error>",
        return_type(method, &op)
    );

    let mut lines: Vec<String> = Vec::new();

    let guards: Vec<&Value> = path_params
        .iter()
        .filter(|p| scalar_string(p) && p.get("required").and_then(|r| r.as_bool()) != Some(false))
        .collect();
    for p in &guards {
        let local = snake_case(s(p, "name"));
        lines.push(braced(
            &format!("if {local}.is_empty()"),
            &format!(
                "return Err(Error::InvalidArgument({}.to_string()));",
                rs_string(&local)
            ),
        ));
    }
    if !guards.is_empty() {
        lines.push(String::new());
    }

    lines.push(format!(
        "let {}req = self.transport.request(reqwest::Method::{}, {});",
        if will_mutate { "mut " } else { "" },
        s(method, "httpMethod").to_uppercase(),
        path_expr(s(method, "path"), path_params),
    ));

    for p in query_params {
        let key = rs_string(wire_name(p));
        let local = format!("params.{}", snake_case(s(p, "name")));
        let call = if p
            .get("type")
            .and_then(|t| t.get("kind"))
            .and_then(|k| k.as_str())
            == Some("array")
            && p.get("explode").and_then(|e| e.as_bool()) == Some(false)
        {
            format!("req = req.query_csv({key}, serde_json::to_value(value)?);")
        } else {
            format!("req = req.query({key}, serde_json::to_value(value)?);")
        };
        lines.push(braced(&format!("if let Some(value) = &{local}"), &call));
    }
    for p in header_params {
        let key = rs_string(wire_name(p));
        lines.push(braced(
            &format!("if let Some(value) = &params.{}", snake_case(s(p, "name"))),
            &format!("req = req.header_json({key}, serde_json::to_value(value)?);"),
        ));
    }
    for f in &body_fields {
        let key = rs_string(s(f, "name"));
        let local = format!("params.{}", snake_case(s(f, "name")));
        let call = if encoding == "multipart" {
            if is_binary_ref(f.get("type")) {
                format!("req = req.multipart_file({key}, value.clone());")
            } else {
                format!("req = req.multipart_json({key}, serde_json::to_value(value)?);")
            }
        } else if encoding == "form" {
            format!("req = req.form_json({key}, serde_json::to_value(value)?);")
        } else {
            format!("req = req.json_field({key}, serde_json::to_value(value)?);")
        };
        lines.push(braced(&format!("if let Some(value) = &{local}"), &call));
    }
    if op.inject_idempotency_key {
        lines.push("req = req.idempotency();".to_string());
    }

    lines.extend(response_expr(method, &op));

    let doc = rs_doc(method.get("description").and_then(|d| d.as_str()));
    let head = if doc.is_empty() {
        String::new()
    } else {
        format!("{doc}\n")
    };
    let func = format!("{head}{}", braced(&signature, &lines.join("\n")));
    let params_struct = if has_params {
        Some(emit_params_struct(
            &params_name,
            query_params,
            header_params,
            &body_fields,
        ))
    } else {
        None
    };
    (func, params_struct)
}

fn wire_name(p: &Value) -> &str {
    p.get("wireName")
        .and_then(|w| w.as_str())
        .unwrap_or_else(|| s(p, "name"))
}

fn path_arg(p: &Value) -> String {
    let local = snake_case(s(p, "name"));
    if scalar_string(p) {
        format!("{local}: &str")
    } else {
        format!("{local}: {}", rs_type(p.get("type")))
    }
}

fn path_expr(path: &str, _path_params: &[Value]) -> String {
    let normalized = if path.starts_with('/') {
        path.to_string()
    } else {
        format!("/{path}")
    };
    if !normalized.contains('{') {
        return rs_string(&normalized);
    }
    let mut args: Vec<String> = Vec::new();
    let mut fmt = String::with_capacity(normalized.len());
    let chars: Vec<char> = normalized.chars().collect();
    let mut i = 0;
    while i < chars.len() {
        if chars[i] == '{' {
            if let Some(close) = chars[i..].iter().position(|&c| c == '}') {
                let inner: String = chars[i + 1..i + close].iter().collect();
                args.push(snake_case(&inner));
                fmt.push_str("{}");
                i += close + 1;
                continue;
            }
        }
        fmt.push(chars[i]);
        i += 1;
    }
    format!("format!({}, {})", rs_string(&fmt), args.join(", "))
}

fn response_expr(method: &Value, op: &OperationPlan) -> Vec<String> {
    if op.binary_content_type.is_some() {
        return vec!["req.send_bytes().await".to_string()];
    }
    if op.page_name.is_some() {
        let pagination = method.get("pagination");
        let items_field = pagination
            .and_then(|p| p.get("itemsField"))
            .and_then(|f| f.as_str())
            .unwrap_or("data");
        let next = match pagination
            .and_then(|p| p.get("nextField"))
            .and_then(|f| f.as_str())
        {
            Some(nf) => format!("Some({})", rs_string(nf)),
            None => "None".to_string(),
        };
        return vec![
            "let value = req.send_value().await?;".to_string(),
            format!(
                "Page::from_value(value, {}, {next})",
                rs_string(items_field)
            ),
        ];
    }
    if method
        .get("primaryResponse")
        .map(|p| !p.is_null())
        .unwrap_or(false)
    {
        return vec!["req.send().await".to_string()];
    }
    vec!["req.send_empty().await".to_string()]
}

fn return_type(method: &Value, op: &OperationPlan) -> String {
    if op.binary_content_type.is_some() {
        return "Vec<u8>".to_string();
    }
    if op.page_name.is_some() {
        return format!(
            "Page<{}>",
            rs_type(method.get("pagination").and_then(|p| p.get("itemType")))
        );
    }
    if method
        .get("primaryResponse")
        .map(|p| !p.is_null())
        .unwrap_or(false)
    {
        return rs_type(method.get("primaryResponse"));
    }
    "()".to_string()
}

pub fn params_struct_name(cls: &str, action: &str) -> String {
    format!("{cls}{}Params", pascal_case(action))
}

/// Whether a method carries any query/header/body params (so it takes a params
/// struct) — mirrors service.ts `methodHasParams`, drives the test-suite call args.
pub fn method_has_params(method: &Value, types: &Map<String, Value>) -> bool {
    let op = plan_operation(method);
    op.query_params.len() + op.header_params.len() + body_field_list(method, types).len() > 0
}

pub fn body_field_list<'a>(method: &'a Value, types: &'a Map<String, Value>) -> Vec<&'a Value> {
    let ref_ = method.get("requestBody").and_then(|b| b.get("type"));
    if let Some(r) = ref_ {
        if r.get("kind").and_then(|k| k.as_str()) == Some("ref") {
            if let Some(name) = r.get("name").and_then(|n| n.as_str()) {
                if let Some(named) = types.get(name) {
                    if let Some(fields) = named.get("fields").and_then(|f| f.as_array()) {
                        return fields.iter().collect();
                    }
                }
            }
        }
    }
    Vec::new()
}

fn emit_params_struct(
    name: &str,
    query_params: &[Value],
    header_params: &[Value],
    body_fields: &[&Value],
) -> String {
    let mut seen = std::collections::HashSet::new();
    let mut rows: Vec<String> = Vec::new();
    let mut add = |raw_name: &str, type_: Option<&Value>, description: Option<&str>| {
        let rust_name = snake_case(raw_name);
        if seen.contains(&rust_name) {
            return;
        }
        seen.insert(rust_name.clone());
        let doc = rs_doc(description);
        let head = if doc.is_empty() {
            String::new()
        } else {
            format!("{doc}\n")
        };
        rows.push(format!(
            "{head}pub {rust_name}: Option<{}>,",
            rs_type(type_)
        ));
    };
    for p in query_params {
        add(
            s(p, "name"),
            p.get("type"),
            p.get("description").and_then(|d| d.as_str()),
        );
    }
    for p in header_params {
        add(
            s(p, "name"),
            p.get("type"),
            p.get("description").and_then(|d| d.as_str()),
        );
    }
    for f in body_fields {
        add(
            s(f, "name"),
            f.get("type"),
            f.get("description").and_then(|d| d.as_str()),
        );
    }
    format!(
        "#[derive(Debug, Clone, Default)]\n{}",
        braced(&format!("pub struct {name}"), &rows.join("\n"))
    )
}
