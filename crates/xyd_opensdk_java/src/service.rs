//! service.ts — one .java per resource service + one <Qualifier><Method>Params
//! builder per method carrying body/query/header input.

use serde_json::Value;
use std::collections::HashSet;

use crate::ir::{arr_field, bool_field, str_field, Types};
use crate::javatype::{
    const_literal, is_binary_type_ref, is_const_field, java_decode, java_type, query_kind,
    QueryKind,
};
use crate::javawriter::{java_doc, java_file};
use crate::jsrt::{
    camel_case, java_method_name, json_str, pascal_case, resource_qualifier, service_type_name,
};
use crate::model::GenFile;
use crate::plan::{plan_operation, OperationPlan, PrimaryKind};
use crate::project::JavaCtx;

pub fn render_resource_files(resources: &[Value], ctx: &JavaCtx) -> Vec<GenFile> {
    let mut files = Vec::new();
    for r in resources {
        walk(
            r,
            &[str_field(r, "name").unwrap_or("").to_string()],
            ctx,
            &mut files,
        );
    }
    files
}

fn walk(resource: &Value, segments: &[String], ctx: &JavaCtx, files: &mut Vec<GenFile>) {
    files.push(service_file(resource, segments, ctx));
    for method in arr_field(resource, "methods") {
        if let Some(pf) = params_file(resource, segments, method, ctx) {
            files.push(pf);
        }
    }
    for sub in arr_field(resource, "resources") {
        let mut seg = segments.to_vec();
        seg.push(str_field(sub, "name").unwrap_or("").to_string());
        walk(sub, &seg, ctx, files);
    }
}

fn request_body_fields<'a>(method: &'a Value, types: &'a Types) -> Vec<&'a Value> {
    let ref_ = method.get("requestBody").and_then(|rb| rb.get("type"));
    if let Some(r) = ref_ {
        if str_field(r, "kind") == Some("ref") {
            if let Some(name) = str_field(r, "name") {
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

pub(crate) fn method_encoding(method: &Value, plan: &OperationPlan, types: &Types) -> &'static str {
    let mut encoding = plan.encoding.unwrap_or("json");
    if encoding == "json"
        && request_body_fields(method, types)
            .iter()
            .any(|f| is_binary_type_ref(f.get("type"), types, &mut HashSet::new()))
    {
        encoding = "multipart";
    }
    encoding
}

struct ParamsPlan<'a> {
    class_name: String,
    body_fields: Vec<&'a Value>,
    query: Vec<&'a Value>,
    header: Vec<&'a Value>,
}

fn plan_params<'a>(
    segments: &[String],
    method: &'a Value,
    plan: &OperationPlan<'a>,
    ctx: &'a JavaCtx,
) -> Option<ParamsPlan<'a>> {
    let query = plan.query.clone();
    let header = plan.header.clone();
    let body_fields = request_body_fields(method, &ctx.types);
    if body_fields.is_empty() && query.is_empty() && header.is_empty() {
        return None;
    }
    let class_name = format!(
        "{}{}Params",
        resource_qualifier(segments),
        pascal_case(&java_method_name(str_field(method, "action").unwrap_or("")))
    );
    Some(ParamsPlan {
        class_name,
        body_fields,
        query,
        header,
    })
}

