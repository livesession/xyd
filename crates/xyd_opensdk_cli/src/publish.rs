//! `src/cli/publish.ts` plus the seven `publish<Lang>()` functions from the
//! emitter packages (`packages/xyd-opensdk-<lang>/src/publish.ts`).
//!
//! The publishers live here, not in the Rust emitter crates, because those
//! crates are PURE (IR in, file map out) and are linked into the
//! `@xyd-js/native` cdylib — a `std::process::Command` dependency in each of the
//! seven would follow them there. The TypeScript splits them per package only
//! because its publish e2e imports them individually.
//!
//! Identity (author/license/...) is baked into the manifests at GENERATE time;
//! this step only carries the REGISTRY MECHANICS (registry URL + auth token
//! from `tokenEnv`).

use std::path::{Path, PathBuf};

use xyd_opensdk_config::{merge_publish_targets, PublishTarget};

use crate::cli_targets::is_cli_target;
use crate::config::ResolvedConfig;
use crate::error::{Error, Result};
use crate::exec::{command_output, first_file, run_command, EmitterPublishOptions};
use crate::paths;
use crate::registry::resolve_lang;

/// "Publish" the generated Go module — Go has no registry, so this is a git tag.
fn publish_go(dir: &Path, opts: &EmitterPublishOptions) -> Result<()> {
    let version = opts.version.clone().unwrap_or_else(|| "0.0.0".into());
    let version = version.strip_prefix('v').unwrap_or(&version).to_string();
    let tag = format!("v{version}");
    if opts.dry_run {
        println!("[dry-run] would tag {tag} in {}", dir.display());
        return Ok(());
    }
    let git = |args: &[&str], tolerant: bool| -> Result<i32> {
        let mut full = vec!["-c", "user.email=opensdk@local", "-c", "user.name=opensdk"];
        full.extend_from_slice(args);
        run_command("git", &full, dir, &[], tolerant)
    };
    let has_head = !command_output("git", &["rev-parse", "--verify", "HEAD"], dir)
        .trim()
        .is_empty();
    if !has_head {
        // A freshly generated dir (or an initialized-but-empty repo): create the
        // commit to tag.
        git(&["init", "-q"], false)?;
        git(&["add", "-A"], false)?;
        git(&["commit", "-q", "-m", "opensdk publish"], true)?; // tolerate "nothing to commit"
    } else if !command_output("git", &["status", "--porcelain"], dir)
        .trim()
        .is_empty()
    {
        // Existing repo: tag the user's HEAD — never sweep their working tree
        // into a commit.
        return Err(Error::msg(format!(
            "{} is a git repo with a dirty working tree — commit or stash before publishing so \
             the tag points at a known commit.",
            dir.display()
        )));
    }
    git(&["tag", &tag], false)?;
    if command_output("git", &["remote"], dir).trim().is_empty() {
        println!("Tagged {tag}. No git remote configured — push it to publish the module.");
    } else {
        git(&["push", "--tags"], false)?;
    }
    Ok(())
}

/// `python -m build` then `twine upload`.
fn publish_python(dir: &Path, opts: &EmitterPublishOptions) -> Result<()> {
    run_command("python3", &["-m", "build"], dir, &[], false)?;
    if opts.dry_run {
        return Ok(());
    }
    let mut args: Vec<&str> = vec!["upload"];
    if let Some(registry) = opts.registry.as_deref() {
        args.push("--repository-url");
        args.push(registry);
    }
    args.push("dist/*");
    let env = vec![
        (
            "TWINE_USERNAME",
            std::env::var("TWINE_USERNAME").unwrap_or_else(|_| "__token__".into()),
        ),
        (
            "TWINE_PASSWORD",
            opts.token.clone().unwrap_or_else(|| {
                std::env::var("TWINE_PASSWORD").unwrap_or_else(|_| "opensdk".into())
            }),
        ),
    ];
    run_command("twine", &args, dir, &env, false)?;
    Ok(())
}

