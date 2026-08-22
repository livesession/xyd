//! clap Arg emission for flags + positionals — port of flags.ts.

use serde_json::Value;

use crate::model::{accepted_values_of, arity_of, ArityModel, FlagModel, FlagType};
use crate::rslit::{chain, json_str, lit, rs_str, RsVal};

/// A clap `.num_args(...)` range from an OpenCLI arity, or None when unconstrained.
fn arity_range(arity: &ArityModel) -> Option<String> {
    match (arity.minimum, arity.maximum) {
        (Some(min), Some(max)) => Some(format!("{min}..={max}")),
        (Some(min), None) => Some(format!("{min}..")),
        (None, Some(max)) => Some(format!("..={max}")),
        (None, None) => None,
    }
}

/// A clap `.value_parser([...])` argument literal from a list of accepted values.
fn value_parser_list(values: &[String]) -> RsVal {
    let list = values
        .iter()
        .map(|v| json_str(v))
        .collect::<Vec<_>>()
        .join(", ");
    lit(format!("[{list}]"))
}

pub fn render_flag_arg(f: &FlagModel) -> RsVal {
    let mut calls: Vec<(String, Vec<RsVal>)> = vec![("long".into(), vec![rs_str(&f.flag_name)])];

    let shorts: Vec<&String> = f
        .aliases
        .iter()
        .filter(|a| a.chars().count() == 1)
        .collect();
    let longs: Vec<&String> = f.aliases.iter().filter(|a| a.chars().count() > 1).collect();
    if !shorts.is_empty() {
        calls.push(("short".into(), vec![lit(format!("'{}'", shorts[0]))]));
    }
    if longs.len() == 1 {
        calls.push(("visible_alias".into(), vec![rs_str(longs[0])]));
    } else if longs.len() > 1 {
        let list = longs
            .iter()
            .map(|l| json_str(l))
            .collect::<Vec<_>>()
            .join(", ");
        calls.push(("visible_aliases".into(), vec![lit(format!("[{list}]"))]));
    }

    match f.flag_type {
        FlagType::Int => {
            calls.push(("value_parser".into(), vec![lit("clap::value_parser!(i64)")]));
        }
        FlagType::Float => {
            calls.push(("value_parser".into(), vec![lit("clap::value_parser!(f64)")]));
        }
        FlagType::Bool => {
            calls.push(("num_args".into(), vec![lit("0..=1")]));
            calls.push(("require_equals".into(), vec![lit("true")]));
            calls.push(("default_missing_value".into(), vec![rs_str("true")]));
            calls.push((
                "value_parser".into(),
                vec![lit("clap::value_parser!(bool)")],
            ));
        }
        FlagType::Slice => {
            calls.push(("action".into(), vec![lit("clap::ArgAction::Append")]));
            calls.push(("value_delimiter".into(), vec![lit("','")]));
        }
        // string | json | file: clap's default String parsing
        _ => {}
    }

    // Non-API leaf extras — additive and field-gated. `build_leaf_model` never sets
    // these, so x-openapi flags render exactly as before.
    if let Some(av) = f.accepted_values.as_ref().filter(|v| !v.is_empty()) {
        calls.push(("value_parser".into(), vec![value_parser_list(av)]));
    }
    if let Some(range) = f.arity.as_ref().and_then(arity_range) {
        calls.push(("num_args".into(), vec![lit(range)]));
    }

    if let Some(desc) = &f.description {
        calls.push(("help".into(), vec![rs_str(desc)]));
    }
    if f.required {
        calls.push(("required".into(), vec![lit("true")]));
    }
    if f.hidden {
        calls.push(("hide".into(), vec![lit("true")]));
    }

    chain(format!("Arg::new({})", json_str(&f.flag_name)), calls)
}

pub fn render_flag_args(flags: &[FlagModel]) -> Vec<RsVal> {
    flags.iter().map(render_flag_arg).collect()
}

/// A positional argument. `local` gates the non-API extras (`acceptedValues →
/// .value_parser`, `arity → .num_args`); the x-openapi call site passes `false`,
/// keeping API positionals byte-identical.
pub fn render_positional_arg(arg: &Value, local: bool) -> RsVal {
    let name = arg.get("name").and_then(|n| n.as_str()).unwrap_or("");
    let mut calls: Vec<(String, Vec<RsVal>)> = Vec::new();
    if let Some(desc) = arg.get("description").and_then(|d| d.as_str()) {
        calls.push(("help".into(), vec![rs_str(desc)]));
    }
    if local {
        if let Some(av) = accepted_values_of(arg) {
            calls.push(("value_parser".into(), vec![value_parser_list(&av)]));
        }
        if let Some(range) = arity_of(arg).as_ref().and_then(arity_range) {
            calls.push(("num_args".into(), vec![lit(range)]));
        }
    }
    if arg.get("required").and_then(|r| r.as_bool()) == Some(true) {
        calls.push(("required".into(), vec![lit("true")]));
    }
    chain(format!("Arg::new({})", json_str(name)), calls)
}
