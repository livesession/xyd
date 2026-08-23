//! Native `migrateme` — WORK IN PROGRESS (staged; see the plan).
//!
//! Port of `packages/xyd-cli/src/commands/migrateme/**`. Staged:
//!   * S1 (this): entry flow, GitHub download/extract, prompts, framework detection.
//!   * S2: Mintlify `docs.json` → xyd Settings (byte-parity).
//!   * S3: Mintlify `.mdx` → `.md` (MDX rewrite + a hand-written mdast→markdown serializer).
//!
//! Until S3 lands, the `migrateme` action in `super::mod` still FORWARDS the whole
//! command to the embedded engine (the engine is the full CLI → zero regression). These
//! modules are therefore exercised only by their own unit tests for now, hence the
//! crate-local `dead_code` allow — it is removed when `run` is wired at the S3 flip.
#![allow(dead_code)]

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