fn service_file(resource: &Value, segments: &[String], ctx: &JavaCtx) -> GenFile {
    let cls = service_type_name(segments);
    let subs = arr_field(resource, "resources");
    let mut imports: HashSet<String> = HashSet::new();

    let mut field_lines = vec!["  private final Transport transport;".to_string()];
    for sub in &subs {
        let sn = str_field(sub, "name").unwrap_or("").to_string();
        let mut seg = segments.to_vec();
        seg.push(sn.clone());
        field_lines.push(format!(
            "  private final {} {};",
            service_type_name(&seg),
            camel_case(&sn)
        ));
    }

    let mut ctor_lines = vec!["    this.transport = transport;".to_string()];
    for sub in &subs {
        let sn = str_field(sub, "name").unwrap_or("").to_string();
        let mut seg = segments.to_vec();
        seg.push(sn.clone());
        ctor_lines.push(format!(
            "    this.{} = new {}(transport);",
            camel_case(&sn),
            service_type_name(&seg)
        ));
    }
    let ctor = format!(
        "  {cls}(Transport transport) {{\n{}\n  }}",
        ctor_lines.join("\n")
    );

    let accessors: Vec<String> = subs
        .iter()
        .map(|sub| {
            let sn = str_field(sub, "name").unwrap_or("").to_string();
            let mut seg = segments.to_vec();
            seg.push(sn.clone());
            format!(
                "  public {} {}() {{\n    return {};\n  }}",
                service_type_name(&seg),
                camel_case(&sn),
                camel_case(&sn)
            )
        })
        .collect();

    let methods: Vec<String> = arr_field(resource, "methods")
        .iter()
        .map(|m| method_def(segments, m, ctx, &mut imports))
        .collect();

    let doc = java_doc(str_field(resource, "description"), "");
    let head = if doc.is_empty() {
        String::new()
    } else {
        format!("{doc}\n")
    };
    let mut members: Vec<String> = vec![field_lines.join("\n"), ctor];
    members.extend(accessors);
    members.extend(methods);
    let members = members
        .into_iter()
        .filter(|s| !s.is_empty())
        .collect::<Vec<_>>()
        .join("\n\n");
    let body = format!("{head}public final class {cls} {{\n{members}\n}}");

    let imports_vec: Vec<String> = imports.into_iter().collect();
    GenFile {
        path: format!("{}{cls}.java", ctx.src_dir),
        content: java_file(&ctx.full_package, &imports_vec, &body),
    }
}

fn method_def(
    segments: &[String],
    method: &Value,
    ctx: &JavaCtx,
    imports: &mut HashSet<String>,
) -> String {
    let plan = plan_operation(method, &ctx.types);
    let name = java_method_name(str_field(method, "action").unwrap_or(""));
    let path_params = &plan.path;
    let params = plan_params(segments, method, &plan, ctx);

    let mut args: Vec<String> = path_params
        .iter()
        .map(|p| {
            format!(
                "{} {}",
                java_type(p.get("type"), &ctx.types),
                camel_case(str_field(p, "name").unwrap_or(""))
            )
        })
        .collect();
    if let Some(pp) = &params {
        args.push(format!("{} params", pp.class_name));
    }

    let mut lines: Vec<String> = Vec::new();
    for p in path_params {
        let is_str = p.get("type").and_then(|t| str_field(t, "kind")) == Some("scalar")
            && p.get("type").and_then(|t| str_field(t, "scalar")) == Some("string");
        if !is_str {
            continue;
        }
        let n = camel_case(str_field(p, "name").unwrap_or(""));
        lines.push(format!(
            "    if ({n} == null || {n}.isEmpty()) {{\n      throw new IllegalArgumentException({});\n    }}",
            json_str(&format!("missing required {} parameter", str_field(p, "name").unwrap_or("")))
        ));
    }

    let http = str_field(method, "httpMethod").unwrap_or("").to_uppercase();
    lines.push(format!(
        "    Transport.Request request = new Transport.Request({}, {});",
        json_str(&http),
        path_expr(str_field(method, "path").unwrap_or(""), path_params)
    ));

    if let Some(bct) = &plan.binary_content_type {
        lines.push(format!("    request.accept({});", json_str(bct)));
    }

    if let Some(pp) = &params {
        if !pp.body_fields.is_empty() {
            imports.insert("java.util.LinkedHashMap".to_string());
            imports.insert("java.util.Map".to_string());
            lines.push("    Map<String, Object> body = new LinkedHashMap<>();".to_string());
            for f in &pp.body_fields {
                lines.push(body_put(f));
            }
            lines.push("    request.body(body);".to_string());
            let encoding = method_encoding(method, &plan, &ctx.types);
            if encoding != "json" {
                lines.push(format!("    request.encoding({});", json_str(encoding)));
            }
        }
        for q in &pp.query {
            lines.push(query_line(q, ctx, imports));
        }
        for h in &pp.header {
            lines.push(header_line(h));
        }
    }

    let ret = return_plan(method, &plan, ctx);
    lines.push(ret.1);

    let doc = java_doc(str_field(method, "description"), "  ");
    let head = if doc.is_empty() {
        String::new()
    } else {
        format!("{doc}\n")
    };
    format!(
        "{head}  public {} {name}({}) {{\n{}\n  }}",
        ret.0,
        args.join(", "),
        lines.join("\n")
    )
}

