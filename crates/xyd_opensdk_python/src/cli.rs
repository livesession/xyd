//! CLI-mode generator: a spec with a root `x-cli` block (from
//! xyd_opencli2opensdk) becomes a Python SDK that SPAWNS the real CLI binary —
//! method bodies assemble argv from the x-cli binding (via the shared
//! `CliPlan`) and call the vendored subprocess `Transport` prologue instead of
//! the HTTP urllib transport. HTTP-only machinery (plan_operation, pagination,
//! idempotency, the pytest suite) is never touched in this mode.

use std::collections::BTreeMap;

use serde_json::Value;
use xyd_opensdk_cli_common::{CliOpt, CliPlan, CliRoot, Encoding};

use crate::naming::{py_module_name, snake_case};
use crate::project::{models_py, pyproject};
use crate::pytype::{optionalize, py_type, PyUses};
use crate::resources::resource_class_name;
use crate::val::{arr, bool_field, pystr, str_field};

/// The vendored subprocess runner (`<pkg>/_transport.py`) with the
/// `__XYD_BIN__` / `__XYD_BIN_ENV_VAR__` / `__XYD_TIMEOUT_MS__` seams.
const CLI_TRANSPORT_TEMPLATE: &str = include_str!("cli_transport.py.txt");

fn timeout_ms(spec: &Value) -> u64 {
    spec.get("sdk")
        .and_then(|s| s.get("timeout"))
        .and_then(|t| t.get("defaultTimeoutMs"))
        .and_then(Value::as_u64)
        .unwrap_or(60000)
}

pub fn generate_cli(spec: &Value) -> BTreeMap<String, String> {
    let root = CliRoot::parse(spec).unwrap_or_else(|e| panic!("emitter \"python\": {e}"));
    let title = spec
        .get("info")
        .and_then(|i| str_field(i, "title"))
        .unwrap_or("");
    let pkg = py_module_name(title);

    let mut files: BTreeMap<String, String> = BTreeMap::new();

    // generateProject — the HTTP pyproject carries no HTTP-specific bits
    // (metadata + setuptools include only), so it is reused as-is.
    files.insert("pyproject.toml".to_string(), pyproject(&pkg, spec));

    // The runner file owns CommandResult + CliError (mirroring the Go runner
    // package), so the package exports them from `_transport`.
    let init = "from ._client import Client\n\
                from ._transport import CliError, CommandResult\n\n\
                __all__ = [\"Client\", \"CliError\", \"CommandResult\"]\n";
    files.insert(format!("{pkg}/__init__.py"), crate::with_py_header(init));

    // models.py without CommandResult — the result type is owned by the
    // vendored runtime; only enums (and any future user types) render.
    let models = cli_models_py(spec);

    files.insert(
        format!("{pkg}/_client.py"),
        crate::with_py_header(&cli_client_py(spec, &root, title)),
    );
    if let Some(m) = &models {
        files.insert(format!("{pkg}/models.py"), crate::with_py_header(m));
    }
    if !arr(spec, "resources").is_empty() {
        files.insert(
            format!("{pkg}/resources.py"),
            crate::with_py_header(&cli_resources_py(spec, &root, models.is_some())),
        );
    }
    files.insert(
        format!("{pkg}/_transport.py"),
        crate::with_py_header(
            &CLI_TRANSPORT_TEMPLATE
                .replace("__XYD_BIN__", &pystr(&root.bin))
                .replace("__XYD_BIN_ENV_VAR__", &pystr(&root.env_var))
                .replace("__XYD_TIMEOUT_MS__", &timeout_ms(spec).to_string()),
        ),
    );
    files
}

/// models.py for the CLI-mode type set (CommandResult filtered out); None when
/// nothing is left to render — no dead file.
fn cli_models_py(spec: &Value) -> Option<String> {
    let types: Vec<Value> = arr(spec, "types")
        .iter()
        .filter(|t| str_field(t, "name") != Some("CommandResult"))
        .cloned()
        .collect();
    if types.is_empty() {
        return None;
    }
    Some(models_py(&serde_json::json!({ "types": types })))
}

/// Accumulated state while rendering CLI-mode method bodies.
struct CliCtx {
    uses: PyUses,
    needs_cli_text: bool,
    needs_cli_json: bool,
    has_methods: bool,
}

impl CliCtx {
    fn new() -> Self {
        CliCtx {
            uses: PyUses::new(),
            needs_cli_text: false,
            needs_cli_json: false,
            has_methods: false,
        }
    }

