// Hand-owned (protected by .sdkignore). The generated command router lives in
// src/gen/** (regenerated from opencli.json by regen.mjs). This shim mirrors the
// current TypeScript `cli.ts` entry point — `opensdk` raw passthrough, default
// command `dev`, and `XYD_CLI=1` — applied BEFORE clap sees the args, then hands
// off to the generated `gen::cli::run`.

mod custom;
mod gen;

use std::process::ExitCode;

/// Top-level commands the OpenCLI doc declares (mirrored by src/gen). Used only
/// to decide whether the first non-flag token is a real command or whether we
/// should fall back to the default `dev` command.
const KNOWN_COMMANDS: &[&str] = &[
    "dev",
    "build",
    "serve",
    "install",
    "migrateme",
    "components",
    "opensdk",
    "completion",
];

#[tokio::main]
async fn main() -> ExitCode {
    // Downstream (engine, plugins) keys off this — set it before any dispatch.
    std::env::set_var("XYD_CLI", "1");

    let raw: Vec<String> = std::env::args().skip(1).collect();

    // (a) `opensdk` is a RAW passthrough to the (optionally installed) toolchain,
    // whose own flags (e.g. `--lang`) clap would reject — it never goes through
    // clap. The bound `opensdk` action forwards the FULL raw argv tail to the
    // embedded engine (`engine opensdk <raw tail…>`), so `xyd opensdk generate
    // --lang ts` reaches the toolchain exactly as typed.
    if raw.first().map(String::as_str) == Some("opensdk") {
        return run_action(&["opensdk"]).await;
    }

    // (b) `dev`/`build`/`serve` are dispatched as actions BEFORE clap. Their flags —
    // the global `--port`/`-p` (dev + serve) and build's flags — are NOT part of the
    // generated clap tree, so letting clap parse them would be a hard rejection. The
    // bound actions instead read the flags from raw argv (which the shim leaves
    // untouched). `dev` is also the DEFAULT command (as in the TS CLI): no command at
    // all (empty / flags-only) or an unknown first token → `dev`.
    // `--version`/`--help` must still reach clap (it owns those built-ins).
    let wants_builtin = raw
        .iter()
        .any(|a| matches!(a.as_str(), "--version" | "-V" | "--help" | "-h"));
    let first_non_flag = raw.iter().find(|a| !a.starts_with('-')).map(String::as_str);
    if !wants_builtin {
        match first_non_flag {
            Some("dev") | None => return run_action(&["dev"]).await,
            Some("build") => return run_action(&["build"]).await,
            Some("serve") => return run_action(&["serve"]).await,
            // A known command other than dev/build/serve → hand off to clap (below).
            Some(cmd) if KNOWN_COMMANDS.contains(&cmd) => {}
            // Unknown first token → default to `dev` (TS-CLI parity).
            Some(_) => return run_action(&["dev"]).await,
        }
    }

    // (c) Normal path: hand off to the generated router exactly as the generated
    // `main` did. It reads the real argv, which we deliberately left untouched.
    let mut commands = gen::runtime::CustomCommands::new();
    custom::register(&mut commands);
    let mut actions = gen::runtime::Actions::new();
    custom::actions(&mut actions);
    gen::cli::run(custom::overrides(), commands, actions).await
}

/// Run one generated non-API leaf action directly, outside clap — used by the
/// argv shim for `dev`/`build` (whose global/build flags aren't in the clap tree)
/// and the `opensdk` passthrough. These actions read their flags from raw argv,
/// so the empty `ArgMatches` passed here is unused. Behavior binds in
/// `src/custom/mod.rs`; an unbound leaf reports the standard "add actions.on(...)"
/// hint via the override error path.
async fn run_action(path: &[&str]) -> ExitCode {
    use gen::runtime::CliOverrides;

    let ctx = gen::runtime::Context::from_env();
    let mut actions = gen::runtime::Actions::new();
    custom::actions(&mut actions);
    let overrides = custom::overrides();

    let owned: Vec<String> = path.iter().map(|s| s.to_string()).collect();
    let matches = empty_matches();
    match actions.run(&ctx, &owned, &matches).await {
        Ok(()) => ExitCode::SUCCESS,
        Err(err) => overrides.print_error(&owned, &err),
    }
}

/// A throwaway empty `ArgMatches` for argless action dispatch from the shim.
fn empty_matches() -> clap::ArgMatches {
    clap::Command::new("xyd").get_matches_from(["xyd"])
}
