//! Hand-owned (protected by .sdkignore): resolve + spawn the JS-on-Bun render
//! engine for `dev`/`build`.
//!
//! The render engine stays JS-on-Bun — the existing `bun --compile` binary is
//! the full engine (it accepts `dev`/`build` and runs them in-process, self-arming
//! `XYD_BUN` + `__xydCompiledBinary`). This Rust CLI does NOT reimplement rendering;
//! it only DRIVES the engine: resolve the binary, spawn it with the docs-project
//! cwd, inherit stdio, forward termination signals, and propagate the child's exit.
//!
//! ## Exit-code contract
//! [`spawn_engine`] is a TERMINAL operation. Once the engine child is launched and
//! exits, this function calls [`std::process::exit`] with the child's own exit code
//! and never returns `Ok` — the engine's status IS the CLI's status, so an engine
//! non-zero exit must not be re-printed by the action's `Err → "error: …"` path.
//! It returns `Err` ONLY when the engine could not be launched at all (env unset,
//! binary missing/not executable, unresolvable cwd); those flow through the normal
//! `CliOverrides::print_error` path with a clear, actionable message (no panic).
//!
//! S3 resolved the engine from `XYD_ENGINE_PATH`. S4 (this file) makes the binary
//! SELF-CONTAINED: `build.rs` `include_bytes!`-embeds the target-matched engine
//! (gated on `cfg(xyd_has_embedded_engine)`), and [`engine_path`] extracts it once
//! to a content-addressed cache dir, then returns that path. The runtime
//! `XYD_ENGINE_PATH` override still wins (dev / tests point at a binary without a
//! 233 MB rebuild). The spawn/signal/exit logic below is unchanged from S3.

use std::path::PathBuf;

use crate::opencli::runtime::Error;

/// Resolve the JS-on-Bun engine binary. Resolution order:
///
/// 1. **Runtime `XYD_ENGINE_PATH`** — used verbatim. The dev / test override:
///    point at any engine binary without rebuilding the 233 MB embed.
/// 2. **Embedded engine** (`cfg(xyd_has_embedded_engine)`) — extract the
///    `include_bytes!`-baked engine to `~/.xyd/cache/engine/<key>/xyd-engine`
///    (content key = `hex(sha256(engine))[..16]`) and return that path. Extraction
///    is a one-time cache-fill (size-checked); subsequent runs hit the cache.
/// 3. **Neither** (non-embedded build, no runtime override) — a clear, actionable
///    error (NOT a panic): this is a plain `cargo build` with no engine baked in.
pub fn engine_path() -> Result<PathBuf, Error> {
    if let Ok(p) = std::env::var("XYD_ENGINE_PATH") {
        if !p.is_empty() {
            return Ok(PathBuf::from(p));
        }
    }

    #[cfg(xyd_has_embedded_engine)]
    {
        return extract_embedded_engine();
    }

    #[cfg(not(xyd_has_embedded_engine))]
    {
        Err(Error::Invalid(
            "no engine available: this xyd binary was built without an embedded \
             engine — set XYD_ENGINE_PATH to a bun engine binary, or rebuild with \
             XYD_ENGINE_PATH set so build.rs embeds it"
                .into(),
        ))
    }
}

/// The engine bytes baked into the binary by `build.rs` (only present when the
/// build embedded an engine). ~233 MB of read-only data.
#[cfg(xyd_has_embedded_engine)]
const ENGINE: &[u8] = include_bytes!(concat!(env!("OUT_DIR"), "/engine.bin"));

