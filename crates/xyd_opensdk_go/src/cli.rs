//! CLI-mode generator: a spec with a root `x-cli` block (from
//! xyd_opencli2opensdk) becomes a Go SDK that SPAWNS the real CLI binary —
//! method bodies assemble argv from the x-cli binding (via the shared
//! `CliPlan`) and call the vendored `internal/runner` prologue instead of the
//! HTTP requestconfig. HTTP-only machinery (plan_operation, pagination,
//! idempotency, tests_gen) is never touched in this mode.

use std::collections::BTreeMap;

use serde_json::{Map, Value};
use xyd_opensdk_cli_common::{CliOpt, CliPlan, CliRoot, Encoding};

use crate::client::GoCtx;
use crate::gotype::go_type;
use crate::gowriter::{go_doc, go_field, go_file, go_struct, Imports};
use crate::model::render_named_type;
use crate::naming::{go_method_name, go_package_name, go_var, json_string, pascal_case, slug};
use crate::service::{query_field_line, resource_qualifier, service_type_name};

const PARAM_GO: &str = include_str!("param.go.txt");
const CLI_RUNNER_GO: &str = include_str!("cli_runner.go.txt");
const CLI_OPTION_GO: &str = include_str!("cli_option.go.txt");

fn s<'a>(v: &'a Value, key: &str) -> &'a str {
    v.get(key).and_then(|x| x.as_str()).unwrap_or("")
}

fn arr<'a>(v: &'a Value, key: &str) -> Vec<&'a Value> {
    v.get(key)
        .and_then(|x| x.as_array())
        .map(|a| a.iter().collect())
        .unwrap_or_default()
}

fn timeout_ms(spec: &Value) -> u64 {
    spec.get("sdk")
        .and_then(|s| s.get("timeout"))
        .and_then(|t| t.get("defaultTimeoutMs"))
        .and_then(|v| v.as_u64())
        .unwrap_or(60000)
}

pub fn generate_cli(spec: &Value) -> BTreeMap<String, String> {
    let root = CliRoot::parse(spec).unwrap_or_else(|e| panic!("emitter \"go\": {e}"));
    let title = spec
        .get("info")
        .and_then(|i| i.get("title"))
        .and_then(|t| t.as_str())
        .unwrap_or("");
    let pkg = go_package_name(title);
    let module_path = format!("github.com/example/{pkg}");

    let mut type_map: Map<String, Value> = Map::new();
    if let Some(types) = spec.get("types").and_then(|t| t.as_array()) {
        for t in types {
            if let Some(name) = t.get("name").and_then(|n| n.as_str()) {
                type_map.insert(name.to_string(), t.clone());
            }
        }
    }
    let ctx = GoCtx {
        module_path: module_path.clone(),
        pkg: pkg.clone(),
        types: &type_map,
        behavior: spec.get("sdk").cloned().unwrap_or(Value::Null),
    };

    let mut files: BTreeMap<String, String> = BTreeMap::new();
    files.insert(
        "go.mod".to_string(),
        crate::with_header("go.mod", format!("module {module_path}\n\ngo 1.22\n")),
    );
    files.insert(
        "client.go".to_string(),
        crate::with_header("client.go", render_cli_client_file(spec, &ctx, &root)),
    );
    if let Some(types_file) = render_cli_types_file(spec, &pkg) {
        files.insert(
            "types.go".to_string(),
            crate::with_header("types.go", types_file),
        );
    }
    for r in arr(spec, "resources") {
        let (path, content) = render_cli_service_file(r, &ctx, &root);
        let content = crate::with_header(&path, content);
        files.insert(path, content);
    }
    files.insert(
        "packages/param/param.go".to_string(),
        crate::with_header("packages/param/param.go", PARAM_GO.to_string()),
    );
    files.insert(
        "option/option.go".to_string(),
        crate::with_header(
            "option/option.go",
            CLI_OPTION_GO.replace("__XYD_MODULE__", &module_path),
        ),
    );
    files.insert(
        "internal/runner/runner.go".to_string(),
        crate::with_header(
            "internal/runner/runner.go",
            CLI_RUNNER_GO
                .replace("__XYD_BIN__", &json_string(&root.bin))
                .replace("__XYD_BIN_ENV_VAR__", &json_string(&root.env_var))
                .replace("__XYD_TIMEOUT_MS__", &timeout_ms(spec).to_string()),
        ),
    );
    files
}

