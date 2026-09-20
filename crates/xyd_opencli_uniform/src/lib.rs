//! OpenCLI document → Uniform `Reference[]`.
//!
//! A faithful Rust port of `opencliToReferences` from
//! `packages/xyd-opencli/src/converters.ts` (plus the slice of `generate.ts`'s
//! `generateUsage` it reaches). One Reference per command, so the docs engine
//! renders CLI reference pages the same way it renders OpenAPI/GraphQL
//! (`api.cli` → Atlas).
//!
//! The output is built as untyped `serde_json::Value` in the TypeScript's exact
//! key order, because the oracle is that package's frozen
//! `__fixtures__/references/**` goldens and JSON key order is observable there.
//!
//! Ported behaviors that are easy to get wrong (all golden-gated):
//! - `regions` is an EXACT-match filter on the space-joined command path.
//! - Root options with `recursive && !hidden` are the CLI's global options. By
//!   default they become ONE extra trailing reference (`global-options`); with
//!   [`OpencliToReferencesOptions::global_options_per_command`] they instead
//!   become a "Global options" definition on every command.
//! - Definition order is Arguments, Options, Commands, Global options.
//! - When the LAST required argument (reverse-find) enumerates `acceptedValues`,
//!   the "CLI Tool" group gets one example PER value, titled with it.

use serde::{Deserialize, Serialize};
use serde_json::{json, Map, Value};

use xyd_uniform::canon;

const GLOBAL_OPTIONS_REGION: &str = "global-options";

/// Options for [`opencli_to_references`]. Mirrors the TS
/// `OpencliToReferencesOptions`.
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct OpencliToReferencesOptions {
    /// Restrict output to specific commands. Each region is a command path,
    /// space-joined from the CLI root (e.g. `"install"`, `"remote add"`).
    /// An empty list means "no filter" (matching the TS `?.length` guard).
    pub regions: Option<Vec<String>>,

    /// Render the CLI's global (root recursive) options on every command page.
    /// When false (the default), a single "Global options" reference is emitted
    /// instead — so the options appear once in the sidebar rather than repeated
    /// on every command.
    pub global_options_per_command: bool,
}

/// Convert an OpenCLI document to uniform `Reference[]` — one Reference per
/// command. Mirrors `oapSchemaToReferences`.
pub fn opencli_to_references(spec: &Value, options: &OpencliToReferencesOptions) -> Vec<Value> {
    if !truthy(Some(spec)) {
        return Vec::new();
    }

    let cli_title = match spec.pointer("/info/title").and_then(Value::as_str) {
        Some(t) if !t.is_empty() => t,
        _ => "cli",
    };

    // `options.regions?.length ? new Set(...) : null` — an empty array is no filter.
    let region_set: Option<&Vec<String>> = match &options.regions {
        Some(r) if !r.is_empty() => Some(r),
        _ => None,
    };
    let in_regions = |region: &str| match region_set {
        Some(set) => set.iter().any(|r| r == region),
        None => true,
    };

    let per_command = options.global_options_per_command;

    // Root-level recursive options (a CLI's global flags) apply to every command.
    let global_options: Vec<&Value> = array(spec.get("options"))
        .iter()
        .filter(|o| truthy(o.get("recursive")) && !truthy(o.get("hidden")))
        .collect();

    let mut refs: Vec<Value> = Vec::new();
    let per_command_globals: &[&Value] = if per_command { &global_options } else { &[] };

    walk(
        spec.get("commands"),
        &mut Vec::new(),
        &mut |cmd, cmd_path| {
            let region = cmd_path.join(" ");
            if in_regions(&region) {
                refs.push(command_to_reference(
                    cmd,
                    cmd_path,
                    cli_title,
                    per_command_globals,
                ));
            }
        },
    );

    // Default: the global options live on a single dedicated page in the sidebar.
    if !per_command && !global_options.is_empty() && in_regions(GLOBAL_OPTIONS_REGION) {
        refs.push(global_options_reference(&global_options));
    }

    refs
}

