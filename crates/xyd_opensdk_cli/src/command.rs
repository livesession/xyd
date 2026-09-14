//! `src/cli/index.ts` — the clap command tree and its dispatch.
//!
//! The option/argument names, descriptions and defaults mirror the commander
//! tree one for one, with ONE deliberate divergence, called out at its site:
//! `generate --spec` is OPTIONAL here (see [`run_generate`]).

use std::path::{Path, PathBuf};
use std::str::FromStr;

use clap::{Arg, ArgAction, ArgMatches, Command};

use xyd_opensdk_config::merge_publish_targets;

use crate::config::{resolve_config, ResolvedConfig};
use crate::diff::{diff_command, DiffCommandOptions, DiffFailOn};
use crate::error::{Error, Result};
use crate::generate::{
    generate_command, generate_targets, merge_behavior_overrides, GenerateCommandOptions,
    GenerateTargetsOptions,
};
use crate::grouping::ConverterInputs;
use crate::init::{init_command, InitOptions};
use crate::parse::{parse_command, ParseCommandOptions};
use crate::publish::{publish_command, PublishCommandOptions};
use crate::registry::resolve_lang;
use crate::run::{run_chain, RunOptions};
use crate::xsdk::{xsdk_command, XsdkCommandOptions};

fn opt(m: &ArgMatches, id: &str) -> Option<String> {
    m.get_one::<String>(id).cloned()
}

fn flag(m: &ArgMatches, id: &str) -> bool {
    m.get_flag(id)
}

