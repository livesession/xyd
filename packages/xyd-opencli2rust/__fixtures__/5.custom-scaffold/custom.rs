//! Hand-edited custom module simulating a user's customizations.

use crate::gen::runtime::{CliOverrides, CustomCommands};

pub struct Custom;

impl CliOverrides for Custom {
    fn print_success(&self, cmd_path: &[String], value: &serde_json::Value) {
        println!("[custom:{}]", cmd_path.join(" "));
        match serde_json::to_string_pretty(value) {
            Ok(text) => println!("{text}"),
            Err(_) => println!("{value}"),
        }
    }
}

pub fn register(commands: &mut CustomCommands) {
    // A brand-new command grafted under a new path.
    commands.add(&["tools"], clap::Command::new("hello").about("Say hello"), |ctx, _m| async move {
        println!("hello from custom code! base_url={}", ctx.base_url);
        Ok(())
    });

    // Override an EXISTING generated command's behavior.
    commands.add(&["models"], clap::Command::new("list"), |_ctx, _m| async move {
        println!("overridden models list!");
        Ok(())
    });
}

pub fn overrides() -> Custom {
    Custom
}
