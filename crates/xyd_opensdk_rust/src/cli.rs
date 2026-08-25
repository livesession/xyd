//! CLI-mode generator: a spec with a root `x-cli` block (from
//! xyd_opencli2opensdk) becomes a Rust SDK that SPAWNS the real CLI binary —
//! method bodies assemble argv from the x-cli binding (via the shared
//! `CliPlan`) and call the vendored `runner` module (tokio::process) instead
//! of the HTTP transport. HTTP-only machinery (plan_operation, pagination,
//! idempotency, tests_gen) is never touched in this mode.
//!
//! Deliberate divergences from the Go CLI emitter (documented, not drift):
//! - Params structs REUSE the HTTP emitter's rendering, so every field is
//!   `Option<T>` (Go renders required params as non-Opt fields) — required
//!   valued flags are therefore appended only when `Some`, like every other
//!   flag, matching this emitter's own HTTP-mode discipline.
//! - Timeouts surface as a dedicated `Error::Timeout` variant (Go folds them
//!   into `CliError{ExitCode: -1, Timeout: true}`).
//! - Root-command params structs live in src/client.rs, so the generated
//!   lib.rs re-exports `client::*` (HTTP mode lists Client/ClientBuilder).

use std::collections::BTreeMap;

use serde_json::Value;
use xyd_opensdk_cli_common::{CliOpt, CliPlan, CliRoot, Encoding};

use crate::model::render_cli_models_file;
use crate::naming::{rust_method_name, snake_case};
use crate::project::package_block;
use crate::rstype::rs_type;
use crate::rswriter::{braced, rs_doc, rs_string};
use crate::service::{
    emit_params_struct, params_struct_name, path_arg, resource_class_name, scalar_string,
};

const CLI_ERROR_TEMPLATE: &str = include_str!("cli_error_template.rs.txt");
const CLI_RUNNER_TEMPLATE: &str = include_str!("cli_transport_template.rs.txt");

fn s<'v>(v: &'v Value, key: &str) -> &'v str {
    v.get(key).and_then(|x| x.as_str()).unwrap_or("")
}

fn arr<'v>(v: &'v Value, key: &str) -> Vec<&'v Value> {
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
    let root = CliRoot::parse(spec).unwrap_or_else(|e| panic!("emitter \"rust\": {e}"));
    let crate_ = crate::resolve_crate(spec);
    let edition = "2021";

    let models = render_cli_models_file(spec);
    let has_models = models.is_some();

    let mut files: BTreeMap<String, String> = BTreeMap::new();
    let mut put = |path: &str, content: String| {
        files.insert(path.to_string(), crate::with_header(path, content));
    };

    put("Cargo.toml", render_cli_cargo_toml(spec, &crate_, edition));
    put("src/lib.rs", render_cli_lib_rs(spec, has_models));
    put(
        "src/client.rs",
        render_cli_client_file(spec, &root, has_models),
    );
    if let Some(models) = models {
        put("src/models.rs", models);
    }
    for resource in arr(spec, "resources") {
        let (path, content) = render_cli_service_file(resource, &root, has_models);
        put(&path, content);
    }
    put("src/error.rs", CLI_ERROR_TEMPLATE.to_string());
    put(
        "src/runner.rs",
        CLI_RUNNER_TEMPLATE
            .replace("__XYD_BIN__", &rs_string(&root.bin))
            .replace("__XYD_BIN_ENV_VAR__", &rs_string(&root.env_var))
            .replace("__XYD_TIMEOUT_MS__", &timeout_ms(spec).to_string()),
    );
    files
}

/// Cargo.toml for CLI mode: tokio subprocess runtime only — no reqwest, no
/// uuid, no HTTP deps (the `[package]` block is shared with HTTP mode).
fn render_cli_cargo_toml(spec: &Value, crate_name: &str, edition: &str) -> String {
    // The empty [workspace] table makes the generated project standalone —
    // it can never be captured by an enclosing cargo workspace (including
    // this repo's own crates/ workspace, where the golden trees live).
    format!(
        "{}\n\n[workspace]\n\n# Field docs are OpenAPI descriptions (arbitrary markdown), not Rust doctests.\n[lib]\ndoctest = false\n\n[dependencies]\ntokio = {{ version = \"1\", features = [\"rt-multi-thread\", \"macros\", \"process\", \"time\", \"io-util\"] }}\nserde = {{ version = \"1\", features = [\"derive\"] }}\nserde_json = \"1\"\nthiserror = \"1\"\n",
        package_block(spec, crate_name, edition)
    )
}

