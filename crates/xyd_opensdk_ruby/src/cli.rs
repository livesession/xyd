//! CLI-mode generator: a spec with a root `x-cli` block (from
//! xyd_opencli2opensdk) becomes a Ruby SDK that SPAWNS the real CLI binary —
//! method bodies assemble argv from the x-cli binding (via the shared
//! `CliPlan`) and call the vendored `<Module>::Runner` prologue
//! (`lib/<pkg>/runner.rb`) instead of the net/http transport. HTTP-only
//! machinery (plan_operation, pagination, idempotency, tests_gen) is never
//! touched in this mode.
//!
//! `CommandResult` is OWNED by the runner template (mirroring the Go
//! emitter's runner package): the `CommandResult` NamedType is skipped from
//! models rendering, and `lib/<pkg>/models.rb` is emitted only when other
//! named types remain.

use std::collections::BTreeMap;

use serde_json::Value;
use xyd_opensdk_cli_common::{CliOpt, CliPlan, CliRoot, Encoding};

use crate::naming::{pascal_case, ruby_gem_name, ruby_method_name, snake_case};
use crate::project::render_gemspec_cli;
use crate::rbtype::rb_doc_type;
use crate::service::resource_class_name;
use crate::writer::{block, indent, rb_comment, rb_string};

const CLI_RUNNER_RB: &str = include_str!("cli_runner_template.rb.txt");

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

fn type_kind(p: &Value) -> &str {
    p.get("type")
        .and_then(|t| t.get("kind"))
        .and_then(|k| k.as_str())
        .unwrap_or("")
}

fn is_string_scalar(p: &Value) -> bool {
    type_kind(p) == "scalar"
        && p.get("type")
            .and_then(|t| t.get("scalar"))
            .and_then(|x| x.as_str())
            == Some("string")
}

/// Whether an array-typed param's items are string scalars (unknown items
/// stringify with `.to_s`, like the Go emitter's `fmt.Sprintf` fallback).
fn items_are_string(p: &Value) -> bool {
    p.get("type")
        .and_then(|t| t.get("items"))
        .map(|i| {
            i.get("kind").and_then(|k| k.as_str()) == Some("scalar")
                && i.get("scalar").and_then(|x| x.as_str()) == Some("string")
        })
        .unwrap_or(false)
}

/// One argv token expression for a value of the given kind: strings pass
/// through, everything else stringifies (`0.5.to_s == "0.5"`).
fn token_expr(expr: &str, yields_string: bool) -> String {
    if yields_string {
        expr.to_string()
    } else {
        format!("{expr}.to_s")
    }
}

/// One valued flag occurrence, honoring the spec's optionSeparator
/// convention: `" "` pushes flag and value as SEPARATE argv tokens; `"="`
/// joins them into one token (interpolation stringifies the value).
fn flag_push(flag: &str, expr: &str, yields_string: bool, separator: &str) -> String {
    if separator == "=" {
        return format!("argv << \"{flag}=#{{{expr}}}\"");
    }
    format!(
        "argv.push({}, {})",
        rb_string(flag),
        token_expr(expr, yields_string)
    )
}

