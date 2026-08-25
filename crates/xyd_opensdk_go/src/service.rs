//! Per-resource service emitter (<resource>.go) — port of service.ts.

use serde_json::Value;

use crate::client::GoCtx;
use crate::gotype::{go_type, is_binary_ref, is_scalar_ref};
use crate::gowriter::{go_doc, go_field, go_file, go_struct, Imports};
use crate::model::{const_field_name, go_zero_literal, is_const_field, union_unmarshaler_name};
use crate::naming::{go_method_name, go_var, json_string, pascal_case, singular_pascal_case, slug};
use crate::plan::{plan_operation, OperationPlan, PageName, PrimaryResponse};

fn http_method_const(m: &str) -> String {
    match m {
        "get" => "http.MethodGet",
        "post" => "http.MethodPost",
        "put" => "http.MethodPut",
        "patch" => "http.MethodPatch",
        "delete" => "http.MethodDelete",
        "head" => "http.MethodHead",
        "options" => "http.MethodOptions",
        _ => return json_string(&m.to_uppercase()),
    }
    .to_string()
}

pub fn resource_qualifier(segments: &[String]) -> String {
    segments.iter().map(|s| singular_pascal_case(s)).collect()
}

pub fn service_type_name(segments: &[String]) -> String {
    format!("{}Service", resource_qualifier(segments))
}

fn arr<'a>(v: &'a Value, key: &str) -> Vec<&'a Value> {
    v.get(key)
        .and_then(|x| x.as_array())
        .map(|a| a.iter().collect())
        .unwrap_or_default()
}

fn s<'a>(v: &'a Value, key: &str) -> &'a str {
    v.get(key).and_then(|x| x.as_str()).unwrap_or("")
}

fn wire_name(p: &Value) -> String {
    p.get("wireName")
        .and_then(|w| w.as_str())
        .unwrap_or_else(|| s(p, "name"))
        .to_string()
}

pub fn render_service_file(resource: &Value, ctx: &GoCtx) -> (String, String) {
    let mut imports = Imports::new();
    let option_q = imports.add(&format!("{}/option", ctx.module_path), None);
    let mut decls: Vec<String> = Vec::new();
    let name = s(resource, "name").to_string();
    emit_service(
        resource,
        std::slice::from_ref(&name),
        ctx,
        &mut imports,
        &option_q,
        &mut decls,
    );
    let path = format!(
        "{}.go",
        if slug(&name).is_empty() {
            "service".to_string()
        } else {
            slug(&name)
        }
    );
    (path, go_file(&ctx.pkg, &imports, &decls))
}

#[allow(clippy::too_many_arguments)]
fn emit_service(
    resource: &Value,
    segments: &[String],
    ctx: &GoCtx,
    imports: &mut Imports,
    option_q: &str,
    decls: &mut Vec<String>,
) {
    let svc = service_type_name(segments);
    let subs = arr(resource, "resources");

    let mut struct_fields = vec![go_field(
        "Options",
        &format!("[]{option_q}.RequestOption"),
        None,
    )];
    for sub in &subs {
        let mut seg = segments.to_vec();
        seg.push(s(sub, "name").to_string());
        struct_fields.push(go_field(
            &pascal_case(s(sub, "name")),
            &service_type_name(&seg),
            None,
        ));
    }
    decls.push(go_struct(
        &svc,
        &struct_fields,
        &go_doc(
            resource.get("description").and_then(|d| d.as_str()),
            Some(&svc),
        ),
    ));

    let mut ctor_lines = vec![format!("\tr = {svc}{{}}"), "\tr.Options = opts".to_string()];
    for sub in &subs {
        let mut seg = segments.to_vec();
        seg.push(s(sub, "name").to_string());
        ctor_lines.push(format!(
            "\tr.{} = New{}(opts...)",
            pascal_case(s(sub, "name")),
            service_type_name(&seg)
        ));
    }
    decls.push(format!(
        "// New{svc} constructs a service that shares the client's request options.\nfunc New{svc}(opts ...{option_q}.RequestOption) (r {svc}) {{\n{}\n\treturn\n}}",
        ctor_lines.join("\n")
    ));

    let mut param_structs: Vec<String> = Vec::new();
    for method in arr(resource, "methods") {
        decls.push(emit_method(
            segments,
            method,
            ctx,
            imports,
            option_q,
            &mut param_structs,
        ));
    }
    decls.extend(param_structs);

    for sub in &subs {
        let mut seg = segments.to_vec();
        seg.push(s(sub, "name").to_string());
        emit_service(sub, &seg, ctx, imports, option_q, decls);
    }
}