/// `npm install` (so the package's `prepare` script can build `dist/`) then
/// `npm publish`. Auth goes through a throwaway userconfig so it never lands in
/// the package dir.
fn publish_node(dir: &Path, opts: &EmitterPublishOptions) -> Result<()> {
    let registry = opts
        .registry
        .clone()
        .unwrap_or_else(|| "https://registry.npmjs.org".into());
    // Install deps from the DEFAULT registry; only `npm publish` targets
    // `--registry`.
    run_command("npm", &["install"], dir, &[], false)?;
    let host = registry
        .strip_prefix("https:")
        .or_else(|| registry.strip_prefix("http:"))
        .unwrap_or(&registry)
        .trim_end_matches('/')
        .to_string();

    let mut token = opts.token.clone();
    if token.is_none() && !opts.dry_run && opts.registry.is_some() {
        let key = format!("{host}/:_authToken");
        let ambient = command_output("npm", &["config", "get", &key], dir)
            .trim()
            .to_string();
        if ambient.is_empty() || ambient == "undefined" || ambient == "null" {
            // npm refuses to publish without a token (client-side ENEEDAUTH)
            // even when the registry itself allows anonymous publish.
            token = Some("opensdk-anonymous".into());
        }
    }

    let userconfig: Option<PathBuf> = match (&token, opts.dry_run) {
        (Some(token), false) => {
            let tmp = std::env::temp_dir().join(format!(
                "opensdk-npmrc-{}-{}",
                std::process::id(),
                std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)
                    .map(|d| d.as_nanos())
                    .unwrap_or_default()
            ));
            std::fs::create_dir_all(&tmp)?;
            let path = tmp.join(".npmrc");
            std::fs::write(&path, format!("{host}/:_authToken={token}\n"))?;
            Some(path)
        }
        _ => None,
    };

    let userconfig_str = userconfig
        .as_ref()
        .map(|p| p.to_string_lossy().to_string())
        .unwrap_or_default();
    let mut args: Vec<&str> = vec!["publish", "--registry", &registry];
    if let Some(tag) = opts.tag.as_deref() {
        args.push("--tag");
        args.push(tag);
    }
    if opts.dry_run {
        args.push("--dry-run");
    }
    if userconfig.is_some() {
        args.push("--userconfig");
        args.push(&userconfig_str);
    }
    let outcome = run_command("npm", &args, dir, &[], false);
    if let Some(path) = userconfig {
        if let Some(parent) = path.parent() {
            std::fs::remove_dir_all(parent).ok();
        }
    }
    outcome.map(|_| ())
}

/// `gem build` then `gem push`.
fn publish_ruby(dir: &Path, opts: &EmitterPublishOptions) -> Result<()> {
    let gemspec = first_file(dir, |n| n.ends_with(".gemspec"))
        .ok_or_else(|| Error::msg(format!("No .gemspec in {}.", dir.display())))?;
    run_command(
        "gem",
        &["build", &paths::basename(&gemspec)],
        dir,
        &[],
        false,
    )?;
    if opts.dry_run {
        return Ok(());
    }
    let gem = first_file(dir, |n| n.ends_with(".gem"))
        .ok_or_else(|| Error::msg(format!("gem build produced no .gem in {}.", dir.display())))?;
    let gem_base = paths::basename(&gem);
    let mut args: Vec<&str> = vec!["push"];
    if let Some(registry) = opts.registry.as_deref() {
        args.push("--host");
        args.push(registry);
    }
    args.push(&gem_base);
    // Auth: an explicit token wins; else an ambient GEM_HOST_API_KEY; else the
    // user's ~/.gem/credentials. Only when NONE exist do we inject a throwaway
    // key — GEM_HOST_API_KEY takes precedence over the credentials file, so it
    // must never be set when real creds are present.
    let ambient = std::env::var("GEM_HOST_API_KEY").ok();
    let has_creds = ambient.is_none()
        && std::env::var("HOME")
            .map(|h| Path::new(&h).join(".gem").join("credentials").exists())
            .unwrap_or(false);
    let key = opts
        .token
        .clone()
        .or(ambient)
        .or_else(|| (!has_creds).then(|| "opensdk".to_string()));
    let env: Vec<(&str, String)> = key.into_iter().map(|k| ("GEM_HOST_API_KEY", k)).collect();
    run_command("gem", &args, dir, &env, false)?;
    Ok(())
}

/// `mvn deploy` (or `mvn package` on a dry run).
fn publish_java(dir: &Path, opts: &EmitterPublishOptions) -> Result<()> {
    if opts.dry_run {
        run_command("mvn", &["-q", "-DskipTests", "package"], dir, &[], false)?;
        return Ok(());
    }
    let mut args: Vec<String> = vec!["-q".into(), "-DskipTests".into(), "deploy".into()];
    if let Some(registry) = opts.registry.as_deref() {
        let repo = if has_url_scheme(registry) {
            registry.to_string()
        } else {
            format!("file://{}", paths::resolve_str(dir, registry))
        };
        args.push(format!(
            "-DaltDeploymentRepository=opensdk::default::{repo}"
        ));
    }
    let refs: Vec<&str> = args.iter().map(String::as_str).collect();
    run_command("mvn", &refs, dir, &[], false)?;
    Ok(())
}

