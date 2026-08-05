//! Port of service.ts — `lib/<pkg>/resources/<r>.rb` emission (the resource
//! class tree + per-method bodies). The largest, most exacting module.

use serde_json::Value;
use std::collections::HashMap;

use crate::model::{union_decoder_ref, union_mapping};
use crate::naming::{pascal_case, ruby_method_name, snake_case};
use crate::plan::{plan_operation, OperationPlan, PrimaryResponse};
use crate::rbtype::rb_doc_type;
use crate::writer::{block, indent, rb_comment, rb_string};

/// Globally-unique resource class name, path-qualified by the full chain.
pub fn resource_class_name(segments: &[String]) -> String {
    segments.iter().map(|s| pascal_case(s)).collect()
}

fn name_of(v: &Value) -> &str {
    v.get("name").and_then(|n| n.as_str()).unwrap_or("")
}

/// Emit one top-level resource (and its whole nested subtree) into one file.
pub fn render_service_file(
    resource: &Value,
    module_name: &str,
    pkg: &str,
    types: &HashMap<String, Value>,
) -> (String, String) {
    let mut classes: Vec<String> = Vec::new();
    emit_resource(
        resource,
        &[name_of(resource).to_string()],
        module_name,
        types,
        &mut classes,
    );
    let body = classes.join("\n\n");
    let content = format!(
        "{}\n",
        block(
            &format!("module {module_name}"),
            &block("module Resources", &body)
        )
    );
    let path = format!("lib/{pkg}/resources/{}.rb", snake_case(name_of(resource)));
    (path, content)
}

fn emit_resource(
    resource: &Value,
    segments: &[String],
    module_name: &str,
    types: &HashMap<String, Value>,
    out: &mut Vec<String>,
) {
    let cls = resource_class_name(segments);
    let subs = resource
        .get("resources")
        .and_then(|r| r.as_array())
        .cloned()
        .unwrap_or_default();

    let mut members: Vec<String> = Vec::new();
    if !subs.is_empty() {
        let readers: Vec<String> = subs
            .iter()
            .map(|s| format!(":{}", snake_case(name_of(s))))
            .collect();
        members.push(format!("attr_reader {}", readers.join(", ")));
    }

    let mut ctor = vec![
        "# @api private".to_string(),
        "def initialize(transport)".to_string(),
        indent("@transport = transport"),
    ];
    for sub in &subs {
        let sn = snake_case(name_of(sub));
        let mut child_segs = segments.to_vec();
        child_segs.push(name_of(sub).to_string());
        ctor.push(indent(&format!(
            "@{sn} = {}.new(transport)",
            resource_class_name(&child_segs)
        )));
    }
    ctor.push("end".to_string());
    members.push(ctor.join("\n"));

    if let Some(methods) = resource.get("methods").and_then(|m| m.as_array()) {
        for method in methods {
            members.push(emit_method(method, module_name, types));
        }
    }

    let doc = rb_comment(
        resource
            .get("description")
            .and_then(|d| d.as_str())
            .unwrap_or(""),
    );
    let head = if doc.is_empty() {
        String::new()
    } else {
        format!("{doc}\n")
    };
    out.push(format!(
        "{head}{}",
        block(&format!("class {cls}"), &members.join("\n\n"))
    ));

    for sub in &subs {
        let mut child_segs = segments.to_vec();
        child_segs.push(name_of(sub).to_string());
        emit_resource(sub, &child_segs, module_name, types, out);
    }
}