struct ParamsPlan {
    arg_name: String,
    type_name: String,
    has_body: bool,
}

fn plan_params(
    segments: &[String],
    method_name: &str,
    has_body: bool,
    query_params: &[&Value],
    header_params: &[&Value],
) -> Option<ParamsPlan> {
    if !has_body && query_params.is_empty() && header_params.is_empty() {
        return None;
    }
    let type_name = format!("{}{method_name}Params", resource_qualifier(segments));
    let arg_name = if has_body {
        if query_params.len() + header_params.len() > 0 {
            "params"
        } else {
            "body"
        }
    } else if !query_params.is_empty() {
        "query"
    } else {
        "params"
    }
    .to_string();
    Some(ParamsPlan {
        arg_name,
        type_name,
        has_body,
    })
}

fn behavior_str<'a>(b: &'a Value, path: &[&str]) -> &'a str {
    let mut cur = b;
    for k in path {
        cur = match cur.get(k) {
            Some(v) => v,
            None => return "",
        };
    }
    cur.as_str().unwrap_or("")
}

pub(crate) fn method_injects_idempotency(method: &Value, behavior: &Value) -> bool {
    if !method
        .get("injectIdempotencyKey")
        .and_then(|v| v.as_bool())
        .unwrap_or(false)
    {
        return false;
    }
    let m = s(method, "httpMethod");
    if !matches!(m, "post" | "put" | "patch") {
        return false;
    }
    let auto = behavior
        .get("idempotency")
        .and_then(|i| i.get("autoGenerateForPost"))
        .and_then(|v| v.as_bool())
        .unwrap_or(false);
    let retries = behavior
        .get("retry")
        .and_then(|r| r.get("maxRetries"))
        .and_then(|v| v.as_i64())
        .unwrap_or(0);
    auto && retries > 0
}