/// Depth-first walk over the command tree, skipping hidden commands. The
/// callback sees each visited command with its full path from the CLI root.
fn walk<'a, F>(commands: Option<&'a Value>, parent_path: &mut Vec<&'a str>, visit: &mut F)
where
    F: FnMut(&'a Value, &[&'a str]),
{
    for cmd in array(commands) {
        if truthy(cmd.get("hidden")) {
            continue;
        }
        // `[...parentPath, cmd.name].join(' ')` — Array#join renders a missing
        // name as the empty string.
        parent_path.push(str_or_empty(cmd.get("name")));
        visit(cmd, parent_path);
        if !array(cmd.get("commands")).is_empty() {
            walk(cmd.get("commands"), parent_path, visit);
        }
        parent_path.pop();
    }
}

fn global_options_reference(global_options: &[&Value]) -> Value {
    json!({
        "title": "Global options",
        "canonical": GLOBAL_OPTIONS_REGION,
        "description": "Options available on every command.",
        "category": "cli",
        "context": {
            "path": GLOBAL_OPTIONS_REGION,
            "fullPath": "",
            "group": ["Global options"],
        },
        "examples": { "groups": [] },
        "definitions": [{
            "title": "Global options",
            "properties": global_options.iter().map(|o| option_to_property(o)).collect::<Vec<_>>(),
        }],
    })
}

fn command_to_reference(
    cmd: &Value,
    cmd_path: &[&str],
    cli_title: &str,
    global_options: &[&Value],
) -> Value {
    let region = cmd_path.join(" ");
    let display_path = format!("{cli_title} {region}").trim().to_string();

    let mut definitions: Vec<Value> = Vec::new();

    let args = visible(cmd.get("arguments"));
    if !args.is_empty() {
        definitions.push(json!({
            "title": "Arguments",
            "properties": args.iter().map(|a| argument_to_property(a)).collect::<Vec<_>>(),
        }));
    }

    let opts = visible(cmd.get("options"));
    if !opts.is_empty() {
        definitions.push(json!({
            "title": "Options",
            "properties": opts.iter().map(|o| option_to_property(o)).collect::<Vec<_>>(),
        }));
    }

    let subs = visible(cmd.get("commands"));
    if !subs.is_empty() {
        definitions.push(json!({
            "title": "Commands",
            "properties": subs.iter().map(|s| {
                let mut p = Map::new();
                insert_defined(&mut p, "name", s.get("name"));
                p.insert("type".into(), json!("command"));
                p.insert("description".into(), json!(str_or_empty(s.get("description"))));
                Value::Object(p)
            }).collect::<Vec<_>>(),
        }));
    }

    if !global_options.is_empty() {
        definitions.push(json!({
            "title": "Global options",
            "properties": global_options.iter().map(|o| option_to_property(o)).collect::<Vec<_>>(),
        }));
    }

    // Sidebar grouping: a leaf top-level command sits directly under "Commands".
    // A command that owns subcommands becomes a nested group (named after
    // itself) under "Commands", and each of its subcommands sits inside that
    // same group — e.g. `components` + `components install`.
    let has_subcommands = !subs.is_empty();
    let group: Vec<&str> = if cmd_path.len() == 1 && !has_subcommands {
        vec!["Commands"]
    } else {
        let tail = if has_subcommands {
            cmd_path
        } else {
            // `cmdPath.slice(0, -1)` — empty-safe, like JS.
            cmd_path.split_last().map(|(_, rest)| rest).unwrap_or(&[])
        };
        std::iter::once("Commands")
            .chain(tail.iter().copied())
            .collect()
    };

    // The runnable invocation ("CLI Tool") at groups[0], plus — when the OpenAPI
    // binding carried one — an "Example response" group. Keep CLI Tool first.
    let mut groups: Vec<Value> = vec![json!({
        "examples": cli_tool_examples(cli_title, cmd, cmd_path),
    })];
    if let Some(response_group) = response_example_group(cmd) {
        groups.push(response_group);
    }

    // A command that owns subcommands reads as "<path> <command>" so it's
    // distinct from its group and shows it takes a subcommand.
    let title = {
        let t = if has_subcommands {
            format!("{region} <command>")
        } else {
            region.clone()
        };
        if t.is_empty() {
            cli_title.to_string()
        } else {
            t
        }
    };
    let canonical = {
        let c = cmd_path.join("/");
        if c.is_empty() {
            cli_title.to_string()
        } else {
            c
        }
    };

    json!({
        "title": title,
        "canonical": canonical,
        "description": str_or_empty(cmd.get("description")),
        "category": "cli",
        // context.path is the region key the docs engine writes into the page
        // frontmatter (`cli: <spec>#<path>`) and reads back to re-resolve the
        // command. api.cli shows the more specific form — a command group
        // carries `<command>`.
        "context": {
            "path": region,
            "fullPath": generate_usage(cmd, &display_path, true),
            "group": group,
        },
        "examples": { "groups": groups },
        "definitions": definitions,
    })
}

