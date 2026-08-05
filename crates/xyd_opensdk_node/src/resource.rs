//! `src/resources/<resource>.ts` + `src/resources/index.ts`. Ports `src/resource.ts`
//! (the generated-code slice; the Atlas type-reference view is out of fork scope).

use std::collections::BTreeSet;

use crate::ir::{Field, Method, NamedType, Param, Resource, TypeRef};
use crate::jsrt::{
    camel_case, js_doc, json_string, node_method_name, pascal_case, prop_key, singular_pascal_case,
    slug,
};
use crate::model::{body_fields, is_binary_type_ref, node_type, union_decode_name, ModelRefs};
use crate::plan::{plan_operation, OperationPlan, PrimaryResponseKind};

/// Per-file render context.
pub struct NodeCtx<'a> {
    pub types: Vec<&'a NamedType>,
    /// `behavior.idempotency.autoGenerateForPost` (default true).
    pub auto_generate_for_post: bool,
}

/// Per-file import trackers.
#[derive(Default)]
struct FileUses {
    refs: ModelRefs,
    decode_names: BTreeSet<String>,
    pages: BTreeSet<&'static str>,
    needs_join_csv: bool,
    has_nested: bool,
}

/// The globally-unique resource CLASS name, path-qualified by the full segment chain.
pub fn resource_class_name(segments: &[String]) -> String {
    segments.iter().map(|s| pascal_case(s)).collect()
}

fn params_qualifier(segments: &[String]) -> String {
    segments.iter().map(|s| singular_pascal_case(s)).collect()
}

/// The synthesized params-interface NAME (openai-node's `PetCreateParams` shape).
pub fn params_type_name(segments: &[String], action: &str) -> String {
    format!(
        "{}{}Params",
        params_qualifier(segments),
        pascal_case(action)
    )
}

/// Emit `src/resources/index.ts`: the barrel re-exporting every top-level resource file.
pub fn render_resources_index_file(resources: &[Resource]) -> String {
    let lines: Vec<String> = resources
        .iter()
        .map(|r| {
            let file = if slug(&r.name).is_empty() {
                "resource".to_string()
            } else {
                slug(&r.name)
            };
            format!("export * from './{file}';")
        })
        .collect();
    format!("{}\n", lines.join("\n"))
}

/// Emit one top-level resource (and its whole subtree) into a single file.
pub fn render_resource_file(resource: &Resource, ctx: &NodeCtx) -> (String, String) {
    let mut uses = FileUses::default();
    let mut classes: Vec<String> = Vec::new();
    let mut param_interfaces: Vec<String> = Vec::new();

    emit_tree(
        resource,
        std::slice::from_ref(&resource.name),
        ctx,
        &mut uses,
        &mut classes,
        &mut param_interfaces,
    );

    let mut core_imports = vec!["RequestOptions"];
    if uses.has_nested {
        core_imports.push("APIClient");
    }
    core_imports.sort_unstable();

    let mut lines = vec![
        "import { APIResource } from '../core/resource';".to_string(),
        format!(
            "import type {{ {} }} from '../core/request';",
            core_imports.join(", ")
        ),
    ];
    if uses.needs_join_csv {
        lines.push("import { joinCsv } from '../core/request';".to_string());
    }
    if !uses.pages.is_empty() {
        let names: Vec<&str> = ["CursorPage", "OffsetPage", "Page"]
            .into_iter()
            .filter(|n| uses.pages.contains(n))
            .collect();
        lines.push(format!(
            "import {{ {} }} from '../core/pagination';",
            names.join(", ")
        ));
    }
    let model_names: Vec<String> = uses.refs.iter().cloned().collect();
    if !model_names.is_empty() {
        lines.push(format!(
            "import type {{ {} }} from '../models';",
            model_names.join(", ")
        ));
    }
    if !uses.decode_names.is_empty() {
        let decodes: Vec<String> = uses.decode_names.iter().cloned().collect();
        lines.push(format!(
            "import {{ {} }} from '../models';",
            decodes.join(", ")
        ));
    }

    let mut blocks = vec![lines.join("\n")];
    blocks.extend(classes);
    blocks.extend(param_interfaces);
    let file = if slug(&resource.name).is_empty() {
        "resource".to_string()
    } else {
        slug(&resource.name)
    };
    (
        format!("src/resources/{file}.ts"),
        format!("{}\n", blocks.join("\n\n")),
    )
}

fn emit_tree(
    res: &Resource,
    segments: &[String],
    ctx: &NodeCtx,
    uses: &mut FileUses,
    classes: &mut Vec<String>,
    param_interfaces: &mut Vec<String>,
) {
    if !res.resources.is_empty() {
        uses.has_nested = true;
    }
    let cls = emit_class(res, segments, ctx, uses, param_interfaces);
    classes.push(cls);
    for sub in &res.resources {
        let mut seg = segments.to_vec();
        seg.push(sub.name.clone());
        emit_tree(sub, &seg, ctx, uses, classes, param_interfaces);
    }
}

