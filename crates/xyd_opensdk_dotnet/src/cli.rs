//! CLI-mode generator: a spec with a root `x-cli` block (from
//! xyd_opencli2opensdk) becomes a .NET SDK that SPAWNS the real CLI binary —
//! method bodies assemble argv from the x-cli binding (via the shared
//! `CliPlan`) and call the vendored `Transport.RunAsync` subprocess prologue
//! instead of the HTTP transport. HTTP-only machinery (plan_operation,
//! pagination, idempotency, tests_gen) is never touched in this mode.

use std::collections::BTreeMap;

use serde_json::Value;
use xyd_opensdk_cli_common::{CliOpt, CliPlan, CliRoot, Encoding};

use crate::cstype::{cs_type, nullable, Types};
use crate::cswriter::{cs_doc, cs_file, indent};
use crate::jsrt::{camel_case, json_string, method_name, pascal_case};
use crate::model::render_models_file;
use crate::service::service_class_name;

const CLI_TRANSPORT_TEMPLATE: &str = include_str!("cli_transport_template.cs.txt");

fn s<'a>(v: &'a Value, key: &str) -> &'a str {
    v.get(key).and_then(|x| x.as_str()).unwrap_or("")
}

fn arr<'a>(v: &'a Value, key: &str) -> Vec<&'a Value> {
    v.get(key)
        .and_then(|x| x.as_array())
        .map(|a| a.iter().collect())
        .unwrap_or_default()
}

fn required(v: &Value) -> bool {
    v.get("required").and_then(Value::as_bool) == Some(true)
}

fn timeout_ms(spec: &Value) -> u64 {
    spec.get("sdk")
        .and_then(|s| s.get("timeout"))
        .and_then(|t| t.get("defaultTimeoutMs"))
        .and_then(|v| v.as_u64())
        .unwrap_or(60000)
}

/// The fixed using set for CLI-mode Client/service files (mirrors the HTTP
/// service emitter's fixed set, minus System.Net.Http).
fn cli_usings() -> Vec<String> {
    vec![
        "System".to_string(),
        "System.Collections.Generic".to_string(),
        "System.Threading".to_string(),
        "System.Threading.Tasks".to_string(),
    ]
}

pub fn generate_cli(spec: &Value) -> BTreeMap<String, String> {
    let root = CliRoot::parse(spec).unwrap_or_else(|e| panic!("emitter \"dotnet\": {e}"));
    let opts = crate::resolve_options(spec);

    let types_arr = spec
        .get("types")
        .and_then(Value::as_array)
        .cloned()
        .unwrap_or_default();
    let mut table: BTreeMap<String, Value> = BTreeMap::new();
    for t in &types_arr {
        if let Some(name) = t.get("name").and_then(Value::as_str) {
            table.insert(name.to_string(), t.clone());
        }
    }

    let mut files: BTreeMap<String, String> = BTreeMap::new();

    // generateProject → <Sdk>.csproj (no tests project in CLI mode, so no
    // Compile-Remove exclusion is needed).
    files.insert(
        format!("{}.csproj", opts.sdk),
        crate::csproj_file(
            &opts.sdk,
            &opts.namespace,
            &opts.target_framework,
            spec,
            false,
        ),
    );

    // generateClient → Client.cs (resource properties + spec-level root methods).
    files.insert(
        "Client.cs".to_string(),
        render_cli_client_file(spec, &opts.sdk, &opts.namespace, &table, &root),
    );

    // generateTypes → Models.cs without CommandResult — the result type is owned
    // by the Transport.cs runtime; only enums (and any future user types) render.
    // Unlike HTTP mode (Models.cs always emitted), the file is skipped entirely
    // when nothing remains, mirroring the Go CLI emitter's types.go behavior.
    let user_types: Vec<Value> = types_arr
        .iter()
        .filter(|t| s(t, "name") != "CommandResult")
        .cloned()
        .collect();
    if !user_types.is_empty() {
        files.insert(
            "Models.cs".to_string(),
            render_models_file(&user_types, &opts.namespace, &table),
        );
    }

    // generateResources → one <Resource>Service.cs per top-level resource.
    for r in arr(spec, "resources") {
        let (path, content) = render_cli_service_file(r, &opts.namespace, &table, &root);
        files.insert(path, content);
    }

    // generateRuntime → Transport.cs (the CLI subprocess runner: CommandResult +
    // CliException + Transport), replacing the HTTP transport entirely.
    files.insert(
        "Transport.cs".to_string(),
        CLI_TRANSPORT_TEMPLATE
            .replace("__XYD_NAMESPACE__", &opts.namespace)
            .replace("__XYD_BIN__", &json_string(&root.bin))
            .replace("__XYD_BIN_ENV_VAR__", &json_string(&root.env_var))
            .replace("__XYD_TIMEOUT_MS__", &timeout_ms(spec).to_string()),
    );

    files
}