/// Usage line for a command (`generateUsage` in `generate.ts`), with the
/// `commandPlaceholder` opt-in `api.cli` asks for.
fn generate_usage(command: &Value, command_path: &str, command_placeholder: bool) -> String {
    let mut parts: Vec<String> = vec![command_path.to_string()];

    // A command that owns subcommands takes one as its next token.
    if command_placeholder && !visible(command.get("commands")).is_empty() {
        parts.push("<command>".to_string());
    }

    if !visible(command.get("options")).is_empty() {
        parts.push("[options]".to_string());
    }

    for arg in visible(command.get("arguments")) {
        let name = str_or_empty(arg.get("name")).to_lowercase();
        // `...` suffix when the argument accepts multiple values (variadic).
        let suffix = if truthy(arg.get("variadic")) {
            "..."
        } else {
            ""
        };
        parts.push(if truthy(arg.get("required")) {
            format!("<{name}{suffix}>")
        } else {
            format!("[{name}{suffix}]")
        });
    }

    parts.join(" ")
}

/// Map a response content type to a code-sample language.
fn response_language(content_type: Option<&str>) -> &'static str {
    let Some(ct) = content_type.filter(|s| !s.is_empty()) else {
        return "json";
    };
    let lower = ct.to_lowercase();
    if lower.contains("json") {
        "json"
    } else if lower.contains("xml") {
        "xml"
    } else {
        "text"
    }
}

/// The "Example response" group built from the command's `x-openapi.responses`
/// binding (emitted by openapi2opencli). `None` when no example is available.
fn response_example_group(cmd: &Value) -> Option<Value> {
    let responses = array(cmd.pointer("/x-openapi/responses"));
    if responses.is_empty() {
        return None;
    }

    let mut examples: Vec<Value> = Vec::new();
    for res in responses {
        // Skip missing / null bodies (no useful sample).
        let example = match res.get("example") {
            Some(v) if !v.is_null() => v,
            _ => continue,
        };
        let code = match example.as_str() {
            Some(s) => s.to_string(),
            // JSON.stringify(value, null, 2); canonicalize first so integral
            // floats render as JS would (`1.0` → `1`).
            None => serde_json::to_string_pretty(&canon::canonicalize(example))
                .unwrap_or_else(|_| String::new()),
        };
        let content_type = nonempty_str(res.get("contentType"));
        examples.push(json!({
            "codeblock": {
                "title": nonempty_str(res.get("status")).unwrap_or("200"),
                "tabs": [{
                    "title": content_type.unwrap_or("application/json"),
                    "language": response_language(content_type),
                    "code": code,
                }],
            },
        }));
    }

    if examples.is_empty() {
        return None;
    }
    Some(json!({ "description": "Example response", "examples": examples }))
}

