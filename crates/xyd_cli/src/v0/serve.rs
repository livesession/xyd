//! Hand-owned (protected by .sdkignore): the NATIVE `xyd serve` static file server.
//!
//! Ports the static-serve branch of the TS command
//! (`packages/xyd-cli/src/commands/serve.ts`): serve the prebuilt site under
//! `.xyd/build/client/` over HTTP with a small MIME map, clean page URLs
//! (`/guide` → `guide.html`, the flattened output both engines write),
//! `directory → index.html`, a redirect from a page's trailing-slash form
//! (`/guide/` → `/guide`) and an SPA fallback for extensionless routes. Unlike
//! `dev`/`build`, this does NOT
//! spawn the engine — it is a self-contained Rust server. Two cases still defer:
//!
//!   * **missing build dir** → the same "run `xyd build` first" error, and
//!   * **edge deploy** (`server.mjs` present — access control / JWT) → the static
//!     server can't run it, so the whole invocation forwards to the embedded engine,
//!     whose own `serve` spawns `node server.mjs`.
//!
//! The port is resolved exactly like `dev`: an explicit `--port`/`-p` on the command
//! line wins, then `PORT`, then 3000 (serve.ts's `PORT || 3000`). Because those flags
//! are NOT in the generated clap tree, `serve` is routed through the pre-clap shim in
//! `main.rs` (like `dev`/`build`), so the flag is read straight from raw argv here.

use std::path::{Path, PathBuf};
use std::sync::Arc;

use super::engine;
use crate::opencli::runtime::Error;

/// Port used when neither `--port`/`-p` (argv) nor `PORT` (env) is set — matches
/// serve.ts's `PORT || 3000`.
const DEFAULT_PORT: u16 = 3000;

/// Resolve the `serve` port, mirroring how `dev` reads it: an explicit `--port`/`-p`
/// on the command line wins, then the `PORT` env var, then the 3000 default.
pub fn resolve_port() -> u16 {
    let args: Vec<String> = std::env::args().skip(1).collect();
    if let Some(port) = engine::extract_port(&args).and_then(|v| v.trim().parse::<u16>().ok()) {
        return port;
    }
    if let Ok(env_port) = std::env::var("PORT") {
        if let Ok(port) = env_port.trim().parse::<u16>() {
            return port;
        }
    }
    DEFAULT_PORT
}

/// Serve the built site on `port`. Resolves `.xyd/build/client` relative to the
/// current directory, errors if it is missing, delegates edge deploys to the engine,
/// and otherwise runs the native static server until a termination signal.
pub async fn run(port: u16) -> Result<(), Error> {
    let cwd = std::env::current_dir()
        .map_err(|e| Error::Invalid(format!("cannot resolve current directory: {e}")))?;
    let build_dir = cwd.join(".xyd").join("build").join("client");

    // No build output → the same actionable error serve.ts prints (non-zero exit,
    // no panic; flows through CliOverrides::print_error).
    if !build_dir.is_dir() {
        return Err(Error::Invalid(
            "No build output found at .xyd/build/client — run `xyd build` first.".into(),
        ));
    }

    // An edge deploy ships a `server.mjs` (JWT verification / access control) the
    // static server can't run — hand the whole invocation to the embedded engine,
    // whose `serve` spawns `node server.mjs`. Terminal: `forward_to_engine` exits
    // with the engine's status and never returns here.
    if build_dir.join("server.mjs").is_file() {
        return engine::forward_to_engine().await;
    }

    serve_static(build_dir, port).await
}

/// Bind and run the blocking static HTTP server until SIGINT/SIGTERM, then shut down
/// cleanly. tiny_http is blocking, so the accept loop runs off the async runtime via
/// `spawn_blocking`; `Server::unblock` ends `incoming_requests()` for a clean drain.
async fn serve_static(build_dir: PathBuf, port: u16) -> Result<(), Error> {
    let server = tiny_http::Server::http(("0.0.0.0", port))
        .map_err(|e| Error::Invalid(format!("cannot bind to port {port}: {e}")))?;
    let server = Arc::new(server);

    println!("serving .xyd/build/client on http://localhost:{port}");

    let accept_server = Arc::clone(&server);
    let accept = tokio::task::spawn_blocking(move || {
        for request in accept_server.incoming_requests() {
            handle_request(&build_dir, request);
        }
    });

    // Exit cleanly on Ctrl-C / termination: stop accepting, then drain the loop.
    wait_for_shutdown().await;
    server.unblock();
    let _ = accept.await;
    Ok(())
}