fn render_cli_client_file(
    spec: &Value,
    sdk: &str,
    namespace_name: &str,
    types: Types,
    root: &CliRoot,
) -> String {
    let resources = arr(spec, "resources");
    let class_name = format!("{sdk}Client");

    let mut members: Vec<String> = vec!["private readonly Transport _transport;".to_string()];
    for r in &resources {
        let name = s(r, "name");
        members.push(format!(
            "public {} {} {{ get; }}",
            service_class_name(&[name.to_string()]),
            pascal_case(name)
        ));
    }

    let mut ctor_lines: Vec<String> =
        vec!["_transport = new Transport(binPath, env, cwd, timeoutMs);".to_string()];
    for r in &resources {
        let name = s(r, "name");
        ctor_lines.push(format!(
            "{} = new {}(_transport);",
            pascal_case(name),
            service_class_name(&[name.to_string()])
        ));
    }
    let ctor_doc = format!(
        "Creates a client that runs `{}`. When binPath is null the binary is resolved from the {} environment variable, then PATH.",
        root.bin, root.env_var
    );
    let ctor = format!(
        "{}\npublic {class_name}(string? binPath = null, IReadOnlyDictionary<string, string>? env = null, string? cwd = null, int? timeoutMs = null)\n{{\n{}\n}}",
        cs_doc(Some(&ctor_doc)),
        indent(&ctor_lines.join("\n"))
    );

    let mut parts = vec![members.join("\n"), ctor];
    for method in arr(spec, "methods") {
        parts.push(emit_cli_method(method, types, root));
    }
    let body = parts.join("\n\n");

    let title = spec
        .get("info")
        .and_then(|i| i.get("title"))
        .and_then(Value::as_str)
        .unwrap_or("");
    let doc = cs_doc(Some(&format!(
        "{title} CLI client (drives the `{}` binary).",
        root.bin
    )));
    let decl = format!(
        "{doc}\npublic sealed class {class_name}\n{{\n{}\n}}",
        indent(&body)
    );
    cs_file(&cli_usings(), namespace_name, &[decl])
}

fn render_cli_service_file(
    resource: &Value,
    namespace_name: &str,
    types: Types,
    root: &CliRoot,
) -> (String, String) {
    let name = s(resource, "name").to_string();
    let mut decls: Vec<String> = Vec::new();
    emit_cli_service(
        resource,
        std::slice::from_ref(&name),
        types,
        root,
        &mut decls,
    );
    let class_name = service_class_name(std::slice::from_ref(&name));
    (
        format!("{class_name}.cs"),
        cs_file(&cli_usings(), namespace_name, &decls),
    )
}

fn emit_cli_service(
    resource: &Value,
    segments: &[String],
    types: Types,
    root: &CliRoot,
    decls: &mut Vec<String>,
) {
    let cls = service_class_name(segments);
    let subs = arr(resource, "resources");

    let mut members: Vec<String> = vec!["private readonly Transport _transport;".to_string()];
    for sub in &subs {
        let sub_name = s(sub, "name");
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
        let sub_name = s(sub, "name");
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

    let mut parts = vec![members.join("\n"), ctor];
    for method in arr(resource, "methods") {
        parts.push(emit_cli_method(method, types, root));
    }
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
        let mut seg = segments.to_vec();
        seg.push(s(sub, "name").to_string());
        emit_cli_service(sub, &seg, types, root, decls);
    }
}

