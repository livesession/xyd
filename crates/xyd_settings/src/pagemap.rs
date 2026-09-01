//! `mapNavigationToPagePathMapping` — port of packages/xyd-plugin-docs/src/
//! index.ts:632-702. Walks the (already i18n-prefixed) navigation.sidebar and
//! resolves each page to its existing `.md`/`.mdx` file, byte-for-byte with the
//! JS walk. The N per-page `fs.existsSync` probes become one Rust call (the
//! "batched walk" — matters most on network/Docker filesystems).
//!
//! Every JS quirk is preserved: md-wins-over-mdx, cwd-relative values, virtual
//! pages probed by `virtual` but keyed by `page`, the SidebarRoute child
//! asymmetry (a bare virtual directly under a route is skipped), the
//! flat-only break-then-reprocess, and silent omission of missing files.
//! `IndexMap`-free: the output key ORDER matches the JS insertion order (the
//! walk visits pages in the same sequence).

use serde_json::{Map, Value};
use std::path::Path;

/// `asToc` sidebar groups are sidebar-as-TOC: their pages are sections of the
/// host page, NOT routable pages — the walk skips the whole subtree (mirrors
/// the JS gate `asTocEnabled` in @xyd-js/core; the JS-side collector picks the
/// sections up separately). `true` or an options OBJECT enables (the object
/// form carries behavior tweaks); `false`/absent/junk disables.
fn is_as_toc(obj: &Map<String, Value>) -> bool {
    matches!(
        obj.get("asToc"),
        Some(Value::Bool(true)) | Some(Value::Object(_))
    )
}

/// Resolve one cwd-relative base path to `base.md` or `base.mdx` (md wins),
/// returning the RELATIVE path WITH extension, or None. Probes against `cwd`.
fn existing_file_path(cwd: &Path, base: &str) -> Option<String> {
    let md = format!("{base}.md");
    if cwd.join(&md).exists() {
        return Some(md);
    }
    let mdx = format!("{base}.mdx");
    if cwd.join(&mdx).exists() {
        return Some(mdx);
    }
    None
}

struct Walker<'a> {
    cwd: &'a Path,
    mapping: Map<String, Value>,
}

impl<'a> Walker<'a> {
    fn set(&mut self, key: &str, path: String) {
        self.mapping.insert(key.to_string(), Value::String(path));
    }

    /// `processPages(pages)` — the recursive leaf/virtual/group visitor.
    fn process_pages(&mut self, pages: &[Value]) {
        for page in pages {
            match page {
                // regular string page
                Value::String(slug) => {
                    if let Some(p) = existing_file_path(self.cwd, slug) {
                        self.set(slug, p);
                    }
                }
                Value::Object(obj) => {
                    // Check order mirrors JS: `virtual` before `pages`.
                    if obj.contains_key("virtual") {
                        let virtual_path =
                            obj.get("virtual").and_then(|v| v.as_str()).unwrap_or("");
                        let page_key = obj.get("page").and_then(|v| v.as_str()).unwrap_or("");
                        if let Some(p) = existing_file_path(self.cwd, virtual_path) {
                            self.set(page_key, p);
                        }
                    } else if let Some(nested) = obj.get("pages").and_then(|p| p.as_array()) {
                        if !is_as_toc(obj) {
                            self.process_pages(nested);
                        }
                    }
                }
                _ => {}
            }
        }
    }

    /// The top-level `navigation.sidebar` walk (index.ts:671-699).
    fn walk(&mut self, navigation: &Value) {
        let empty: Vec<Value> = Vec::new();
        let sidebar = navigation
            .get("sidebar")
            .and_then(|s| s.as_array())
            .unwrap_or(&empty);

        let mut flat_only = false;
        for entry in sidebar {
            match entry {
                // (a) bare string → flat-only, break
                Value::String(_) => {
                    flat_only = true;
                    break;
                }
                Value::Object(obj) => {
                    let has_pages = obj.contains_key("pages");
                    let has_route = obj.contains_key("route");
                    if has_pages && has_route {
                        // (b) SidebarRoute: for each item — nested pages recurse,
                        // bare strings resolve directly; a direct virtual object
                        // is NOT handled (the JS asymmetry — preserved).
                        if let Some(items) = obj.get("pages").and_then(|p| p.as_array()) {
                            for item in items {
                                match item {
                                    Value::Object(io) if io.contains_key("pages") => {
                                        if let Some(nested) =
                                            io.get("pages").and_then(|p| p.as_array())
                                        {
                                            if !is_as_toc(io) {
                                                self.process_pages(nested);
                                            }
                                        }
                                    }
                                    Value::String(s) => {
                                        if let Some(p) = existing_file_path(self.cwd, s) {
                                            self.set(s, p);
                                        }
                                    }
                                    _ => {}
                                }
                            }
                        }
                    } else if has_pages {
                        // (c) plain Sidebar group
                        if let Some(pages) = obj.get("pages").and_then(|p| p.as_array()) {
                            if !is_as_toc(obj) {
                                self.process_pages(pages);
                            }
                        }
                    }
                }
                _ => {}
            }
        }

        // flat-only fallback: re-process the WHOLE sidebar as pages (idempotent).
        if flat_only {
            self.process_pages(sidebar);
        }
    }
}

/// Build the pagePathMapping for one navigation tree, probing files under
/// `cwd`. The navigation must already be i18n-prefixed by the caller (the
/// prefixing stays JS — it's a pure in-place mutation the shim does before
/// this call, once per locale, merging the results).
pub fn map_navigation(navigation: &Value, cwd: &Path) -> Map<String, Value> {
    let mut w = Walker {
        cwd,
        mapping: Map::new(),
    };
    w.walk(navigation);
    w.mapping
}

/// `findIndexPage()` — index.md wins over index.mdx; "" when neither exists.
/// Returned separately (the JS assigns it after all locale maps).
pub fn find_index_page(cwd: &Path) -> String {
    if cwd.join("index.md").exists() {
        "index.md".to_string()
    } else if cwd.join("index.mdx").exists() {
        "index.mdx".to_string()
    } else {
        String::new()
    }
}