/// types.go without CommandResult — the result type is owned by the runner
/// package (import-cycle-free); only enums (and any future user types) render.
fn render_cli_types_file(spec: &Value, pkg: &str) -> Option<String> {
    let types = spec.get("types").and_then(|t| t.as_array())?;
    let mut imports = Imports::new();
    let decls: Vec<String> = types
        .iter()
        .filter(|t| s(t, "name") != "CommandResult")
        .map(|t| render_named_type(t, &mut imports))
        .collect();
    if decls.is_empty() {
        return None;
    }
    Some(go_file(pkg, &imports, &decls))
}

fn render_cli_client_file(spec: &Value, ctx: &GoCtx, root: &CliRoot) -> String {
    let mut imports = Imports::new();
    let option_q = imports.add(&format!("{}/option", ctx.module_path), None);
    let resources = arr(spec, "resources");

    let mut struct_fields = vec![go_field(
        "Options",
        &format!("[]{option_q}.CommandOption"),
        None,
    )];
    for r in &resources {
        let rname = s(r, "name");
        struct_fields.push(go_field(
            &pascal_case(rname),
            &service_type_name(&[rname.to_string()]),
            None,
        ));
    }
    let title = spec
        .get("info")
        .and_then(|i| i.get("title"))
        .and_then(|t| t.as_str())
        .unwrap_or("");
    let client_struct = go_struct(
        "Client",
        &struct_fields,
        &go_doc(
            Some(&format!(
                "Client drives the {title} CLI (the `{}` binary).",
                root.bin
            )),
            Some("Client"),
        ),
    );

    let mut ctor_lines: Vec<String> = vec!["\tr = Client{Options: opts}".to_string()];
    for r in &resources {
        let rname = s(r, "name");
        ctor_lines.push(format!(
            "\tr.{} = New{}(opts...)",
            pascal_case(rname),
            service_type_name(&[rname.to_string()])
        ));
    }
    let ctor = format!(
        "{}\nfunc NewClient(opts ...{option_q}.CommandOption) (r Client) {{\n{}\n\treturn\n}}",
        go_doc(
            Some(&format!(
                "NewClient creates a client that runs `{}` (override with the {} env var or option.WithBinPath).",
                root.bin, root.env_var
            )),
            Some("NewClient"),
        ),
        ctor_lines.join("\n")
    );

    let mut decls = vec![client_struct, ctor];
    let mut param_structs: Vec<String> = Vec::new();
    for method in arr(spec, "methods") {
        decls.push(emit_cli_method(
            "Client",
            &[],
            method,
            ctx,
            root,
            &mut imports,
            &option_q,
            &mut param_structs,
        ));
    }
    decls.extend(param_structs);
    go_file(&ctx.pkg, &imports, &decls)
}