#[allow(clippy::too_many_arguments)]
fn emit_method(
    segments: &[String],
    method: &Value,
    ctx: &GoCtx,
    imports: &mut Imports,
    option_q: &str,
    param_structs: &mut Vec<String>,
) -> String {
    imports.add("context", None);
    let reqconfig_q = imports.add(&format!("{}/internal/requestconfig", ctx.module_path), None);

    let op = plan_operation(method, ctx.types);
    let name = go_method_name(s(method, "action"));
    let path_params = arr(method, "pathParams");
    let query_params = arr(method, "queryParams");
    let header_params = arr(method, "headerParams");
    let has_body = op.has_body;
    let encoding = op.encoding.clone().unwrap_or_else(|| "json".to_string());
    let raw_content_type = op.binary_content_type.clone();

    let plan = plan_params(segments, &name, has_body, &query_params, &header_params);
    if let Some(p) = &plan {
        param_structs.push(render_params_struct(p, method, &encoding, ctx, imports));
    }

    // signature
    let mut args = vec!["ctx context.Context".to_string()];
    for p in &path_params {
        args.push(format!(
            "{} {}",
            go_var(s(p, "name")),
            go_type(p.get("type"))
        ));
    }
    if let Some(p) = &plan {
        args.push(format!("{} {}", p.arg_name, p.type_name));
    }
    args.push(format!("opts ...{option_q}.RequestOption"));

    imports.add("net/http", None);
    let http_const = http_method_const(s(method, "httpMethod"));

    let mut lines: Vec<String> = vec!["\topts = append(r.Options[:], opts...)".to_string()];
    if let Some(rct) = &raw_content_type {
        lines.push(format!(
            "\topts = append([]{option_q}.RequestOption{{{option_q}.WithHeader(\"Accept\", {})}}, opts...)",
            json_string(rct)
        ));
    }
    for p in &path_params {
        if go_type(p.get("type")) != "string" {
            continue;
        }
        imports.add("errors", None);
        lines.push(format!(
            "\tif {} == \"\" {{\n\t\terr = errors.New({})\n\t\treturn\n\t}}",
            go_var(s(p, "name")),
            json_string(&format!("missing required {} parameter", s(p, "name")))
        ));
    }
    if let Some(p) = &plan {
        for h in &header_params {
            let required = h.get("required").and_then(|v| v.as_bool()).unwrap_or(false);
            if !required || go_type(h.get("type")) != "string" {
                continue;
            }
            imports.add("errors", None);
            lines.push(format!(
                "\tif {}.{} == \"\" {{\n\t\terr = errors.New({})\n\t\treturn\n\t}}",
                p.arg_name,
                pascal_case(s(h, "name")),
                json_string(&format!("missing required {} parameter", wire_name(h)))
            ));
        }
    }
    let path_expr = path_expression(s(method, "path"), &path_params, imports);
    let body_arg = if plan.as_ref().map(|p| p.has_body).unwrap_or(false) {
        plan.as_ref().unwrap().arg_name.clone()
    } else {
        "nil".to_string()
    };
    lines.push(format!(
        "\tcfg, err := {reqconfig_q}.NewRequestConfig(ctx, {http_const}, {path_expr}, {body_arg}, opts...)"
    ));
    lines.push("\tif err != nil {\n\t\treturn\n\t}".to_string());

    if method_injects_idempotency(method, &ctx.behavior) {
        let header_name = json_string(behavior_str(&ctx.behavior, &["idempotency", "headerName"]));
        lines.push(format!(
            "\tif cfg.Header.Get({header_name}) == \"\" {{\n\t\tcfg.Header.Set({header_name}, {reqconfig_q}.NewIdempotencyKey())\n\t}}"
        ));
    }

    if plan.as_ref().map(|p| p.has_body).unwrap_or(false) && encoding != "json" {
        lines.push(format!("\tcfg.Encoding = {}", json_string(&encoding)));
    }

    if let Some(p) = &plan {
        for h in &header_params {
            lines.push(header_param_lines(&p.arg_name, h, imports));
        }
        for q in &query_params {
            lines.push(query_param_lines(&p.arg_name, q, ctx, imports));
        }
    }

    let page_type = pagination_page_type(method, op.page_name, ctx, imports);
    lines.extend(response_lines(method, &op, ctx, &page_type, imports));

    let doc = go_doc(
        method.get("description").and_then(|d| d.as_str()),
        Some(&format!(
            "{name} {} {}",
            s(method, "httpMethod").to_uppercase(),
            s(method, "path")
        )),
    );
    let head = if doc.is_empty() {
        String::new()
    } else {
        format!("{doc}\n")
    };
    format!(
        "{head}func (r *{}) {name}({}) {} {{\n{}\n\treturn\n}}",
        service_type_name(segments),
        args.join(", "),
        return_signature(method, &op, &page_type),
        lines.join("\n")
    )
}

fn page_state_key(method: &Value, page: Option<PageName>) -> Option<String> {
    let pagination = method.get("pagination")?;
    let page = page?;
    let param_name = match page {
        PageName::Cursor => pagination.get("cursorParam").and_then(|p| p.as_str()),
        PageName::Offset => pagination.get("offsetParam").and_then(|p| p.as_str()),
        _ => None,
    }?;
    let qp = method.get("queryParams").and_then(|q| q.as_array());
    let found = qp.and_then(|arr| arr.iter().find(|q| s(q, "name") == param_name));
    Some(
        found
            .map(wire_name)
            .unwrap_or_else(|| param_name.to_string()),
    )
}

