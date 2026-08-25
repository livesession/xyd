//! CLI-mode generator: a spec with a root `x-cli` block (from
//! xyd_opencli2opensdk) becomes a Java SDK that SPAWNS the real CLI binary —
//! method bodies assemble argv from the x-cli binding (via the shared
//! `CliPlan`) and call the vendored `CliTransport` instead of the HTTP
//! Transport. HTTP-only machinery (Transport.java, the ApiException family,
//! pagination containers, tests_gen) is never touched in this mode.

use std::collections::BTreeMap;

use serde_json::Value;
use xyd_opensdk_cli_common::{CliOpt, CliPlan, CliRoot, Encoding};

use crate::ir::{arr_field, bool_field, build_types, str_field};
use crate::javatype::java_type;
use crate::javawriter::{java_doc, java_file};
use crate::jsrt::{camel_case, java_method_name, json_str, service_type_name};
use crate::model::{render_type_files, GenFile};
use crate::plan::plan_operation;
use crate::project::{pom_xml, resolve_java_options, JavaCtx};
use crate::runtime::json_file;
use crate::service::{params_file, plan_params};

const CLI_TRANSPORT_TEMPLATE: &str = include_str!("cli_transport_template.java.txt");
const CLI_COMMAND_RESULT: &str = include_str!("cli_command_result.java.txt");
const CLI_EXCEPTION: &str = include_str!("cli_exception.java.txt");

/// The params-class qualifier for spec-level root methods (`ClientStatusParams`).
const CLIENT_SEGMENT: &str = "client";

fn timeout_ms(spec: &Value) -> u64 {
    spec.get("sdk")
        .and_then(|s| s.get("timeout"))
        .and_then(|t| t.get("defaultTimeoutMs"))
        .and_then(|v| v.as_u64())
        .unwrap_or(60000)
}

pub fn generate_cli(spec: &Value) -> BTreeMap<String, String> {
    let root = CliRoot::parse(spec).unwrap_or_else(|e| panic!("emitter \"java\": {e}"));
    let types_map = build_types(spec);
    let ctx = resolve_java_options(spec, types_map);

    let mut files: BTreeMap<String, String> = BTreeMap::new();
    files.insert("pom.xml".to_string(), pom_xml(&ctx, spec));
    files.insert(
        format!("{}Client.java", ctx.src_dir),
        render_cli_client_file(spec, &ctx, &root),
    );

    // generateTypes minus CommandResult — the result type is owned by the
    // vendored runtime (mirrors the Go emitter's filter).
    let types: Vec<Value> = spec
        .get("types")
        .and_then(|t| t.as_array())
        .map(|a| {
            a.iter()
                .filter(|t| str_field(t, "name") != Some("CommandResult"))
                .cloned()
                .collect()
        })
        .unwrap_or_default();
    for f in render_type_files(&types, &ctx) {
        files.insert(f.path, f.content);
    }

    // Root-method params builders (qualifier "Client").
    let client_seg = vec![CLIENT_SEGMENT.to_string()];
    for m in arr_field(spec, "methods") {
        if let Some(f) = params_file(spec, &client_seg, m, &ctx) {
            files.insert(f.path, f.content);
        }
    }

    // Resource services + params builders.
    let mut gen_files: Vec<GenFile> = Vec::new();
    for r in arr_field(spec, "resources") {
        let name = str_field(r, "name").unwrap_or("").to_string();
        walk_cli_resource(r, std::slice::from_ref(&name), &ctx, &root, &mut gen_files);
    }
    for f in gen_files {
        files.insert(f.path, f.content);
    }

    // The vendored CLI runtime: the shared Json codec, the runtime-owned
    // CommandResult, the CliException, and the CliTransport prologue.
    let json = json_file(&ctx);
    files.insert(json.path, json.content);
    files.insert(
        format!("{}CommandResult.java", ctx.src_dir),
        java_file(&ctx.full_package, &[], CLI_COMMAND_RESULT),
    );
    files.insert(
        format!("{}CliException.java", ctx.src_dir),
        java_file(&ctx.full_package, &[], CLI_EXCEPTION),
    );
    files.insert(
        format!("{}CliTransport.java", ctx.src_dir),
        java_file(
            &ctx.full_package,
            &cli_transport_imports(),
            &CLI_TRANSPORT_TEMPLATE
                .trim_end_matches('\n')
                .replace("__XYD_BIN__", &json_str(&root.bin))
                .replace("__XYD_BIN_ENV_VAR__", &json_str(&root.env_var))
                .replace("__XYD_TIMEOUT_MS__", &timeout_ms(spec).to_string()),
        ),
    );
    files
}