/// Whether a TypeRef maps to a C# VALUE type (needing `.Value` behind a `T?`
/// optional): non-string scalars and enum refs (aliases resolved). NOTE: an
/// enum flag value would render its member NAME, not its wire literal — no
/// CLI-mode fixture carries enums yet; revisit with a converter if one does.
fn is_value_type(ref_: Option<&Value>, types: Types) -> bool {
    let Some(r) = ref_ else { return false };
    match r.get("kind").and_then(Value::as_str) {
        Some("scalar") => matches!(
            r.get("scalar").and_then(Value::as_str),
            Some("integer") | Some("number") | Some("boolean")
        ),
        Some("ref") => {
            let Some(name) = r.get("name").and_then(Value::as_str) else {
                return false;
            };
            match types.get(name) {
                Some(named) => match named.get("kind").and_then(Value::as_str) {
                    Some("enum") => true,
                    Some("alias") => is_value_type(named.get("of"), types),
                    _ => false,
                },
                None => false,
            }
        }
        _ => false,
    }
}

/// One argv token expression for a value of the given IR type: strings pass
/// through; everything else goes through the invariant-culture stringifier.
fn value_token(expr: &str, type_ref: Option<&Value>, types: Types) -> String {
    if cs_type(type_ref, types) == "string" {
        return expr.to_string();
    }
    format!("Transport.FormatValue({expr})")
}

/// The non-null value expression for an OPTIONAL parameter inside its
/// `!= null` guard: value types unwrap through `.Value`.
fn optional_expr(arg: &str, type_ref: Option<&Value>, types: Types) -> String {
    if is_value_type(type_ref, types) {
        format!("{arg}.Value")
    } else {
        arg.to_string()
    }
}

/// The `argv.Add` statement(s) for one valued-flag occurrence, honoring the
/// spec's optionSeparator convention (`" "`: two tokens; `"="`: joined).
fn flag_append(flag: &str, value_token: &str, separator: &str) -> String {
    if separator == "=" {
        return format!(
            "argv.Add({} + {value_token});",
            json_string(&format!("{flag}="))
        );
    }
    format!("argv.Add({});\nargv.Add({value_token});", json_string(flag))
}

/// The argv-building statement block for one flag binding.
fn opt_lines(opt: &CliOpt, query_params: &[&Value], separator: &str, types: Types) -> String {
    let flag_lit = json_string(&opt.flag);
    let Some(idx) = opt.param_index else {
        // Constant flag: always appended.
        return format!("argv.Add({flag_lit});");
    };
    let q = query_params[idx];
    let arg = camel_case(s(q, "name"));
    let req = required(q);
    let type_ref = q.get("type");

    if opt.repeat {
        // Array-typed param: repeat the flag per item.
        let item_ref = type_ref.and_then(|t| t.get("items"));
        let token = value_token("value", item_ref, types);
        let append = flag_append(&opt.flag, &token, separator);
        let each = format!("foreach (var value in {arg})\n{{\n{}\n}}", indent(&append));
        if req {
            return each;
        }
        return format!("if ({arg} != null)\n{{\n{}\n}}", indent(&each));
    }
    match opt.encoding {
        Encoding::Boolean => {
            // Bare flag, appended only when the value is true.
            let cond = if req {
                arg.clone()
            } else {
                format!("{arg} == true")
            };
            format!(
                "if ({cond})\n{{\n{}\n}}",
                indent(&format!("argv.Add({flag_lit});"))
            )
        }
        Encoding::Json => {
            let append = flag_append(&opt.flag, &format!("Transport.JsonArg({arg})"), separator);
            if req {
                append
            } else {
                format!("if ({arg} != null)\n{{\n{}\n}}", indent(&append))
            }
        }
        _ => {
            if req {
                let token = value_token(&arg, type_ref, types);
                flag_append(&opt.flag, &token, separator)
            } else {
                let expr = optional_expr(&arg, type_ref, types);
                let token = value_token(&expr, type_ref, types);
                let append = flag_append(&opt.flag, &token, separator);
                format!("if ({arg} != null)\n{{\n{}\n}}", indent(&append))
            }
        }
    }
}