/// Await a termination signal. On unix, either SIGINT or SIGTERM triggers shutdown
/// (falling back to Ctrl-C if signal handlers can't be installed); elsewhere, Ctrl-C.
#[cfg(unix)]
async fn wait_for_shutdown() {
    use tokio::signal::unix::{signal, SignalKind};

    match (
        signal(SignalKind::interrupt()),
        signal(SignalKind::terminate()),
    ) {
        (Ok(mut sigint), Ok(mut sigterm)) => {
            tokio::select! {
                _ = sigint.recv() => {}
                _ = sigterm.recv() => {}
            }
        }
        _ => {
            let _ = tokio::signal::ctrl_c().await;
        }
    }
}

#[cfg(not(unix))]
async fn wait_for_shutdown() {
    let _ = tokio::signal::ctrl_c().await;
}

/// Route one request: strip the query/fragment (route on the path only, mirroring
/// serve.ts's use of `URL.pathname`), resolve a file, and respond (or redirect, or 404).
fn handle_request(build_dir: &Path, request: tiny_http::Request) {
    let raw = request.url().to_string();
    let pathname = raw.split(['?', '#']).next().unwrap_or("/");
    let query = raw.find('?').map(|i| &raw[i..]).unwrap_or("");

    match resolve(build_dir, pathname) {
        Resolved::File(file) => respond_file(request, &file),
        Resolved::Redirect(location) => respond_redirect(request, &format!("{location}{query}")),
        Resolved::NotFound => respond_status(request, 404, "Not Found"),
    }
}

/// What a request path resolves to.
#[derive(Debug, PartialEq)]
enum Resolved {
    File(PathBuf),
    /// A permanent redirect to this path (the query is appended by the caller).
    Redirect(String),
    NotFound,
}

/// Map a request path to a response:
///   * a page's trailing-slash form (`/guide/`, no `guide/index.html`) redirects
///     to the page (`/guide`), so a link or a typed URL with the slash lands;
///   * otherwise the file resolution below.
fn resolve(build_dir: &Path, pathname: &str) -> Resolved {
    if let Some(page) = trailing_slash_page(build_dir, pathname) {
        return Resolved::Redirect(page);
    }
    match resolve_target(build_dir, pathname) {
        Some(file) => Resolved::File(file),
        None => Resolved::NotFound,
    }
}

/// The page a trailing-slash path stands for: `/guide/` → `/guide` when the
/// build has `guide.html` and no `guide/index.html` of its own (a directory
/// index, like a basename's root `/docs/`, is served as it is). The leading
/// slashes collapse to one, so the redirect never leaves the site.
fn trailing_slash_page(build_dir: &Path, pathname: &str) -> Option<String> {
    if !pathname.ends_with('/') {
        return None;
    }
    // The same segments safe_join keeps, so the target names the file checked.
    let segments: Vec<&str> = pathname
        .split('/')
        .filter(|seg| !matches!(*seg, "" | "." | ".."))
        .collect();
    if segments.is_empty() {
        return None;
    }
    let path = segments.join("/");
    if safe_join(build_dir, &path).join("index.html").is_file() {
        return None;
    }
    safe_join(build_dir, &format!("{path}.html"))
        .is_file()
        .then(|| format!("/{path}"))
}

/// Map a request path to a file on disk, mirroring serve.ts's intent:
///   * an exact file hit is served as-is;
///   * an extensionless path whose `<path>.html` exists is that page (clean URLs:
///     both engines write every page as `<slug>.html`), even when a directory of
///     the same name holds its subpages;
///   * a directory (including `/`) serves its `index.html`, else the SPA fallback;
///   * a missing path whose last segment has an extension is a genuine 404;
///   * a missing extensionless path is an SPA client route → the root `index.html`.
fn resolve_target(build_dir: &Path, pathname: &str) -> Option<PathBuf> {
    let candidate = safe_join(build_dir, pathname);

    if candidate.is_file() {
        return Some(candidate);
    }

    let trimmed = pathname.trim_matches('/');
    if !trimmed.is_empty() && !pathname.ends_with('/') && !last_segment_has_ext(pathname) {
        let page = safe_join(build_dir, &format!("{trimmed}.html"));
        if page.is_file() {
            return Some(page);
        }
    }

    if candidate.is_dir() {
        let index = candidate.join("index.html");
        if index.is_file() {
            return Some(index);
        }
        return spa_fallback(build_dir);
    }

    if last_segment_has_ext(pathname) {
        None
    } else {
        spa_fallback(build_dir)
    }
}

/// The root `index.html`, if present — the SPA fallback target.
fn spa_fallback(build_dir: &Path) -> Option<PathBuf> {
    let index = build_dir.join("index.html");
    index.is_file().then_some(index)
}

