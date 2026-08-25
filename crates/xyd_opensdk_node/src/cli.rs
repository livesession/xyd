//! CLI-mode generator: a spec with a root `x-cli` block (from
//! xyd_opencli2opensdk) becomes a TypeScript SDK that SPAWNS the real CLI
//! binary — method bodies assemble argv from the x-cli binding (via the shared
//! `CliPlan`) and call the vendored `src/core/command.ts` prologue instead of
//! the HTTP fetch runtime. HTTP-only machinery (plan_operation, pagination,
//! idempotency, tests_gen) is never touched in this mode.

use std::collections::BTreeMap;

use serde_json::{json, Value};
use xyd_opensdk_cli_common::{CliOpt, CliPlan, CliRoot, Encoding};

use crate::ir::{Method, Param, Resource, Spec, TypeRef};
use crate::jsrt::{
    camel_case, js_doc, json_string, node_method_name, npm_package_name, pascal_case, slug,
};
use crate::model::{node_type, render_named_type, ModelRefs};
use crate::project::pretty;
use crate::resource::{
    member_access, params_required, params_type_name, render_params_interface,
    render_resources_index_file, resource_class_name,
};

const CORE_COMMAND_TS: &str = include_str!("core_command.ts.txt");

fn timeout_ms(spec: &Value) -> u64 {
    spec.get("sdk")
        .and_then(|s| s.get("timeout"))
        .and_then(|t| t.get("defaultTimeoutMs"))
        .and_then(|v| v.as_u64())
        .unwrap_or(60000)
}

pub fn generate_cli(spec: &Spec, spec_json: &Value) -> BTreeMap<String, String> {
    let root = CliRoot::parse(spec_json).unwrap_or_else(|e| panic!("emitter \"node\": {e}"));
    let pkg = npm_package_name(&spec.info.title);
    let client_name = pascal_case(&pkg);

    let mut files: BTreeMap<String, String> = BTreeMap::new();
    let mut add = |path: &str, content: String| {
        let content = crate::with_file_header(path, content);
        if files.insert(path.to_string(), content).is_some() {
            panic!("emitter \"node\": re-emitted {path}");
        }
    };

    // generateProject (no README — mirror the go emitter's CLI-mode minimalism).
    add("package.json", cli_package_json(&pkg, spec));
    add("tsconfig.json", cli_tsconfig_json());

    // generateClient
    let models = render_cli_models_file(spec);
    add(
        "src/index.ts",
        render_cli_index_file(spec, &client_name, models.is_some()),
    );
    add(
        "src/client.ts",
        render_cli_client_file(spec, &root, &client_name),
    );

    // generateTypes — without CommandResult (owned by the command runtime).
    if let Some(models) = models {
        add("src/models.ts", models);
    }

    // generateResources
    if !spec.resources.is_empty() {
        for r in &spec.resources {
            let (path, content) = render_cli_resource_file(r, &root);
            add(&path, content);
        }
        add(
            "src/resources/index.ts",
            render_resources_index_file(&spec.resources),
        );
    }

    // generateRuntime — the vendored subprocess runner with the seams stamped.
    add(
        "src/core/command.ts",
        CORE_COMMAND_TS
            .replace("__XYD_BIN__", &json_string(&root.bin))
            .replace("__XYD_BIN_ENV_VAR__", &json_string(&root.env_var))
            .replace("__XYD_TIMEOUT_MS__", &timeout_ms(spec_json).to_string()),
    );

    files
}