pub fn generate_cli(spec: &Value) -> BTreeMap<String, String> {
    let root = CliRoot::parse(spec).unwrap_or_else(|e| panic!("emitter \"ruby\": {e}"));
    let title = spec
        .get("info")
        .and_then(|i| i.get("title"))
        .and_then(|t| t.as_str())
        .unwrap_or("");
    let pkg = ruby_gem_name(title);
    let module_name = pascal_case(title);

    let models = render_cli_models_file(spec, &module_name);

    let mut files: BTreeMap<String, String> = BTreeMap::new();
    let mut put = |path: String, content: String| {
        let c = crate::with_header(&path, content);
        files.insert(path, c);
    };

    // generateProject — CLI-mode manifest + entrypoint.
    put(format!("{pkg}.gemspec"), render_gemspec_cli(spec, &pkg));
    put(
        format!("lib/{pkg}.rb"),
        render_cli_entrypoint(spec, &pkg, models.is_some()),
    );
    // generateClient — root methods live on Client next to resource readers.
    put(
        format!("lib/{pkg}/client.rb"),
        render_cli_client_file(spec, &module_name, &root),
    );
    // generateTypes — without CommandResult (owned by the runner template).
    if let Some(models) = models {
        put(format!("lib/{pkg}/models.rb"), models);
    }
    // generateResources
    for resource in arr(spec, "resources") {
        let (path, content) = render_cli_service_file(resource, &module_name, &pkg, &root);
        put(path, content);
    }
    // generateRuntime — the vendored subprocess runner.
    put(
        format!("lib/{pkg}/runner.rb"),
        CLI_RUNNER_RB
            .replace("__XYD_MODULE__", &module_name)
            .replace("__XYD_BIN__", &rb_string(&root.bin))
            .replace("__XYD_BIN_ENV_VAR__", &rb_string(&root.env_var))
            .replace("__XYD_TIMEOUT_MS__", &timeout_ms(spec).to_string()),
    );
    files
}

/// models.rb without CommandResult — the result type is owned by the runner
/// template; only enums (and any future user types) render. None when nothing
/// remains.
fn render_cli_models_file(spec: &Value, module_name: &str) -> Option<String> {
    let types: Vec<Value> = spec
        .get("types")?
        .as_array()?
        .iter()
        .filter(|t| s(t, "name") != "CommandResult")
        .cloned()
        .collect();
    if types.is_empty() {
        return None;
    }
    let filtered = serde_json::json!({ "types": types });
    Some(crate::model::render_models_file(&filtered, module_name))
}

fn render_cli_entrypoint(spec: &Value, pkg: &str, has_models: bool) -> String {
    let mut requires = vec![
        "require \"json\"".to_string(),
        "require \"open3\"".to_string(),
        String::new(),
        format!("require_relative {}", rb_string(&format!("{pkg}/runner"))),
    ];
    if has_models {
        requires.push(format!(
            "require_relative {}",
            rb_string(&format!("{pkg}/models"))
        ));
    }
    for r in arr(spec, "resources") {
        let sn = snake_case(s(r, "name"));
        requires.push(format!(
            "require_relative {}",
            rb_string(&format!("{pkg}/resources/{sn}"))
        ));
    }
    requires.push(format!(
        "require_relative {}",
        rb_string(&format!("{pkg}/client"))
    ));
    format!("{}\n", requires.join("\n"))
}

fn render_cli_client_file(spec: &Value, module_name: &str, root: &CliRoot) -> String {
    let resources = arr(spec, "resources");
    let mut members: Vec<String> = Vec::new();

    if !resources.is_empty() {
        let readers: Vec<String> = resources
            .iter()
            .map(|r| format!(":{}", snake_case(s(r, "name"))))
            .collect();
        members.push(format!("attr_reader {}", readers.join(", ")));
    }

    let mut ctor = vec![
        rb_comment(&format!(
            "Creates a client that runs `{}` (override with the {} env var or bin_path:).",
            root.bin, root.env_var
        )),
        "def initialize(bin_path: nil, env: nil, cwd: nil, timeout_ms: nil)".to_string(),
        indent(&format!(
            "@runner = {module_name}::Runner.new(bin_path: bin_path, env: env, cwd: cwd, timeout_ms: timeout_ms)"
        )),
    ];
    for r in &resources {
        let sn = snake_case(s(r, "name"));
        ctor.push(indent(&format!(
            "@{sn} = {module_name}::Resources::{}.new(@runner)",
            resource_class_name(&[s(r, "name").to_string()])
        )));
    }
    ctor.push("end".to_string());
    members.push(ctor.join("\n"));

    // Spec-level root methods become methods on the Client class.
    for method in arr(spec, "methods") {
        members.push(emit_cli_method(method, root));
    }

    let title = spec
        .get("info")
        .and_then(|i| i.get("title"))
        .and_then(|t| t.as_str())
        .unwrap_or("");
    let doc = rb_comment(&format!(
        "Client drives the {title} CLI (the `{}` binary).",
        root.bin
    ));
    let client_class = format!("{doc}\n{}", block("class Client", &members.join("\n\n")));
    format!(
        "{}\n",
        block(&format!("module {module_name}"), &client_class)
    )
}