fn render_cli_lib_rs(spec: &Value, has_models: bool) -> String {
    let resource_mods: Vec<String> = arr(spec, "resources")
        .iter()
        .map(|r| snake_case(s(r, "name")))
        .collect();

    let mut mod_names = vec!["error".to_string(), "runner".to_string()];
    if has_models {
        mod_names.push("models".to_string());
    }
    mod_names.push("client".to_string());
    mod_names.extend(resource_mods.iter().cloned());
    let mods: Vec<String> = mod_names.iter().map(|m| format!("pub mod {m};")).collect();

    // `client::*` (not just Client/ClientBuilder): root-command params structs
    // live in client.rs and must reach the crate root like resource params do.
    let mut reexports = vec![
        "pub use client::*;".to_string(),
        "pub use error::Error;".to_string(),
    ];
    if has_models {
        reexports.push("pub use models::*;".to_string());
    }
    reexports.push("pub use runner::CommandResult;".to_string());
    reexports.extend(resource_mods.iter().map(|m| format!("pub use {m}::*;")));

    format!(
        "#![allow(dead_code, unused_imports, unused_variables, unused_mut, clippy::all)]\n\n{}\n\n{}\n",
        mods.join("\n"),
        reexports.join("\n")
    )
}

/// The shared use-block for files that call the runner.
fn runner_uses(has_models: bool) -> String {
    let models_use = if has_models {
        "\nuse crate::models::*;"
    } else {
        ""
    };
    format!(
        "use std::sync::Arc;\n\nuse crate::error::Error;{models_use}\nuse crate::runner::{{CommandResult, Runner}};"
    )
}

fn render_cli_client_file(spec: &Value, root: &CliRoot, has_models: bool) -> String {
    let title = spec
        .get("info")
        .and_then(|i| i.get("title"))
        .and_then(|t| t.as_str())
        .unwrap_or("");
    let resources = arr(spec, "resources");

    let mut impl_members: Vec<String> = Vec::new();
    impl_members.push(format!(
        "{}\n{}",
        rs_doc(Some(&format!(
            "Creates a client that runs `{}` (override with the {} env var or `ClientBuilder::bin_path`).",
            root.bin, root.env_var
        ))),
        braced(
            "pub fn new() -> Self",
            "Client {\n    runner: Arc::new(Runner::new(None, Vec::new(), None, None)),\n}",
        )
    ));
    impl_members.push(braced(
        "pub fn builder() -> ClientBuilder",
        "ClientBuilder::default()",
    ));
    for resource in &resources {
        let name = s(resource, "name");
        let md = snake_case(name);
        let cls = resource_class_name(&[name.to_string()]);
        impl_members.push(braced(
            &format!("pub fn {md}(&self) -> crate::{md}::{cls}"),
            &format!("crate::{md}::{cls}::new(self.runner.clone())"),
        ));
    }
    let mut param_structs: Vec<String> = Vec::new();
    for method in arr(spec, "methods") {
        impl_members.push(emit_cli_method("Client", method, root, &mut param_structs));
    }

    let builder_impl_body = [
        braced(
            "pub fn bin_path(mut self, bin_path: impl Into<String>) -> Self",
            "self.bin_path = Some(bin_path.into());\nself",
        ),
        braced(
            "pub fn env(mut self, key: impl Into<String>, value: impl Into<String>) -> Self",
            "self.env.push((key.into(), value.into()));\nself",
        ),
        braced(
            "pub fn cwd(mut self, cwd: impl Into<String>) -> Self",
            "self.cwd = Some(cwd.into());\nself",
        ),
        braced(
            "pub fn timeout_ms(mut self, timeout_ms: u64) -> Self",
            "self.timeout_ms = Some(timeout_ms);\nself",
        ),
        braced(
            "pub fn build(self) -> Client",
            "Client {\n    runner: Arc::new(Runner::new(self.bin_path, self.env, self.cwd, self.timeout_ms)),\n}",
        ),
    ]
    .join("\n\n");

    let doc = rs_doc(Some(&format!(
        "Client drives the {title} CLI (the `{}` binary).",
        root.bin
    )));
    let mut out = format!(
        "{}\n\n{doc}\npub struct Client {{\n    runner: Arc<Runner>,\n}}\n\n{}\n\n/// A builder for binary path / env / cwd / timeout overrides.\n#[derive(Default)]\npub struct ClientBuilder {{\n    bin_path: Option<String>,\n    env: Vec<(String, String)>,\n    cwd: Option<String>,\n    timeout_ms: Option<u64>,\n}}\n\n{}\n",
        runner_uses(has_models),
        braced("impl Client", &impl_members.join("\n\n")),
        braced("impl ClientBuilder", &builder_impl_body)
    );
    for ps in param_structs {
        out.push_str(&format!("\n{ps}\n"));
    }
    out
}