fn cli_transport_imports() -> Vec<String> {
    [
        "java.io.ByteArrayOutputStream",
        "java.io.File",
        "java.io.IOException",
        "java.io.InputStream",
        "java.nio.charset.StandardCharsets",
        "java.util.ArrayList",
        "java.util.LinkedHashMap",
        "java.util.List",
        "java.util.Map",
        "java.util.concurrent.TimeUnit",
    ]
    .iter()
    .map(|s| s.to_string())
    .collect()
}

fn render_cli_client_file(spec: &Value, ctx: &JavaCtx, root: &CliRoot) -> String {
    let resources = arr_field(spec, "resources");
    let root_methods = arr_field(spec, "methods");
    let rname = |r: &Value| str_field(r, "name").unwrap_or("").to_string();

    let mut field_lines: Vec<String> = vec!["  private final CliTransport transport;".to_string()];
    for r in &resources {
        let n = rname(r);
        field_lines.push(format!(
            "  private final {} {};",
            service_type_name(std::slice::from_ref(&n)),
            camel_case(&n)
        ));
    }

    let mut ctor_lines: Vec<String> = vec![
        "    this.transport = new CliTransport(builder.binPath, builder.env, builder.cwd, builder.timeoutMs);"
            .to_string(),
    ];
    for r in &resources {
        let n = rname(r);
        ctor_lines.push(format!(
            "    this.{} = new {}(transport);",
            camel_case(&n),
            service_type_name(std::slice::from_ref(&n))
        ));
    }
    let ctor = format!(
        "  private Client(Builder builder) {{\n{}\n  }}",
        ctor_lines.join("\n")
    );

    let accessors = resources
        .iter()
        .map(|r| {
            let n = rname(r);
            format!(
                "  public {} {}() {{\n    return {};\n  }}",
                service_type_name(std::slice::from_ref(&n)),
                camel_case(&n),
                camel_case(&n)
            )
        })
        .collect::<Vec<_>>()
        .join("\n\n");

    let client_seg = vec![CLIENT_SEGMENT.to_string()];
    let methods = root_methods
        .iter()
        .map(|m| cli_method_def(&client_seg, m, ctx, root))
        .collect::<Vec<_>>()
        .join("\n\n");

    let builder = [
        "  public static final class Builder {".to_string(),
        "    private String binPath;".to_string(),
        "    private final Map<String, String> env = new LinkedHashMap<>();".to_string(),
        "    private String cwd;".to_string(),
        "    private Long timeoutMs;".to_string(),
        "".to_string(),
        format!(
            "    /** Override the CLI binary path (highest precedence — above the {} env var and the PATH lookup). */",
            root.env_var
        ),
        "    public Builder binPath(String binPath) {".to_string(),
        "      this.binPath = binPath;".to_string(),
        "      return this;".to_string(),
        "    }".to_string(),
        "".to_string(),
        "    /** Add an environment variable on top of the inherited process environment for the child CLI. */"
            .to_string(),
        "    public Builder env(String key, String value) {".to_string(),
        "      this.env.put(key, value);".to_string(),
        "      return this;".to_string(),
        "    }".to_string(),
        "".to_string(),
        "    /** Set the child CLI process's working directory (default: inherited). */".to_string(),
        "    public Builder cwd(String cwd) {".to_string(),
        "      this.cwd = cwd;".to_string(),
        "      return this;".to_string(),
        "    }".to_string(),
        "".to_string(),
        "    /** Bound one CLI invocation in milliseconds; on expiry the child is killed. */".to_string(),
        "    public Builder timeoutMs(long timeoutMs) {".to_string(),
        "      this.timeoutMs = timeoutMs;".to_string(),
        "      return this;".to_string(),
        "    }".to_string(),
        "".to_string(),
        "    public Client build() {".to_string(),
        "      return new Client(this);".to_string(),
        "    }".to_string(),
        "  }".to_string(),
    ]
    .join("\n");

    let title = str_field(spec.get("info").unwrap_or(&Value::Null), "title").unwrap_or("");
    let doc = java_doc(
        Some(&format!(
            "Client drives the {title} CLI (the `{}` binary; override with the {} env var or binPath).",
            root.bin, root.env_var
        )),
        "",
    );
    let head = if doc.is_empty() {
        String::new()
    } else {
        format!("{doc}\n")
    };

    let members = [
        field_lines.join("\n"),
        ctor,
        accessors,
        methods,
        "  public static Builder builder() {\n    return new Builder();\n  }".to_string(),
        builder,
    ]
    .into_iter()
    .filter(|s| !s.is_empty())
    .collect::<Vec<_>>()
    .join("\n\n");

    let body = format!("{head}public final class Client {{\n{members}\n}}");
    let mut imports: Vec<String> = vec![
        "java.util.LinkedHashMap".to_string(),
        "java.util.Map".to_string(),
    ];
    if !root_methods.is_empty() {
        imports.push("java.util.ArrayList".to_string());
        imports.push("java.util.List".to_string());
    }
    java_file(&ctx.full_package, &imports, &body)
}