/// Extract the embedded engine to a content-addressed cache dir and return its
/// path. Idempotent: if the target file already exists with the exact expected
/// size, it is reused (cache hit — no re-extract, no "preparing engine…" note).
///
/// The write is crash-safe: bytes go to a temp file IN THE SAME DIR (so the final
/// `rename` is atomic on the same filesystem), the file is made executable
/// (`0o755` on unix), then atomically renamed into place. The inner binary's
/// ad-hoc `allow-jit` signature lives inside the embedded bytes, so the extracted
/// copy is already a valid, runnable Mach-O.
#[cfg(xyd_has_embedded_engine)]
fn extract_embedded_engine() -> Result<PathBuf, Error> {
    let dir = engine_cache_dir()?.join(engine_key(ENGINE));
    let dest = dir.join("xyd-engine");

    // Cache hit: same content key dir + exact byte length ⇒ already extracted.
    let up_to_date = std::fs::metadata(&dest)
        .map(|m| m.len() == ENGINE.len() as u64)
        .unwrap_or(false);
    if up_to_date {
        return Ok(dest);
    }

    // One-time (per content key) extraction — make it visible; it writes ~233 MB.
    eprintln!("preparing engine…");
    std::fs::create_dir_all(&dir).map_err(|e| {
        Error::Invalid(format!("cannot create engine cache {}: {e}", dir.display()))
    })?;

    // Temp file in the SAME dir (pid-suffixed to avoid concurrent-writer clashes)
    // so the rename below is a same-filesystem atomic swap.
    let tmp = dir.join(format!("xyd-engine.tmp.{}", std::process::id()));
    std::fs::write(&tmp, ENGINE)
        .map_err(|e| Error::Invalid(format!("cannot write engine to {}: {e}", tmp.display())))?;

    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        std::fs::set_permissions(&tmp, std::fs::Permissions::from_mode(0o755))
            .map_err(|e| Error::Invalid(format!("cannot chmod engine {}: {e}", tmp.display())))?;
    }

    std::fs::rename(&tmp, &dest).map_err(|e| {
        // Best-effort cleanup so a failed rename doesn't leave a stray temp file.
        let _ = std::fs::remove_file(&tmp);
        Error::Invalid(format!("cannot place engine at {}: {e}", dest.display()))
    })?;

    Ok(dest)
}

/// Directory that holds the per-content-key engine subdirs. Resolution order:
/// explicit `XYD_ENGINE_CACHE` → `$HOME/.xyd/cache/engine` → `$XDG_CACHE_HOME/xyd/engine`.
#[cfg(xyd_has_embedded_engine)]
fn engine_cache_dir() -> Result<PathBuf, Error> {
    if let Ok(root) = std::env::var("XYD_ENGINE_CACHE") {
        if !root.is_empty() {
            return Ok(PathBuf::from(root));
        }
    }
    if let Ok(home) = std::env::var("HOME") {
        if !home.is_empty() {
            return Ok(PathBuf::from(home)
                .join(".xyd")
                .join("cache")
                .join("engine"));
        }
    }
    if let Ok(xdg) = std::env::var("XDG_CACHE_HOME") {
        if !xdg.is_empty() {
            return Ok(PathBuf::from(xdg).join("xyd").join("engine"));
        }
    }
    Err(Error::Invalid(
        "cannot resolve engine cache dir: set XYD_ENGINE_CACHE (or HOME / XDG_CACHE_HOME)".into(),
    ))
}

/// Content key for the embedded engine: the first 16 hex chars (8 bytes) of
/// `sha256(bytes)`. Distinct engines land in distinct cache dirs, so upgrading
/// the embedded engine never reuses a stale extraction.
#[cfg(xyd_has_embedded_engine)]
fn engine_key(bytes: &[u8]) -> String {
    use sha2::{Digest, Sha256};
    let digest = Sha256::digest(bytes);
    let mut key = String::with_capacity(16);
    for b in &digest[..8] {
        key.push_str(&format!("{b:02x}"));
    }
    key
}

/// Forward the RAW argv (everything after `argv[0]`) to the engine, which IS the
/// full CLI — so `engine <original args>` reproduces the command exactly. This is
/// the instant-parity fallback: any command not yet ported natively is handled by
/// the embedded engine, so no "not implemented" ever reaches a user. Terminal (it
/// exits with the engine's status via [`spawn_engine`]).
pub async fn forward_to_engine() -> Result<(), Error> {
    spawn_engine(&raw_args()).await
}