fn render_cli_service_file(resource: &Value, root: &CliRoot, has_models: bool) -> (String, String) {
    let mut items: Vec<String> = Vec::new();
    emit_cli_resource(
        resource,
        &[s(resource, "name").to_string()],
        root,
        &mut items,
    );
    let content = format!("{}\n\n{}\n", runner_uses(has_models), items.join("\n\n"));
    (
        format!("src/{}.rs", snake_case(s(resource, "name"))),
        content,
    )
}

fn emit_cli_resource(resource: &Value, segments: &[String], root: &CliRoot, out: &mut Vec<String>) {
    let cls = resource_class_name(segments);
    let subs = arr(resource, "resources");

    let mut impl_members: Vec<String> = Vec::new();
    impl_members.push(braced(
        "pub(crate) fn new(runner: Arc<Runner>) -> Self",
        &format!("{cls} {{ runner }}"),
    ));
    for sub in &subs {
        let mut seg = segments.to_vec();
        seg.push(s(sub, "name").to_string());
        let sub_cls = resource_class_name(&seg);
        impl_members.push(braced(
            &format!("pub fn {}(&self) -> {sub_cls}", snake_case(s(sub, "name"))),
            &format!("{sub_cls}::new(self.runner.clone())"),
        ));
    }

    let mut param_structs: Vec<String> = Vec::new();
    for method in arr(resource, "methods") {
        impl_members.push(emit_cli_method(&cls, method, root, &mut param_structs));
    }

    let doc = rs_doc(resource.get("description").and_then(|d| d.as_str()));
    let head = if doc.is_empty() {
        String::new()
    } else {
        format!("{doc}\n")
    };
    out.push(format!(
        "{head}pub struct {cls} {{\n    runner: Arc<Runner>,\n}}"
    ));
    out.push(braced(&format!("impl {cls}"), &impl_members.join("\n\n")));
    out.extend(param_structs);

    for sub in &subs {
        let mut seg = segments.to_vec();
        seg.push(s(sub, "name").to_string());
        emit_cli_resource(sub, &seg, root, out);
    }
}

/// `argv.push(...);` for a borrowed loop/if-let `value` of the given IR type.
fn push_value_token(type_ref: Option<&Value>) -> String {
    if rs_type(type_ref) == "String" {
        "argv.push(value.clone());".to_string()
    } else {
        // wire_token renders enums as their serde wire literal.
        "argv.push(crate::runner::wire_token(value));".to_string()
    }
}

/// Append lines for one valued flag occurrence (`value` is a borrow), honoring
/// the spec's optionSeparator convention (" " = separate argv tokens, "=" =
/// one joined token).
fn flag_value_lines(
    flag: &str,
    type_ref: Option<&Value>,
    encoding: Encoding,
    separator: &str,
) -> String {
    if separator == "=" {
        let inner = match encoding {
            Encoding::Json => "serde_json::to_string(value)?",
            _ => "crate::runner::wire_token(value)",
        };
        return format!("argv.push(format!(\"{flag}={{}}\", {inner}));");
    }
    let token = match encoding {
        Encoding::Json => "argv.push(serde_json::to_string(value)?);".to_string(),
        _ => push_value_token(type_ref),
    };
    format!("argv.push({}.to_string());\n{token}", rs_string(flag))
}

/// The argv-building lines for one flag binding.
fn opt_lines(opt: &CliOpt, query_params: &[Value], separator: &str) -> String {
    let bare_push = format!("argv.push({}.to_string());", rs_string(&opt.flag));
    let Some(idx) = opt.param_index else {
        // Constant flag: always appended.
        return bare_push;
    };
    let q = &query_params[idx];
    let field = format!("params.{}", snake_case(s(q, "name")));
    let type_ref = q.get("type");

    if opt.repeat {
        // Array-typed param: repeat the flag per item.
        let item_ref = type_ref.and_then(|t| t.get("items"));
        let body = flag_value_lines(&opt.flag, item_ref, opt.encoding, separator);
        return braced(
            &format!("if let Some(values) = &{field}"),
            &braced("for value in values", &body),
        );
    }
    match opt.encoding {
        // Boolean: bare flag, only when true (separator does not apply).
        Encoding::Boolean => braced(&format!("if {field} == Some(true)"), &bare_push),
        _ => braced(
            &format!("if let Some(value) = &{field}"),
            &flag_value_lines(&opt.flag, type_ref, opt.encoding, separator),
        ),
    }
}

