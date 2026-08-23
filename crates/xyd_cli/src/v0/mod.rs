//! Hand-owned (protected by .sdkignore): behavior for the generated `xyd` CLI.
//!
//! The command SURFACE is generated from opencli.json into src/opencli/**; behavior
//! for the non-API leaves is implemented here via the generated [`Commands`] trait —
//! one required method per leaf, so the compiler flags any we forget. `dev`/`build`
//! drive the JS-on-Bun render engine (spawned via [`engine`]). NATIVE Rust leaves:
//! `serve` (the static-site case), `completion` (zsh/fish/install/opencli), `opensdk`,
//! and `components install/uninstall opensdk`. The rest — `install`, `components
//! install diagrams`, and `migrateme` — forward their raw argv to the (embedded)
//! engine, which is the full CLI, so `engine <original args>` reproduces the command
//! exactly. No "not implemented" ever reaches a user.

mod completion;
mod engine;
mod migrateme;
mod opensdk;
mod paths;
mod pm;
mod serve;

use std::future::Future;
use std::pin::Pin;

use clap::ArgMatches;

use crate::opencli::runtime::{CliOverrides, Commands, Context, CustomCommands, Error};

/// Override only what you need — every `CliOverrides` method has a default.
pub struct Cli;

impl CliOverrides for Cli {}

/// Register fully custom commands grafted into the generated tree. Unused for now —
/// the xyd commands are generated non-API leaves, implemented via [`Commands`].
pub fn register(commands: &mut CustomCommands) {
    let _ = commands;
}

/// Behavior for every generated non-API leaf. `main` wires these in via the generated
/// `opencli::runtime::bind::<Cli>`; a leaf added to the OpenCLI surface won't compile
/// until its method is implemented here.
impl Commands for Cli {
    // `dev`/`build` DRIVE the JS-on-Bun render engine — spawn it, inherit stdio,
    // forward signals, propagate its exit code (see [`engine`]). Global flags
    // (`--port`/build flags) are NOT in the generated clap tree, so the args are read
    // from raw argv (`engine::dev_engine_args` / `engine::build_engine_args`); the
    // flag-carrying invocations are routed here BEFORE clap by the main shim.
    fn dev(_ctx: Context, _m: ArgMatches) -> Pin<Box<dyn Future<Output = Result<(), Error>>>> {
        Box::pin(async move { engine::spawn_engine(&engine::dev_engine_args()).await })
    }
    fn build(_ctx: Context, _m: ArgMatches) -> Pin<Box<dyn Future<Output = Result<(), Error>>>> {
        Box::pin(async move { engine::spawn_engine(&engine::build_engine_args()).await })
    }

    // `serve` is a NATIVE Rust static file server for the built site
    // (`.xyd/build/client/`). The port comes from `--port`/`-p`/`PORT` read from raw
    // argv/env (via [`serve::resolve_port`]) — routed here BEFORE clap by the main
    // shim. An EDGE deploy (`server.mjs` present) can't be served natively, so
    // [`serve::run`] forwards that case to the embedded engine instead.
    fn serve(_ctx: Context, _m: ArgMatches) -> Pin<Box<dyn Future<Output = Result<(), Error>>>> {
        Box::pin(async move { serve::run(serve::resolve_port()).await })
    }

    // `install` (framework installer) remains a documan feature (readSettings /
    // docs.ts eval + the bundled host template) → forwarded to the embedded engine.
    fn install(_ctx: Context, _m: ArgMatches) -> Pin<Box<dyn Future<Output = Result<(), Error>>>> {
        Box::pin(async move { engine::forward_to_engine().await })
    }

    // `migrateme <path>` is NATIVE — detect the source docs framework and migrate in
    // place (Mintlify: docs.json → xyd settings + `.mdx` → `.md`). Its `<path>`
    // positional is in the generated clap tree, so it's read from `ArgMatches`.
    fn migrateme(_ctx: Context, m: ArgMatches) -> Pin<Box<dyn Future<Output = Result<(), Error>>>> {
        Box::pin(async move { migrateme::run(&m).await })
    }

    // `components install/uninstall opensdk` manage the opensdk component natively;
    // only that component is native — the `diagrams` component and `install` are
    // documan-owned and forward to the engine.
    fn components_install(
        _ctx: Context,
        m: ArgMatches,
    ) -> Pin<Box<dyn Future<Output = Result<(), Error>>>> {
        Box::pin(async move {
            match m.get_one::<String>("component").map(String::as_str) {
                Some("opensdk") => opensdk::install(),
                _ => engine::forward_to_engine().await,
            }
        })
    }
    fn components_uninstall(
        _ctx: Context,
        m: ArgMatches,
    ) -> Pin<Box<dyn Future<Output = Result<(), Error>>>> {
        Box::pin(async move {
            match m.get_one::<String>("component").map(String::as_str) {
                Some("opensdk") => opensdk::uninstall(),
                other => Err(Error::Invalid(format!(
                    "'{}' cannot be uninstalled (only: opensdk).",
                    other.unwrap_or("")
                ))),
            }
        })
    }

    // `opensdk` runs the installed toolchain natively (raw passthrough, routed
    // pre-clap in `main.rs`).
    fn opensdk(_ctx: Context, _m: ArgMatches) -> Pin<Box<dyn Future<Output = Result<(), Error>>>> {
        Box::pin(async move { opensdk::run() })
    }

    // `completion` (zsh/fish/install/opencli) is NATIVE — it generates the shell
    // scripts / prints the embedded OpenCLI doc directly from `opencli.json`, no engine
    // needed. Routed here BEFORE clap by the `main.rs` shim so `completion install
    // <shell>` and bare `completion` reach the handler; it reads tokens from raw argv.
    fn completion(
        _ctx: Context,
        _m: ArgMatches,
    ) -> Pin<Box<dyn Future<Output = Result<(), Error>>>> {
        Box::pin(async move { completion::run().await })
    }
}

pub fn overrides() -> Cli {
    Cli
}
