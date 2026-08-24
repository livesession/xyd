//! Interactive y/n prompts for `migrateme` (port of `cli.ts`). Uses raw stdin — no
//! prompt-crate dependency. The cyan prompt uses a literal ANSI escape exactly like the
//! TS (which colors unconditionally, not via a TTY-aware colorizer).

use std::io::{self, Write};

use super::resource;

/// Print `<question> (y/n): ` (cyan) and return true for `y`/`yes`.
fn ask_for_confirmation(question: &str) -> bool {
    print!("\x1b[36m{question}\x1b[0m (y/n): ");
    let _ = io::stdout().flush();
    let mut answer = String::new();
    if io::stdin().read_line(&mut answer).is_err() {
        return false;
    }
    let normalized = answer.trim().to_lowercase();
    normalized == "y" || normalized == "yes"
}

/// Optionally clean the current directory before processing (`askForClean`; the `--dir`
/// flag is unreachable so `saveDir` is always cwd).
pub fn ask_for_clean() {
    if ask_for_confirmation("Should the folder be cleaned before processing?") {
        let save_dir = std::env::current_dir().unwrap_or_else(|_| std::path::PathBuf::from("."));
        resource::clean_directory(&save_dir);
    }
}

/// Confirm the migration should start; exit(0) if the user declines (`askForStart`).
pub fn ask_for_start() {
    if !ask_for_confirmation("Do you want to start the migration?") {
        println!("Migration cancelled");
        std::process::exit(0);
    }
}