fn emit_cli_method(
    cls: &str,
    method: &Value,
    root: &CliRoot,
    param_structs: &mut Vec<String>,
) -> String {
    let plan = CliPlan::for_method(method).unwrap_or_else(|e| panic!("emitter \"rust\": {e}"));
    let name = rust_method_name(s(method, "action"));
    let path_params = arr(method, "pathParams");
    let query_params: Vec<Value> = method
        .get("queryParams")
        .and_then(|q| q.as_array())
        .cloned()
        .unwrap_or_default();

    let params_name = params_struct_name(cls, s(method, "action"));
    let has_params = !query_params.is_empty();
    if has_params {
        param_structs.push(emit_params_struct(&params_name, &query_params, &[], &[]));
    }

    // signature
    let mut args: Vec<String> = path_params.iter().map(|p| path_arg(p)).collect();
    if has_params {
        args.push(format!("params: {params_name}"));
    }
    let arg_list = if args.is_empty() {
        String::new()
    } else {
        format!(", {}", args.join(", "))
    };
    let signature = format!("pub async fn {name}(&self{arg_list}) -> Result<CommandResult, Error>");

    let mut lines: Vec<String> = Vec::new();

    // Required scalar-string guards (same discipline as the HTTP emitter).
    let mut guarded = false;
    for a in &plan.args {
        let p = path_params[a.param_index];
        if a.required && scalar_string(p) {
            let local = snake_case(s(p, "name"));
            lines.push(braced(
                &format!("if {local}.is_empty()"),
                &format!(
                    "return Err(Error::InvalidArgument({}.to_string()));",
                    rs_string(&local)
                ),
            ));
            guarded = true;
        }
    }
    if guarded {
        lines.push(String::new());
    }

    // argv: command tokens, then positionals, then flags.
    let command_tokens = plan
        .command
        .iter()
        .map(|t| format!("{}.to_string()", rs_string(t)))
        .collect::<Vec<_>>()
        .join(", ");
    if command_tokens.is_empty() {
        lines.push("let mut argv: Vec<String> = Vec::new();".to_string());
    } else {
        lines.push(format!(
            "let mut argv: Vec<String> = vec![{command_tokens}];"
        ));
    }
    for a in &plan.args {
        let p = path_params[a.param_index];
        let var = snake_case(s(p, "name"));
        let type_ref = p.get("type");
        if a.variadic {
            // Array-typed param whose items spread as consecutive argv tokens.
            let item_ref = type_ref.and_then(|t| t.get("items"));
            lines.push(braced(
                &format!("for value in &{var}"),
                &push_value_token(item_ref),
            ));
        } else if scalar_string(p) {
            let push = format!("argv.push({var}.to_string());");
            if a.required {
                lines.push(push);
            } else {
                // Optional positional: the empty string means "omitted".
                lines.push(braced(&format!("if !{var}.is_empty()"), &push));
            }
        } else {
            // Non-string positionals append unconditionally (the Go emitter's
            // optional-positional carve-out is string-only too).
            lines.push(format!("argv.push(crate::runner::wire_token(&{var}));"));
        }
    }
    for opt in &plan.opts {
        lines.push(opt_lines(opt, &query_params, &root.option_separator));
    }
    lines.push("self.runner.run(argv).await".to_string());

    let usage = std::iter::once(root.bin.clone())
        .chain(plan.command.iter().cloned())
        .collect::<Vec<_>>()
        .join(" ");
    let doc_text = match method
        .get("description")
        .and_then(|d| d.as_str())
        .map(|d| d.trim())
        .filter(|d| !d.is_empty())
    {
        Some(description) => format!("{description}\n\nRuns `{usage}`."),
        None => format!("Runs `{usage}`."),
    };
    format!(
        "{}\n{}",
        rs_doc(Some(&doc_text)),
        braced(&signature, &lines.join("\n"))
    )
}