/// The generated `package.json` in CLI mode: same dependency-free tsc-built
/// shape as HTTP mode, plus `@types/node` (the runner imports node:child_process).
fn cli_package_json(pkg: &str, spec: &Spec) -> String {
    let info = &spec.info;
    let mut manifest = serde_json::Map::new();
    manifest.insert("name".into(), json!(pkg));
    let version = if info.version.is_empty() {
        "0.0.0".to_string()
    } else {
        info.version.clone()
    };
    manifest.insert("version".into(), json!(version));
    if let Some(desc) = info.description.as_deref() {
        if !desc.is_empty() {
            manifest.insert("description".into(), json!(desc));
        }
    }
    if let Some(name) = info.contact.as_ref().and_then(|c| c.name.as_deref()) {
        manifest.insert("author".into(), json!(name));
    }
    if let Some(id) = info.license.as_ref().and_then(|l| l.identifier.as_deref()) {
        manifest.insert("license".into(), json!(id));
    }
    if let Some(home) = info.homepage.as_deref() {
        manifest.insert("homepage".into(), json!(home));
    }
    if let Some(repo) = info.repository.as_deref() {
        manifest.insert("repository".into(), json!({ "type": "git", "url": repo }));
    }
    manifest.insert("type".into(), json!("module"));
    manifest.insert("main".into(), json!("./dist/index.js"));
    manifest.insert("types".into(), json!("./dist/index.d.ts"));
    manifest.insert(
        "exports".into(),
        json!({ ".": { "types": "./dist/index.d.ts", "import": "./dist/index.js" } }),
    );
    manifest.insert("files".into(), json!(["dist", "src"]));
    manifest.insert(
        "scripts".into(),
        json!({ "build": "tsc", "prepare": "tsc" }),
    );
    manifest.insert("engines".into(), json!({ "node": ">=18" }));
    manifest.insert("dependencies".into(), json!({}));
    manifest.insert(
        "devDependencies".into(),
        json!({ "@types/node": "^22.7.0", "typescript": "^5.6.2" }),
    );
    format!("{}\n", pretty(&Value::Object(manifest)))
}

/// The generated `tsconfig.json` in CLI mode (node types instead of DOM lib).
fn cli_tsconfig_json() -> String {
    let config = json!({
        "compilerOptions": {
            "target": "ES2022",
            "module": "ESNext",
            "moduleResolution": "bundler",
            "lib": ["ES2022"],
            "types": ["node"],
            "strict": true,
            "esModuleInterop": true,
            "skipLibCheck": true,
            "forceConsistentCasingInFileNames": true,
            "declaration": true,
            "outDir": "./dist"
        },
        "include": ["src"]
    });
    format!("{}\n", pretty(&config))
}

/// `src/models.ts` without CommandResult — the result type is owned by the
/// command runtime (imported from `core/command`); only enums (and any future
/// user types) render. None when nothing remains.
fn render_cli_models_file(spec: &Spec) -> Option<String> {
    let decls: Vec<String> = spec
        .types
        .iter()
        .filter(|t| t.name != "CommandResult")
        .map(render_named_type)
        .filter(|d| !d.is_empty())
        .collect();
    if decls.is_empty() {
        return None;
    }
    Some(format!("{}\n", decls.join("\n\n")))
}

/// `src/index.ts`: the public entry point in CLI mode.
fn render_cli_index_file(spec: &Spec, client_name: &str, has_models: bool) -> String {
    let mut lines = vec![
        format!("export {{ {client_name} as default }} from './client';"),
        "export * from './client';".to_string(),
        "export { CliError, CommandResult } from './core/command';".to_string(),
        "export type { ClientOptions } from './core/command';".to_string(),
    ];
    if has_models {
        lines.push("export * from './models';".to_string());
    }
    if !spec.resources.is_empty() {
        lines.push("export * from './resources/index';".to_string());
    }
    format!("{}\n", lines.join("\n"))
}