/// Shell-quote a value only when it needs it (spaces / special chars).
fn shell_quote(value: &str) -> String {
    // JS: /[\s'"$`\\<>|&;()]/
    let needs = value
        .chars()
        .any(|c| js_space(c) || "'\"$`\\<>|&;()".contains(c));
    if needs {
        format!("'{}'", value.replace('\'', "'\\''"))
    } else {
        value.to_string()
    }
}

/// JS regex `\s`: Unicode White_Space plus U+FEFF, minus U+0085 (which JS's
/// `\s` excludes but Rust's `char::is_whitespace` includes).
fn js_space(c: char) -> bool {
    c == '\u{feff}' || (c != '\u{85}' && c.is_whitespace())
}

/// A representative value for an argument: an explicit example, an
/// accepted/enum value, else a placeholder.
fn example_value(arg: Option<&Value>) -> String {
    if let Some(example) = arg.and_then(arg_example_value) {
        return example.to_string();
    }
    let accepted = arg
        .map(|a| array(a.get("acceptedValues")))
        .unwrap_or_default();
    if let Some(first) = accepted.first() {
        return js_string(first);
    }
    "Example data".to_string()
}

/// An argument's explicit example value (from metadata), or `None`. Mirrors the
/// TS guard: the metadata value must be a NON-EMPTY string.
fn arg_example_value(arg: &Value) -> Option<&str> {
    array(arg.get("metadata"))
        .iter()
        .find(|m| m.get("name").and_then(Value::as_str) == Some("example"))
        .and_then(|m| m.get("value"))
        .and_then(Value::as_str)
        .filter(|s| !s.is_empty())
}

/// The "CLI Tool" example(s) for a command. When a required argument enumerates
/// its accepted values (e.g. `completion <zsh|fish>`), each value becomes its
/// own example (`codeblock.title` = the value) — so Atlas renders an
/// example-level switcher rather than tabs inside one code block.
fn cli_tool_examples(cli_title: &str, cmd: &Value, cmd_path: &[&str]) -> Vec<Value> {
    let req_args: Vec<&Value> = array(cmd.get("arguments"))
        .iter()
        .filter(|a| truthy(a.get("required")) && !truthy(a.get("hidden")))
        .collect();

    // The argument whose representative value(s) label the example(s) — an enum
    // gives one per value, a single example value gives one. Reverse-find: the
    // LAST qualifying required argument wins.
    let variant_arg = req_args
        .iter()
        .rev()
        .find(|a| !array(a.get("acceptedValues")).is_empty() || arg_example_value(a).is_some())
        .copied();

    if let Some(arg) = variant_arg {
        let accepted = array(arg.get("acceptedValues"));
        let values: Vec<String> = if !accepted.is_empty() {
            accepted.iter().map(js_string).collect()
        } else {
            // Guaranteed non-null by the find predicate above.
            vec![arg_example_value(arg).unwrap_or("null").to_string()]
        };
        let arg_name = str_or_empty(arg.get("name"));
        return values
            .into_iter()
            .map(|value| {
                let code = generate_cli_example(cli_title, cmd, cmd_path, Some((arg_name, &value)));
                json!({
                    "codeblock": {
                        "title": value,
                        "tabs": [{ "title": "CLI Tool", "language": "shell", "code": code }],
                    },
                })
            })
            .collect();
    }

    vec![json!({
        "codeblock": {
            "tabs": [{
                "title": "CLI Tool",
                "language": "shell",
                "code": generate_cli_example(cli_title, cmd, cmd_path, None),
            }],
        },
    })]
}