/// Build the `opensdk` command tree.
pub fn command() -> Command {
    let spec_arg = |required: bool| {
        Arg::new("spec")
            .long("spec")
            .value_name("path")
            .required(required)
    };
    let grouping_arg = || {
        Arg::new("grouping")
            .long("grouping")
            .value_name("path")
            .help("JSON grouping file ({mountRules, operationHints}); overrides the config values")
    };
    let sdk_name_arg = || {
        Arg::new("sdk-name")
            .long("sdk-name")
            .value_name("name")
            .help("SDK name for the converter")
    };

    Command::new("opensdk")
        .about("Generate SDKs from OpenAPI specs through OpenSDK emitter plugins")
        .subcommand_required(true)
        .arg_required_else_help(true)
        .arg(
            Arg::new("config")
                .long("config")
                .value_name("path")
                .global(true)
                .help("Path to opensdk config file (default: sdk.json in cwd)"),
        )
        .subcommand(
            Command::new("parse")
                .about("Parse an OpenAPI spec and output the OpenSDK IR as JSON")
                .arg(spec_arg(true).help("Path to the OpenAPI spec (yaml/json)"))
                .arg(
                    Arg::new("output")
                        .long("output")
                        .value_name("path")
                        .help("Write the IR to a file instead of stdout"),
                )
                .arg(sdk_name_arg())
                .arg(grouping_arg()),
        )
        .subcommand(
            Command::new("xsdk")
                .about(
                    "Embed x-sdk SDK docs (signatures, types, usage samples) into an OpenAPI spec \
                     — for CI/CD pipelines that ship a docs-ready spec",
                )
                .arg(spec_arg(true).help("Path to the OpenAPI spec (yaml/json)"))
                .arg(
                    Arg::new("output")
                        .long("output")
                        .value_name("path")
                        .help("Write the enriched spec to a file instead of stdout"),
                )
                .arg(
                    Arg::new("langs")
                        .long("langs")
                        .value_name("ids")
                        .help("Comma-separated SDK language ids (default: all six)"),
                ),
        )
        .subcommand(
            Command::new("generate")
                .about(
                    "Generate an SDK from an OpenAPI spec (or a pre-parsed IR json) — or a CLI via \
                     the go-cli/rust-cli targets. With no --lang, every language declared in \
                     sdk.json is generated.",
                )
                .arg(
                    spec_arg(false)
                        .help("Path to the OpenAPI spec (yaml/json) or OpenSDK IR (.json)"),
                )
                .arg(
                    Arg::new("lang")
                        .long("lang")
                        .value_name("language")
                        .help(
                            "Emitter language/alias (go|python|typescript|ruby|java|csharp|rust|...) \
                             or a CLI target (go-cli|rust-cli); omit to build every language in \
                             sdk.json",
                        ),
                )
                .arg(
                    Arg::new("output")
                        .long("output")
                        .value_name("dir")
                        .help(
                            "Output directory (single --lang), or the base dir for per-language \
                             subfolders (multi-target)",
                        ),
                )
                .arg(sdk_name_arg())
                .arg(grouping_arg())
                .arg(
                    Arg::new("dry-run")
                        .long("dry-run")
                        .action(ArgAction::SetTrue)
                        .help("Print the files that would be generated without writing"),
                )
                .arg(
                    Arg::new("no-tests")
                        .long("no-tests")
                        .action(ArgAction::SetTrue)
                        .help(
                            "Don't emit the generated SDK's self-test suite (sets \
                             emitterOptions.<lang>.tests=false)",
                        ),
                )
                .arg(
                    Arg::new("merge")
                        .long("merge")
                        .action(ArgAction::SetTrue)
                        .help(
                            "Preserve hand-edits to generated files: 3-way merge them with the new \
                             generation instead of overwriting (writes .sdk/base; conflicts get \
                             <<<<<<< markers)",
                        ),
                ),
        )
        .subcommand(
            Command::new("diff")
                .about(
                    "Diff two spec versions by SDK-consumer impact (exit 2 = breaking, 1 = risky, \
                     0 = safe/none)",
                )
                .arg(Arg::new("base").required(true).help(
                    "The published/old spec: OpenAPI (yaml/json) or pre-parsed OpenSDK IR (.json)",
                ))
                .arg(Arg::new("head").required(true).help(
                    "The new spec: OpenAPI (yaml/json) or pre-parsed OpenSDK IR (.json)",
                ))
                .arg(
                    Arg::new("fail-on")
                        .long("fail-on")
                        .value_name("severity")
                        .value_parser(["breaking", "risky", "any"])
                        .default_value("breaking")
                        .help(
                            "Failure gate: breaking|risky exit per the 0/1/2 table; any also exits \
                             1 on safe-only changes",
                        ),
                )
                .arg(
                    Arg::new("json")
                        .long("json")
                        .action(ArgAction::SetTrue)
                        .help(
                            "Print the machine-readable IrDiff JSON to stdout instead of the \
                             grouped report",
                        ),
                )
                .arg(sdk_name_arg().help("SDK name for the converter (applied to both sides)"))
                .arg(grouping_arg().help(
                    "JSON grouping file ({mountRules, operationHints}); applied to BOTH sides so \
                     remounts never diff as renames",
                )),
        )
        .subcommand(
            Command::new("publish")
                .about(
                    "Publish already-generated SDK(s) to their language registries \
                     (npm/PyPI/RubyGems/NuGet/Maven; Go = git tag). Run `generate` first.",
                )
                .arg(
                    Arg::new("lang")
                        .long("lang")
                        .value_name("language")
                        .help(
                            "Emitter language/alias; omit to publish every language declared in \
                             sdk.json",
                        ),
                )
                .arg(Arg::new("output").long("output").value_name("dir").help(
                    "Generated SDK dir (single --lang), or the base dir of per-language subfolders",
                ))
                .arg(
                    Arg::new("registry")
                        .long("registry")
                        .value_name("url")
                        .help("Registry URL override (wins over the config publish.registry)"),
                )
                .arg(
                    Arg::new("dry-run")
                        .long("dry-run")
                        .action(ArgAction::SetTrue)
                        .help(
                            "Package only (npm pack / build / gem build / dotnet pack) without \
                             pushing",
                        ),
                ),
        )
        .subcommand(
            Command::new("run")
                .about(
                    "Run a chain.json pipeline: process sources (merge + overlays) then generate \
                     every target SDK (add --publish to publish each).",
                )
                .arg(
                    Arg::new("chain")
                        .long("chain")
                        .value_name("path")
                        .help("Path to the chain file (default: chain.json or .chain/chain.json)"),
                )
                .arg(
                    Arg::new("target")
                        .long("target")
                        .value_name("name")
                        .help("Only run this target (else every target in the chain)"),
                )
                .arg(
                    Arg::new("source")
                        .long("source")
                        .value_name("name")
                        .help("Only run targets bound to this source"),
                )
                .arg(
                    Arg::new("publish")
                        .long("publish")
                        .action(ArgAction::SetTrue)
                        .help("Also publish each generated target to its registry"),
                )
                .arg(
                    Arg::new("dry-run")
                        .long("dry-run")
                        .action(ArgAction::SetTrue)
                        .help("Process + print without writing SDKs or pushing"),
                ),
        )
        .subcommand(
            Command::new("init")
                .about(
                    "Scaffold a config file (sdk.json by default, or an opensdk.config.mjs plugin \
                     bundle)",
                )
                .arg(
                    Arg::new("project")
                        .long("project")
                        .value_name("dir")
                        .help("Project directory (default: cwd)"),
                )
                .arg(
                    Arg::new("format")
                        .long("format")
                        .value_name("format")
                        .value_parser(["json", "mjs"])
                        .default_value("json")
                        .help("Config format"),
                )
                .arg(
                    Arg::new("dir")
                        .long("dir")
                        .value_name("subdir")
                        .help("Write the config under a subdir (e.g. .sdk / .chain)"),
                )
                .arg(
                    Arg::new("lang")
                        .long("lang")
                        .value_name("language")
                        .help("Seed this language (default: typescript)"),
                )
                .arg(
                    Arg::new("chain")
                        .long("chain")
                        .action(ArgAction::SetTrue)
                        .help("Scaffold a chain.json pipeline (sources → targets) instead"),
                ),
        )
}

