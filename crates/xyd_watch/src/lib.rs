//! File-watch service for xyd dev mode (plan S5) — the first server-side
//! service moving to Rust. The OS watcher (`notify`) is thin; the change
//! filtering + classification are pure and unit-tested (over `xyd_core_rs`).

use std::collections::HashSet;
use std::path::{Path, PathBuf};
use std::sync::mpsc::{channel, RecvTimeoutError, Sender};
use std::thread::{self, JoinHandle};
use std::time::Duration;

use notify::{RecursiveMode, Watcher};
use notify_debouncer_full::new_debouncer;

use xyd_core_rs::{classify, ChangeKind};

/// A classified, de-duplicated change emitted to the consumer.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct XydChange {
    pub kind: ChangeKind,
    pub path: PathBuf,
}

#[derive(Debug, Clone)]
pub struct WatchOptions {
    pub debounce_ms: u64,
    /// Directory names whose subtrees are ignored.
    pub ignore_dirs: Vec<String>,
}

impl Default for WatchOptions {
    fn default() -> Self {
        Self {
            debounce_ms: 40,
            ignore_dirs: ["node_modules", ".xyd", ".git", "dist", "target", ".cache"]
                .iter()
                .map(|s| s.to_string())
                .collect(),
        }
    }
}

/// True if any path segment matches an ignored directory name.
fn is_ignored(path: &Path, ignore_dirs: &[String]) -> bool {
    path.components().any(|c| {
        let seg = c.as_os_str().to_string_lossy();
        ignore_dirs.iter().any(|d| d.as_str() == seg)
    })
}

/// Pure: filter ignored paths, de-duplicate, classify. Unit-tested — this is
/// the deterministic kernel independent of the OS watcher.
pub fn process_paths<I: IntoIterator<Item = PathBuf>>(
    paths: I,
    ignore_dirs: &[String],
) -> Vec<XydChange> {
    let mut seen = HashSet::new();
    let mut out = Vec::new();
    for path in paths {
        if is_ignored(&path, ignore_dirs) {
            continue;
        }
        if !seen.insert(path.clone()) {
            continue;
        }
        out.push(XydChange {
            kind: classify(&path),
            path,
        });
    }
    out
}

/// A running watcher. Dropping it (or calling `stop`) ends the background thread.
pub struct WatchHandle {
    stop: Sender<()>,
    thread: Option<JoinHandle<()>>,
}

impl WatchHandle {
    pub fn stop(&mut self) {
        let _ = self.stop.send(());
        if let Some(t) = self.thread.take() {
            let _ = t.join();
        }
    }
}

impl Drop for WatchHandle {
    fn drop(&mut self) {
        self.stop();
    }
}

/// Start watching `root` recursively. `on_batch` is invoked (on a background
/// thread) with classified, de-duplicated change batches until the handle is
/// dropped. Returns immediately.
pub fn watch(
    root: &Path,
    opts: WatchOptions,
    mut on_batch: impl FnMut(Vec<XydChange>) + Send + 'static,
) -> notify::Result<WatchHandle> {
    let (tx, rx) = channel();
    let mut debouncer = new_debouncer(Duration::from_millis(opts.debounce_ms), None, move |res| {
        let _ = tx.send(res);
    })?;
    debouncer.watcher().watch(root, RecursiveMode::Recursive)?;

    let (stop_tx, stop_rx) = channel::<()>();
    let ignore_dirs = opts.ignore_dirs;
    let thread = thread::spawn(move || {
        let _debouncer = debouncer; // keep the watcher alive for the thread's lifetime
        loop {
            if stop_rx.try_recv().is_ok() {
                break;
            }
            match rx.recv_timeout(Duration::from_millis(150)) {
                Ok(Ok(events)) => {
                    let paths = events.into_iter().flat_map(|e| e.event.paths);
                    let batch = process_paths(paths, &ignore_dirs);
                    if !batch.is_empty() {
                        on_batch(batch);
                    }
                }
                Ok(Err(_errs)) => {}
                Err(RecvTimeoutError::Timeout) => continue,
                Err(RecvTimeoutError::Disconnected) => break,
            }
        }
    });

    Ok(WatchHandle {
        stop: stop_tx,
        thread: Some(thread),
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    fn ignores() -> Vec<String> {
        WatchOptions::default().ignore_dirs
    }

    #[test]
    fn filters_ignored_dirs_and_classifies() {
        let paths = vec![
            PathBuf::from("content/intro.md"),
            PathBuf::from("node_modules/react/index.js"),
            PathBuf::from(".xyd/host/x.ts"),
            PathBuf::from("docs.json"),
        ];
        let out = process_paths(paths, &ignores());
        assert_eq!(out.len(), 2);
        assert_eq!(out[0].kind, ChangeKind::Content);
        assert_eq!(out[1].kind, ChangeKind::Settings);
    }

    #[test]
    fn dedups_paths() {
        let p = PathBuf::from("content/a.md");
        let out = process_paths(vec![p.clone(), p.clone(), p], &ignores());
        assert_eq!(out.len(), 1);
    }
}