    /// The sorted `from ._transport import ...` name list for a rendered file.
    fn transport_import(&self) -> String {
        let mut names: Vec<&str> = vec!["Transport"];
        if self.has_methods {
            names.push("CommandResult");
        }
        if self.needs_cli_json {
            names.push("cli_json");
        }
        if self.needs_cli_text {
            names.push("cli_text");
        }
        names.sort_unstable();
        format!("from ._transport import {}", names.join(", "))
    }
}

// ---- _client.py (CLI mode) -------------------------------------------------

fn cli_client_py(spec: &Value, root: &CliRoot, title: &str) -> String {
    let resources = arr(spec, "resources");
    let mut ctx = CliCtx::new();
    // Constructor options are all Optional.
    ctx.uses.use_name("Optional");

    // Spec-level root `methods` land directly on the Client class.
    let method_blocks: Vec<String> = arr(spec, "methods")
        .iter()
        .map(|m| emit_cli_method(m, root, &mut ctx))
        .collect();

    let mut ctor_lines: Vec<String> = vec![
        "        self._transport = Transport(bin_path=bin_path, env=env, cwd=cwd, timeout=timeout)"
            .to_string(),
    ];
    for r in resources {
        let n = str_field(r, "name").unwrap_or("");
        ctor_lines.push(format!(
            "        self.{} = {}(self._transport)",
            snake_case(n),
            resource_class_name(&[n.to_string()])
        ));
    }
    let ctor = format!(
        "    def __init__(\n        \
             self,\n        \
             bin_path: Optional[str] = None,\n        \
             env: Optional[dict[str, str]] = None,\n        \
             cwd: Optional[str] = None,\n        \
             timeout: Optional[float] = None,\n    \
         ) -> None:\n        \
         \"\"\"Create a client that runs `{}` (override with the {} env var or bin_path); timeout is in milliseconds.\"\"\"\n{}",
        root.bin,
        root.env_var,
        ctor_lines.join("\n")
    );

    let mut parts: Vec<String> = vec![
        format!(
            "    \"\"\"Drives the {title} CLI (the `{}` binary).\"\"\"",
            root.bin
        ),
        ctor,
    ];
    parts.extend(method_blocks);

    let mut lines: Vec<String> = vec!["from __future__ import annotations".into(), String::new()];
    if let Some(tl) = ctx.uses.typing_import() {
        lines.push(tl);
        lines.push(String::new());
    }
    lines.push(ctx.transport_import());
    if !resources.is_empty() {
        let imports = resources
            .iter()
            .map(|r| resource_class_name(&[str_field(r, "name").unwrap_or("").to_string()]))
            .collect::<Vec<_>>()
            .join(", ");
        lines.push(format!("from .resources import {imports}"));
    }
    format!(
        "{}\n\n\nclass Client:\n{}\n",
        lines.join("\n"),
        parts.join("\n\n")
    )
}

// ---- resources.py (CLI mode) -----------------------------------------------

fn cli_resources_py(spec: &Value, root: &CliRoot, has_models: bool) -> String {
    let mut ctx = CliCtx::new();
    let mut classes: Vec<String> = Vec::new();
    emit_cli_resources(arr(spec, "resources"), &[], root, &mut classes, &mut ctx);

    let mut lines: Vec<String> = vec!["from __future__ import annotations".into(), String::new()];
    if let Some(tl) = ctx.uses.typing_import() {
        lines.push(tl);
        lines.push(String::new());
    }
    lines.push(ctx.transport_import());
    if has_models {
        lines.push("from .models import *  # noqa: F401,F403".into());
    }
    format!("{}\n\n\n{}\n", lines.join("\n"), classes.join("\n\n\n"))
}

fn emit_cli_resources(
    resources: &[Value],
    parent: &[String],
    root: &CliRoot,
    classes: &mut Vec<String>,
    ctx: &mut CliCtx,
) {
    for r in resources {
        let mut segments: Vec<String> = parent.to_vec();
        segments.push(str_field(r, "name").unwrap_or("").to_string());
        classes.push(cli_resource_class(r, &segments, root, ctx));
        let subs = arr(r, "resources");
        if !subs.is_empty() {
            emit_cli_resources(subs, &segments, root, classes, ctx);
        }
    }
}