/// `dotnet pack` then `dotnet nuget push`.
fn publish_dotnet(dir: &Path, opts: &EmitterPublishOptions) -> Result<()> {
    run_command("dotnet", &["pack", "-c", "Release"], dir, &[], false)?;
    if opts.dry_run {
        return Ok(());
    }
    let release = dir.join("bin").join("Release");
    let nupkg = first_file(&release, |n| n.ends_with(".nupkg")).ok_or_else(|| {
        Error::msg(format!(
            "dotnet pack produced no .nupkg under {}/bin/Release.",
            dir.display()
        ))
    })?;
    let registry = opts
        .registry
        .clone()
        .unwrap_or_else(|| "https://api.nuget.org/v3/index.json".into());
    if !has_url_scheme(&registry) {
        std::fs::create_dir_all(&registry)?; // folder feed
    }
    let mut args: Vec<&str> = vec!["nuget", "push", &nupkg, "-s", &registry];
    if let Some(token) = opts.token.as_deref() {
        args.push("-k");
        args.push(token);
    }
    run_command("dotnet", &args, dir, &[], false)?;
    Ok(())
}

/// `cargo publish` (or `cargo package` on a dry run / local-dir registry).
fn publish_rust(dir: &Path, opts: &EmitterPublishOptions) -> Result<()> {
    if first_file(dir, |n| n == "Cargo.toml").is_none() {
        return Err(Error::msg(format!("No Cargo.toml in {}.", dir.display())));
    }
    let local_dir = opts
        .registry
        .as_deref()
        .is_some_and(|r| Path::new(r).is_dir());
    if opts.dry_run || local_dir {
        run_command(
            "cargo",
            &["package", "--allow-dirty", "--no-verify"],
            dir,
            &[],
            false,
        )?;
        return Ok(());
    }
    let mut args: Vec<&str> = vec!["publish", "--allow-dirty", "--no-verify"];
    if let Some(registry) = opts.registry.as_deref() {
        args.push("--registry");
        args.push(registry);
    }
    if let Some(token) = opts.token.as_deref() {
        args.push("--token");
        args.push(token);
    }
    run_command("cargo", &args, dir, &[], false)?;
    Ok(())
}

/// The TS `/^\w+:\/\//` test — is this a URL rather than a local path?
fn has_url_scheme(value: &str) -> bool {
    match value.find("://") {
        Some(0) | None => false,
        Some(i) => value[..i]
            .chars()
            .all(|c| c.is_ascii_alphanumeric() || c == '_'),
    }
}

/// Package + publish ONE already-generated SDK at `dir` for `lang`.
pub fn publish_target(lang: &str, dir: &Path, opts: &EmitterPublishOptions) -> Result<()> {
    // CLI outputs have no registry publisher — skip (not error) so a mixed chain
    // with --publish never aborts halfway through its SDK targets.
    if is_cli_target(Some(lang)) {
        eprintln!(
            "Skipping publish for \"{lang}\" — CLI targets have no registry publisher (ship the \
             generated project via its own repo / goreleaser / cargo publish)."
        );
        return Ok(());
    }
    let canonical = resolve_lang(lang);
    if !dir.exists() {
        return Err(Error::msg(format!(
            "No generated SDK at {}. Run `opensdk generate` first (or pass --spec to regenerate).",
            dir.display()
        )));
    }
    match canonical.as_str() {
        "go" => publish_go(dir, opts),
        "python" => publish_python(dir, opts),
        "node" => publish_node(dir, opts),
        "ruby" => publish_ruby(dir, opts),
        "java" => publish_java(dir, opts),
        "dotnet" => publish_dotnet(dir, opts),
        "rust" => publish_rust(dir, opts),
        other => Err(Error::msg(format!(
            "No publisher for language \"{other}\"."
        ))),
    }
}

/// Resolve a token from a publish target's `tokenEnv` (env only; never stored).
pub fn resolve_token(publish: Option<&PublishTarget>) -> Option<String> {
    // The config's `tokenEnv` names the variable to read. Programmatic callers that have
    // no sdk.json (the apitoolchain gateway publishes from its own DB) can instead set
    // OPENSDK_PUBLISH_TOKEN. Deliberately env, never a flag: argv is world-readable via
    // `ps`, so a token passed as an argument would leak to every user on the host.
    let ambient = || match std::env::var(AMBIENT_TOKEN_ENV) {
        Ok(v) if !v.is_empty() => Some(v),
        _ => None,
    };
    let Some(token_env) = publish.and_then(|p| p.token_env.as_deref()) else {
        return ambient();
    };
    match std::env::var(token_env) {
        Ok(v) if !v.is_empty() => Some(v),
        _ => ambient().or_else(|| {
            eprintln!("Warning: publish.tokenEnv \"{token_env}\" is not set in the environment.");
            None
        }),
    }
}