/// A runnable, concrete CLI invocation — the command path plus its required
/// arguments and options filled with example values, one option per line.
/// `override_arg` pins a specific value for a named argument (used to render one
/// example per accepted value).
fn generate_cli_example(
    cli_title: &str,
    cmd: &Value,
    cmd_path: &[&str],
    override_arg: Option<(&str, &str)>,
) -> String {
    let mut head = std::iter::once(cli_title)
        .chain(cmd_path.iter().copied())
        .collect::<Vec<_>>()
        .join(" ");

    // A command group takes a subcommand — shown as a placeholder (unquoted,
    // like the usage formula), e.g. `xyd components <command>`.
    if !visible(cmd.get("commands")).is_empty() {
        head.push_str(" <command>");
    }

    for arg in array(cmd.get("arguments"))
        .iter()
        .filter(|a| truthy(a.get("required")) && !truthy(a.get("hidden")))
    {
        let name = str_or_empty(arg.get("name"));
        let value = match override_arg {
            Some((k, v)) if k == name => v.to_string(),
            _ => example_value(Some(arg)),
        };
        head.push(' ');
        head.push_str(&shell_quote(&value));
    }

    let mut lines = vec![head];
    for opt in array(cmd.get("options"))
        .iter()
        .filter(|o| truthy(o.get("required")) && !truthy(o.get("hidden")))
    {
        let name = str_or_empty(opt.get("name"));
        let opt_args = array(opt.get("arguments"));
        match opt_args.first() {
            // boolean flag
            None => lines.push(format!("--{name}")),
            Some(first) => lines.push(format!(
                "--{name} {}",
                shell_quote(&example_value(Some(first)))
            )),
        }
    }

    lines.join(" \\\n  ")
}

fn argument_to_property(arg: &Value) -> Value {
    let mut meta: Vec<Value> = Vec::new();
    if truthy(arg.get("required")) {
        meta.push(json!({ "name": "required", "value": "true" }));
    }
    // Surface the argument's accepted values / example in the Arguments section.
    let accepted = array(arg.get("acceptedValues"));
    if !accepted.is_empty() {
        meta.push(json!({ "name": "examples", "value": accepted }));
    } else if let Some(example) = array(arg.get("metadata"))
        .iter()
        .find(|m| m.get("name").and_then(Value::as_str) == Some("example"))
        .and_then(|m| m.get("value"))
        // `example != null && example !== ''`
        .filter(|v| !v.is_null() && v.as_str() != Some(""))
    {
        meta.push(json!({ "name": "example", "value": example }));
    }

    let mut out = Map::new();
    insert_defined(&mut out, "name", arg.get("name"));
    out.insert(
        "type".into(),
        json!(if truthy(arg.get("arity")) {
            "array"
        } else {
            "string"
        }),
    );
    out.insert(
        "description".into(),
        json!(str_or_empty(arg.get("description"))),
    );
    if !meta.is_empty() {
        out.insert("meta".into(), Value::Array(meta));
    }
    Value::Object(out)
}

fn option_to_property(opt: &Value) -> Value {
    let aliases = array(opt.get("aliases"));
    let alias_note = if aliases.is_empty() {
        String::new()
    } else {
        let rendered = aliases
            .iter()
            .map(|a| {
                let s = js_string(a);
                // JS `a.length` is a UTF-16 code-unit count.
                if s.encode_utf16().count() == 1 {
                    format!("-{s}")
                } else {
                    format!("--{s}")
                }
            })
            .collect::<Vec<_>>()
            .join(", ");
        format!(" (alias: {rendered})")
    };

    let mut out = Map::new();
    out.insert(
        "name".into(),
        json!(format!("--{}", str_or_empty(opt.get("name")))),
    );
    // an option that takes a value vs. a boolean flag
    out.insert(
        "type".into(),
        json!(if array(opt.get("arguments")).is_empty() {
            "boolean"
        } else {
            "string"
        }),
    );
    out.insert(
        "description".into(),
        json!(format!(
            "{}{alias_note}",
            str_or_empty(opt.get("description"))
        )),
    );
    if truthy(opt.get("required")) {
        out.insert(
            "meta".into(),
            json!([{ "name": "required", "value": "true" }]),
        );
    }
    Value::Object(out)
}

