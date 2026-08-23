//! GitHub-source handling for `migrateme` — URL detection/parsing + ZIP download.
//!
//! Port of the GitHub half of `packages/xyd-cli/src/commands/migrateme/utils.ts`. The
//! URL predicates/parser are hand-rolled (no regex dep) to match the TS regexes exactly;
//! `download_github_repo` fetches the branch ZIP via reqwest and extracts it by shelling
//! out to `unzip` (with a `tar` fallback), mirroring the TS `child_process.exec` flow.

use std::path::{Path, PathBuf};

use crate::opencli::runtime::Error;

/// Parsed pieces of a GitHub URL (`{owner}/{repo}` + branch + optional subdirectory).
pub struct GitHubRef {
    pub owner: String,
    pub repo: String,
    pub branch: String,
    pub directory: Option<String>,
}

/// True when `url` looks like a GitHub repo or a `raw.githubusercontent.com` file URL.
/// Mirrors the two TS regexes: raw needs owner/repo/branch + a non-empty file tail;
/// `github.com` needs a non-empty owner and repo.
pub fn is_github_repo(url: &str) -> bool {
    if let Some(rest) = url.strip_prefix("https://raw.githubusercontent.com/") {
        let segs: Vec<&str> = rest.split('/').collect();
        if segs.len() >= 4
            && segs[..3].iter().all(|s| !s.is_empty())
            && !segs[3..].join("/").is_empty()
        {
            return true;
        }
    }
    if let Some(rest) = url.strip_prefix("https://github.com/") {
        let segs: Vec<&str> = rest.split('/').collect();
        if segs.len() >= 2 && !segs[0].is_empty() && !segs[1].is_empty() {
            return true;
        }
    }
    false
}

/// Parse a GitHub URL into owner/repo/branch/directory. Mirrors `parseGitHubUrl`: for a
/// `github.com` URL with no `/tree/` segment, the first path part is treated as the branch.
pub fn parse_github_url(url: &str) -> Result<GitHubRef, Error> {
    // raw.githubusercontent.com/{owner}/{repo}/{branch}/{file...}
    if let Some(rest) = url.strip_prefix("https://raw.githubusercontent.com/") {
        let segs: Vec<&str> = rest.split('/').collect();
        if segs.len() >= 4 && segs[..3].iter().all(|s| !s.is_empty()) {
            let file_path = segs[3..].join("/");
            if !file_path.is_empty() {
                // directory = filePath.split('/').slice(0, -1).join('/')  (may be "")
                let parts: Vec<&str> = file_path.split('/').collect();
                let directory = parts[..parts.len() - 1].join("/");
                return Ok(GitHubRef {
                    owner: segs[0].to_string(),
                    repo: segs[1].to_string(),
                    branch: segs[2].to_string(),
                    directory: Some(directory),
                });
            }
        }
    }

    // github.com/{owner}/{repo}(/tree/{branch}/{dir…} | /{branch}/{dir…})?
    if let Some(rest) = url.strip_prefix("https://github.com/") {
        let segs: Vec<&str> = rest.split('/').collect();
        if segs.len() >= 2 && !segs[0].is_empty() && !segs[1].is_empty() {
            let owner = segs[0].to_string();
            let repo = segs[1].to_string();
            // pathParts = everything after owner/repo, dropping empty segments.
            let path_parts: Vec<&str> = segs[2..]
                .iter()
                .copied()
                .filter(|p| !p.is_empty())
                .collect();

            let mut branch = "main".to_string();
            let mut directory: Option<String> = None;
            if path_parts.len() >= 2 && path_parts[0] == "tree" {
                branch = path_parts[1].to_string();
                if path_parts.len() > 2 {
                    directory = Some(path_parts[2..].join("/"));
                }
            } else if !path_parts.is_empty() {
                // No `tree` segment: the first part is assumed to be the branch.
                branch = path_parts[0].to_string();
                if path_parts.len() > 1 {
                    directory = Some(path_parts[1..].join("/"));
                }
            }
            return Ok(GitHubRef {
                owner,
                repo,
                branch,
                directory,
            });
        }
    }

    Err(Error::Invalid("Invalid GitHub URL format".into()))
}