/// Spawn the engine with `args`, inheriting stdio and env (plus `XYD_CLI=1`), from
/// the current docs-project directory. Forwards SIGINT/SIGTERM (+SIGHUP on unix) to
/// the child, awaits its exit, then [`std::process::exit`]s with the child's code.
///
/// See the module docs for the exit-code contract: on a launched engine this never
/// returns `Ok` (it exits the process); it returns `Err` only if the engine could
/// not be launched.
pub async fn spawn_engine(args: &[String]) -> Result<(), Error> {
    let path = engine_path()?;
    let cwd = std::env::current_dir()
        .map_err(|e| Error::Invalid(format!("cannot resolve current directory: {e}")))?;

    let mut cmd = tokio::process::Command::new(&path);
    cmd.args(args)
        .current_dir(&cwd)
        // Inherit the full parent env (do NOT unset XYD_BUN — the engine keys off
        // its own env) and mark this invocation as coming from the CLI.
        .env("XYD_CLI", "1")
        .stdin(std::process::Stdio::inherit())
        .stdout(std::process::Stdio::inherit())
        .stderr(std::process::Stdio::inherit());

    let mut child = cmd.spawn().map_err(|e| {
        Error::Invalid(format!("failed to spawn engine at {}: {e}", path.display()))
    })?;

    let status = wait_forwarding_signals(&mut child).await?;

    // Terminal op: the engine's exit status IS the CLI's status. Propagate it
    // directly instead of routing through the action's Ok/Err printing.
    let code = status.code().unwrap_or_else(|| {
        // No exit code → killed by a signal. Mirror the shell's 128+signal
        // convention so callers see a meaningful non-zero status.
        #[cfg(unix)]
        {
            use std::os::unix::process::ExitStatusExt;
            status.signal().map(|s| 128 + s).unwrap_or(1)
        }
        #[cfg(not(unix))]
        {
            1
        }
    });
    std::process::exit(code);
}

/// Await the child while forwarding termination signals to it. On unix, forwards
/// the EXACT signal (SIGINT/SIGTERM/SIGHUP) so the engine can run its own graceful
/// teardown, then keeps waiting for the child to exit (never abandons or orphans it).
#[cfg(unix)]
async fn wait_forwarding_signals(
    child: &mut tokio::process::Child,
) -> Result<std::process::ExitStatus, Error> {
    use tokio::signal::unix::{signal, SignalKind};

    let sig_err = |e: std::io::Error| Error::Invalid(format!("cannot install signal handler: {e}"));
    let mut sigint = signal(SignalKind::interrupt()).map_err(sig_err)?;
    let mut sigterm = signal(SignalKind::terminate()).map_err(sig_err)?;
    let mut sighup = signal(SignalKind::hangup()).map_err(sig_err)?;

    // Capture the pid ONCE (it is stable until we reap the child) so the signal
    // arms don't need to borrow `child` while `child.wait()` holds `&mut child`.
    let pid = child.id().map(|id| id as i32);

    loop {
        tokio::select! {
            status = child.wait() => {
                return status.map_err(|e| Error::Invalid(format!("engine wait failed: {e}")));
            }
            _ = sigint.recv() => forward(pid, libc::SIGINT),
            _ = sigterm.recv() => forward(pid, libc::SIGTERM),
            _ = sighup.recv() => forward(pid, libc::SIGHUP),
        }
    }
}

/// Forward `sig` to the engine child by pid. Best-effort: a failed `kill` (child
/// already gone) is ignored — the `child.wait()` arm will resolve regardless.
#[cfg(unix)]
fn forward(pid: Option<i32>, sig: i32) {
    if let Some(pid) = pid {
        // SAFETY: `kill(2)` with a pid we own; harmless if the child already exited.
        unsafe {
            libc::kill(pid, sig);
        }
    }
}

/// Non-unix fallback: forward Ctrl-C by killing the child, then await its exit.
/// Windows is out of scope for the current matrix; this keeps the crate portable.
#[cfg(not(unix))]
async fn wait_forwarding_signals(
    child: &mut tokio::process::Child,
) -> Result<std::process::ExitStatus, Error> {
    loop {
        tokio::select! {
            status = child.wait() => {
                return status.map_err(|e| Error::Invalid(format!("engine wait failed: {e}")));
            }
            _ = tokio::signal::ctrl_c() => {
                let _ = child.start_kill();
            }
        }
    }
}

/// Build the engine args for `dev`, translating the CLI's global `--port <N>` /
/// `-p <N>` (which are NOT part of the generated clap tree) read from raw argv into
/// the engine's `dev --port <N>`. Bare `xyd`, `xyd --port N`, and `xyd dev --port N`
/// all funnel through here → `["dev"]` or `["dev", "--port", N]`.
pub fn dev_engine_args() -> Vec<String> {
    dev_engine_args_from(&raw_args())
}

