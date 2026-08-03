//! Port of `gql-sample.ts` — the example query/mutation printed EXACTLY like
//! graphql-js `print()` renders the hand-built AST (incl. the comment-as-field
//! hack `# <op> fields` inside the selection set).

use xyd_uniform::DefinitionProperty;

fn meta_value<'a>(p: &'a DefinitionProperty, name: &str) -> Option<&'a serde_json::Value> {
    p.meta
        .as_ref()?
        .iter()
        .find(|m| m.name == name)
        .and_then(|m| m.value.as_ref())
}

fn is_required(p: &DefinitionProperty) -> bool {
    meta_value(p, "required")
        .map(|v| v == "true")
        .unwrap_or(false)
}

/// `defaultValue` in the JS impl: JSON.stringify of a NON-string defaults meta
/// (string defaults yield "").
fn stringified_nonstring_default(p: &DefinitionProperty) -> String {
    match meta_value(p, "defaults") {
        Some(v) if !v.is_string() => serde_json::to_string(v).unwrap_or_default(),
        _ => String::new(),
    }
}

fn graphql_type_flat(p: &DefinitionProperty) -> String {
    p.context
        .as_ref()
        .and_then(|c| c.get("graphqlTypeFlat"))
        .and_then(|v| v.as_str())
        .unwrap_or("")
        .to_string()
}

fn name_of(p: &DefinitionProperty) -> String {
    p.name.clone().unwrap_or_default()
}

/// graphql-js string-literal printing (JSON.stringify semantics).
fn print_string(s: &str) -> String {
    serde_json::to_string(s).unwrap_or_else(|_| format!("\"{s}\""))
}

enum ArgValue {
    Str(String),
    Int(String),
    Bool(bool),
    Var(String),
}

fn print_arg(name: &str, v: &ArgValue) -> String {
    let rendered = match v {
        ArgValue::Str(s) => print_string(s),
        ArgValue::Int(i) => i.clone(),
        ArgValue::Bool(b) => b.to_string(),
        ArgValue::Var(n) => format!("${n}"),
    };
    format!("{name}: {rendered}")
}

/// `simpleGraphqlExample`. (`_returns` is unused — same as the JS signature.)
pub fn simple_graphql_example(
    op: &str,
    operation_name: &str,
    args: &[DefinitionProperty],
    _returns: &[DefinitionProperty],
) -> String {
    // Required args, else the first arg.
    let required: Vec<&DefinitionProperty> = args.iter().filter(|a| is_required(a)).collect();
    let selected: Vec<&DefinitionProperty> = if !required.is_empty() {
        required
    } else {
        args.iter().take(1).collect()
    };

    // Inline defaults — QUERIES only (mutations/subscriptions use variables).
    let mut defaults: Vec<(String, ArgValue)> = Vec::new();
    if op == "query" {
        for arg in &selected {
            let dv = stringified_nonstring_default(arg);
            let name = name_of(arg);
            let value = match graphql_type_flat(arg).as_str() {
                "String" => Some(ArgValue::Str(if dv.is_empty() {
                    format!("example-{name}")
                } else {
                    dv.clone()
                })),
                "Int" | "Float" => Some(ArgValue::Int(if dv.is_empty() {
                    "0".into()
                } else {
                    dv.clone()
                })),
                "Boolean" => Some(ArgValue::Bool(dv == "true")),
                _ => None,
            };
            if let Some(v) = value {
                defaults.push((name, v));
            }
        }
    }

    let all_defaults = defaults.len() == selected.len();
    let has_arg_vars = !all_defaults;

    let rendered_args: Vec<String> = if all_defaults {
        selected
            .iter()
            .filter_map(|a| {
                let n = name_of(a);
                defaults
                    .iter()
                    .find(|(dn, _)| *dn == n)
                    .map(|(dn, dv)| print_arg(dn, dv))
            })
            .collect()
    } else {
        selected
            .iter()
            .map(|a| {
                let n = name_of(a);
                print_arg(&n, &ArgValue::Var(n.clone()))
            })
            .collect()
    };

    // Operation header (graphql-js print: shorthand only for anonymous,
    // variable-less queries).
    let header = if has_arg_vars {
        let var_defs: Vec<String> = selected
            .iter()
            .map(|a| {
                let n = name_of(a);
                let dv = stringified_nonstring_default(a);
                let has_default_meta = meta_value(a, "defaults").is_some();
                if has_default_meta && !dv.is_empty() {
                    format!("${n}: {} = {}", a.property_type, print_string(&dv))
                } else {
                    format!("${n}: {}", a.property_type)
                }
            })
            .collect();
        format!("{op} {operation_name}({}) ", var_defs.join(", "))
    } else if op == "query" {
        String::new()
    } else {
        format!("{op} ")
    };

    let field_args = if rendered_args.is_empty() {
        String::new()
    } else {
        format!("({})", rendered_args.join(", "))
    };

    format!(
        "{header}{{\n  {operation_name}{field_args} {{\n    # {operation_name} fields\n  }}\n}}"
    )
}