fn walk_cli_resource(
    resource: &Value,
    segments: &[String],
    ctx: &JavaCtx,
    root: &CliRoot,
    files: &mut Vec<GenFile>,
) {
    files.push(cli_service_file(resource, segments, ctx, root));
    for method in arr_field(resource, "methods") {
        if let Some(pf) = params_file(resource, segments, method, ctx) {
            files.push(pf);
        }
    }
    for sub in arr_field(resource, "resources") {
        let mut seg = segments.to_vec();
        seg.push(str_field(sub, "name").unwrap_or("").to_string());
        walk_cli_resource(sub, &seg, ctx, root, files);
    }
}

fn cli_service_file(
    resource: &Value,
    segments: &[String],
    ctx: &JavaCtx,
    root: &CliRoot,
) -> GenFile {
    let cls = service_type_name(segments);
    let subs = arr_field(resource, "resources");
    let methods_v = arr_field(resource, "methods");

    let mut field_lines = vec!["  private final CliTransport transport;".to_string()];
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
        "  {cls}(CliTransport transport) {{\n{}\n  }}",
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

    let methods: Vec<String> = methods_v
        .iter()
        .map(|m| cli_method_def(segments, m, ctx, root))
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

    let mut imports: Vec<String> = Vec::new();
    if !methods_v.is_empty() {
        imports.push("java.util.ArrayList".to_string());
        imports.push("java.util.List".to_string());
    }
    GenFile {
        path: format!("{}{cls}.java", ctx.src_dir),
        content: java_file(&ctx.full_package, &imports, &body),
    }
}

/// The IR ref resolves to a generated Java enum (which must render its wire
/// literal via `value()`, never the member identifier).
fn is_enum_ref(type_ref: Option<&Value>, ctx: &JavaCtx) -> bool {
    let Some(r) = type_ref else { return false };
    if r.get("kind").and_then(|k| k.as_str()) != Some("ref") {
        return false;
    }
    r.get("name")
        .and_then(|n| n.as_str())
        .and_then(|n| ctx.types.get(n))
        .and_then(|t| t.get("kind"))
        .and_then(|k| k.as_str())
        == Some("enum")
}

/// One argv token expression for a value of the given IR type — Java's
/// `String.valueOf` stringification (`0.5` → `"0.5"`) for non-strings;
/// generated enums render their wire value.
fn token_expr(expr: &str, type_ref: Option<&Value>, ctx: &JavaCtx) -> String {
    if java_type(type_ref, &ctx.types) == "String" {
        return expr.to_string();
    }
    if is_enum_ref(type_ref, ctx) {
        return format!("{expr}.value()");
    }
    format!("String.valueOf({expr})")
}

/// Append lines for one valued flag occurrence, honoring the spec's
/// optionSeparator convention (`" "` = separate tokens; `"="` = joined).
fn flag_append(flag: &str, value_token: &str, separator: &str, indent: &str) -> String {
    if separator == "=" {
        return format!(
            "{indent}argv.add({} + {value_token});",
            json_str(&format!("{flag}="))
        );
    }
    format!(
        "{indent}argv.add({});\n{indent}argv.add({value_token});",
        json_str(flag)
    )
}