/// Build the engine args for `build`, forwarding every flag verbatim. The `build`
/// command token is normalized to the front and dropped from the tail, so both
/// `xyd build --foo` and `xyd --verbose build` reach the engine as `build …flags`.
pub fn build_engine_args() -> Vec<String> {
    build_engine_args_from(&raw_args())
}

fn dev_engine_args_from(args: &[String]) -> Vec<String> {
    let mut out = vec!["dev".to_string()];
    if let Some(port) = extract_port(args) {
        out.push("--port".to_string());
        out.push(port);
    }
    out
}

fn build_engine_args_from(args: &[String]) -> Vec<String> {
    let mut out = vec!["build".to_string()];
    let mut dropped_cmd = false;
    for a in args {
        if !dropped_cmd && a == "build" {
            dropped_cmd = true; // the command token itself is already at the front
            continue;
        }
        out.push(a.clone());
    }
    out
}

/// The process argv without argv[0]. A thin wrapper so the arg helpers are
/// unit-reasoned against a slice (the shim leaves real argv untouched, so both the
/// pre-clap shim path and the clap action path observe the same tokens here).
fn raw_args() -> Vec<String> {
    std::env::args().skip(1).collect()
}

/// Extract the `--port` value from `--port <N>`, `-p <N>`, `--port=<N>`, or `-p=<N>`
/// anywhere in `args`. The last occurrence wins (last flag on the line wins), matching
/// typical CLI flag semantics. Shared with `serve` (crate-visible) so `xyd serve
/// --port <N>` reads the flag exactly the way `dev` does.
pub(crate) fn extract_port(args: &[String]) -> Option<String> {
    let mut found = None;
    let mut it = args.iter().peekable();
    while let Some(a) = it.next() {
        match a.as_str() {
            "--port" | "-p" => {
                if let Some(v) = it.next() {
                    found = Some(v.clone());
                }
            }
            other => {
                if let Some(v) = other.strip_prefix("--port=") {
                    found = Some(v.to_string());
                } else if let Some(v) = other.strip_prefix("-p=") {
                    found = Some(v.to_string());
                }
            }
        }
    }
    found
}

#[cfg(test)]
mod tests {
    use super::{build_engine_args_from, dev_engine_args_from, extract_port};

    #[test]
    fn port_space_and_equals_forms() {
        let s = |v: &[&str]| v.iter().map(|x| x.to_string()).collect::<Vec<_>>();
        assert_eq!(extract_port(&s(&["--port", "4000"])), Some("4000".into()));
        assert_eq!(extract_port(&s(&["-p", "4001"])), Some("4001".into()));
        assert_eq!(extract_port(&s(&["--port=4002"])), Some("4002".into()));
        assert_eq!(extract_port(&s(&["-p=4003"])), Some("4003".into()));
        assert_eq!(extract_port(&s(&["dev"])), None);
        // last wins
        assert_eq!(
            extract_port(&s(&["--port", "1", "-p", "2"])),
            Some("2".into())
        );
    }

    #[test]
    fn dev_args_translate_short_port() {
        let s = |v: &[&str]| v.iter().map(|x| x.to_string()).collect::<Vec<_>>();
        assert_eq!(dev_engine_args_from(&s(&[])), s(&["dev"]));
        assert_eq!(
            dev_engine_args_from(&s(&["-p", "4001"])),
            s(&["dev", "--port", "4001"])
        );
        assert_eq!(
            dev_engine_args_from(&s(&["dev", "--port", "4000"])),
            s(&["dev", "--port", "4000"])
        );
    }

    #[test]
    fn build_args_forward_flags_verbatim() {
        let s = |v: &[&str]| v.iter().map(|x| x.to_string()).collect::<Vec<_>>();
        assert_eq!(build_engine_args_from(&s(&["build"])), s(&["build"]));
        assert_eq!(
            build_engine_args_from(&s(&["build", "--clean"])),
            s(&["build", "--clean"])
        );
        assert_eq!(
            build_engine_args_from(&s(&["--verbose", "build"])),
            s(&["build", "--verbose"])
        );
    }
}