/// Emit one top-level resource (and its whole nested subtree) into one file.
fn render_cli_service_file(
    resource: &Value,
    module_name: &str,
    pkg: &str,
    root: &CliRoot,
) -> (String, String) {
    let name = s(resource, "name").to_string();
    let mut classes: Vec<String> = Vec::new();
    emit_cli_resource(resource, std::slice::from_ref(&name), root, &mut classes);
    let content = format!(
        "{}\n",
        block(
            &format!("module {module_name}"),
            &block("module Resources", &classes.join("\n\n"))
        )
    );
    let path = format!("lib/{pkg}/resources/{}.rb", snake_case(&name));
    (path, content)
}

fn emit_cli_resource(resource: &Value, segments: &[String], root: &CliRoot, out: &mut Vec<String>) {
    let cls = resource_class_name(segments);
    let subs = arr(resource, "resources");

    let mut members: Vec<String> = Vec::new();
    if !subs.is_empty() {
        let readers: Vec<String> = subs
            .iter()
            .map(|sub| format!(":{}", snake_case(s(sub, "name"))))
            .collect();
        members.push(format!("attr_reader {}", readers.join(", ")));
    }

    let mut ctor = vec![
        "# @api private".to_string(),
        "def initialize(runner)".to_string(),
        indent("@runner = runner"),
    ];
    for sub in &subs {
        let sn = snake_case(s(sub, "name"));
        let mut child_segs = segments.to_vec();
        child_segs.push(s(sub, "name").to_string());
        ctor.push(indent(&format!(
            "@{sn} = {}.new(runner)",
            resource_class_name(&child_segs)
        )));
    }
    ctor.push("end".to_string());
    members.push(ctor.join("\n"));

    for method in arr(resource, "methods") {
        members.push(emit_cli_method(method, root));
    }

    let doc = rb_comment(s(resource, "description"));
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
        child_segs.push(s(sub, "name").to_string());
        emit_cli_resource(sub, &child_segs, root, out);
    }
}