fn emit_class(
    resource: &Resource,
    segments: &[String],
    ctx: &NodeCtx,
    uses: &mut FileUses,
    param_interfaces: &mut Vec<String>,
) -> String {
    let cls = resource_class_name(segments);
    let subs = &resource.resources;
    let mut members: Vec<String> = Vec::new();

    if !subs.is_empty() {
        for sub in subs {
            let mut seg = segments.to_vec();
            seg.push(sub.name.clone());
            members.push(format!(
                "  readonly {}: {};",
                camel_case(&sub.name),
                resource_class_name(&seg)
            ));
        }
        let mut ctor_lines = vec!["    super(client);".to_string()];
        for sub in subs {
            let mut seg = segments.to_vec();
            seg.push(sub.name.clone());
            ctor_lines.push(format!(
                "    this.{} = new {}(client);",
                camel_case(&sub.name),
                resource_class_name(&seg)
            ));
        }
        members.push(format!(
            "  constructor(client: APIClient) {{\n{}\n  }}",
            ctor_lines.join("\n")
        ));
    }

    for method in &resource.methods {
        members.push(emit_method(segments, method, ctx, uses, param_interfaces));
    }

    let doc = js_doc(resource.description.as_deref());
    let body = if members.is_empty() {
        String::new()
    } else {
        format!("\n{}\n", members.join("\n\n"))
    };
    format!("{doc}export class {cls} extends APIResource {{{body}}}")
}

fn emit_method(
    segments: &[String],
    method: &Method,
    ctx: &NodeCtx,
    uses: &mut FileUses,
    param_interfaces: &mut Vec<String>,
) -> String {
    let op = plan_operation(method, &ctx.types);
    let name = node_method_name(&method.action);
    let path_params = &method.path_params;
    let query_params = &method.query_params;
    let header_params = &method.header_params;
    let has_body = op.has_body;
    let raw_content_type = op.binary_content_type.clone();
    let body_list = body_fields(method.request_body.as_ref().map(|b| &b.ty), &ctx.types);

    let has_params = has_body || !query_params.is_empty() || !header_params.is_empty();
    let arg_name = params_arg_name(has_body, query_params.len(), header_params.len());
    let params_type = params_type_name(segments, &method.action);
    if has_params {
        param_interfaces.push(render_params_interface(
            &params_type,
            has_body,
            &body_list,
            query_params,
            header_params,
            &mut uses.refs,
        ));
    }

    let mut args: Vec<String> = path_params
        .iter()
        .map(|p| {
            format!(
                "{}: {}",
                camel_case(&p.name),
                node_type(Some(&p.ty), &mut uses.refs)
            )
        })
        .collect();
    if has_params {
        let optional = if params_required(has_body, op.body_required, query_params, header_params) {
            ""
        } else {
            "?"
        };
        args.push(format!("{arg_name}{optional}: {params_type}"));
    }
    args.push("options?: RequestOptions".to_string());

    let arg_optional =
        has_params && !params_required(has_body, op.body_required, query_params, header_params);

    let mut entries = vec![
        format!(
            "method: {}",
            json_string(&method.http_method.to_uppercase())
        ),
        format!("path: {}", path_expr(&method.path)),
    ];
    if !query_params.is_empty() {
        let qv = query_value(arg_name, query_params, uses, arg_optional);
        if qv == "query" {
            entries.push("query".to_string());
        } else {
            entries.push(format!("query: {qv}"));
        }
    }
    let encoding = body_encoding(&op, &body_list, &ctx.types);
    if has_body {
        let bv = body_value(
            arg_name,
            &body_list,
            !query_params.is_empty() || !header_params.is_empty(),
            arg_optional,
        );
        if bv == "body" {
            entries.push("body".to_string());
        } else {
            entries.push(format!("body: {bv}"));
        }
    }
    let header_entries = header_object_entries(
        raw_content_type.as_deref(),
        arg_name,
        header_params,
        arg_optional,
    );
    if !header_entries.is_empty() {
        entries.push(format!("headers: {header_entries}"));
    }
    if has_body && encoding != "json" {
        entries.push(format!("encoding: {}", json_string(encoding)));
    }
    if raw_content_type.is_some() {
        entries.push("raw: true".to_string());
    }
    if op.inject_idempotency_key && ctx.auto_generate_for_post {
        entries.push("idempotency: true".to_string());
    }

    let arg_object = format!("{{ {} }}", entries.join(", "));
    let (return_type, call) = return_plan(&op, method, &arg_object, uses, ctx);

    let guards = path_param_guards(path_params);
    let raw_doc = method
        .description
        .as_deref()
        .filter(|d| !d.is_empty())
        .map(|d| js_doc(Some(d)).trim_end().to_string())
        .unwrap_or_default();
    let doc_block = if raw_doc.is_empty() {
        String::new()
    } else {
        format!("  {}\n", raw_doc.replace('\n', "\n  "))
    };

    format!(
        "{doc_block}  {name}({args}): Promise<{return_type}> {{\n{guards}{call}\n  }}",
        args = args.join(", "),
    )
}