/// Converter inputs shared by `parse` / `generate` / `diff`: the command's own
/// flags layered over the resolved config.
fn shared_inputs(m: &ArgMatches, config: Option<&ResolvedConfig>) -> ConverterInputs {
    ConverterInputs {
        sdk_name: opt(m, "sdk-name").or_else(|| config.and_then(|c| c.sdk_name.clone())),
        mount_rules: config.and_then(|c| c.mount_rules.clone()),
        operation_hints: config.and_then(|c| c.operation_hints.clone()),
        grouping: opt(m, "grouping"),
        sdk: config.and_then(|c| c.sdk.clone()),
    }
}

fn run_generate(m: &ArgMatches, config: Option<&ResolvedConfig>, cwd: &Path) -> Result<i32> {
    let mut inputs = shared_inputs(m, config);
    let dry_run = flag(m, "dry-run");
    let no_tests = flag(m, "no-tests");
    let merge = flag(m, "merge") || config.and_then(|c| c.merge).unwrap_or(false);

    // DIVERGENCE (additive): commander declares `--spec` as a REQUIRED option,
    // which makes the `opts.spec ?? config?.spec` fallback two lines below it
    // unreachable from the CLI (it only ever fires for programmatic callers).
    // Here `--spec` is optional so the documented sdk.json `api`/`spec` key
    // actually works. Passing `--spec` behaves identically to the TS.
    let spec = opt(m, "spec").or_else(|| config.and_then(|c| c.spec.clone()));
    let Some(spec) = spec else {
        return Err(Error::msg(
            "No spec — pass --spec, or add a \"spec\" field to your sdk.json.",
        ));
    };

    match opt(m, "lang") {
        Some(lang_input) => {
            // Single target: merge the language's behavior over the global one.
            let lang = resolve_lang(&lang_input);
            let target = config.and_then(|c| c.target_for(&lang));
            let behavior = merge_behavior_overrides(&[
                config.and_then(|c| c.sdk.as_ref()),
                target.and_then(|t| t.behavior.as_ref()),
            ]);
            inputs.sdk = Some(behavior);
            generate_command(
                &GenerateCommandOptions {
                    inputs,
                    spec,
                    output: opt(m, "output")
                        .or_else(|| target.and_then(|t| t.output.clone()))
                        .unwrap_or_else(|| "./sdk".into()),
                    publish: merge_publish_targets(&[
                        config.and_then(|c| c.publish.as_ref()),
                        target.and_then(|t| t.publish.as_ref()),
                    ]),
                    emitter_options: config.and_then(|c| c.emitter_options_for(&lang).cloned()),
                    lang: lang_input,
                    dry_run,
                    no_tests,
                    merge,
                },
                cwd,
            )?;
        }
        None => {
            // Multi target: build every language declared in the config.
            let Some(config) = config else {
                return Err(Error::msg(
                    "No config found — pass --lang, or add a sdk.json with language sections.",
                ));
            };
            generate_targets(
                &GenerateTargetsOptions {
                    inputs,
                    spec,
                    output: opt(m, "output").unwrap_or_else(|| "./sdk".into()),
                    dry_run,
                    no_tests,
                    merge,
                },
                config,
                cwd,
            )?;
        }
    }
    Ok(0)
}

