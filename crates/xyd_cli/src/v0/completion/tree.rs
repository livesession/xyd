//! Adapt an OpenCLI document into the command tree the shell generators walk.
//!
//! Byte-for-byte port of `packages/xyd-opencli-completion/src/tree.ts`. Root-level
//! `recursive` options (the CLI's global flags) are appended to every command node so
//! they complete in any subcommand context too. `serde_json::Value` arrays preserve
//! insertion order, so command/option ordering matches the JSON source exactly.

use serde_json::Value;

/// A completion option: its flag spellings, whether it takes a value, and its description.
pub struct OptionC {
    pub flags: Vec<String>,
    pub takes_value: bool,
    pub description: Option<String>,
}

/// A node in the command tree: name, description, options, and nested subcommands
/// (kept as an ordered `Vec` — the byte-parity guarantee).
pub struct Node {
    pub name: String,
    pub description: Option<String>,
    pub options: Vec<OptionC>,
    pub commands: Vec<Node>,
}

/// Build the command tree from an OpenCLI document (`spec`).
pub fn opencli_to_tree(spec: &Value) -> Node {
    let name = spec
        .get("info")
        .and_then(|i| i.get("title"))
        .and_then(Value::as_str)
        .filter(|s| !s.is_empty())
        .unwrap_or("cli")
        .to_string();

    let empty: Vec<Value> = Vec::new();
    let root_options: Vec<&Value> = spec
        .get("options")
        .and_then(Value::as_array)
        .unwrap_or(&empty)
        .iter()
        .filter(|o| !is_hidden(o))
        .collect();
    let global_options: Vec<&Value> = root_options
        .iter()
        .copied()
        .filter(|o| o.get("recursive").and_then(Value::as_bool).unwrap_or(false))
        .collect();

    Node {
        name,
        description: spec
            .get("info")
            .and_then(|i| i.get("description"))
            .and_then(Value::as_str)
            .map(str::to_string),
        options: root_options
            .iter()
            .map(|o| option_to_completion(o))
            .collect(),
        commands: to_node_map(spec.get("commands"), &global_options),
    }
}

fn to_node_map(commands: Option<&Value>, globals: &[&Value]) -> Vec<Node> {
    let empty: Vec<Value> = Vec::new();
    commands
        .and_then(Value::as_array)
        .unwrap_or(&empty)
        .iter()
        .filter(|c| !is_hidden(c))
        .map(|c| command_node(c, globals))
        .collect()
}

fn command_node(cmd: &Value, globals: &[&Value]) -> Node {
    let empty: Vec<Value> = Vec::new();
    // The command's own (non-hidden) options first, then every global option appended.
    let mut options: Vec<OptionC> = cmd
        .get("options")
        .and_then(Value::as_array)
        .unwrap_or(&empty)
        .iter()
        .filter(|o| !is_hidden(o))
        .map(option_to_completion)
        .collect();
    options.extend(globals.iter().map(|o| option_to_completion(o)));

    Node {
        name: cmd
            .get("name")
            .and_then(Value::as_str)
            .unwrap_or("")
            .to_string(),
        description: cmd
            .get("description")
            .and_then(Value::as_str)
            .map(str::to_string),
        options,
        commands: to_node_map(cmd.get("commands"), globals),
    }
}

/// OpenCLI option `name` is the canonical long form; aliases may be short or long.
fn option_to_completion(opt: &Value) -> OptionC {
    let name = opt.get("name").and_then(Value::as_str).unwrap_or("");
    let mut flags = vec![format!("--{name}")];
    if let Some(aliases) = opt.get("aliases").and_then(Value::as_array) {
        for alias in aliases.iter().filter_map(Value::as_str) {
            if alias.chars().count() == 1 {
                flags.push(format!("-{alias}"));
            } else {
                flags.push(format!("--{alias}"));
            }
        }
    }
    let takes_value = opt
        .get("arguments")
        .and_then(Value::as_array)
        .map(|a| !a.is_empty())
        .unwrap_or(false);
    OptionC {
        flags,
        takes_value,
        description: opt
            .get("description")
            .and_then(Value::as_str)
            .map(str::to_string),
    }
}

fn is_hidden(v: &Value) -> bool {
    v.get("hidden").and_then(Value::as_bool).unwrap_or(false)
}
