//! clap Arg emission for flags + positionals — port of flags.ts.

use crate::model::{FlagModel, FlagType};
use crate::rslit::{chain, json_str, lit, rs_str, RsVal};

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

/// A positional argument.
pub fn render_positional_arg(name: &str, required: bool, description: Option<&str>) -> RsVal {
    let mut calls: Vec<(String, Vec<RsVal>)> = Vec::new();
    if let Some(desc) = description {
        calls.push(("help".into(), vec![rs_str(desc)]));
    }
    if required {
        calls.push(("required".into(), vec![lit("true")]));
    }
    chain(format!("Arg::new({})", json_str(name)), calls)
}
