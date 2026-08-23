//! Hand-owned (protected by .sdkignore): behavior for the generated `xyd` CLI.
//!
//! The command SURFACE is generated from opencli.json into src/gen/**; behavior
//! for the non-API leaves binds here via [`actions`]. `dev`/`build` drive the JS-on-Bun
//! render engine (spawned via [`engine`]). NATIVE Rust leaves: `serve` (the static-site
//! case), `completion` (zsh/fish/install/opencli), `opensdk`, and `components
//! install/uninstall opensdk`. The rest — `install`, `components install diagrams`, and
//! `migrateme` — forward their raw argv to the (embedded) engine, which is the full CLI,
//! so `engine <original args>` reproduces the command exactly. No "not implemented" ever
//! reaches a user.

mod completion;
mod engine;
mod migrateme;
mod opensdk;
mod paths;
mod pm;
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

    // `completion` (zsh/fish/install/opencli) is NATIVE — it generates the shell
    // scripts / prints the embedded OpenCLI doc directly from `opencli.json`, no engine
    // needed. Routed here BEFORE clap by the `main.rs` shim so `completion install
    // <shell>` (a second positional not in the clap tree) and bare `completion` (shell
    // auto-detected from $SHELL) reach the handler; it reads the tokens from raw argv.
    actions.on(&["completion"], |_ctx, _m: ArgMatches| async move {
        completion::run().await
    });

    // `opensdk` runs the installed toolchain natively (raw passthrough, routed pre-clap
    // in `main.rs`); `components install/uninstall opensdk` manage that component. Only
    // the `opensdk` component is native — the `diagrams` component and `install` are
    // documan-owned and forward to the engine.
    actions.on(&["opensdk"], |_ctx, _m: ArgMatches| async move {
        opensdk::run()
    });
    actions.on(
        &["components", "install"],
        |_ctx, m: ArgMatches| async move {
            match m.get_one::<String>("component").map(String::as_str) {
                Some("opensdk") => opensdk::install(),
                _ => engine::forward_to_engine().await,
            }
        },
    );
    actions.on(
        &["components", "uninstall"],
        |_ctx, m: ArgMatches| async move {
            match m.get_one::<String>("component").map(String::as_str) {
                Some("opensdk") => opensdk::uninstall(),
                other => Err(Error::Invalid(format!(
                    "'{}' cannot be uninstalled (only: opensdk).",
                    other.unwrap_or("")
                ))),
            }
        },
    );

    // `migrateme <path>` is NATIVE — detect the source docs framework and migrate in place
    // (Mintlify: docs.json → xyd settings + `.mdx` → `.md`). Its `<path>` positional is in
    // the generated clap tree, so it's read from `ArgMatches`.
    actions.on(&["migrateme"], |_ctx, m: ArgMatches| async move {
        migrateme::run(&m).await
    });

    // `install` (framework installer) and `components install diagrams` remain documan
    // features (readSettings / docs.ts eval + the bundled host template) → forwarded to the
    // embedded engine (the full CLI).
    actions.on(&["install"], |_ctx, _m: ArgMatches| async move {
        engine::forward_to_engine().await
    });
}

pub fn overrides() -> Custom {
    Custom
}