fn pagination_page_type(
    method: &Value,
    page: Option<PageName>,
    ctx: &GoCtx,
    imports: &mut Imports,
) -> Option<String> {
    let page = page?;
    let pagination_q = imports.add(&format!("{}/packages/pagination", ctx.module_path), None);
    Some(format!(
        "{pagination_q}.{}[{}]",
        page.as_str(),
        go_type(method.get("pagination").and_then(|p| p.get("itemType")))
    ))
}

#[derive(PartialEq)]
pub(crate) enum QueryKind {
    Scalar,
    Array,
    Map,
    Object,
}

pub(crate) fn query_kind(
    ref_: Option<&Value>,
    types: &serde_json::Map<String, Value>,
) -> QueryKind {
    let Some(r) = ref_ else {
        return QueryKind::Scalar;
    };
    match r.get("kind").and_then(|k| k.as_str()) {
        Some("scalar") => QueryKind::Scalar,
        Some("array") => QueryKind::Array,
        Some("map") => QueryKind::Map,
        Some("ref") => {
            if let Some(name) = r.get("name").and_then(|n| n.as_str()) {
                match types
                    .get(name)
                    .and_then(|n| n.get("kind"))
                    .and_then(|k| k.as_str())
                {
                    Some("enum") => QueryKind::Scalar,
                    Some("alias") => query_kind(types.get(name).and_then(|n| n.get("of")), types),
                    _ => QueryKind::Object,
                }
            } else {
                QueryKind::Object
            }
        }
        _ => QueryKind::Object,
    }
}

fn render_params_struct(
    plan: &ParamsPlan,
    method: &Value,
    encoding: &str,
    ctx: &GoCtx,
    imports: &mut Imports,
) -> String {
    let mut fields: Vec<String> = Vec::new();
    if plan.has_body {
        for f in body_fields(method, ctx) {
            fields.push(body_field_line(&f, encoding, ctx, imports));
        }
    }
    for q in arr(method, "queryParams") {
        fields.push(query_field_line(q, ctx, imports));
    }
    for h in arr(method, "headerParams") {
        fields.push(header_field_line(h, ctx, imports));
    }

    let struct_ = go_struct(&plan.type_name, &fields, "");
    if !plan.has_body || encoding != "json" {
        return struct_;
    }
    let apijson_q = imports.add(&format!("{}/packages/apijson", ctx.module_path), None);
    let fills = const_fill_lines(method, ctx);
    let marshal_doc = if !fills.is_empty() {
        "// MarshalJSON auto-fills const-valued fields left at their zero value.\n".to_string()
    } else {
        String::new()
    };
    let marshal = format!(
        "{marshal_doc}func (r {}) MarshalJSON() ([]byte, error) {{\n{}{}\treturn {apijson_q}.MarshalRoot(r)\n}}",
        plan.type_name,
        fills.join("\n"),
        if fills.is_empty() { "" } else { "\n" }
    );
    format!("{struct_}\n\n{marshal}")
}

fn const_fill_lines(method: &Value, ctx: &GoCtx) -> Vec<String> {
    let ref_ = method.get("requestBody").and_then(|rb| rb.get("type"));
    let Some(ref_) = ref_ else { return vec![] };
    if ref_.get("kind").and_then(|k| k.as_str()) != Some("ref") {
        return vec![];
    }
    let Some(name) = ref_.get("name").and_then(|n| n.as_str()) else {
        return vec![];
    };
    let Some(named) = ctx.types.get(name) else {
        return vec![];
    };
    let Some(fields) = named.get("fields").and_then(|f| f.as_array()) else {
        return vec![];
    };
    let mut lines = Vec::new();
    for f in fields {
        if !is_const_field(f) {
            continue;
        }
        let field_name = pascal_case(s(f, "name"));
        let zero = go_zero_literal(&go_type(f.get("type")));
        lines.push(format!(
            "\tif r.{field_name} == {zero} {{\n\t\tr.{field_name} = {}\n\t}}",
            const_field_name(s(named, "name"), s(f, "name"))
        ));
    }
    lines
}