fn body_put(field: &Value) -> String {
    let member = camel_case(str_field(field, "name").unwrap_or(""));
    let key = json_str(str_field(field, "name").unwrap_or(""));
    if is_const_field(field) {
        let cval = field
            .get("type")
            .and_then(|t| t.get("const"))
            .cloned()
            .unwrap_or(Value::Null);
        format!("    body.put({key}, {});", const_literal(&cval))
    } else if bool_field(field, "required") {
        format!("    body.put({key}, params.{member}());")
    } else {
        format!("    params.{member}().ifPresent(value -> body.put({key}, value));")
    }
}

fn query_line(q: &Value, ctx: &JavaCtx, imports: &mut HashSet<String>) -> String {
    let member = camel_case(str_field(q, "name").unwrap_or(""));
    let key = str_field(q, "wireName").unwrap_or_else(|| str_field(q, "name").unwrap_or(""));
    let wire = json_str(key);
    let kind = query_kind(q.get("type"), &ctx.types);
    let deep_object = str_field(q, "style") == Some("deepObject");
    let required = bool_field(q, "required");
    let explode_false = q.get("explode") == Some(&Value::Bool(false));

    match kind {
        QueryKind::Array => {
            if explode_false {
                imports.insert("java.util.ArrayList".to_string());
                imports.insert("java.util.List".to_string());
                let join = |values: &str, indent: &str| {
                    format!(
                        "{indent}List<String> parts = new ArrayList<>();\n\
                         {indent}for (Object value : {values}) {{\n{indent}  parts.add(String.valueOf(value));\n{indent}}}\n\
                         {indent}request.query({wire}, String.join(\",\", parts));"
                    )
                };
                if required {
                    format!(
                        "    {{\n{}\n    }}",
                        join(&format!("params.{member}()"), "      ")
                    )
                } else {
                    format!(
                        "    params.{member}().ifPresent(values -> {{\n{}\n    }});",
                        join("values", "      ")
                    )
                }
            } else if required {
                format!("    for (Object value : params.{member}()) {{\n      request.query({wire}, String.valueOf(value));\n    }}")
            } else {
                format!(
                    "    params.{member}().ifPresent(values -> {{\n\
                     \x20     for (Object value : values) {{\n        request.query({wire}, String.valueOf(value));\n      }}\n\
                     \x20   }});"
                )
            }
        }
        QueryKind::Map => {
            if deep_object {
                let sub = json_str(&format!("{key}["));
                let for_each = format!("forEach((mapKey, mapValue) -> request.query({sub} + mapKey + \"]\", String.valueOf(mapValue)))");
                if required {
                    format!("    params.{member}().{for_each};")
                } else {
                    format!("    params.{member}().ifPresent(entries -> entries.{for_each});")
                }
            } else if required {
                format!("    request.query({wire}, Json.encode(params.{member}()));")
            } else {
                format!("    params.{member}().ifPresent(value -> request.query({wire}, Json.encode(value)));")
            }
        }
        QueryKind::Object => {
            if required {
                format!("    request.query({wire}, Json.encode(params.{member}()));")
            } else {
                format!("    params.{member}().ifPresent(value -> request.query({wire}, Json.encode(value)));")
            }
        }
        QueryKind::Scalar => {
            if required {
                format!("    request.query({wire}, String.valueOf(params.{member}()));")
            } else {
                format!("    params.{member}().ifPresent(value -> request.query({wire}, String.valueOf(value)));")
            }
        }
    }
}