fn emit_cli_method(method: &Value, root: &CliRoot) -> String {
    let plan = CliPlan::for_method(method).unwrap_or_else(|e| panic!("emitter \"ruby\": {e}"));
    let name = ruby_method_name(s(method, "action"));
    let path_params = arr(method, "pathParams");
    let query_params = arr(method, "queryParams");

    // Signature: positional path params (IR order), then keyword args for
    // query params — the emitter's existing HTTP convention.
    let mut params: Vec<String> = Vec::new();
    for p in &path_params {
        let local = snake_case(s(p, "name"));
        let required = p.get("required").and_then(|r| r.as_bool()) != Some(false);
        params.push(if required {
            local
        } else {
            format!("{local} = nil")
        });
    }
    for q in &query_params {
        let local = snake_case(s(q, "name"));
        let required = q.get("required").and_then(|r| r.as_bool()) == Some(true);
        params.push(if required {
            format!("{local}:")
        } else {
            format!("{local}: nil")
        });
    }
    let signature = if params.is_empty() {
        format!("def {name}")
    } else {
        format!("def {name}({})", params.join(", "))
    };

    let mut lines: Vec<String> = Vec::new();

    // Required string-scalar guards (same discipline as the HTTP emitter).
    for a in &plan.args {
        let p = path_params[a.param_index];
        if a.required && is_string_scalar(p) {
            let local = snake_case(s(p, "name"));
            lines.push(format!(
                "raise ArgumentError, \"Expected a non-empty value for `{local}`\" if {local}.nil? || {local}.to_s.empty?"
            ));
            lines.push(String::new());
        }
    }

    // argv: command tokens, then positionals in args order, then flags in
    // opts order.
    let command_tokens = plan
        .command
        .iter()
        .map(|t| rb_string(t))
        .collect::<Vec<_>>()
        .join(", ");
    lines.push(format!("argv = [{command_tokens}]"));
    for a in &plan.args {
        let p = path_params[a.param_index];
        let local = snake_case(s(p, "name"));
        if a.variadic {
            // Array-typed positional: items spread as consecutive tokens.
            let token = token_expr("value", items_are_string(p));
            lines.push(format!(
                "({local} || []).each do |value|\n  argv << {token}\nend"
            ));
        } else {
            let token = token_expr(&local, is_string_scalar(p));
            if a.required {
                lines.push(format!("argv << {token}"));
            } else {
                lines.push(format!("argv << {token} unless {local}.nil?"));
            }
        }
    }
    for opt in &plan.opts {
        lines.push(opt_lines(opt, &query_params, &root.option_separator));
    }
    lines.push("@runner.run(argv)".to_string());

    let doc = cli_method_doc(method, &plan, &path_params, &query_params, root);
    format!("{doc}\n{}", block(&signature, &lines.join("\n")))
}

/// The argv-building line(s) for one flag binding.
fn opt_lines(opt: &CliOpt, query_params: &[&Value], separator: &str) -> String {
    let flag = &opt.flag;
    let Some(idx) = opt.param_index else {
        // Constant flag: always appended.
        return format!("argv << {}", rb_string(flag));
    };
    let q = query_params[idx];
    let local = snake_case(s(q, "name"));
    let required = q.get("required").and_then(|r| r.as_bool()) == Some(true);

    if opt.repeat {
        // Array-typed param: repeat the flag per item (nil ranges zero times,
        // like a nil Go slice).
        let push = flag_push(flag, "value", items_are_string(q), separator);
        return format!("({local} || []).each do |value|\n  {push}\nend");
    }
    match opt.encoding {
        Encoding::Boolean => {
            // Bare flag only when true (nil and false both omit).
            format!("argv << {} if {local}", rb_string(flag))
        }
        Encoding::Json => {
            // Single compact-JSON token.
            let push = flag_push(flag, &format!("JSON.generate({local})"), true, separator);
            if required && type_kind(q) != "any" {
                push
            } else {
                format!("{push} unless {local}.nil?")
            }
        }
        _ => {
            let push = flag_push(flag, &local, is_string_scalar(q), separator);
            if required {
                push
            } else {
                format!("{push} unless {local}.nil?")
            }
        }
    }
}

fn cli_method_doc(
    method: &Value,
    plan: &CliPlan,
    path_params: &[&Value],
    query_params: &[&Value],
    root: &CliRoot,
) -> String {
    let usage = std::iter::once(root.bin.clone())
        .chain(plan.command.iter().cloned())
        .collect::<Vec<_>>()
        .join(" ");
    let mut lines: Vec<String> = Vec::new();
    let description = s(method, "description").trim();
    if description.is_empty() {
        lines.push(format!("Runs `{usage}`."));
    } else {
        lines.push(description.to_string());
    }
    lines.push(String::new());
    for p in path_params.iter().chain(query_params.iter()) {
        lines.push(format!(
            "@param {} [{}]",
            snake_case(s(p, "name")),
            rb_doc_type(p.get("type"))
        ));
    }
    // primaryResponse is always a CommandResult ref in CLI mode; the class
    // lives at module level (runner template), not under Models.
    lines.push("@return [CommandResult]".to_string());
    rb_comment(&lines.join("\n"))
}