pub(crate) fn query_field_line(q: &Value, ctx: &GoCtx, imports: &mut Imports) -> String {
    let tag = format!("json:\"-\" query:{}", json_string(&wire_name(q)));
    let field_name = pascal_case(s(q, "name"));
    let kind = query_kind(q.get("type"), ctx.types);
    let base = go_type(q.get("type"));
    let required = q.get("required").and_then(|v| v.as_bool()).unwrap_or(false);
    if kind == QueryKind::Array || kind == QueryKind::Map {
        return go_field(&field_name, &base, Some(&tag));
    }
    if kind == QueryKind::Object {
        let ty = if required || base == "any" {
            base
        } else {
            format!("*{base}")
        };
        return go_field(&field_name, &ty, Some(&tag));
    }
    if required {
        return go_field(&field_name, &base, Some(&tag));
    }
    let param_q = imports.add(&format!("{}/packages/param", ctx.module_path), None);
    go_field(&field_name, &format!("{param_q}.Opt[{base}]"), Some(&tag))
}

fn header_field_line(h: &Value, ctx: &GoCtx, imports: &mut Imports) -> String {
    let tag = format!("json:\"-\" header:{}", json_string(&wire_name(h)));
    let field_name = pascal_case(s(h, "name"));
    if h.get("required").and_then(|v| v.as_bool()).unwrap_or(false) {
        return go_field(&field_name, &go_type(h.get("type")), Some(&tag));
    }
    let param_q = imports.add(&format!("{}/packages/param", ctx.module_path), None);
    go_field(
        &field_name,
        &format!("{param_q}.Opt[{}]", go_type(h.get("type"))),
        Some(&tag),
    )
}

fn header_param_lines(arg_name: &str, h: &Value, imports: &mut Imports) -> String {
    let field_name = pascal_case(s(h, "name"));
    let wire = json_string(&wire_name(h));
    if h.get("required").and_then(|v| v.as_bool()).unwrap_or(false) {
        if go_type(h.get("type")) == "string" {
            return format!("\tcfg.Header.Set({wire}, {arg_name}.{field_name})");
        }
        imports.add("fmt", None);
        return format!("\tcfg.Header.Set({wire}, fmt.Sprintf(\"%v\", {arg_name}.{field_name}))");
    }
    imports.add("fmt", None);
    format!(
        "\tif {arg_name}.{field_name}.IsPresent() {{\n\t\tcfg.Header.Set({wire}, fmt.Sprintf(\"%v\", {arg_name}.{field_name}.Value()))\n\t}}"
    )
}