/// Dispatch one parsed invocation. Returns the process exit code.
pub fn dispatch(matches: &ArgMatches, cwd: &Path) -> Result<i32> {
    let (name, m) = matches
        .subcommand()
        .ok_or_else(|| Error::msg("no subcommand"))?;

    // `init` never reads a config (it CREATES one), so resolving first would
    // make `opensdk init` fail in a directory holding an opensdk.config.mjs.
    let config = if name == "init" {
        None
    } else {
        resolve_config(cwd, opt(m, "config").as_deref())?
    };
    let config = config.as_ref();

    match name {
        "parse" => {
            parse_command(
                &ParseCommandOptions {
                    inputs: shared_inputs(m, config),
                    spec: opt(m, "spec").expect("required"),
                    output: opt(m, "output"),
                },
                cwd,
            )?;
            Ok(0)
        }
        "xsdk" => {
            xsdk_command(&XsdkCommandOptions {
                spec: opt(m, "spec").expect("required"),
                output: opt(m, "output"),
                langs: opt(m, "langs").map(|v| {
                    v.split(',')
                        .map(|s| s.trim().to_string())
                        .filter(|s| !s.is_empty())
                        .collect()
                }),
            })?;
            Ok(0)
        }
        "generate" => run_generate(m, config, cwd),
        "diff" => diff_command(
            &DiffCommandOptions {
                inputs: shared_inputs(m, config),
                base: opt(m, "base").expect("required"),
                head: opt(m, "head").expect("required"),
                json: flag(m, "json"),
                fail_on: DiffFailOn::from_str(
                    m.get_one::<String>("fail-on")
                        .map(String::as_str)
                        .unwrap_or("breaking"),
                )?,
            },
            cwd,
        ),
        "publish" => {
            publish_command(
                &PublishCommandOptions {
                    lang: opt(m, "lang"),
                    output: opt(m, "output").unwrap_or_else(|| "./sdk".into()),
                    registry: opt(m, "registry"),
                    dry_run: flag(m, "dry-run"),
                },
                config,
                cwd,
            )?;
            Ok(0)
        }
        "run" => {
            let chain = opt(m, "chain")
                .or_else(|| {
                    xyd_opensdk_chain::detect_chain(cwd, None)
                        .map(|p| p.to_string_lossy().to_string())
                })
                .unwrap_or_else(|| "chain.json".into());
            run_chain(
                &RunOptions {
                    chain,
                    target: opt(m, "target"),
                    source: opt(m, "source"),
                    publish: flag(m, "publish"),
                    dry_run: flag(m, "dry-run"),
                },
                cwd,
            )?;
            Ok(0)
        }
        "init" => {
            init_command(
                &InitOptions {
                    project: opt(m, "project"),
                    format: opt(m, "format"),
                    dir: opt(m, "dir"),
                    lang: opt(m, "lang"),
                    chain: flag(m, "chain"),
                },
                cwd,
            )?;
            Ok(0)
        }
        other => Err(Error::msg(format!("Unknown command: {other}"))),
    }
}