// ---------------------------------------------------------------------------
// JS-semantics helpers
// ---------------------------------------------------------------------------

const EMPTY: &[Value] = &[];

/// `value || []` for an array-valued field.
fn array(v: Option<&Value>) -> &[Value] {
    v.and_then(Value::as_array)
        .map(|a| a.as_slice())
        .unwrap_or(EMPTY)
}

/// Insert `key` only when the source value is present — JSON.stringify drops
/// `undefined` properties rather than writing `null`.
fn insert_defined(map: &mut Map<String, Value>, key: &str, v: Option<&Value>) {
    if let Some(v) = v {
        map.insert(key.to_string(), v.clone());
    }
}

/// `(list || []).filter(x => !x.hidden)`.
fn visible(v: Option<&Value>) -> Vec<&Value> {
    array(v)
        .iter()
        .filter(|x| !truthy(x.get("hidden")))
        .collect()
}

/// `value || ''` for a string-valued field.
fn str_or_empty(v: Option<&Value>) -> &str {
    v.and_then(Value::as_str).unwrap_or("")
}

/// `value || <fallback>` for a string-valued field — an empty string is falsy.
fn nonempty_str(v: Option<&Value>) -> Option<&str> {
    v.and_then(Value::as_str).filter(|s| !s.is_empty())
}

/// JS truthiness for a possibly-absent JSON value.
fn truthy(v: Option<&Value>) -> bool {
    match v {
        None | Some(Value::Null) => false,
        Some(Value::Bool(b)) => *b,
        Some(Value::Number(n)) => n.as_f64().map(|f| f != 0.0 && !f.is_nan()).unwrap_or(true),
        Some(Value::String(s)) => !s.is_empty(),
        Some(_) => true, // arrays and objects are always truthy
    }
}

