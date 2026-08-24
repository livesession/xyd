//! Yours — scaffolded once by opencli2rust, never overwritten by regeneration.
//!
//! Two extension seams, both optional:
//!  * `CliOverrides` on [`Custom`] — hook/override every generated command
//!    (see src/gen/runtime/overrides.rs for the available methods).
//!  * [`register`] — add fully custom commands anywhere in the tree; a command
//!    registered on an existing path takes over that command's behavior.
//!  * [`Commands`] — one required method per generated non-API leaf (dev/build/…);
//!    the compiler names any you forget to implement.

use std::future::Future;
use std::pin::Pin;

use clap::ArgMatches;

use crate::gen::runtime::{CliOverrides, Commands, Context, CustomCommands, Error};

/// Override only what you need — every trait method has a default.
pub struct Custom;

impl CliOverrides for Custom {}

/// Behavior for every generated non-API leaf. Each method is stubbed — replace the
/// body with your implementation.
impl Commands for Custom {
    fn dev(ctx: Context, m: ArgMatches) -> Pin<Box<dyn Future<Output = Result<(), Error>>>> {
        Box::pin(async move {
            let _ = (ctx, m);
            Err(Error::Invalid("dev not implemented".into()))
        })
    }
    fn build(ctx: Context, m: ArgMatches) -> Pin<Box<dyn Future<Output = Result<(), Error>>>> {
        Box::pin(async move {
            let _ = (ctx, m);
            Err(Error::Invalid("build not implemented".into()))
        })
    }
    fn migrateme(ctx: Context, m: ArgMatches) -> Pin<Box<dyn Future<Output = Result<(), Error>>>> {
        Box::pin(async move {
            let _ = (ctx, m);
            Err(Error::Invalid("migrateme not implemented".into()))
        })
    }
    fn components_install(ctx: Context, m: ArgMatches) -> Pin<Box<dyn Future<Output = Result<(), Error>>>> {
        Box::pin(async move {
            let _ = (ctx, m);
            Err(Error::Invalid("components_install not implemented".into()))
        })
    }
    fn components_uninstall(ctx: Context, m: ArgMatches) -> Pin<Box<dyn Future<Output = Result<(), Error>>>> {
        Box::pin(async move {
            let _ = (ctx, m);
            Err(Error::Invalid("components_uninstall not implemented".into()))
        })
    }
    fn completion(ctx: Context, m: ArgMatches) -> Pin<Box<dyn Future<Output = Result<(), Error>>>> {
        Box::pin(async move {
            let _ = (ctx, m);
            Err(Error::Invalid("completion not implemented".into()))
        })
    }
    fn exec(ctx: Context, m: ArgMatches) -> Pin<Box<dyn Future<Output = Result<(), Error>>>> {
        Box::pin(async move {
            let _ = (ctx, m);
            Err(Error::Invalid("exec not implemented".into()))
        })
    }
}

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

pub fn overrides() -> Custom {
    Custom
}