/// Parse `argv` and dispatch. Returns the process exit code.
///
/// Uses `try_get_matches_from` rather than `get_matches_from` so a usage error
/// RETURNS a code instead of calling `process::exit` — both because the caller
/// owns the exit, and because otherwise no test could observe it.
///
/// The code mapping follows commander (what the TypeScript uses), not clap's
/// default: `--help`/`--version` exit 0, every other usage error exits 1
/// (clap's own convention is 2).
pub fn main_with(argv: Vec<String>, cwd: &Path) -> i32 {
    let matches = match command().try_get_matches_from(argv) {
        Ok(m) => m,
        Err(err) => {
            let _ = err.print();
            return match err.kind() {
                clap::error::ErrorKind::DisplayHelp
                | clap::error::ErrorKind::DisplayVersion
                | clap::error::ErrorKind::DisplayHelpOnMissingArgumentOrSubcommand => 0,
                _ => 1,
            };
        }
    };
    match dispatch(&matches, cwd) {
        Ok(code) => code,
        Err(err) => {
            // `handleError`: print the message (when non-empty) then exit 1.
            if !err.0.is_empty() {
                eprintln!("{}", err.0);
            }
            1
        }
    }
}

/// Entry point for the `opensdk` binary.
pub fn main() -> i32 {
    let cwd = std::env::current_dir().unwrap_or_else(|_| PathBuf::from("."));
    main_with(std::env::args().collect(), &cwd)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn the_command_tree_is_well_formed() {
        command().debug_assert();
    }

    #[test]
    fn every_typescript_subcommand_exists() {
        let cmd = command();
        let names: Vec<&str> = cmd.get_subcommands().map(|s| s.get_name()).collect();
        for want in [
            "parse", "xsdk", "generate", "diff", "publish", "run", "init",
        ] {
            assert!(
                names.contains(&want),
                "missing subcommand {want}: {names:?}"
            );
        }
    }

    #[test]
    fn generate_flags_parse() {
        let m = command().get_matches_from(vec![
            "opensdk",
            "generate",
            "--spec",
            "api.yaml",
            "--lang",
            "typescript",
            "--output",
            "./out",
            "--dry-run",
            "--no-tests",
            "--merge",
        ]);
        let (name, sub) = m.subcommand().unwrap();
        assert_eq!(name, "generate");
        assert_eq!(opt(sub, "spec").as_deref(), Some("api.yaml"));
        assert_eq!(opt(sub, "lang").as_deref(), Some("typescript"));
        assert!(flag(sub, "dry-run") && flag(sub, "no-tests") && flag(sub, "merge"));
    }

    #[test]
    fn diff_takes_two_positionals_and_defaults_fail_on_to_breaking() {
        let m = command().get_matches_from(vec!["opensdk", "diff", "a.json", "b.json"]);
        let (_, sub) = m.subcommand().unwrap();
        assert_eq!(opt(sub, "base").as_deref(), Some("a.json"));
        assert_eq!(opt(sub, "head").as_deref(), Some("b.json"));
        assert_eq!(sub.get_one::<String>("fail-on").unwrap(), "breaking");
    }

    #[test]
    fn config_is_a_global_flag_usable_after_the_subcommand() {
        let m = command().get_matches_from(vec![
            "opensdk",
            "generate",
            "--config",
            "custom.json",
            "--spec",
            "a.yaml",
        ]);
        let (_, sub) = m.subcommand().unwrap();
        assert_eq!(opt(sub, "config").as_deref(), Some("custom.json"));
    }

    #[test]
    fn xsdk_langs_split_on_commas() {
        let m = command().get_matches_from(vec![
            "opensdk",
            "xsdk",
            "--spec",
            "a.json",
            "--langs",
            "go, python ,",
        ]);
        let (_, sub) = m.subcommand().unwrap();
        let langs: Vec<String> = opt(sub, "langs")
            .map(|v| {
                v.split(',')
                    .map(|s| s.trim().to_string())
                    .filter(|s| !s.is_empty())
                    .collect()
            })
            .unwrap();
        assert_eq!(langs, vec!["go", "python"]);
    }
}