fn emit_cli_method(method: &Value, types: Types, root: &CliRoot) -> String {
    let plan = CliPlan::for_method(method).unwrap_or_else(|e| panic!("emitter \"dotnet\": {e}"));
    let name = method_name(s(method, "action"));
    let path_params = arr(method, "pathParams");
    let query_params = arr(method, "queryParams");

    // --- signature: required args, then optional args, then CancellationToken ---
    let mut required_args: Vec<String> = Vec::new();
    let mut optional_args: Vec<String> = Vec::new();
    for p in path_params.iter().chain(query_params.iter()) {
        let t = cs_type(p.get("type"), types);
        let arg = camel_case(s(p, "name"));
        if required(p) {
            required_args.push(format!("{t} {arg}"));
        } else {
            optional_args.push(format!("{} {arg} = null", nullable(&t)));
        }
    }
    let mut args = required_args;
    args.extend(optional_args);
    args.push("CancellationToken cancellationToken = default".to_string());

    // --- body statements ------------------------------------------------------
    let mut lines: Vec<String> = Vec::new();

    // Required scalar-string guards (same discipline as the HTTP emitter).
    for a in &plan.args {
        let p = path_params[a.param_index];
        if a.required && !a.variadic && cs_type(p.get("type"), types) == "string" {
            let arg = camel_case(s(p, "name"));
            lines.push(format!(
                "if (string.IsNullOrEmpty({arg}))\n{{\n{}\n}}",
                indent(&format!(
                    "throw new ArgumentException(\"Expected a non-empty value for {arg}.\", nameof({arg}));"
                ))
            ));
        }
    }

    // argv: command tokens, then positionals, then flags.
    if plan.command.is_empty() {
        lines.push("var argv = new List<string>();".to_string());
    } else {
        let tokens = plan
            .command
            .iter()
            .map(|t| json_string(t))
            .collect::<Vec<_>>()
            .join(", ");
        lines.push(format!("var argv = new List<string> {{ {tokens} }};"));
    }
    for a in &plan.args {
        let p = path_params[a.param_index];
        let arg = camel_case(s(p, "name"));
        let type_ref = p.get("type");
        if a.variadic {
            let item_ref = type_ref.and_then(|t| t.get("items"));
            let token = value_token("value", item_ref, types);
            let each = format!(
                "foreach (var value in {arg})\n{{\n{}\n}}",
                indent(&format!("argv.Add({token});"))
            );
            if a.required {
                lines.push(each);
            } else {
                lines.push(format!("if ({arg} != null)\n{{\n{}\n}}", indent(&each)));
            }
        } else if a.required {
            lines.push(format!("argv.Add({});", value_token(&arg, type_ref, types)));
        } else {
            // Optional positional: null means "omitted".
            let expr = optional_expr(&arg, type_ref, types);
            let token = value_token(&expr, type_ref, types);
            lines.push(format!(
                "if ({arg} != null)\n{{\n{}\n}}",
                indent(&format!("argv.Add({token});"))
            ));
        }
    }
    for opt in &plan.opts {
        lines.push(opt_lines(opt, &query_params, &root.option_separator, types));
    }
    lines.push(
        "return await _transport.RunAsync(argv, cancellationToken).ConfigureAwait(false);"
            .to_string(),
    );

    let doc = cs_doc(method.get("description").and_then(Value::as_str));
    let head = if doc.is_empty() {
        String::new()
    } else {
        format!("{doc}\n")
    };
    format!(
        "{head}public async Task<CommandResult> {name}({})\n{{\n{}\n}}",
        args.join(", "),
        indent(&lines.join("\n"))
    )
}