/// `String(value)` for a JSON value.
fn js_string(v: &Value) -> String {
    match v {
        Value::String(s) => s.clone(),
        Value::Null => "null".to_string(),
        Value::Bool(b) => b.to_string(),
        Value::Number(_) => canon::canonicalize(v).to_string(),
        Value::Array(items) => items
            .iter()
            .map(|i| match i {
                Value::Null => String::new(),
                other => js_string(other),
            })
            .collect::<Vec<_>>()
            .join(","),
        Value::Object(_) => "[object Object]".to_string(),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn empty_spec_yields_no_references() {
        let opts = OpencliToReferencesOptions::default();
        assert!(opencli_to_references(&Value::Null, &opts).is_empty());
        assert!(opencli_to_references(&json!({}), &opts).is_empty());
    }

    #[test]
    fn shell_quote_only_when_needed() {
        assert_eq!(shell_quote("plain"), "plain");
        assert_eq!(shell_quote("has space"), "'has space'");
        assert_eq!(shell_quote("it's"), "'it'\\''s'");
        assert_eq!(shell_quote("<command>"), "'<command>'");
    }

    #[test]
    fn response_language_mapping() {
        assert_eq!(response_language(None), "json");
        assert_eq!(response_language(Some("application/json")), "json");
        assert_eq!(response_language(Some("APPLICATION/XML")), "xml");
        assert_eq!(response_language(Some("text/plain")), "text");
    }

    /// The committed goldens never contain a command where TWO required
    /// arguments qualify as the "variant" argument, so they do NOT discriminate
    /// the reverse-find direction. Pin it here: the TS is `[...reqArgs]
    /// .reverse().find(...)`, i.e. the LAST qualifying required argument wins.
    #[test]
    fn variant_argument_is_the_last_qualifying_required_argument() {
        let spec = json!({
            "info": { "title": "demo" },
            "commands": [{
                "name": "copy",
                "arguments": [
                    { "name": "from", "required": true, "acceptedValues": ["a", "b"] },
                    { "name": "to", "required": true, "acceptedValues": ["x", "y"] },
                ],
            }],
        });
        let refs = opencli_to_references(&spec, &OpencliToReferencesOptions::default());
        let examples = refs[0]["examples"]["groups"][0]["examples"].clone();

        // One example per accepted value of the LAST qualifying argument (`to`),
        // and the OTHER argument keeps its own first accepted value.
        assert_eq!(
            examples,
            json!([
                { "codeblock": { "title": "x", "tabs": [
                    { "title": "CLI Tool", "language": "shell", "code": "demo copy a x" }]}},
                { "codeblock": { "title": "y", "tabs": [
                    { "title": "CLI Tool", "language": "shell", "code": "demo copy a y" }]}},
            ])
        );
    }

    /// Likewise unexercised by the goldens: an explicit `metadata.example` makes
    /// an argument qualify even without `acceptedValues`, yielding ONE example.
    #[test]
    fn metadata_example_qualifies_an_argument_without_accepted_values() {
        let spec = json!({
            "info": { "title": "demo" },
            "commands": [{
                "name": "run",
                "arguments": [{
                    "name": "path",
                    "required": true,
                    "metadata": [{ "name": "example", "value": "./docs dir" }],
                }],
            }],
        });
        let refs = opencli_to_references(&spec, &OpencliToReferencesOptions::default());
        assert_eq!(
            refs[0]["examples"]["groups"][0]["examples"],
            json!([{ "codeblock": { "title": "./docs dir", "tabs": [{
                "title": "CLI Tool",
                "language": "shell",
                // the title is raw; only the invocation is shell-quoted
                "code": "demo run './docs dir'",
            }]}}])
        );
    }

    /// `globalOptionsPerCommand` moves the root recursive options from a single
    /// trailing reference onto every command as a LAST definition.
    #[test]
    fn global_options_move_between_a_page_and_per_command_definitions() {
        let spec = json!({
            "info": { "title": "demo" },
            "options": [
                { "name": "verbose", "recursive": true },
                { "name": "hidden-one", "recursive": true, "hidden": true },
                { "name": "not-global" },
            ],
            "commands": [{ "name": "build", "arguments": [{ "name": "target" }] }],
        });

        let default = opencli_to_references(&spec, &OpencliToReferencesOptions::default());
        assert_eq!(default.len(), 2, "one command + one global-options page");
        assert_eq!(default[1]["canonical"], json!("global-options"));
        // `recursive && !hidden` — exactly one qualifies.
        assert_eq!(
            default[1]["definitions"][0]["properties"]
                .as_array()
                .unwrap()
                .len(),
            1
        );
        assert_eq!(default[0]["definitions"].as_array().unwrap().len(), 1); // Arguments only

        let per_command = opencli_to_references(
            &spec,
            &OpencliToReferencesOptions {
                regions: None,
                global_options_per_command: true,
            },
        );
        assert_eq!(per_command.len(), 1, "no extra global-options page");
        let defs = per_command[0]["definitions"].as_array().unwrap();
        assert_eq!(defs.len(), 2);
        assert_eq!(defs[0]["title"], json!("Arguments"));
        assert_eq!(
            defs[1]["title"],
            json!("Global options"),
            "Global options come LAST"
        );
    }

    #[test]
    fn regions_filter_is_exact_match_on_the_space_joined_path() {
        let spec = json!({
            "info": { "title": "demo" },
            "commands": [{ "name": "remote", "commands": [{ "name": "add" }] }],
        });
        let refs = opencli_to_references(
            &spec,
            &OpencliToReferencesOptions {
                regions: Some(vec!["remote add".into()]),
                global_options_per_command: false,
            },
        );
        assert_eq!(refs.len(), 1);
        assert_eq!(refs[0]["canonical"], json!("remote/add"));
    }
}
