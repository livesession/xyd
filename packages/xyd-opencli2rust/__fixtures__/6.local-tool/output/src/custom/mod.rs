//! Yours — scaffolded once by opencli2rust, never overwritten by regeneration.
//!
//! Two extension seams, both optional:
//!  * `CliOverrides` on [`Custom`] — hook/override every generated command
//!    (see src/gen/runtime/overrides.rs for the available methods).
//!  * [`register`] — add fully custom commands anywhere in the tree; a command
//!    registered on an existing path takes over that command's behavior.
//!  * [`actions`] — bind behavior to the generated non-API leaves (dev/build/…).

use crate::gen::runtime::{Actions, CliOverrides, CustomCommands};

/// Override only what you need — every trait method has a default.
pub struct Custom;

impl CliOverrides for Custom {}

/// Register hand-written commands. Called by the generated `main`.
pub fn register(commands: &mut CustomCommands) {
    let _ = commands;
    // Example — a fully custom `tools hello` subcommand:
    //
    // commands.add(&["tools"], clap::Command::new("hello").about("Say hello"), |_ctx, _m| async move {
    //     println!("hello");
    //     Ok(())
    // });
}

/// Bind behavior to the generated non-API leaves. Called by the generated `main`.
pub fn actions(actions: &mut Actions) {
    let _ = actions;
    // Example — implement the `dev` leaf:
    //
    // actions.on(&["dev"], |_ctx, _m| async move {
    //     println!("dev");
    //     Ok(())
    // });
}

pub fn overrides() -> Custom {
    Custom
}
