//! Native `completion` command — port of `packages/xyd-cli/src/commands/completion.ts`.
//!
//! `xyd completion [<shell>|install|opencli]`:
//!   * `xyd completion [zsh|fish]`      — print the completion script ($SHELL auto-detected)
//!   * `xyd completion install [shell]` — write it to the conventional location + instructions
//!   * `xyd completion opencli`         — print the embedded OpenCLI document
//!
//! Reads the sub/shell tokens straight from raw argv (routed here BEFORE clap by the
//! `main.rs` shim), because `completion install <shell>` carries a second positional that
//! is NOT in the generated clap tree, and bare `xyd completion` must auto-detect the shell
//! rather than fail clap's `required(true)`. The completion tree is built from the embedded
//! `opencli.json` — the same document `completion opencli` prints. Output is plain text
//! (picocolors already emits plain strings when stdout is not a TTY, so this is byte-parity
//! with the TS CLI's piped output).

mod fish;
mod flags;
mod tree;
mod zsh;

use std::path::Path;

use serde_json::Value;

use super::paths;
use crate::opencli::runtime::Error;

/// The embedded source-of-truth OpenCLI document (same file `completion opencli` prints).
const OPENCLI_JSON: &str = include_str!("../../../opencli.json");

#[derive(Clone, Copy)]
enum Shell {
    Zsh,
    Fish,
}

impl Shell {
    fn name(self) -> &'static str {
        match self {
            Shell::Zsh => "zsh",
            Shell::Fish => "fish",
        }
    }
}

/// Dispatch `completion <sub> [shell]` from raw argv.
pub async fn run() -> Result<(), Error> {
    let args: Vec<String> = std::env::args().skip(1).collect();
    // args[0] == "completion"; the sub/shell token is args[1], and (for `install`) its
    // shell argument is args[2].
    let sub = args.get(1).map(String::as_str);

    match sub {
        Some("opencli") => {
            // Byte-identical passthrough of the generated document (already ends in `\n`).
            print!("{OPENCLI_JSON}");
            Ok(())
        }
        Some("install") => install_completion(resolve_shell(args.get(2).map(String::as_str))),
        other => {
            let spec = parse_doc()?;
            let script = script_for(&spec, resolve_shell(other));
            // `println!` adds the same trailing newline `console.log` does (on top of the
            // script's own), matching the TS CLI byte-for-byte.
            println!("{script}");
            Ok(())
        }
    }
}

fn script_for(spec: &Value, shell: Shell) -> String {
    match shell {
        Shell::Fish => fish::fish(spec),
        Shell::Zsh => zsh::zsh(spec),
    }
}

fn parse_doc() -> Result<Value, Error> {
    serde_json::from_str(OPENCLI_JSON)
        .map_err(|e| Error::Invalid(format!("cannot parse embedded opencli.json: {e}")))
}

/// Resolve the target shell: an explicit arg wins, else `basename($SHELL)`; unknown
/// explicit args warn and fall back to zsh (mirrors `resolveShell` in completion.ts).
fn resolve_shell(arg: Option<&str>) -> Shell {
    let candidate = match arg {
        Some(a) if !a.is_empty() => a.to_lowercase(),
        _ => basename(&std::env::var("SHELL").unwrap_or_default()).to_lowercase(),
    };
    match candidate.as_str() {
        "fish" => Shell::Fish,
        "zsh" => Shell::Zsh,
        _ => {
            if let Some(a) = arg {
                if !a.is_empty() {
                    eprintln!("Unknown shell '{a}'; supported: zsh, fish. Defaulting to zsh.");
                }
            }
            Shell::Zsh
        }
    }
}

/// The conventional install path for `shell`'s completion script.
fn completion_path(shell: Shell) -> Result<std::path::PathBuf, Error> {
    let home = paths::home_dir()?;
    Ok(match shell {
        Shell::Fish => home.join(".config/fish/completions/xyd.fish"),
        Shell::Zsh => home.join(".config/xyd/completions/_xyd"),
    })
}

fn install_completion(shell: Shell) -> Result<(), Error> {
    let spec = parse_doc()?;
    let target = completion_path(shell)?;
    if let Some(parent) = target.parent() {
        std::fs::create_dir_all(parent)
            .map_err(|e| Error::Invalid(format!("cannot create {}: {e}", parent.display())))?;
    }
    std::fs::write(&target, script_for(&spec, shell))
        .map_err(|e| Error::Invalid(format!("cannot write {}: {e}", target.display())))?;
    println!(
        "✓ wrote {} completion to {}",
        shell.name(),
        target.display()
    );

    match shell {
        Shell::Fish => println!("fish autoloads it — open a new shell to use it."),
        Shell::Zsh => {
            let dir = target.parent().map(display_home).unwrap_or_default();
            println!("Add to your ~/.zshrc (once):");
            println!("  fpath=({dir} $fpath)");
            println!("  autoload -U compinit; compinit");
            println!("then open a new shell to use it.");
        }
    }
    Ok(())
}

/// Last path segment (`node:path.basename` for the `$SHELL` autodetect case).
fn basename(path: &str) -> &str {
    path.rsplit('/').next().unwrap_or(path)
}

/// Render `path` with a `$HOME` prefix collapsed to `~` (TS `.replace(homedir(), '~')`).
fn display_home(path: &Path) -> String {
    let s = path.to_string_lossy().into_owned();
    if let Ok(home) = std::env::var("HOME") {
        if !home.is_empty() {
            if let Some(rest) = s.strip_prefix(&home) {
                return format!("~{rest}");
            }
        }
    }
    s
}