/// Download the repo's branch ZIP and extract it into the current directory (the TS
/// `--dir` flag is unreachable from the CLI, so `saveDir` is always cwd). Returns the
/// directory the repo contents were extracted into.
pub async fn download_github_repo(url: &str) -> Result<PathBuf, Error> {
    println!("GitHub repo detected, downloading entire repository...");
    let gh = parse_github_url(url)?;
    let repo_url = format!("https://github.com/{}/{}", gh.owner, gh.repo);
    let download_url = format!(
        "https://github.com/{}/{}/archive/refs/heads/{}.zip",
        gh.owner, gh.repo, gh.branch
    );
    // TS `if (directory)` treats an empty string as "no directory".
    let directory = gh.directory.filter(|d| !d.is_empty());

    println!("Repository: {repo_url}");
    println!("Branch: {}", gh.branch);
    if let Some(dir) = &directory {
        println!("Directory: {dir}");
    }
    println!("Download URL: {download_url}");

    let response = reqwest::get(&download_url)
        .await
        .map_err(|e| Error::Invalid(format!("Failed to download repository: {e}")))?;
    if !response.status().is_success() {
        return Err(Error::Invalid(format!(
            "Failed to download repository: {}",
            response.status()
        )));
    }

    let save_dir = std::env::current_dir()
        .map_err(|e| Error::Invalid(format!("cannot resolve current directory: {e}")))?;
    let filename = format!("{}-{}.zip", gh.repo, gh.branch);
    let save_path = save_dir.join(&filename);
    let bytes = response
        .bytes()
        .await
        .map_err(|e| Error::Invalid(format!("download read failed: {e}")))?;
    std::fs::write(&save_path, &bytes)
        .map_err(|e| Error::Invalid(format!("cannot write {}: {e}", save_path.display())))?;
    println!("Successfully downloaded repository: {filename}");

    let _ = std::fs::remove_dir_all(save_dir.join(format!("{}-{}", gh.repo, gh.branch)));
    let temp_extract = save_dir.join("temp-extract");

    println!("Extracting ZIP file...");
    let unzipped = run_cmd(
        "unzip",
        &[
            "-o",
            "-q",
            path_arg(&save_path),
            "-d",
            path_arg(&temp_extract),
        ],
    )
    .await
    .is_ok();

    if unzipped {
        match first_subdir(&temp_extract) {
            Some(repo_dir) => {
                let source_dir = temp_extract.join(repo_dir);
                let target = match &directory {
                    Some(dir) => source_dir.join(dir),
                    None => source_dir.clone(),
                };
                if directory.is_some() && !target.is_dir() {
                    return Err(Error::Invalid(format!(
                        "Directory '{}' not found in repository",
                        directory.as_deref().unwrap_or("")
                    )));
                }
                copy_dir_contents(&target, &save_dir)?;
                let _ = std::fs::remove_dir_all(&temp_extract);
            }
            None => {
                return Err(Error::Invalid(
                    "Could not find repository directory in ZIP".into(),
                ));
            }
        }
    } else {
        // Fallback: tar with a stripped top-level component (matches the TS fallback).
        let tarred = run_cmd(
            "tar",
            &[
                "-xf",
                path_arg(&save_path),
                "--strip-components=1",
                "-C",
                path_arg(&save_dir),
            ],
        )
        .await
        .is_ok();
        if !tarred {
            println!("Could not extract ZIP file automatically. Please extract manually.");
            println!("ZIP file saved at: {}", save_path.display());
            return Ok(save_dir);
        }
    }

    let _ = std::fs::remove_file(&save_path);
    println!("Successfully extracted to: {}", save_dir.display());
    Ok(save_dir)
}