/// Join `pathname` onto `base`, dropping empty/`.` segments and REFUSING `..` so a
/// crafted URL can never escape the build directory.
fn safe_join(base: &Path, pathname: &str) -> PathBuf {
    let mut out = base.to_path_buf();
    for seg in pathname.split('/') {
        match seg {
            "" | "." | ".." => {}
            other => out.push(other),
        }
    }
    out
}

/// Whether the last path segment looks like a file (has an extension) — used to tell
/// a genuine missing asset (404) from an SPA client route (index.html fallback).
fn last_segment_has_ext(pathname: &str) -> bool {
    pathname
        .rsplit('/')
        .next()
        .map(|seg| seg.contains('.'))
        .unwrap_or(false)
}

/// Send a file with its MIME `Content-Type`. A resolved-but-unreadable file → 500
/// (serve.ts's `catch → 'Error'`); a request write failure is ignored (client gone).
fn respond_file(request: tiny_http::Request, file: &Path) {
    match std::fs::read(file) {
        Ok(bytes) => {
            let mime = mime_for(file);
            match tiny_http::Header::from_bytes(&b"Content-Type"[..], mime.as_bytes()) {
                Ok(header) => {
                    let response = tiny_http::Response::from_data(bytes).with_header(header);
                    let _ = request.respond(response);
                }
                // Unreachable for our static MIME strings; never panic on a request.
                Err(()) => {
                    let _ = request.respond(tiny_http::Response::from_data(bytes));
                }
            }
        }
        Err(_) => respond_status(request, 500, "Error"),
    }
}

/// Respond with a permanent redirect (308 keeps the method) to `location`.
fn respond_redirect(request: tiny_http::Request, location: &str) {
    let response = tiny_http::Response::empty(308);
    match tiny_http::Header::from_bytes(&b"Location"[..], location.as_bytes()) {
        Ok(header) => {
            let _ = request.respond(response.with_header(header));
        }
        // A location with bytes a header cannot carry: there is no page to send.
        Err(()) => respond_status(request, 404, "Not Found"),
    }
}

/// Respond with a bare status + text body (404/500).
fn respond_status(request: tiny_http::Request, status: u16, body: &str) {
    let response = tiny_http::Response::from_string(body).with_status_code(status);
    let _ = request.respond(response);
}

