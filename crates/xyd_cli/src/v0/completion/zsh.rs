//! Generate a zsh completion script (`#compdef`) from an OpenCLI document.
//!
//! Byte-for-byte port of `packages/xyd-opencli-completion/src/zsh.ts`. The escaping
//! is load-bearing: the TS applies its `.replace()` steps sequentially over the whole
//! string, but a single-pass char emit over the ORIGINAL string is provably equivalent
//! here because the later steps (`:[]{}` prefixing) never re-process the backslashes the
//! earlier steps introduce (verified against the committed golden `testdata/xyd.zsh`).

use serde_json::Value;

use super::flags::split_flags;
use super::tree::{opencli_to_tree, OptionC};

/// Inside an `_arguments` spec's `[...]` description: escape `\`, `'`, then the chars
/// that are syntactically special there (`:` `[` `]` `{` `}`).
fn esc_zsh_spec(s: &str) -> String {
    let mut out = String::with_capacity(s.len());
    for c in s.chars() {
        match c {
            '\\' => out.push_str("\\\\"),
            '\'' => out.push_str("'\\''"),
            ':' | '[' | ']' | '{' | '}' => {
                out.push('\\');
                out.push(c);
            }
            _ => out.push(c),
        }
    }
    out
}

/// Inside a `_describe` `'value:desc'` row only the `:` separator (plus quote /
/// backslash) is special — brackets/braces are literal.
fn esc_zsh_describe(s: &str) -> String {
    let mut out = String::with_capacity(s.len());
    for c in s.chars() {
        match c {
            '\\' => out.push_str("\\\\"),
            '\'' => out.push_str("'\\''"),
            ':' => out.push_str("\\:"),
            _ => out.push(c),
        }
    }
    out
}

fn opt_to_spec(opt: &OptionC) -> String {
    let f = split_flags(&opt.flags);
    let desc = match opt.description.as_deref() {
        Some(d) if !d.is_empty() => format!("[{}]", esc_zsh_spec(d)),
        _ => String::new(),
    };
    let value = if opt.takes_value { ":value:" } else { "" };
    let mut all: Vec<String> = Vec::new();
    all.extend(f.short.iter().map(|s| format!("-{s}")));
    all.extend(f.long.iter().map(|l| format!("--{l}")));
    if all.len() >= 2 {
        format!("'({})'{{{}}}'{desc}{value}'", all.join(" "), all.join(","))
    } else {
        format!(
            "'{}{desc}{value}'",
            all.first().map(String::as_str).unwrap_or("")
        )
    }
}

/// Generate a zsh completion script (`#compdef`) from an OpenCLI document.
pub fn zsh(spec: &Value) -> String {
    let tree = opencli_to_tree(spec);
    let cmd = &tree.name;
    let subs = &tree.commands;
    let has_subs = !subs.is_empty();

    let mut out: Vec<String> = vec![
        format!("#compdef {cmd}"),
        String::new(),
        format!("_{cmd}() {{"),
    ];
    out.push("  local context state state_descr line".to_string());
    out.push("  typeset -A opt_args".to_string());
    out.push(String::new());

    let mut root_specs: Vec<String> = tree.options.iter().map(opt_to_spec).collect();
    if has_subs {
        root_specs.push("'1: :->command'".to_string());
        root_specs.push("'*::arg:->args'".to_string());
    }
    out.push("  _arguments -C \\".to_string());
    out.push(format!("{} && return 0", indent_join(&root_specs, "    ")));

    if has_subs {
        out.push(String::new());
        out.push("  case $state in".to_string());
        out.push("    command)".to_string());
        out.push("      local -a commands".to_string());
        out.push("      commands=(".to_string());
        for sub in subs {
            out.push(format!(
                "        '{}:{}'",
                sub.name,
                esc_zsh_describe(sub.description.as_deref().unwrap_or(""))
            ));
        }
        out.push("      )".to_string());
        out.push(format!(
            "      _describe -t commands '{cmd} command' commands"
        ));
        out.push("      ;;".to_string());
        out.push("    args)".to_string());
        out.push("      case $line[1] in".to_string());
        for sub in subs {
            out.push(format!("        {})", sub.name));
            let specs: Vec<String> = sub.options.iter().map(opt_to_spec).collect();
            if specs.is_empty() {
                out.push("          _message 'no more arguments'".to_string());
            } else {
                out.push("          _arguments \\".to_string());
                out.push(indent_join(&specs, "            "));
            }
            out.push("          ;;".to_string());
        }
        out.push("      esac".to_string());
        out.push("      ;;".to_string());
        out.push("  esac".to_string());
    }

    out.push("}".to_string());
    out.push(String::new());
    out.push(format!("_{cmd} \"$@\""));
    format!("{}\n", out.join("\n"))
}

/// Join specs as `<indent>spec1 \<NL><indent>spec2 …` (TS `.map(indent).join(' \\\n')`).
fn indent_join(specs: &[String], indent: &str) -> String {
    specs
        .iter()
        .map(|s| format!("{indent}{s}"))
        .collect::<Vec<_>>()
        .join(" \\\n")
}

#[cfg(test)]
mod tests {
    use serde_json::Value;

    use super::{esc_zsh_describe, esc_zsh_spec, opt_to_spec, zsh};
    use crate::v0::completion::tree::OptionC;

    fn spec() -> Value {
        serde_json::from_str(include_str!("../../../opencli.json")).unwrap()
    }

    /// Byte-parity against the committed golden. `XYD_BLESS=1 cargo test` regenerates
    /// `testdata/xyd.zsh` from the Rust generator — the crate is self-sufficient, no TS
    /// golden tool is needed.
    #[test]
    fn matches_golden() {
        let actual = zsh(&spec());
        if std::env::var("XYD_BLESS").is_ok() {
            let golden = std::path::Path::new(env!("CARGO_MANIFEST_DIR"))
                .join("src/v0/completion/testdata/xyd.zsh");
            std::fs::write(&golden, &actual).unwrap();
            return;
        }
        assert_eq!(actual, include_str!("testdata/xyd.zsh"));
    }

    #[test]
    fn esc_spec_escapes_special_chars() {
        assert_eq!(esc_zsh_spec("a:b[c]{d}"), "a\\:b\\[c\\]\\{d\\}");
        assert_eq!(esc_zsh_spec("a'b\\c"), "a'\\''b\\\\c");
        // A backslash before a colon: `\:` → `\\` then `\:` = `\\\:` (order-independent).
        assert_eq!(esc_zsh_spec("\\:"), "\\\\\\:");
    }

    #[test]
    fn esc_describe_escapes_colon_only() {
        assert_eq!(esc_zsh_describe("a:b[c]"), "a\\:b[c]");
        assert_eq!(esc_zsh_describe("a'b"), "a'\\''b");
    }

    #[test]
    fn opt_spec_groups_multiple_spellings() {
        let opt = OptionC {
            flags: vec!["--help".into(), "-h".into()],
            takes_value: false,
            description: Some("Print help".into()),
        };
        assert_eq!(opt_to_spec(&opt), "'(-h --help)'{-h,--help}'[Print help]'");

        let single = OptionC {
            flags: vec!["--verbose".into()],
            takes_value: false,
            description: Some("Enable verbose output".into()),
        };
        assert_eq!(opt_to_spec(&single), "'--verbose[Enable verbose output]'");

        let valued = OptionC {
            flags: vec!["--port".into(), "-p".into()],
            takes_value: true,
            description: Some("Port".into()),
        };
        assert_eq!(
            opt_to_spec(&valued),
            "'(-p --port)'{-p,--port}'[Port]:value:'"
        );
    }
}
