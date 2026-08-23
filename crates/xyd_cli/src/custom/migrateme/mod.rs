//! Native `migrateme` — port of `packages/xyd-cli/src/commands/migrateme/**`.
//!
//! Entry flow ([`run`]): a GitHub URL is downloaded/extracted then migrated; a local path
//! is migrated in place. Migration = framework detection ([`detect`]) → the Mintlify
//! migrator ([`mintlify`]): `docs.json` → xyd settings (byte-parity), stray images → public/,
//! and every `.mdx` → `.md`. Bound natively in `super::mod`.

mod detect;
mod github;
mod mintlify;
mod prompt;
mod resource;

use clap::ArgMatches;

use crate::gen::runtime::Error;

/// `xyd migrateme <path>` — entry flow (mirrors `migrateme()` in migrateme.ts): a GitHub
/// URL is downloaded/extracted (after a clean prompt) then migrated; a local path is
/// migrated in place (after a start prompt).
pub async fn run(m: &ArgMatches) -> Result<(), Error> {
    let resource = m
        .get_one::<String>("path")
        .map(String::as_str)
        .unwrap_or("");
    if resource.is_empty() {
        eprintln!("No resource provided");
        return Ok(());
    }

    if github::is_github_repo(resource) {
        prompt::ask_for_clean();
        let extract_dir = github::download_github_repo(resource).await?;
        return detect::run(&extract_dir).await;
    }

    let docs_path = resource::resolve_resource_path(resource);
    if docs_path.exists() {
        prompt::ask_for_start();
        return detect::run(&docs_path).await;
    }

    eprintln!("No support for this resource yet");
    Ok(())
}