/// The name of the first immediate subdirectory of `dir` (the extracted repo root).
fn first_subdir(dir: &Path) -> Option<std::ffi::OsString> {
    std::fs::read_dir(dir).ok()?.flatten().find_map(|entry| {
        entry
            .file_type()
            .ok()
            .filter(|t| t.is_dir())
            .map(|_| entry.file_name())
    })
}

/// Recursively copy the CONTENTS of `src` into `dst` (like `cp -r src/* dst/`).
fn copy_dir_contents(src: &Path, dst: &Path) -> Result<(), Error> {
    std::fs::create_dir_all(dst)
        .map_err(|e| Error::Invalid(format!("cannot create {}: {e}", dst.display())))?;
    let entries = std::fs::read_dir(src)
        .map_err(|e| Error::Invalid(format!("cannot read {}: {e}", src.display())))?;
    for entry in entries.flatten() {
        let from = entry.path();
        let to = dst.join(entry.file_name());
        let file_type = entry
            .file_type()
            .map_err(|e| Error::Invalid(format!("cannot stat {}: {e}", from.display())))?;
        if file_type.is_dir() {
            copy_dir_contents(&from, &to)?;
        } else {
            std::fs::copy(&from, &to)
                .map_err(|e| Error::Invalid(format!("cannot copy {}: {e}", from.display())))?;
        }
    }
    Ok(())
}

fn path_arg(path: &Path) -> &str {
    path.to_str().unwrap_or("")
}

/// Run a system command, erroring on spawn failure or non-zero exit (quietly — output
/// is inherited so the extraction progress stays visible like the TS flow).
async fn run_cmd(program: &str, args: &[&str]) -> Result<(), Error> {
    let status = tokio::process::Command::new(program)
        .args(args)
        .status()
        .await
        .map_err(|e| Error::Invalid(format!("cannot run `{program}`: {e}")))?;
    if status.success() {
        Ok(())
    } else {
        Err(Error::Invalid(format!(
            "`{program}` failed (exit {})",
            status.code().unwrap_or(-1)
        )))
    }
}

#[cfg(test)]
mod tests {
    use super::{is_github_repo, parse_github_url};

    #[test]
    fn detects_github_urls() {
        assert!(is_github_repo("https://github.com/livesession/xyd"));
        assert!(is_github_repo(
            "https://github.com/livesession/xyd/tree/main/docs"
        ));
        assert!(is_github_repo(
            "https://raw.githubusercontent.com/o/r/main/docs/intro.mdx"
        ));
        assert!(!is_github_repo("https://github.com/onlyowner"));
        assert!(!is_github_repo("https://example.com/o/r"));
        assert!(!is_github_repo("./local/path"));
    }

    #[test]
    fn parses_repo_url_without_tree() {
        // No `/tree/`: first path part is treated as the branch.
        let r = parse_github_url("https://github.com/o/r/dev/docs/api").unwrap();
        assert_eq!(
            (r.owner.as_str(), r.repo.as_str(), r.branch.as_str()),
            ("o", "r", "dev")
        );
        assert_eq!(r.directory.as_deref(), Some("docs/api"));
    }

    #[test]
    fn parses_repo_url_with_tree() {
        let r = parse_github_url("https://github.com/o/r/tree/feat/x/guides").unwrap();
        assert_eq!(r.branch, "feat");
        assert_eq!(r.directory.as_deref(), Some("x/guides"));
    }

    #[test]
    fn parses_bare_repo_defaults_to_main() {
        let r = parse_github_url("https://github.com/o/r").unwrap();
        assert_eq!(r.branch, "main");
        assert_eq!(r.directory, None);
    }

    #[test]
    fn parses_raw_url() {
        let r =
            parse_github_url("https://raw.githubusercontent.com/o/r/main/docs/intro.mdx").unwrap();
        assert_eq!(
            (r.owner.as_str(), r.repo.as_str(), r.branch.as_str()),
            ("o", "r", "main")
        );
        assert_eq!(r.directory.as_deref(), Some("docs"));
    }

    #[test]
    fn rejects_non_github() {
        assert!(parse_github_url("https://example.com/o/r").is_err());
    }
}