/// Fallback auth-token variable for callers with no `sdk.json` publish config.
pub const AMBIENT_TOKEN_ENV: &str = "OPENSDK_PUBLISH_TOKEN";

#[derive(Debug, Clone, Default)]
pub struct PublishCommandOptions {
    /// Single language/alias; omit to publish every declared language.
    pub lang: Option<String>,
    /// Output dir (single `--lang`) or base dir for per-language subfolders.
    pub output: String,
    /// Registry override (wins over the config `publish.registry`).
    pub registry: Option<String>,
    /// Pack only — don't push.
    pub dry_run: bool,
    /// Package version override (wins over the config `publish.version`).
    pub package_version: Option<String>,
    /// Dist-tag for registries that support one (npm).
    pub tag: Option<String>,
}

/// `opensdk publish` — publish one or every declared language's generated SDK.
pub fn publish_command(
    opts: &PublishCommandOptions,
    config: Option<&ResolvedConfig>,
    cwd: &Path,
) -> Result<()> {
    let langs: Vec<String> = match opts.lang.as_deref() {
        Some(lang) => vec![resolve_lang(lang)],
        None => config
            .map(ResolvedConfig::declared_languages)
            .unwrap_or_default(),
    };
    if langs.is_empty() {
        return Err(Error::msg(
            "No languages to publish. Pass --lang, or declare language sections in sdk.json.",
        ));
    }
    for lang in &langs {
        let target = config.and_then(|c| c.target_for(lang));
        let publish = merge_publish_targets(&[
            config.and_then(|c| c.publish.as_ref()),
            target.and_then(|t| t.publish.as_ref()),
        ]);
        let dir = if opts.lang.is_some() {
            opts.output.clone()
        } else {
            target
                .and_then(|t| t.output.clone())
                .unwrap_or_else(|| paths::join(&opts.output, lang))
        };
        println!(
            "Publishing {lang} from {dir}{}...",
            if opts.dry_run { " (dry-run)" } else { "" }
        );
        publish_target(
            lang,
            &paths::resolve(cwd, &dir),
            &EmitterPublishOptions {
                registry: opts
                    .registry
                    .clone()
                    .or_else(|| publish.as_ref().and_then(|p| p.registry.clone())),
                token: resolve_token(publish.as_ref()),
                version: publish.as_ref().and_then(|p| p.version.clone()),
                tag: None,
                dry_run: opts.dry_run,
            },
        )?;
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn cli_targets_are_skipped_not_published() {
        // Even when the dir does not exist — a mixed chain must not abort.
        for lang in ["go-cli", "rust-cli"] {
            publish_target(
                lang,
                Path::new("/nonexistent-cli-dir"),
                &EmitterPublishOptions::default(),
            )
            .unwrap();
        }
    }

    #[test]
    fn a_missing_sdk_dir_is_a_clear_error() {
        let err = publish_target(
            "node",
            Path::new("/does-not-exist-xyz"),
            &EmitterPublishOptions::default(),
        )
        .unwrap_err();
        assert!(err.0.starts_with("No generated SDK at "), "{}", err.0);
        assert!(err.0.contains("Run `opensdk generate` first"), "{}", err.0);
    }

    #[test]
    fn publish_command_needs_a_language() {
        let err = publish_command(
            &PublishCommandOptions {
                output: "./sdk".into(),
                ..Default::default()
            },
            None,
            Path::new("/tmp"),
        )
        .unwrap_err();
        assert_eq!(
            err.0,
            "No languages to publish. Pass --lang, or declare language sections in sdk.json."
        );
    }

    #[test]
    fn go_dry_run_tags_nothing_and_needs_no_toolchain() {
        let dir = std::env::temp_dir();
        publish_target(
            "golang",
            &dir,
            &EmitterPublishOptions {
                version: Some("1.2.3".into()),
                dry_run: true,
                ..Default::default()
            },
        )
        .unwrap();
    }

    #[test]
    fn url_scheme_detection_matches_the_regex() {
        assert!(has_url_scheme("https://api.nuget.org/v3/index.json"));
        assert!(has_url_scheme("file:///tmp/feed"));
        assert!(!has_url_scheme("/tmp/local-feed"));
        assert!(!has_url_scheme("./feed"));
        assert!(!has_url_scheme("://nope"));
    }

    #[test]
    fn an_unknown_canonical_language_has_no_publisher() {
        let dir = std::env::temp_dir();
        let err = publish_target("cobol", &dir, &EmitterPublishOptions::default()).unwrap_err();
        assert_eq!(err.0, "No publisher for language \"cobol\".");
    }
}
