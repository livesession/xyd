//! `@xyd-js/native` — the ONLY napi-aware crate in xyd. It is a thin adapter:
//! types cross the FFI boundary once here as `#[napi]` items; all real logic
//! lives in the pure crates (`xyd_core_rs`, `xyd_watch`, later `xyd_openapi`).

mod frontmatter;
mod gql;
mod highlight;
mod mcp_uniform;
mod openapi;
mod openapi2opencli;
mod openapi2opensdk;
mod opencli2go;
mod opencli2rust;
mod opensdk;
mod settings;
mod uniform;

use std::path::Path;

use napi::bindgen_prelude::*;
use napi::threadsafe_function::{ThreadsafeFunction, ThreadsafeFunctionCallMode};
use napi_derive::napi;

/// FFI smoke: proves the embedded Rust core is reachable from the Bun binary.
#[napi]
pub fn hello(name: String) -> String {
    format!("hello {name} from xyd rust core")
}

/// Classify a changed path into an xyd reload category — the pure kernel of the
/// dev-watch service (plan S5). Delegates to `xyd_core_rs::classify`.
#[napi]
pub fn classify(path: String) -> String {
    xyd_core_rs::classify(Path::new(&path)).as_str().to_string()
}

/// A single classified change delivered to JS.
#[napi(object)]
pub struct JsChange {
    pub kind: String,
    pub path: String,
}

/// Options for `createWatcher`.
#[napi(object)]
pub struct WatchOpts {
    pub debounce_ms: Option<u32>,
    pub ignore_dirs: Option<Vec<String>>,
}

/// A running file watcher. `stop()` ends the background thread; dropping the JS
/// handle does the same.
#[napi]
pub struct Watcher {
    handle: Option<xyd_watch::WatchHandle>,
}

#[napi]
impl Watcher {
    #[napi]
    pub fn stop(&mut self) {
        if let Some(mut h) = self.handle.take() {
            h.stop();
        }
    }
}

/// Start watching `root` recursively. `on_change` is called with each
/// classified, de-duplicated batch of changes (plan S5 dev-watch). The JS
/// orchestrator (`dev.ts`) consumes this and never learns it is Rust.
#[napi]
pub fn create_watcher(
    root: String,
    opts: WatchOpts,
    #[napi(ts_arg_type = "(err: Error | null, batch: JsChange[]) => void")]
    on_change: ThreadsafeFunction<Vec<JsChange>>,
) -> Result<Watcher> {
    let options = xyd_watch::WatchOptions {
        debounce_ms: opts.debounce_ms.unwrap_or(40) as u64,
        ignore_dirs: opts
            .ignore_dirs
            .unwrap_or_else(|| xyd_watch::WatchOptions::default().ignore_dirs),
    };

    let handle = xyd_watch::watch(Path::new(&root), options, move |batch| {
        let js: Vec<JsChange> = batch
            .into_iter()
            .map(|c| JsChange {
                kind: c.kind.as_str().to_string(),
                path: c.path.to_string_lossy().to_string(),
            })
            .collect();
        on_change.call(Ok(js), ThreadsafeFunctionCallMode::NonBlocking);
    })
    .map_err(|e| Error::from_reason(e.to_string()))?;

    Ok(Watcher {
        handle: Some(handle),
    })
}