fn header_line(h: &Value) -> String {
    let member = camel_case(str_field(h, "name").unwrap_or(""));
    let wire =
        json_str(str_field(h, "wireName").unwrap_or_else(|| str_field(h, "name").unwrap_or("")));
    if bool_field(h, "required") {
        format!("    request.header({wire}, String.valueOf(params.{member}()));")
    } else {
        format!("    params.{member}().ifPresent(value -> request.header({wire}, String.valueOf(value)));")
    }
}

fn return_plan(method: &Value, plan: &OperationPlan, ctx: &JavaCtx) -> (String, String) {
    if plan.binary_content_type.is_some() {
        return (
            "byte[]".to_string(),
            "    return transport.executeRaw(request);".to_string(),
        );
    }
    if let Some(page) = plan.page_name {
        let item_type = method.get("pagination").and_then(|p| p.get("itemType"));
        let item = java_type(item_type, &ctx.types);
        let decode = java_decode(item_type, "__e", &ctx.types, 1);
        return (
            format!("{page}<{item}>"),
            format!("    return {page}.fromJson(transport.execute(request), __e -> {decode});"),
        );
    }
    let primary = method.get("primaryResponse");
    if primary.is_none() || plan.primary_response == PrimaryKind::None {
        return (
            "void".to_string(),
            "    transport.execute(request);".to_string(),
        );
    }
    let ty = java_type(primary, &ctx.types);
    let decoded = java_decode(primary, "transport.execute(request)", &ctx.types, 0);
    (ty, format!("    return {decoded};"))
}

fn path_expr(path: &str, path_params: &[&Value]) -> String {
    let normalized = if path.starts_with('/') {
        path.to_string()
    } else {
        format!("/{path}")
    };
    if !normalized.contains('{') {
        return json_str(&normalized);
    }
    let by_name: std::collections::HashMap<&str, String> = path_params
        .iter()
        .map(|p| {
            (
                str_field(p, "name").unwrap_or(""),
                camel_case(str_field(p, "name").unwrap_or("")),
            )
        })
        .collect();
    let mut parts: Vec<String> = Vec::new();
    let bytes = normalized.as_bytes();
    let mut last = 0;
    let mut i = 0;
    while i < bytes.len() {
        if bytes[i] == b'{' {
            if let Some(close) = normalized[i..].find('}') {
                let end = i + close;
                let literal = &normalized[last..i];
                if !literal.is_empty() {
                    parts.push(json_str(literal));
                }
                let pname = &normalized[i + 1..end];
                let member = by_name
                    .get(pname)
                    .cloned()
                    .unwrap_or_else(|| camel_case(pname));
                parts.push(format!("Transport.encodePath({member})"));
                last = end + 1;
                i = end + 1;
                continue;
            }
        }
        i += 1;
    }
    let tail = &normalized[last..];
    if !tail.is_empty() {
        parts.push(json_str(tail));
    }
    parts.join(" + ")
}

