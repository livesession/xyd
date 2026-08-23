//! Generate a fish completion script from an OpenCLI document.
//!
//! Byte-for-byte port of `packages/xyd-opencli-completion/src/fish.ts`. Unlike zsh,
//! fish DOES recurse into nested subcommands (so `components install`/`uninstall` get
//! `__fish_seen_subcommand_from`-gated completions). Verified against `testdata/xyd.fish`.

use serde_json::Value;

use super::flags::split_flags;
use super::tree::{opencli_to_tree, Node};

fn esc_fish(s: &str) -> String {
    let mut out = String::with_capacity(s.len());
    for c in s.chars() {
        match c {
            '\\' => out.push_str("\\\\"),
            '\'' => out.push_str("\\'"),
            _ => out.push(c),
        }
    }
    out
}

/// Generate a fish completion script from an OpenCLI document.
pub fn fish(spec: &Value) -> String {
    let tree = opencli_to_tree(spec);
    let cmd = &tree.name;
    let mut lines: Vec<String> = vec![format!(
        "# fish completions for {cmd} (generated - do not edit)"
    )];
    walk(&tree, &[], cmd, &mut lines);
    format!("{}\n", lines.join("\n"))
}

fn walk(node: &Node, path: &[&str], cmd: &str, lines: &mut Vec<String>) {
    let cond = if path.is_empty() {
        "__fish_use_subcommand".to_string()
    } else {
        path.iter()
            .map(|p| format!("__fish_seen_subcommand_from {p}"))
            .collect::<Vec<_>>()
            .join("; and ")
    };

    for sub in &node.commands {
        let d = describe(sub.description.as_deref());
        lines.push(format!(
            "complete -c {cmd} -n \"{cond}\" -f -a \"{}\"{d}",
            sub.name
        ));
    }
    for opt in &node.options {
        let f = split_flags(&opt.flags);
        let mut parts: Vec<String> = Vec::new();
        parts.extend(f.short.iter().map(|s| format!("-s {s}")));
        parts.extend(f.long.iter().map(|l| format!("-l {l}")));
        parts.extend(f.old.iter().map(|o| format!("-o {o}")));
        let parts = parts.join(" ");
        let r = if opt.takes_value { " -r" } else { "" };
        let d = describe(opt.description.as_deref());
        lines.push(format!("complete -c {cmd} -n \"{cond}\" {parts}{r}{d}"));
    }
    for sub in &node.commands {
        let mut child_path: Vec<&str> = path.to_vec();
        child_path.push(&sub.name);
        walk(sub, &child_path, cmd, lines);
    }
}

/// The ` -d '<escaped>'` suffix, or empty when there is no (non-empty) description.
fn describe(description: Option<&str>) -> String {
    match description {
        Some(d) if !d.is_empty() => format!(" -d '{}'", esc_fish(d)),
        _ => String::new(),
    }
}

#[cfg(test)]
mod tests {
    use serde_json::Value;

    use super::{esc_fish, fish};

    #[test]
    fn matches_golden() {
        let spec: Value = serde_json::from_str(include_str!("../../../opencli.json")).unwrap();
        assert_eq!(fish(&spec), include_str!("testdata/xyd.fish"));
    }

    #[test]
    fn esc_fish_escapes_backslash_and_quote() {
        assert_eq!(esc_fish("a'b\\c"), "a\\'b\\\\c");
        assert_eq!(esc_fish("plain"), "plain");
    }
}