fn render_cli_service_file(resource: &Value, ctx: &GoCtx, root: &CliRoot) -> (String, String) {
    let mut imports = Imports::new();
    let option_q = imports.add(&format!("{}/option", ctx.module_path), None);
    let mut decls: Vec<String> = Vec::new();
    let name = s(resource, "name").to_string();
    emit_cli_service(
        resource,
        std::slice::from_ref(&name),
        ctx,
        root,
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
fn emit_cli_service(
    resource: &Value,
    segments: &[String],
    ctx: &GoCtx,
    root: &CliRoot,
    imports: &mut Imports,
    option_q: &str,
    decls: &mut Vec<String>,
) {
    let svc = service_type_name(segments);
    let subs = arr(resource, "resources");

    let mut struct_fields = vec![go_field(
        "Options",
        &format!("[]{option_q}.CommandOption"),
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
        "// New{svc} constructs a service that shares the client's command options.\nfunc New{svc}(opts ...{option_q}.CommandOption) (r {svc}) {{\n{}\n\treturn\n}}",
        ctor_lines.join("\n")
    ));

    let mut param_structs: Vec<String> = Vec::new();
    for method in arr(resource, "methods") {
        decls.push(emit_cli_method(
            &svc,
            segments,
            method,
            ctx,
            root,
            imports,
            option_q,
            &mut param_structs,
        ));
    }
    decls.extend(param_structs);

    for sub in &subs {
        let mut seg = segments.to_vec();
        seg.push(s(sub, "name").to_string());
        emit_cli_service(sub, &seg, ctx, root, imports, option_q, decls);
    }
}

/// One argv token expression for a value of the given IR type.
fn token_expr(expr: &str, type_ref: Option<&Value>, imports: &mut Imports) -> String {
    if go_type(type_ref) == "string" {
        return expr.to_string();
    }
    imports.add("fmt", None);
    format!("fmt.Sprintf(\"%v\", {expr})")
}

/// Append lines for one valued flag occurrence, honoring the spec's
/// optionSeparator convention.
fn flag_append(flag: &str, value_token: &str, separator: &str, imports: &mut Imports) -> String {
    if separator == "=" {
        if value_token.starts_with("fmt.Sprintf(\"%v\", ") {
            imports.add("fmt", None);
            let inner = &value_token["fmt.Sprintf(\"%v\", ".len()..value_token.len() - 1];
            return format!("\targv = append(argv, fmt.Sprintf(\"{flag}=%v\", {inner}))");
        }
        return format!(
            "\targv = append(argv, {}+{value_token})",
            json_string(&format!("{flag}="))
        );
    }
    format!(
        "\targv = append(argv, {}, {value_token})",
        json_string(flag)
    )
}

/// The argv-building lines for one flag binding.
fn opt_lines(
    opt: &CliOpt,
    query_params: &[&Value],
    separator: &str,
    imports: &mut Imports,
) -> String {
    let flag_lit = json_string(&opt.flag);
    let Some(idx) = opt.param_index else {
        // Constant flag: always appended.
        return format!("\targv = append(argv, {flag_lit})");
    };
    let q = query_params[idx];
    let field = format!("params.{}", pascal_case(s(q, "name")));
    let required = q.get("required").and_then(|v| v.as_bool()) == Some(true);
    let type_ref = q.get("type");
    let go_ty = go_type(type_ref);

    if opt.repeat {
        // Array-typed param: repeat the flag per item.
        let item_ref = type_ref.and_then(|t| t.get("items"));
        let token = token_expr("value", item_ref, imports);
        let append = flag_append(&opt.flag, &token, separator, imports);
        return format!("\tfor _, value := range {field} {{\n\t{append}\n\t}}");
    }
    match opt.encoding {
        Encoding::Boolean => {
            if required {
                format!("\tif {field} {{\n\t\targv = append(argv, {flag_lit})\n\t}}")
            } else {
                format!(
                    "\tif {field}.IsPresent() && {field}.Value() {{\n\t\targv = append(argv, {flag_lit})\n\t}}"
                )
            }
        }
        Encoding::Json => {
            imports.add("encoding/json", None);
            let open = if go_ty == "any" {
                format!("\tif {field} != nil {{\n")
            } else if required {
                "\t{\n".to_string()
            } else {
                format!("\tif {field} != nil {{\n")
            };
            let append = flag_append(&opt.flag, "string(raw)", separator, imports);
            format!(
                "{open}\t\traw, jsonErr := json.Marshal({field})\n\t\tif jsonErr != nil {{\n\t\t\terr = jsonErr\n\t\t\treturn\n\t\t}}\n\t{append}\n\t}}"
            )
        }
        _ => {
            if required {
                let token = token_expr(&field, type_ref, imports);
                flag_append(&opt.flag, &token, separator, imports)
            } else {
                let token = token_expr(&format!("{field}.Value()"), type_ref, imports);
                let append = flag_append(&opt.flag, &token, separator, imports);
                format!("\tif {field}.IsPresent() {{\n\t{append}\n\t}}")
            }
        }
    }
}

#[allow(clippy::too_many_arguments)]
fn emit_cli_method(
    receiver: &str,
    segments: &[String],
    method: &Value,
    ctx: &GoCtx,
    root: &CliRoot,
    imports: &mut Imports,
    option_q: &str,
    param_structs: &mut Vec<String>,
) -> String {
    let plan = CliPlan::for_method(method).unwrap_or_else(|e| panic!("emitter \"go\": {e}"));
    imports.add("context", None);
    let runner_q = imports.add(&format!("{}/internal/runner", ctx.module_path), None);

    let name = go_method_name(s(method, "action"));
    let path_params = arr(method, "pathParams");
    let query_params = arr(method, "queryParams");

    let qualifier = if segments.is_empty() {
        "Client".to_string()
    } else {
        resource_qualifier(segments)
    };
    let params_type = format!("{qualifier}{name}Params");
    let has_params = !query_params.is_empty();
    if has_params {
        let fields: Vec<String> = query_params
            .iter()
            .map(|q| query_field_line(q, ctx, imports))
            .collect();
        param_structs.push(go_struct(&params_type, &fields, ""));
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
    if has_params {
        args.push(format!("params {params_type}"));
    }
    args.push(format!("opts ...{option_q}.CommandOption"));

    let mut lines: Vec<String> = vec!["\topts = append(r.Options[:], opts...)".to_string()];

    // Required scalar-string guards (same discipline as the HTTP emitter).
    for a in &plan.args {
        let p = path_params[a.param_index];
        if a.required && go_type(p.get("type")) == "string" {
            imports.add("errors", None);
            lines.push(format!(
                "\tif {} == \"\" {{\n\t\terr = errors.New({})\n\t\treturn\n\t}}",
                go_var(s(p, "name")),
                json_string(&format!("missing required {} parameter", s(p, "name")))
            ));
        }
    }

    // argv: command tokens, then positionals, then flags.
    let command_tokens = plan
        .command
        .iter()
        .map(|t| json_string(t))
        .collect::<Vec<_>>()
        .join(", ");
    lines.push(format!("\targv := []string{{{command_tokens}}}"));
    for a in &plan.args {
        let p = path_params[a.param_index];
        let var = go_var(s(p, "name"));
        let type_ref = p.get("type");
        if a.variadic {
            let item_ref = type_ref.and_then(|t| t.get("items"));
            let token = token_expr("value", item_ref, imports);
            lines.push(format!(
                "\tfor _, value := range {var} {{\n\t\targv = append(argv, {token})\n\t}}"
            ));
        } else if a.required {
            let token = token_expr(&var, type_ref, imports);
            lines.push(format!("\targv = append(argv, {token})"));
        } else {
            // Optional positional: the zero value means "omitted".
            let token = token_expr(&var, type_ref, imports);
            lines.push(format!(
                "\tif {var} != \"\" {{\n\t\targv = append(argv, {token})\n\t}}"
            ));
        }
    }
    for opt in &plan.opts {
        lines.push(opt_lines(
            opt,
            &query_params,
            &root.option_separator,
            imports,
        ));
    }
    lines.push(format!("\tres, err = {runner_q}.Run(ctx, argv, opts...)"));

    let usage = std::iter::once(root.bin.clone())
        .chain(plan.command.iter().cloned())
        .collect::<Vec<_>>()
        .join(" ");
    let doc = go_doc(
        method.get("description").and_then(|d| d.as_str()),
        Some(&format!("{name} runs `{usage}`")),
    );
    let head = if doc.is_empty() {
        String::new()
    } else {
        format!("{doc}\n")
    };
    format!(
        "{head}func (r *{receiver}) {name}({}) (res *{runner_q}.CommandResult, err error) {{\n{}\n\treturn\n}}",
        args.join(", "),
        lines.join("\n")
    )
}