/// `src/client.ts`: the client with a field per top-level resource plus the
/// spec-level root methods rendered directly on the class.
fn render_cli_client_file(spec: &Spec, root: &CliRoot, client_name: &str) -> String {
    let resources = &spec.resources;
    let mut refs = ModelRefs::new();
    let mut param_interfaces: Vec<String> = Vec::new();

    let mut members: Vec<String> = Vec::new();
    for r in resources {
        members.push(format!(
            "  readonly {}: {};",
            camel_case(&r.name),
            resource_class_name(std::slice::from_ref(&r.name))
        ));
    }
    if !resources.is_empty() {
        let mut ctor_lines = vec!["    super(options);".to_string()];
        for r in resources {
            ctor_lines.push(format!(
                "    this.{} = new {}(this);",
                camel_case(&r.name),
                resource_class_name(std::slice::from_ref(&r.name))
            ));
        }
        members.push(format!(
            "  constructor(options: ClientOptions = {{}}) {{\n{}\n  }}",
            ctor_lines.join("\n")
        ));
    }
    for method in &spec.methods {
        members.push(emit_cli_method(
            &[],
            method,
            root,
            &mut refs,
            &mut param_interfaces,
        ));
    }

    let mut lines = vec!["import { CLIClient } from './core/command';".to_string()];
    let mut type_imports: Vec<&str> = Vec::new();
    if !resources.is_empty() {
        type_imports.push("ClientOptions");
    }
    if !spec.methods.is_empty() {
        type_imports.push("CommandResult");
    }
    if !type_imports.is_empty() {
        lines.push(format!(
            "import type {{ {} }} from './core/command';",
            type_imports.join(", ")
        ));
    }
    for r in resources {
        let file = if slug(&r.name).is_empty() {
            "resource".to_string()
        } else {
            slug(&r.name)
        };
        lines.push(format!(
            "import {{ {} }} from './resources/{}';",
            resource_class_name(std::slice::from_ref(&r.name)),
            file
        ));
    }
    refs.remove("CommandResult");
    if !refs.is_empty() {
        let names: Vec<String> = refs.iter().cloned().collect();
        lines.push(format!(
            "import type {{ {} }} from './models';",
            names.join(", ")
        ));
    }

    let doc = js_doc(Some(&format!(
        "The {} CLI client (drives the `{}` binary; override with the {} env var or the binPath option).",
        spec.info.title, root.bin, root.env_var
    )));
    let body = if members.is_empty() {
        String::new()
    } else {
        format!("\n{}\n", members.join("\n\n"))
    };
    let mut blocks = vec![format!(
        "{}\n\n{doc}export class {client_name} extends CLIClient {{{body}}}",
        lines.join("\n")
    )];
    blocks.extend(param_interfaces);
    format!("{}\n", blocks.join("\n\n"))
}

/// Per-file import trackers for one CLI resource file.
struct CliFileUses {
    refs: ModelRefs,
    has_nested: bool,
    has_methods: bool,
}