fn params_file(
    resource: &Value,
    segments: &[String],
    method: &Value,
    ctx: &JavaCtx,
) -> Option<GenFile> {
    let plan = plan_operation(method, &ctx.types);
    let params = plan_params(segments, method, &plan, ctx)?;
    let _ = resource;

    struct Slot {
        member: String,
        ty: String,
        required: bool,
    }
    let mut slots: Vec<Slot> = Vec::new();
    for f in &params.body_fields {
        if is_const_field(f) {
            continue;
        }
        slots.push(Slot {
            member: camel_case(str_field(f, "name").unwrap_or("")),
            ty: java_type(f.get("type"), &ctx.types),
            required: bool_field(f, "required"),
        });
    }
    for p in params.query.iter().chain(params.header.iter()) {
        slots.push(Slot {
            member: camel_case(str_field(p, "name").unwrap_or("")),
            ty: java_type(p.get("type"), &ctx.types),
            required: bool_field(p, "required"),
        });
    }

    let mut imports: Vec<String> = Vec::new();
    if slots.iter().any(|s| !s.required) {
        imports.push("java.util.Optional".to_string());
    }
    if slots.iter().any(|s| s.ty.contains("List<")) {
        imports.push("java.util.List".to_string());
    }
    if slots.iter().any(|s| s.ty.contains("Map<")) {
        imports.push("java.util.Map".to_string());
    }

    let field_decls = slots
        .iter()
        .map(|s| format!("  private final {} {};", s.ty, s.member))
        .collect::<Vec<_>>()
        .join("\n");
    let ctor_assigns = slots
        .iter()
        .map(|s| format!("    this.{} = builder.{};", s.member, s.member))
        .collect::<Vec<_>>()
        .join("\n");
    let accessors = slots
        .iter()
        .map(|s| {
            if s.required {
                format!(
                    "  public {} {}() {{\n    return {};\n  }}",
                    s.ty, s.member, s.member
                )
            } else {
                format!(
                    "  public Optional<{}> {}() {{\n    return Optional.ofNullable({});\n  }}",
                    s.ty, s.member, s.member
                )
            }
        })
        .collect::<Vec<_>>()
        .join("\n\n");

    let builder_fields = slots
        .iter()
        .map(|s| format!("    private {} {};", s.ty, s.member))
        .collect::<Vec<_>>()
        .join("\n");
    let setters = slots
        .iter()
        .map(|s| {
            format!(
                "    public Builder {}({} {}) {{\n      this.{} = {};\n      return this;\n    }}",
                s.member, s.ty, s.member, s.member, s.member
            )
        })
        .collect::<Vec<_>>()
        .join("\n\n");
    let required_checks = slots
        .iter()
        .filter(|s| s.required)
        .map(|s| {
            format!(
                "      if ({} == null) {{\n        throw new IllegalStateException({});\n      }}",
                s.member,
                json_str(&format!("{} is required", s.member))
            )
        })
        .collect::<Vec<_>>()
        .join("\n");
    let build = format!(
        "    public {cn} build() {{\n{}      return new {cn}(this);\n    }}",
        if required_checks.is_empty() {
            String::new()
        } else {
            format!("{required_checks}\n")
        },
        cn = params.class_name,
    );
    let builder = format!(
        "  public static final class Builder {{\n{builder_fields}\n\n{setters}\n\n{build}\n  }}"
    );

    let action = java_method_name(str_field(method, "action").unwrap_or(""));
    let doc_text = match str_field(method, "description") {
        Some(d) if !d.is_empty() => format!("Parameters for {action}: {d}"),
        _ => String::new(),
    };
    let doc = java_doc(
        if doc_text.is_empty() {
            None
        } else {
            Some(doc_text.as_str())
        },
        "",
    );
    let head = if doc.is_empty() {
        String::new()
    } else {
        format!("{doc}\n")
    };
    let body = format!(
        "{head}public final class {cn} {{\n\
         {field_decls}\n\n\
         \x20 private {cn}(Builder builder) {{\n{ctor_assigns}\n  }}\n\n\
         \x20 public static Builder builder() {{\n    return new Builder();\n  }}\n\n\
         {accessors}\n\n\
         {builder}\n}}",
        cn = params.class_name,
    );
    Some(GenFile {
        path: format!("{}{}.java", ctx.src_dir, params.class_name),
        content: java_file(&ctx.full_package, &imports, &body),
    })
}