fn query_param_lines(arg_name: &str, q: &Value, ctx: &GoCtx, imports: &mut Imports) -> String {
    let field_name = pascal_case(s(q, "name"));
    let field = format!("{arg_name}.{field_name}");
    let key = wire_name(q);
    let wire = json_string(&key);
    let kind = query_kind(q.get("type"), ctx.types);
    let deep_object = q.get("style").and_then(|s| s.as_str()) == Some("deepObject");
    let required = q.get("required").and_then(|v| v.as_bool()).unwrap_or(false);
    let explode_false = q.get("explode").and_then(|v| v.as_bool()) == Some(false);

    match kind {
        QueryKind::Array => {
            imports.add("fmt", None);
            if explode_false {
                imports.add("strings", None);
                let joined = format!("{}Values", go_var(s(q, "name")));
                format!(
                    "\tif len({field}) > 0 {{\n\t\t{joined} := make([]string, 0, len({field}))\n\t\tfor _, value := range {field} {{\n\t\t\t{joined} = append({joined}, fmt.Sprintf(\"%v\", value))\n\t\t}}\n\t\tcfg.Query.Set({wire}, strings.Join({joined}, \",\"))\n\t}}"
                )
            } else {
                format!("\tfor _, value := range {field} {{\n\t\tcfg.Query.Add({wire}, fmt.Sprintf(\"%v\", value))\n\t}}")
            }
        }
        QueryKind::Map => {
            imports.add("fmt", None);
            if deep_object {
                let sub_key = json_string(&format!("{key}[%v]"));
                format!(
                    "\tfor mapKey, mapValue := range {field} {{\n\t\tcfg.Query.Set(fmt.Sprintf({sub_key}, mapKey), fmt.Sprintf(\"%v\", mapValue))\n\t}}"
                )
            } else {
                imports.add("encoding/json", None);
                format!(
                    "\tif len({field}) > 0 {{\n\t\traw, jsonErr := json.Marshal({field})\n\t\tif jsonErr != nil {{\n\t\t\terr = jsonErr\n\t\t\treturn\n\t\t}}\n\t\tcfg.Query.Set({wire}, string(raw))\n\t}}"
                )
            }
        }
        QueryKind::Object => {
            imports.add("encoding/json", None);
            let open = if required && go_type(q.get("type")) != "any" {
                "\t{\n".to_string()
            } else {
                format!("\tif {field} != nil {{\n")
            };
            if deep_object {
                imports.add("fmt", None);
                let sub_key = json_string(&format!("{key}[%v]"));
                format!(
                    "{open}\t\traw, jsonErr := json.Marshal({field})\n\t\tif jsonErr != nil {{\n\t\t\terr = jsonErr\n\t\t\treturn\n\t\t}}\n\t\tvar pairs map[string]any\n\t\tif jsonErr := json.Unmarshal(raw, &pairs); jsonErr != nil {{\n\t\t\terr = jsonErr\n\t\t\treturn\n\t\t}}\n\t\tfor mapKey, mapValue := range pairs {{\n\t\t\tcfg.Query.Set(fmt.Sprintf({sub_key}, mapKey), fmt.Sprintf(\"%v\", mapValue))\n\t\t}}\n\t}}"
                )
            } else {
                format!(
                    "{open}\t\traw, jsonErr := json.Marshal({field})\n\t\tif jsonErr != nil {{\n\t\t\terr = jsonErr\n\t\t\treturn\n\t\t}}\n\t\tcfg.Query.Set({wire}, string(raw))\n\t}}"
                )
            }
        }
        QueryKind::Scalar => {
            imports.add("fmt", None);
            if required {
                format!("\tcfg.Query.Set({wire}, fmt.Sprintf(\"%v\", {field}))")
            } else {
                format!(
                    "\tif {field}.IsPresent() {{\n\t\tcfg.Query.Set({wire}, fmt.Sprintf(\"%v\", {field}.Value()))\n\t}}"
                )
            }
        }
    }
}

fn body_fields(method: &Value, ctx: &GoCtx) -> Vec<Value> {
    let ref_ = method.get("requestBody").and_then(|rb| rb.get("type"));
    if let Some(ref_) = ref_ {
        if ref_.get("kind").and_then(|k| k.as_str()) == Some("ref") {
            if let Some(name) = ref_.get("name").and_then(|n| n.as_str()) {
                if let Some(fields) = ctx
                    .types
                    .get(name)
                    .and_then(|n| n.get("fields"))
                    .and_then(|f| f.as_array())
                {
                    return fields.clone();
                }
            }
        }
    }
    vec![]
}

fn body_field_line(field: &Value, encoding: &str, ctx: &GoCtx, imports: &mut Imports) -> String {
    let go_name = pascal_case(s(field, "name"));
    let required = field
        .get("required")
        .and_then(|v| v.as_bool())
        .unwrap_or(false);
    let tag = format!(
        "json:{}",
        json_string(&format!(
            "{}{}",
            s(field, "name"),
            if required { ",required" } else { ",omitempty" }
        ))
    );
    if encoding == "multipart" && is_binary_ref(field.get("type")) {
        imports.add("io", None);
        return go_field(&go_name, "io.Reader", Some(&tag));
    }
    if is_const_field(field) {
        return go_field(&go_name, &go_type(field.get("type")), Some(&tag));
    }
    if !required && is_scalar_ref(field.get("type")) {
        let param_q = imports.add(&format!("{}/packages/param", ctx.module_path), None);
        return go_field(
            &go_name,
            &format!("{param_q}.Opt[{}]", go_type(field.get("type"))),
            Some(&tag),
        );
    }
    go_field(&go_name, &go_type(field.get("type")), Some(&tag))
}