/// The argv-building lines for one flag binding.
fn opt_lines(opt: &CliOpt, query_params: &[&Value], separator: &str, ctx: &JavaCtx) -> String {
    let flag_lit = json_str(&opt.flag);
    let Some(idx) = opt.param_index else {
        // Constant flag: always appended.
        return format!("    argv.add({flag_lit});");
    };
    let q = query_params[idx];
    let member = camel_case(str_field(q, "name").unwrap_or(""));
    let required = bool_field(q, "required");
    let type_ref = q.get("type");

    if opt.repeat {
        // Array-typed param: repeat the flag per item.
        let items = type_ref.and_then(|t| t.get("items"));
        let elem_ty = java_type(items, &ctx.types);
        if required {
            let append = flag_append(
                &opt.flag,
                &token_expr("value", items, ctx),
                separator,
                "      ",
            );
            return format!("    for ({elem_ty} value : params.{member}()) {{\n{append}\n    }}");
        }
        let append = flag_append(
            &opt.flag,
            &token_expr("value", items, ctx),
            separator,
            "        ",
        );
        return format!(
            "    params.{member}().ifPresent(values -> {{\n      for ({elem_ty} value : values) {{\n{append}\n      }}\n    }});"
        );
    }
    match opt.encoding {
        Encoding::Boolean => {
            // Bare flag, only when true (the separator convention never applies).
            if required {
                format!("    if (params.{member}()) {{\n      argv.add({flag_lit});\n    }}")
            } else {
                format!("    if (params.{member}().orElse(false)) {{\n      argv.add({flag_lit});\n    }}")
            }
        }
        Encoding::Json => {
            // One compact-JSON token via the vendored Json codec.
            if required {
                flag_append(
                    &opt.flag,
                    &format!("Json.encode(params.{member}())"),
                    separator,
                    "    ",
                )
            } else {
                let append = flag_append(&opt.flag, "Json.encode(value)", separator, "      ");
                format!("    params.{member}().ifPresent(value -> {{\n{append}\n    }});")
            }
        }
        _ => {
            if required {
                flag_append(
                    &opt.flag,
                    &token_expr(&format!("params.{member}()"), type_ref, ctx),
                    separator,
                    "    ",
                )
            } else {
                let append = flag_append(
                    &opt.flag,
                    &token_expr("value", type_ref, ctx),
                    separator,
                    "      ",
                );
                format!("    params.{member}().ifPresent(value -> {{\n{append}\n    }});")
            }
        }
    }
}

fn cli_method_def(
    qual_segments: &[String],
    method: &Value,
    ctx: &JavaCtx,
    root: &CliRoot,
) -> String {
    let cli = CliPlan::for_method(method).unwrap_or_else(|e| panic!("emitter \"java\": {e}"));
    let plan = plan_operation(method, &ctx.types);
    let name = java_method_name(str_field(method, "action").unwrap_or(""));
    let path_params = &plan.path;
    let params = plan_params(qual_segments, method, &plan, ctx);

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

    // Required scalar-string guards (same discipline as the Go CLI emitter).
    for a in &cli.args {
        let p = path_params[a.param_index];
        if a.required && java_type(p.get("type"), &ctx.types) == "String" {
            let n = camel_case(str_field(p, "name").unwrap_or(""));
            lines.push(format!(
                "    if ({n} == null || {n}.isEmpty()) {{\n      throw new IllegalArgumentException({});\n    }}",
                json_str(&format!(
                    "missing required {} parameter",
                    str_field(p, "name").unwrap_or("")
                ))
            ));
        }
    }

    // argv: command tokens, then positionals, then flags.
    lines.push("    List<String> argv = new ArrayList<>();".to_string());
    for t in &cli.command {
        lines.push(format!("    argv.add({});", json_str(t)));
    }
    for a in &cli.args {
        let p = path_params[a.param_index];
        let var = camel_case(str_field(p, "name").unwrap_or(""));
        let type_ref = p.get("type");
        if a.variadic {
            let items = type_ref.and_then(|t| t.get("items"));
            let elem_ty = java_type(items, &ctx.types);
            let token = token_expr("value", items, ctx);
            lines.push(format!(
                "    for ({elem_ty} value : {var}) {{\n      argv.add({token});\n    }}"
            ));
        } else if a.required {
            lines.push(format!(
                "    argv.add({});",
                token_expr(&var, type_ref, ctx)
            ));
        } else {
            // Optional positional: null (or an empty string) means "omitted".
            let cond = if java_type(type_ref, &ctx.types) == "String" {
                format!("{var} != null && !{var}.isEmpty()")
            } else {
                format!("{var} != null")
            };
            lines.push(format!(
                "    if ({cond}) {{\n      argv.add({});\n    }}",
                token_expr(&var, type_ref, ctx)
            ));
        }
    }
    for opt in &cli.opts {
        lines.push(opt_lines(opt, &plan.query, &root.option_separator, ctx));
    }
    lines.push("    return transport.run(argv);".to_string());

    let doc = java_doc(str_field(method, "description"), "  ");
    let head = if doc.is_empty() {
        String::new()
    } else {
        format!("{doc}\n")
    };
    format!(
        "{head}  public CommandResult {name}({}) {{\n{}\n  }}",
        args.join(", "),
        lines.join("\n")
    )
}