fn emit_method(method: &Value, module_name: &str, types: &HashMap<String, Value>) -> String {
    let op = plan_operation(method, types);
    let name = ruby_method_name(method.get("action").and_then(|a| a.as_str()).unwrap_or(""));
    let body_fields = body_field_list(method, types);

    // Signature: positional path params, then keyword args (query, header, body).
    let positional: Vec<String> = op
        .path_params
        .iter()
        .map(|p| snake_case(param_name(p)))
        .collect();
    let mut kwargs: Vec<String> = Vec::new();
    for p in op.query_params.iter().chain(op.header_params.iter()) {
        kwargs.push(kw_arg(param_name(p), param_required(p)));
    }
    for f in &body_fields {
        kwargs.push(kw_arg(field_name(f), field_required(f)));
    }
    let params: Vec<String> = positional.iter().chain(kwargs.iter()).cloned().collect();
    let signature = if params.is_empty() {
        format!("def {name}")
    } else {
        format!("def {name}({})", params.join(", "))
    };

    // Transport call keyword arguments.
    let http_method = method
        .get("httpMethod")
        .and_then(|h| h.as_str())
        .unwrap_or("");
    let path = method.get("path").and_then(|p| p.as_str()).unwrap_or("");
    let mut call_args = vec![
        format!("method: :{http_method}"),
        format!("path: {}", path_literal(path)),
    ];
    if !op.query_params.is_empty() {
        let entries: Vec<String> = op
            .query_params
            .iter()
            .map(|p| query_entry(p, module_name))
            .collect();
        call_args.push(format!("query: {{ {} }}", entries.join(", ")));
    }
    if !body_fields.is_empty() {
        let entries: Vec<String> = body_fields
            .iter()
            .map(|f| {
                format!(
                    "{} => {}",
                    rb_string(field_name(f)),
                    snake_case(field_name(f))
                )
            })
            .collect();
        call_args.push(format!("body: {{ {} }}", entries.join(", ")));
    }
    let mut header_entries: Vec<String> = op.header_params.iter().map(wire_entry).collect();
    if let Some(bct) = &op.binary_content_type {
        header_entries.insert(0, format!("\"Accept\" => {}", rb_string(bct)));
    }
    if !header_entries.is_empty() {
        call_args.push(format!("headers: {{ {} }}", header_entries.join(", ")));
    }
    let encoding = op.encoding.unwrap_or("json");
    if op.has_body && encoding != "json" {
        call_args.push(format!("encoding: {}", rb_string(encoding)));
    }
    if op.binary_content_type.is_some() {
        call_args.push("raw: true".to_string());
    }
    if op.inject_idempotency_key {
        call_args.push("idempotency: true".to_string());
    }

    let call = format!("@transport.request(\n{}\n)", indent(&call_args.join(",\n")));

    let mut body_lines = path_param_guards(&op.path_params);
    body_lines.extend(response_lines(method, &op, module_name, types, &call));

    let doc = method_doc(method, &op, &body_fields);
    let head = if doc.is_empty() {
        String::new()
    } else {
        format!("{doc}\n")
    };
    format!("{head}{}", block(&signature, &body_lines.join("\n")))
}

fn kw_arg(wire: &str, required: bool) -> String {
    let local = snake_case(wire);
    if required {
        format!("{local}:")
    } else {
        format!("{local}: nil")
    }
}

fn wire_entry(p: &Value) -> String {
    let wire = p
        .get("wireName")
        .and_then(|w| w.as_str())
        .unwrap_or_else(|| param_name(p));
    format!("{} => {}", rb_string(wire), snake_case(param_name(p)))
}

fn query_entry(p: &Value, module_name: &str) -> String {
    let key = rb_string(
        p.get("wireName")
            .and_then(|w| w.as_str())
            .unwrap_or_else(|| param_name(p)),
    );
    let local = snake_case(param_name(p));
    let is_array = p
        .get("type")
        .and_then(|t| t.get("kind"))
        .and_then(|k| k.as_str())
        == Some("array");
    let explode_false = p.get("explode").and_then(|e| e.as_bool()) == Some(false);
    if is_array && explode_false {
        format!("{key} => {module_name}.join_csv({local})")
    } else {
        format!("{key} => {local}")
    }
}

fn path_param_guards(path_params: &[Value]) -> Vec<String> {
    let mut lines = Vec::new();
    for p in path_params {
        let is_string_scalar = p
            .get("type")
            .and_then(|t| t.get("kind"))
            .and_then(|k| k.as_str())
            == Some("scalar")
            && p.get("type")
                .and_then(|t| t.get("scalar"))
                .and_then(|s| s.as_str())
                == Some("string");
        let required = p.get("required").and_then(|r| r.as_bool()) != Some(false);
        if !is_string_scalar || !required {
            continue;
        }
        let local = snake_case(param_name(p));
        lines.push(format!(
            "raise ArgumentError, \"Expected a non-empty value for `{local}`\" if {local}.nil? || {local}.to_s.empty?"
        ));
        lines.push(String::new());
    }
    lines
}