/// The return type + the `return this._client.request(...)` statement.
fn return_plan(
    op: &OperationPlan,
    method: &Method,
    arg_object: &str,
    uses: &mut FileUses,
    ctx: &NodeCtx,
) -> (String, String) {
    if op.binary_content_type.is_some() {
        return (
            "Response".to_string(),
            format!("    return this._client.request<Response>({arg_object}, options);"),
        );
    }
    if let Some(page_name) = op.page_name {
        uses.pages.insert(page_name);
        let item = node_type(
            method
                .pagination
                .as_ref()
                .and_then(|p| p.item_type.as_ref()),
            &mut uses.refs,
        );
        return (
            format!("{page_name}<{item}>"),
            format!(
                "    return this._client\n      .request<unknown>({arg_object}, options)\n      .then((raw) => {page_name}.fromResponse<{item}>(raw));"
            ),
        );
    }
    if op.primary_response == PrimaryResponseKind::None {
        return (
            "void".to_string(),
            format!("    return this._client.request<void>({arg_object}, options);"),
        );
    }
    let return_type = node_type(method.primary_response.as_ref(), &mut uses.refs);
    let decode = if op.primary_response == PrimaryResponseKind::UnionMapped {
        union_decode_for(method.primary_response.as_ref(), ctx)
    } else {
        None
    };
    if let Some(decode) = decode {
        uses.decode_names.insert(decode.clone());
        return (
            return_type,
            format!(
                "    return this._client\n      .request<unknown>({arg_object}, options)\n      .then({decode});"
            ),
        );
    }
    (
        return_type.clone(),
        format!("    return this._client.request<{return_type}>({arg_object}, options);"),
    )
}

fn union_decode_for(ref_: Option<&TypeRef>, ctx: &NodeCtx) -> Option<String> {
    let r = ref_?;
    if r.kind() != "ref" {
        return None;
    }
    let name = r.name.as_deref()?;
    let named = ctx.types.iter().find(|t| t.name == name)?;
    union_decode_name(named)
}

fn params_arg_name(has_body: bool, query_count: usize, header_count: usize) -> &'static str {
    if has_body {
        if query_count + header_count > 0 {
            "params"
        } else {
            "body"
        }
    } else if query_count > 0 {
        "query"
    } else {
        "params"
    }
}

fn params_required(has_body: bool, body_required: bool, query: &[Param], header: &[Param]) -> bool {
    if has_body {
        body_required
    } else {
        query.iter().any(|p| p.required_truthy()) || header.iter().any(|p| p.required_truthy())
    }
}

/// The body wire encoding: the IR encoding, upgraded to multipart for a json body
/// carrying a binary field.
fn body_encoding<'a>(op: &OperationPlan, body_list: &[&Field], types: &[&NamedType]) -> &'a str {
    let encoding = op.encoding.unwrap_or("json");
    if encoding == "json"
        && body_list
            .iter()
            .any(|f| is_binary_type_ref(Some(&f.ty), types, &mut BTreeSet::new()))
    {
        "multipart"
    } else {
        encoding
    }
}

fn render_params_interface(
    type_name: &str,
    has_body: bool,
    body_list: &[&Field],
    query_params: &[Param],
    header_params: &[Param],
    refs: &mut ModelRefs,
) -> String {
    let mut lines: Vec<String> = Vec::new();
    let mut seen: BTreeSet<String> = BTreeSet::new();
    // Body fields win over a same-keyed query/header param (dedupe by property key).
    if has_body {
        for f in body_list {
            push_param_field(
                &mut lines,
                &mut seen,
                &f.name,
                f.required == Some(true),
                &f.ty,
                refs,
            );
        }
    }
    for p in query_params.iter().chain(header_params.iter()) {
        push_param_field(
            &mut lines,
            &mut seen,
            &p.name,
            p.required_truthy(),
            &p.ty,
            refs,
        );
    }
    let body = if lines.is_empty() {
        String::new()
    } else {
        format!("\n{}\n", lines.join("\n"))
    };
    format!("export interface {type_name} {{{body}}}")
}