/// One top-level resource (and its whole subtree) into a single file.
fn render_cli_resource_file(resource: &Resource, root: &CliRoot) -> (String, String) {
    let mut uses = CliFileUses {
        refs: ModelRefs::new(),
        has_nested: false,
        has_methods: false,
    };
    let mut classes: Vec<String> = Vec::new();
    let mut param_interfaces: Vec<String> = Vec::new();
    emit_cli_tree(
        resource,
        std::slice::from_ref(&resource.name),
        root,
        &mut uses,
        &mut classes,
        &mut param_interfaces,
    );

    let mut lines = vec!["import { CLIResource } from '../core/command';".to_string()];
    let mut type_imports: Vec<&str> = Vec::new();
    if uses.has_nested {
        type_imports.push("CLIClient");
    }
    if uses.has_methods {
        type_imports.push("CommandResult");
    }
    if !type_imports.is_empty() {
        lines.push(format!(
            "import type {{ {} }} from '../core/command';",
            type_imports.join(", ")
        ));
    }
    uses.refs.remove("CommandResult");
    if !uses.refs.is_empty() {
        let names: Vec<String> = uses.refs.iter().cloned().collect();
        lines.push(format!(
            "import type {{ {} }} from '../models';",
            names.join(", ")
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

fn emit_cli_tree(
    res: &Resource,
    segments: &[String],
    root: &CliRoot,
    uses: &mut CliFileUses,
    classes: &mut Vec<String>,
    param_interfaces: &mut Vec<String>,
) {
    if !res.resources.is_empty() {
        uses.has_nested = true;
    }
    let cls = emit_cli_class(res, segments, root, uses, param_interfaces);
    classes.push(cls);
    for sub in &res.resources {
        let mut seg = segments.to_vec();
        seg.push(sub.name.clone());
        emit_cli_tree(sub, &seg, root, uses, classes, param_interfaces);
    }
}

fn emit_cli_class(
    resource: &Resource,
    segments: &[String],
    root: &CliRoot,
    uses: &mut CliFileUses,
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
            "  constructor(client: CLIClient) {{\n{}\n  }}",
            ctor_lines.join("\n")
        ));
    }

    for method in &resource.methods {
        uses.has_methods = true;
        members.push(emit_cli_method(
            segments,
            method,
            root,
            &mut uses.refs,
            param_interfaces,
        ));
    }

    let doc = js_doc(resource.description.as_deref());
    let body = if members.is_empty() {
        String::new()
    } else {
        format!("\n{}\n", members.join("\n\n"))
    };
    format!("{doc}export class {cls} extends CLIResource {{{body}}}")
}

/// A minimal method view for the shared `CliPlan` parser (which resolves
/// `from:` references against pathParams/queryParams by name).
fn plan_view(method: &Method) -> Value {
    let names = |params: &[Param]| -> Value {
        Value::Array(
            params
                .iter()
                .map(|p| json!({ "name": p.name }))
                .collect::<Vec<_>>(),
        )
    };
    json!({
        "action": method.action,
        "pathParams": names(&method.path_params),
        "queryParams": names(&method.query_params),
        "x-cli": method.x_cli,
    })
}

/// One argv token expression for a value of the given IR type.
fn token_expr(expr: &str, ty: Option<&TypeRef>) -> String {
    let is_string = ty
        .map(|t| t.kind() == "scalar" && t.scalar.as_deref() == Some("string"))
        .unwrap_or(false);
    if is_string {
        expr.to_string()
    } else {
        format!("String({expr})")
    }
}

/// One valued-flag push, honoring the spec's optionSeparator convention:
/// `" "` (default) pushes flag and value as separate argv tokens; `"="` joins.
fn flag_push(flag: &str, token: &str, separator: &str) -> String {
    if separator == "=" {
        format!("argv.push({} + {token});", json_string(&format!("{flag}=")))
    } else {
        format!("argv.push({}, {token});", json_string(flag))
    }
}

/// The argv-building statement for one flag binding.
fn opt_lines(opt: &CliOpt, query_params: &[Param], separator: &str, arg_optional: bool) -> String {
    let flag_lit = json_string(&opt.flag);
    let Some(idx) = opt.param_index else {
        // Constant flag: always appended.
        return format!("    argv.push({flag_lit});");
    };
    let q = &query_params[idx];
    let required = q.required_truthy();
    // `params?.x` when the whole params argument is optional (the `!== undefined`
    // check then narrows `params.x` for the push inside the guard).
    let guard_field = member_access("params", &q.name, arg_optional);
    let plain_field = member_access("params", &q.name, false);

    if opt.repeat {
        // Array-typed param: repeat the flag per item.
        let token = token_expr("value", q.ty.items.as_deref());
        let push = flag_push(&opt.flag, &token, separator);
        let iter = if required {
            plain_field
        } else {
            format!("{guard_field} ?? []")
        };
        return format!("    for (const value of {iter}) {{\n      {push}\n    }}");
    }
    match opt.encoding {
        Encoding::Boolean => {
            // Bare flag only when the value is true.
            format!("    if ({guard_field}) {{\n      argv.push({flag_lit});\n    }}")
        }
        Encoding::Json => {
            let push = flag_push(
                &opt.flag,
                &format!("JSON.stringify({plain_field})"),
                separator,
            );
            if required {
                format!("    {push}")
            } else {
                format!("    if ({guard_field} !== undefined) {{\n      {push}\n    }}")
            }
        }
        _ => {
            let token = token_expr(&plain_field, Some(&q.ty));
            let push = flag_push(&opt.flag, &token, separator);
            if required {
                format!("    {push}")
            } else {
                format!("    if ({guard_field} !== undefined) {{\n      {push}\n    }}")
            }
        }
    }
}

/// Required scalar-string guards (same discipline as the HTTP emitter).
fn cli_guards(plan: &CliPlan, path_params: &[Param]) -> String {
    let mut out = String::new();
    for a in &plan.args {
        let p = &path_params[a.param_index];
        let is_string = p.ty.kind() == "scalar" && p.ty.scalar.as_deref() == Some("string");
        if !(a.required && is_string) {
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

/// One generated method: positionals from pathParams, a params object from
/// queryParams, argv assembled per the method's x-cli plan, then the runner.
/// `segments` empty = a spec-level root method on the client itself.
fn emit_cli_method(
    segments: &[String],
    method: &Method,
    root: &CliRoot,
    refs: &mut ModelRefs,
    param_interfaces: &mut Vec<String>,
) -> String {
    let plan =
        CliPlan::for_method(&plan_view(method)).unwrap_or_else(|e| panic!("emitter \"node\": {e}"));
    let name = node_method_name(&method.action);
    let path_params = &method.path_params;
    let query_params = &method.query_params;

    let params_type = if segments.is_empty() {
        params_type_name(&["client".to_string()], &method.action)
    } else {
        params_type_name(segments, &method.action)
    };
    let has_params = !query_params.is_empty();
    if has_params {
        param_interfaces.push(render_params_interface(
            &params_type,
            false,
            &[],
            query_params,
            &[],
            refs,
        ));
    }
    let arg_optional = has_params && !params_required(false, false, query_params, &[]);

    // signature
    let mut args: Vec<String> = path_params
        .iter()
        .map(|p| format!("{}: {}", camel_case(&p.name), node_type(Some(&p.ty), refs)))
        .collect();
    if has_params {
        let optional = if arg_optional { "?" } else { "" };
        args.push(format!("params{optional}: {params_type}"));
    }

    // argv: command tokens, then positionals, then flags.
    let mut lines: Vec<String> = Vec::new();
    let command_tokens = plan
        .command
        .iter()
        .map(|t| json_string(t))
        .collect::<Vec<_>>()
        .join(", ");
    lines.push(format!("    const argv: string[] = [{command_tokens}];"));
    for a in &plan.args {
        let p = &path_params[a.param_index];
        let var = camel_case(&p.name);
        if a.variadic {
            // Array-typed positional: its items spread as consecutive tokens.
            let token = token_expr("value", p.ty.items.as_deref());
            lines.push(format!(
                "    for (const value of {var}) {{\n      argv.push({token});\n    }}"
            ));
        } else if a.required {
            let token = token_expr(&var, Some(&p.ty));
            lines.push(format!("    argv.push({token});"));
        } else {
            // Optional positional: a falsy value means "omitted".
            let token = token_expr(&var, Some(&p.ty));
            lines.push(format!(
                "    if ({var}) {{\n      argv.push({token});\n    }}"
            ));
        }
    }
    for opt in &plan.opts {
        lines.push(opt_lines(
            opt,
            query_params,
            &root.option_separator,
            arg_optional,
        ));
    }
    lines.push(if segments.is_empty() {
        "    return this._run(argv);".to_string()
    } else {
        "    return this._client._run(argv);".to_string()
    });

    let usage = std::iter::once(root.bin.clone())
        .chain(plan.command.iter().cloned())
        .collect::<Vec<_>>()
        .join(" ");
    let runs = format!("Runs `{usage}`.");
    let description = method
        .description
        .as_deref()
        .map(str::trim)
        .filter(|d| !d.is_empty());
    let doc_text = match description {
        Some(d) => format!("{d}\n\n{runs}"),
        None => runs,
    };
    let raw_doc = js_doc(Some(&doc_text)).trim_end().to_string();
    let doc_block = format!("  {}\n", raw_doc.replace('\n', "\n  "));

    let guards = cli_guards(&plan, path_params);
    format!(
        "{doc_block}  {name}({args}): Promise<CommandResult> {{\n{guards}{body}\n  }}",
        args = args.join(", "),
        body = lines.join("\n"),
    )
}