fn response_lines(
    method: &Value,
    op: &OperationPlan,
    module_name: &str,
    types: &HashMap<String, Value>,
    call: &str,
) -> Vec<String> {
    if op.binary_content_type.is_some() {
        return vec![call.to_string()];
    }
    if op.page_name.is_some() {
        let pagination = method.get("pagination");
        let items_field = pagination
            .and_then(|p| p.get("itemsField"))
            .and_then(|f| f.as_str())
            .unwrap_or("data");
        let next_field = pagination
            .and_then(|p| p.get("nextField"))
            .and_then(|f| f.as_str())
            .unwrap_or("has_more");
        return vec![
            format!("response = {call}"),
            format!(
                "{module_name}::Page.new(data: (response || {{}})[:{}], has_more: (response || {{}})[:{}])",
                snake_case(items_field),
                snake_case(next_field)
            ),
        ];
    }
    if op.primary_response == PrimaryResponse::UnionMapped {
        if let Some(ref_) = method.get("primaryResponse") {
            if ref_.get("kind").and_then(|k| k.as_str()) == Some("ref") {
                if let Some(rname) = ref_.get("name").and_then(|n| n.as_str()) {
                    if let Some(named) = types.get(rname) {
                        if union_mapping(named).is_some() {
                            return vec![
                                format!("response = {call}"),
                                format!(
                                    "{}.decode(response)",
                                    union_decoder_ref(module_name, named)
                                ),
                            ];
                        }
                    }
                }
            }
        }
    }
    vec![call.to_string()]
}

fn body_field_list(method: &Value, types: &HashMap<String, Value>) -> Vec<Value> {
    let ref_ = method.get("requestBody").and_then(|rb| rb.get("type"));
    if let Some(r) = ref_ {
        if r.get("kind").and_then(|k| k.as_str()) == Some("ref") {
            if let Some(name) = r.get("name").and_then(|n| n.as_str()) {
                if let Some(named) = types.get(name) {
                    if let Some(fields) = named.get("fields").and_then(|f| f.as_array()) {
                        return fields.clone();
                    }
                }
            }
        }
    }
    Vec::new()
}

fn path_literal(path: &str) -> String {
    let trimmed = if path.starts_with('/') {
        path.to_string()
    } else {
        format!("/{path}")
    };
    if !trimmed.contains('{') {
        return rb_string(&trimmed);
    }
    // replace {name} -> #{snake_case(name)}
    let mut out = String::with_capacity(trimmed.len());
    let bytes = trimmed.as_bytes();
    let mut i = 0;
    while i < bytes.len() {
        if bytes[i] == b'{' {
            if let Some(close) = trimmed[i..].find('}') {
                let name = &trimmed[i + 1..i + close];
                out.push_str(&format!("#{{{}}}", snake_case(name)));
                i += close + 1;
                continue;
            }
        }
        out.push(bytes[i] as char);
        i += 1;
    }
    format!("\"{out}\"")
}

fn method_doc(method: &Value, op: &OperationPlan, body_fields: &[Value]) -> String {
    let mut lines: Vec<String> = Vec::new();
    if let Some(d) = method
        .get("description")
        .and_then(|d| d.as_str())
        .filter(|d| !d.trim().is_empty())
    {
        lines.push(d.trim().to_string());
        lines.push(String::new());
    }
    for p in &op.path_params {
        lines.push(format!(
            "@param {} [{}]",
            snake_case(param_name(p)),
            rb_doc_type(p.get("type"))
        ));
    }
    for p in op.query_params.iter().chain(op.header_params.iter()) {
        lines.push(format!(
            "@param {} [{}]",
            snake_case(param_name(p)),
            rb_doc_type(p.get("type"))
        ));
    }
    for f in body_fields {
        lines.push(format!(
            "@param {} [{}]",
            snake_case(field_name(f)),
            rb_doc_type(f.get("type"))
        ));
    }
    lines.push(format!("@return [{}]", return_doc(method, op)));
    rb_comment(&lines.join("\n"))
}

fn return_doc(method: &Value, op: &OperationPlan) -> String {
    if op.binary_content_type.is_some() {
        return "String".to_string();
    }
    if op.page_name.is_some() {
        let item_type = method.get("pagination").and_then(|p| p.get("itemType"));
        return format!("Page<{}>", rb_doc_type(item_type));
    }
    match method.get("primaryResponse") {
        None | Some(Value::Null) => "nil".to_string(),
        Some(pr) => rb_doc_type(Some(pr)),
    }
}

fn param_name(p: &Value) -> &str {
    p.get("name").and_then(|n| n.as_str()).unwrap_or("")
}
fn param_required(p: &Value) -> bool {
    p.get("required").and_then(|r| r.as_bool()).unwrap_or(false)
}
fn field_name(f: &Value) -> &str {
    f.get("name").and_then(|n| n.as_str()).unwrap_or("")
}
fn field_required(f: &Value) -> bool {
    f.get("required").and_then(|r| r.as_bool()).unwrap_or(false)
}