fn cli_resource_class(
    resource: &Value,
    segments: &[String],
    root: &CliRoot,
    ctx: &mut CliCtx,
) -> String {
    let cls = resource_class_name(segments);
    let mut ctor_lines: Vec<String> = vec!["        self._transport = transport".into()];
    for sub in arr(resource, "resources") {
        let sub_name = str_field(sub, "name").unwrap_or("");
        let mut sub_segments = segments.to_vec();
        sub_segments.push(sub_name.to_string());
        ctor_lines.push(format!(
            "        self.{} = {}(transport)",
            snake_case(sub_name),
            resource_class_name(&sub_segments)
        ));
    }
    let ctor = format!(
        "    def __init__(self, transport: Transport) -> None:\n{}",
        ctor_lines.join("\n")
    );
    let mut parts: Vec<String> = vec![ctor];
    for m in arr(resource, "methods") {
        parts.push(emit_cli_method(m, root, ctx));
    }
    format!("class {cls}:\n{}", parts.join("\n\n"))
}

// ---- one CLI method --------------------------------------------------------

/// A TypeRef that renders as plain `str` (no argv stringification needed).
fn is_string_scalar(t: Option<&Value>) -> bool {
    t.map(|t| {
        str_field(t, "kind") == Some("scalar")
            && str_field(t, "scalar") == Some("string")
            && str_field(t, "format") != Some("binary")
    })
    .unwrap_or(false)
}

/// One argv token expression for a value of the given IR type.
fn token_expr(expr: &str, type_ref: Option<&Value>, ctx: &mut CliCtx) -> String {
    if is_string_scalar(type_ref) {
        return expr.to_string();
    }
    ctx.needs_cli_text = true;
    format!("cli_text({expr})")
}

/// One valued-flag-occurrence statement (no indent), honoring the spec's
/// optionSeparator convention.
fn flag_append(flag: &str, value_token: &str, separator: &str) -> String {
    if separator == "=" {
        return format!(
            "argv.append({} + {value_token})",
            pystr(&format!("{flag}="))
        );
    }
    format!("argv.extend([{}, {value_token}])", pystr(flag))
}

/// The argv-building lines for one flag binding.
fn opt_lines(opt: &CliOpt, query_params: &[Value], separator: &str, ctx: &mut CliCtx) -> String {
    let flag_lit = pystr(&opt.flag);
    let Some(idx) = opt.param_index else {
        // Constant flag: always appended.
        return format!("        argv.append({flag_lit})");
    };
    let q = &query_params[idx];
    let var = snake_case(str_field(q, "name").unwrap_or(""));
    let required = bool_field(q, "required") == Some(true);
    let type_ref = q.get("type");

    if opt.repeat {
        // Array-typed param: repeat the flag per item.
        let item_ref = type_ref.and_then(|t| t.get("items"));
        let token = token_expr("value", item_ref, ctx);
        let append = flag_append(&opt.flag, &token, separator);
        let iterable = if required {
            var
        } else {
            format!("{var} or []")
        };
        return format!("        for value in {iterable}:\n            {append}");
    }
    match opt.encoding {
        Encoding::Boolean => {
            // Bare flag only when the value is True (None/False omit it).
            format!("        if {var}:\n            argv.append({flag_lit})")
        }
        Encoding::Json => {
            ctx.needs_cli_json = true;
            let append = flag_append(&opt.flag, &format!("cli_json({var})"), separator);
            if required {
                format!("        {append}")
            } else {
                format!("        if {var} is not None:\n            {append}")
            }
        }
        _ => {
            let token = token_expr(&var, type_ref, ctx);
            let append = flag_append(&opt.flag, &token, separator);
            if required {
                format!("        {append}")
            } else {
                format!("        if {var} is not None:\n            {append}")
            }
        }
    }
}

