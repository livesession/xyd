//! Hand-owned (protected by .sdkignore): behavior for the generated `xyd` CLI.
//!
//! The command SURFACE is generated from opencli.json into src/gen/**; behavior
//! for the non-API leaves (`dev`/`build`/…) binds here via [`actions`]. `dev`/`build`
//! drive the JS-on-Bun render engine (spawned via [`engine`]); `completion opencli`
//! and `serve` (the static-site case) are NATIVE Rust; and every remaining leaf
//! forwards its raw argv to the (embedded) engine — the engine is the full CLI, so
//! `engine <original args>` reproduces the command exactly. No "not implemented"
//! ever reaches a user.

mod engine;
mod serve;

use clap::ArgMatches;

use crate::gen::runtime::{Actions, CliOverrides, CustomCommands, Error};

/// Override only what you need — every `CliOverrides` method has a default.
pub struct Custom;

impl CliOverrides for Custom {}

/// Register fully custom commands grafted into the generated tree. Unused for
/// now — the xyd commands are generated non-API leaves, bound via [`actions`].
pub fn register(commands: &mut CustomCommands) {
    let _ = commands;
}

/// Bind behavior to the generated non-API leaves. Called by `main`.
pub fn actions(actions: &mut Actions) {
    // `dev`/`build` DRIVE the JS-on-Bun render engine — spawn it, inherit stdio,
    // forward signals, propagate its exit code (see [`engine`]). Global flags
    // (`--port`/build flags) are NOT in the generated clap tree, so the args are
    // read from raw argv (`engine::dev_engine_args` / `engine::build_engine_args`);
    // the flag-carrying invocations are routed here BEFORE clap by the main shim.
    actions.on(&["dev"], |_ctx, _m: ArgMatches| async move {
        engine::spawn_engine(&engine::dev_engine_args()).await
    });
    actions.on(&["build"], |_ctx, _m: ArgMatches| async move {
        engine::spawn_engine(&engine::build_engine_args()).await
    });

    // `serve` is a NATIVE Rust static file server for the built site
    // (`.xyd/build/client/`). The port comes from `--port`/`-p`/`PORT` read from
    // raw argv/env (via [`serve::resolve_port`], same as `dev`) — the flag isn't in
    // the generated clap tree, so `serve` is routed here BEFORE clap by the main
    // shim. An EDGE deploy (`server.mjs` present) can't be served natively, so
    // [`serve::run`] forwards that case to the embedded engine instead.
    actions.on(&["serve"], |_ctx, _m: ArgMatches| async move {
        serve::run(serve::resolve_port()).await
    });

    // `completion opencli` prints the embedded source-of-truth OpenCLI document
    // (`node …/xyd-cli completion opencli` parity) — native, no engine needed.
    // Every other shell (zsh/fish/install) forwards its raw argv to the engine.
    actions.on(&["completion"], |_ctx, m: ArgMatches| async move {
        match m.get_one::<String>("shell").map(String::as_str) {
            Some("opencli") => {
                print!("{}", include_str!("../../opencli.json"));
                Ok(())
            }
            // zsh/fish/install (and anything else clap accepted) → engine.
            Some(_) => engine::forward_to_engine().await,
            None => Err(Error::Invalid(
                "completion: missing <shell> argument".into(),
            )),
        }
    });

    // Everything not ported natively forwards its RAW argv to the embedded engine
    // for instant parity (the engine is the full CLI). `opensdk` is routed here by
    // the pre-clap shim in `main.rs`; the rest arrive through clap → `Actions`.
    for path in [
        &["install"][..],
        &["components", "install"][..],
        &["components", "uninstall"][..],
        &["migrateme"][..],
        &["opensdk"][..],
    ] {
        actions.on(path, |_ctx, _m: ArgMatches| async move {
            engine::forward_to_engine().await
        });
    }
}

pub fn overrides() -> Custom {
    Custom
}