/// Small extension → MIME map (serve.ts parity + the extra types the built site
/// emits). Unknown extensions fall back to `application/octet-stream`.
fn mime_for(file: &Path) -> &'static str {
    let ext = file
        .extension()
        .and_then(|e| e.to_str())
        .map(str::to_ascii_lowercase)
        .unwrap_or_default();
    match ext.as_str() {
        "html" => "text/html",
        "js" | "mjs" => "application/javascript",
        "css" => "text/css",
        "json" | "map" => "application/json",
        "svg" => "image/svg+xml",
        "png" => "image/png",
        "jpg" | "jpeg" => "image/jpeg",
        "webp" => "image/webp",
        "ico" => "image/x-icon",
        "woff2" => "font/woff2",
        "woff" => "font/woff",
        "ttf" => "font/ttf",
        "txt" => "text/plain",
        "xml" => "application/xml",
        _ => "application/octet-stream",
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;

    // Unique per test (pid + caller-supplied name) so the default parallel test
    // runner can't have two tests racing on the same directory.
    fn tmpdir(name: &str) -> PathBuf {
        let dir =
            std::env::temp_dir().join(format!("xyd-serve-test-{}-{name}", std::process::id()));
        let _ = fs::remove_dir_all(&dir);
        fs::create_dir_all(&dir).unwrap();
        dir
    }

    #[test]
    fn root_and_directory_serve_index() {
        let root = tmpdir("root-dir");
        fs::write(root.join("index.html"), b"<html>").unwrap();
        fs::create_dir_all(root.join("guide")).unwrap();
        fs::write(root.join("guide").join("index.html"), b"g").unwrap();

        assert_eq!(resolve_target(&root, "/"), Some(root.join("index.html")));
        assert_eq!(
            resolve_target(&root, "/guide"),
            Some(root.join("guide").join("index.html"))
        );
        let _ = fs::remove_dir_all(&root);
    }

    #[test]
    fn exact_file_hit_and_missing_asset_404() {
        let root = tmpdir("exact-404");
        fs::write(root.join("index.html"), b"<html>").unwrap();
        fs::create_dir_all(root.join("assets")).unwrap();
        fs::write(root.join("assets").join("app.js"), b"//js").unwrap();

        assert_eq!(
            resolve_target(&root, "/assets/app.js"),
            Some(root.join("assets").join("app.js"))
        );
        // Missing file WITH an extension ⇒ genuine 404.
        assert_eq!(resolve_target(&root, "/nope.js"), None);
        let _ = fs::remove_dir_all(&root);
    }

    #[test]
    fn extensionless_missing_route_spa_fallback() {
        let root = tmpdir("spa");
        fs::write(root.join("index.html"), b"<html>").unwrap();
        // Missing, no extension ⇒ SPA fallback to index.html.
        assert_eq!(
            resolve_target(&root, "/overview"),
            Some(root.join("index.html"))
        );
        let _ = fs::remove_dir_all(&root);
    }

    #[test]
    fn clean_urls_serve_the_flattened_pages() {
        let root = tmpdir("clean-urls");
        fs::write(root.join("index.html"), b"<html>").unwrap();
        fs::create_dir_all(root.join("cli").join("project")).unwrap();
        fs::write(root.join("cli").join("deploy.html"), b"deploy").unwrap();
        fs::write(root.join("cli").join("project.html"), b"project").unwrap();
        fs::write(root.join("cli").join("project").join("list.html"), b"list").unwrap();

        assert_eq!(
            resolve_target(&root, "/cli/deploy"),
            Some(root.join("cli").join("deploy.html"))
        );
        assert_eq!(
            resolve_target(&root, "/cli/project/list"),
            Some(root.join("cli").join("project").join("list.html"))
        );
        // A page whose subpages live in a directory of the same name.
        assert_eq!(
            resolve_target(&root, "/cli/project"),
            Some(root.join("cli").join("project.html"))
        );
        let _ = fs::remove_dir_all(&root);
    }

    #[test]
    fn a_trailing_slash_redirects_to_the_page() {
        let root = tmpdir("trailing-slash");
        fs::write(root.join("index.html"), b"<html>").unwrap();
        fs::create_dir_all(root.join("cli").join("project")).unwrap();
        fs::write(root.join("cli").join("deploy.html"), b"deploy").unwrap();
        fs::write(root.join("cli").join("project.html"), b"project").unwrap();
        fs::write(root.join("cli").join("project").join("list.html"), b"list").unwrap();

        assert_eq!(
            resolve(&root, "/cli/deploy/"),
            Resolved::Redirect("/cli/deploy".into())
        );
        assert_eq!(
            resolve(&root, "/cli/project/"),
            Resolved::Redirect("/cli/project".into())
        );
        assert_eq!(
            resolve(&root, "/cli/project/list/"),
            Resolved::Redirect("/cli/project/list".into())
        );
        // Repeated slashes collapse, so the target never becomes `//host`, and
        // dot segments go, as they do for the file lookup.
        assert_eq!(
            resolve(&root, "//cli/deploy//"),
            Resolved::Redirect("/cli/deploy".into())
        );
        assert_eq!(
            resolve(&root, "/../cli/./deploy/"),
            Resolved::Redirect("/cli/deploy".into())
        );
        // The site root is not redirected.
        assert_eq!(resolve(&root, "/"), Resolved::File(root.join("index.html")));
        // No page behind the slash: the usual resolution (here the SPA fallback).
        assert_eq!(
            resolve(&root, "/nope/"),
            Resolved::File(root.join("index.html"))
        );
        let _ = fs::remove_dir_all(&root);
    }

    #[test]
    fn a_directory_index_keeps_its_trailing_slash() {
        let root = tmpdir("dir-index");
        fs::create_dir_all(root.join("docs")).unwrap();
        fs::write(root.join("docs").join("index.html"), b"docs home").unwrap();
        fs::write(root.join("docs.html"), b"a page named docs").unwrap();

        assert_eq!(
            resolve(&root, "/docs/"),
            Resolved::File(root.join("docs").join("index.html"))
        );
        let _ = fs::remove_dir_all(&root);
    }

    #[test]
    fn safe_join_refuses_traversal() {
        let base = Path::new("/build/client");
        assert_eq!(
            safe_join(base, "/../../etc/passwd"),
            base.join("etc/passwd")
        );
        assert_eq!(safe_join(base, "/assets/./x.js"), base.join("assets/x.js"));
    }

    #[test]
    fn mime_map_covers_common_types() {
        assert_eq!(mime_for(Path::new("a.html")), "text/html");
        assert_eq!(mime_for(Path::new("a.js")), "application/javascript");
        assert_eq!(mime_for(Path::new("a.css")), "text/css");
        assert_eq!(mime_for(Path::new("a.map")), "application/json");
        assert_eq!(mime_for(Path::new("a.woff2")), "font/woff2");
        assert_eq!(
            mime_for(Path::new("a.unknownext")),
            "application/octet-stream"
        );
    }
}