fn path_expression(path: &str, path_params: &[&Value], imports: &mut Imports) -> String {
    let trimmed = path.strip_prefix('/').unwrap_or(path);
    if !trimmed.contains('{') {
        return json_string(trimmed);
    }
    imports.add("fmt", None);
    let args: Vec<String> = path_params.iter().map(|p| go_var(s(p, "name"))).collect();
    let mut i = 0usize;
    // replace /\{[^}]+\}/g with %v
    let mut template = String::with_capacity(trimmed.len());
    let bytes = trimmed.as_bytes();
    let mut j = 0;
    while j < bytes.len() {
        if bytes[j] == b'{' {
            if let Some(close) = trimmed[j..].find('}') {
                template.push_str("%v");
                i += 1;
                j += close + 1;
                continue;
            }
        }
        let ch_len = utf8_len(bytes[j]);
        template.push_str(&trimmed[j..j + ch_len]);
        j += ch_len;
    }
    let used = &args[..i.min(args.len())];
    format!(
        "fmt.Sprintf({}, {})",
        json_string(&template),
        used.join(", ")
    )
}

fn utf8_len(b: u8) -> usize {
    if b < 0x80 {
        1
    } else if b >> 5 == 0b110 {
        2
    } else if b >> 4 == 0b1110 {
        3
    } else {
        4
    }
}

fn return_signature(method: &Value, op: &OperationPlan, page_type: &Option<String>) -> String {
    if op.binary_content_type.is_some() {
        return "(res *http.Response, err error)".to_string();
    }
    if let Some(pt) = page_type {
        return format!("(res *{pt}, err error)");
    }
    let ref_ = method.get("primaryResponse");
    if ref_.is_none() || op.primary_response == PrimaryResponse::None {
        return "(err error)".to_string();
    }
    if op.primary_response == PrimaryResponse::Struct {
        return format!("(res *{}, err error)", go_type(ref_));
    }
    format!("(res {}, err error)", go_type(ref_))
}

fn response_lines(
    method: &Value,
    op: &OperationPlan,
    ctx: &GoCtx,
    page_type: &Option<String>,
    imports: &mut Imports,
) -> Vec<String> {
    if op.binary_content_type.is_some() {
        return vec!["\tres, err = cfg.ExecuteRaw()".to_string()];
    }
    if let Some(pt) = page_type {
        let mut lines = vec![
            format!("\tres = &{pt}{{}}"),
            "\terr = cfg.Execute(res)".to_string(),
        ];
        if let Some(state_key) = page_state_key(method, op.page_name) {
            lines.push("\tif err != nil {\n\t\treturn\n\t}".to_string());
            lines.push(format!(
                "\tres.SetPageConfig(cfg, {})",
                json_string(&state_key)
            ));
        }
        return lines;
    }
    let ref_ = method.get("primaryResponse");
    if ref_.is_none() || op.primary_response == PrimaryResponse::None {
        return vec!["\terr = cfg.Execute(nil)".to_string()];
    }
    if op.primary_response == PrimaryResponse::UnionMapped {
        if let Some(r) = ref_ {
            if r.get("kind").and_then(|k| k.as_str()) == Some("ref") {
                if let Some(name) = r.get("name").and_then(|n| n.as_str()) {
                    if let Some(union) = ctx.types.get(name) {
                        imports.add("encoding/json", None);
                        return vec![
                            "\tvar raw json.RawMessage".to_string(),
                            "\terr = cfg.Execute(&raw)".to_string(),
                            "\tif err != nil {\n\t\treturn\n\t}".to_string(),
                            format!(
                                "\tif len(raw) > 0 {{\n\t\tres, err = {}(raw)\n\t}}",
                                union_unmarshaler_name(union)
                            ),
                        ];
                    }
                }
            }
        }
    }
    if op.primary_response == PrimaryResponse::Struct {
        return vec![
            format!("\tres = &{}{{}}", go_type(ref_)),
            "\terr = cfg.Execute(res)".to_string(),
        ];
    }
    vec!["\terr = cfg.Execute(&res)".to_string()]
}