fn emit_cli_method(method: &Value, root: &CliRoot, ctx: &mut CliCtx) -> String {
    let plan = CliPlan::for_method(method).unwrap_or_else(|e| panic!("emitter \"python\": {e}"));
    ctx.has_methods = true;
    let name = snake_case(str_field(method, "action").unwrap_or(""));
    let path_params = arr(method, "pathParams");
    let query_params = arr(method, "queryParams");

    // Signature: positional path args, then keyword-only query args (same
    // convention as the HTTP emitter's method_def).
    let mut params: Vec<String> = vec!["self".into()];
    for p in path_params {
        let n = snake_case(str_field(p, "name").unwrap_or(""));
        let ty = py_type(p.get("type"), &mut ctx.uses);
        if bool_field(p, "required") == Some(true) {
            params.push(format!("{n}: {ty}"));
        } else {
            params.push(format!("{n}: {} = None", optionalize(&ty, &mut ctx.uses)));
        }
    }
    let mut kw_args: Vec<String> = Vec::new();
    for q in query_params {
        let n = snake_case(str_field(q, "name").unwrap_or(""));
        let ty = py_type(q.get("type"), &mut ctx.uses);
        if bool_field(q, "required") == Some(true) {
            kw_args.push(format!("{n}: {ty}"));
        } else {
            kw_args.push(format!("{n}: {} = None", optionalize(&ty, &mut ctx.uses)));
        }
    }
    if !kw_args.is_empty() {
        params.push("*".into());
        params.extend(kw_args);
    }

    let mut lines: Vec<String> = Vec::new();

    // Required scalar-string guards (same discipline as the HTTP emitter).
    for a in &plan.args {
        let p = &path_params[a.param_index];
        if a.required && !a.variadic && is_string_scalar(p.get("type")) {
            let n = snake_case(str_field(p, "name").unwrap_or(""));
            lines.push(format!("        if not {n}:"));
            lines.push(format!(
                "            raise ValueError(f\"Expected a non-empty value for `{n}` but received {{{n}!r}}\")"
            ));
        }
    }

    // argv: command tokens, then positionals, then flags.
    let command_tokens = plan
        .command
        .iter()
        .map(|t| pystr(t))
        .collect::<Vec<_>>()
        .join(", ");
    lines.push(format!("        argv: list[str] = [{command_tokens}]"));
    for a in &plan.args {
        let p = &path_params[a.param_index];
        let var = snake_case(str_field(p, "name").unwrap_or(""));
        let type_ref = p.get("type");
        if a.variadic {
            let item_ref = type_ref.and_then(|t| t.get("items"));
            let token = token_expr("value", item_ref, ctx);
            let iterable = if a.required {
                var
            } else {
                format!("{var} or []")
            };
            lines.push(format!(
                "        for value in {iterable}:\n            argv.append({token})"
            ));
        } else if a.required {
            let token = token_expr(&var, type_ref, ctx);
            lines.push(format!("        argv.append({token})"));
        } else {
            // Optional positional: None means "omitted".
            let token = token_expr(&var, type_ref, ctx);
            lines.push(format!(
                "        if {var} is not None:\n            argv.append({token})"
            ));
        }
    }
    for opt in &plan.opts {
        lines.push(opt_lines(opt, query_params, &root.option_separator, ctx));
    }
    lines.push("        return self._transport.run(argv)".into());

    let usage = std::iter::once(root.bin.clone())
        .chain(plan.command.iter().cloned())
        .collect::<Vec<_>>()
        .join(" ");
    let desc = str_field(method, "description").unwrap_or("");
    let doc = if desc.is_empty() {
        format!("        \"\"\"Runs `{usage}`.\"\"\"")
    } else {
        format!("        \"\"\"{desc} (runs `{usage}`).\"\"\"")
    };
    format!(
        "    def {name}({}) -> CommandResult:\n{doc}\n{}",
        params.join(", "),
        lines.join("\n")
    )
}

#[cfg(test)]
mod tests {
    use super::*;

    /// The "=" optionSeparator convention joins flag and value into ONE argv
    /// token (no shared fixture exercises it, so it is pinned here).
    #[test]
    fn equals_separator_joins_flag_and_value() {
        let spec = serde_json::json!({
            "opensdk": "1.0.0",
            "info": { "title": "acme", "version": "1.0.0" },
            "x-cli": {
                "bin": "acme",
                "envVar": "ACME_BIN",
                "conventions": { "optionSeparator": "=" }
            },
            "methods": [ {
                "action": "create",
                "queryParams": [
                    { "name": "model", "type": {"kind":"scalar","scalar":"string"}, "required": true },
                    { "name": "temperature", "type": {"kind":"scalar","scalar":"number"}, "required": false }
                ],
                "primaryResponse": { "kind": "ref", "name": "CommandResult" },
                "x-cli": {
                    "command": ["create"],
                    "options": [
                        { "flag": "--model", "from": "param:model", "encoding": "string" },
                        { "flag": "--temperature", "from": "param:temperature", "encoding": "number" }
                    ]
                }
            } ],
            "sdk": { "mode": "cli" }
        });
        let files = generate_cli(&spec);
        let client = &files["acme/_client.py"];
        assert!(
            client.contains("argv.append(\"--model=\" + model)"),
            "{client}"
        );
        assert!(
            client.contains("argv.append(\"--temperature=\" + cli_text(temperature))"),
            "{client}"
        );
    }
}