#[allow(clippy::too_many_arguments)]
fn push_param_field(
    lines: &mut Vec<String>,
    seen: &mut BTreeSet<String>,
    name: &str,
    required: bool,
    ty: &TypeRef,
    refs: &mut ModelRefs,
) {
    let key = prop_key(name);
    if seen.contains(&key) {
        return;
    }
    seen.insert(key.clone());
    lines.push(format!(
        "  {}{}: {};",
        key,
        if required { "" } else { "?" },
        node_type(Some(ty), refs)
    ));
}

fn query_value(
    arg_name: &str,
    query_params: &[Param],
    uses: &mut FileUses,
    optional: bool,
) -> String {
    let needs_explicit = query_params.iter().any(|q| {
        q.wire_name.as_deref().map(|w| w != q.name).unwrap_or(false)
            || (q.ty.kind() == "array" && q.explode == Some(false))
    });
    if arg_name == "query" && !needs_explicit {
        return "query".to_string();
    }
    let entries: Vec<String> = query_params
        .iter()
        .map(|q| {
            let wire = q.wire_name.as_deref().unwrap_or(&q.name);
            if q.ty.kind() == "array" && q.explode == Some(false) {
                uses.needs_join_csv = true;
                format!(
                    "{}: joinCsv({})",
                    prop_key(wire),
                    member_access(arg_name, &q.name, optional)
                )
            } else {
                format!(
                    "{}: {}",
                    prop_key(wire),
                    member_access(arg_name, &q.name, optional)
                )
            }
        })
        .collect();
    format!("{{ {} }}", entries.join(", "))
}

fn body_value(arg_name: &str, body_list: &[&Field], mixed: bool, optional: bool) -> String {
    if !mixed {
        return arg_name.to_string();
    }
    let entries: Vec<String> = body_list
        .iter()
        .map(|f| {
            format!(
                "{}: {}",
                prop_key(&f.name),
                member_access(arg_name, &f.name, optional)
            )
        })
        .collect();
    format!("{{ {} }}", entries.join(", "))
}

fn header_object_entries(
    raw_content_type: Option<&str>,
    arg_name: &str,
    header_params: &[Param],
    optional: bool,
) -> String {
    let mut entries: Vec<String> = Vec::new();
    if let Some(ct) = raw_content_type {
        entries.push(format!("Accept: {}", json_string(ct)));
    }
    for h in header_params {
        let wire = h.wire_name.as_deref().unwrap_or(&h.name);
        entries.push(format!(
            "{}: {}",
            prop_key(wire),
            member_access(arg_name, &h.name, optional)
        ));
    }
    if entries.is_empty() {
        String::new()
    } else {
        format!("{{ {} }}", entries.join(", "))
    }
}

fn is_js_ident(key: &str) -> bool {
    let mut chars = key.chars();
    match chars.next() {
        Some(c) if c.is_ascii_alphabetic() || c == '_' || c == '$' => {}
        _ => return false,
    }
    chars.all(|c| c.is_ascii_alphanumeric() || c == '_' || c == '$')
}

fn member_access(obj: &str, key: &str, optional: bool) -> String {
    let ident = is_js_ident(key);
    if optional {
        if ident {
            format!("{obj}?.{key}")
        } else {
            format!("{obj}?.[{}]", json_string(key))
        }
    } else if ident {
        format!("{obj}.{key}")
    } else {
        format!("{obj}[{}]", json_string(key))
    }
}

fn path_param_guards(path_params: &[Param]) -> String {
    let mut out = String::new();
    for p in path_params {
        let is_string_scalar = p.ty.kind() == "scalar" && p.ty.scalar.as_deref() == Some("string");
        if !is_string_scalar || p.required == Some(false) {
            continue;
        }
        let name = camel_case(&p.name);
        out.push_str(&format!(
            "    if (!{name}) {{\n      throw new Error({});\n    }}\n",
            json_string(&format!("missing required {} parameter", p.name))
        ));
    }
    out
}

fn path_expr(path: &str) -> String {
    let p = if path.starts_with('/') {
        path.to_string()
    } else {
        format!("/{path}")
    };
    if !p.contains('{') {
        return json_string(&p);
    }
    // Replace `{name}` -> `${camelCase(name)}` inside a template literal.
    let mut tmpl = String::new();
    let mut rest = p.as_str();
    while let Some(start) = rest.find('{') {
        tmpl.push_str(&rest[..start]);
        let after = &rest[start + 1..];
        if let Some(end) = after.find('}') {
            let inner = &after[..end];
            tmpl.push_str(&format!("${{{}}}", camel_case(inner)));
            rest = &after[end + 1..];
        } else {
            tmpl.push_str(&rest[start..]);
            rest = "";
        }
    }
    tmpl.push_str(rest);
    format!("`{tmpl}`")
}
