//! Pure, napi-free core logic shared across xyd's Rust crates.
//!
//! Everything here is `cargo test`-able and reusable by a future standalone
//! binary. The rule (see plan §4): napi lives ONLY in `xyd_napi`; every other
//! crate is pure Rust.

use std::path::Path;

/// A classified change to a watched file, mirroring the reload strategy in
/// `packages/xyd-documan/src/dev.ts`.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ChangeKind {
    Content,
    Settings,
    Api,
    Icon,
    Env,
    Public,
    Other,
}

impl ChangeKind {
    pub fn as_str(&self) -> &'static str {
        match self {
            ChangeKind::Content => "content",
            ChangeKind::Settings => "settings",
            ChangeKind::Api => "api",
            ChangeKind::Icon => "icon",
            ChangeKind::Env => "env",
            ChangeKind::Public => "public",
            ChangeKind::Other => "other",
        }
    }
}

/// True if any path segment (case-insensitive) equals `seg`. Handles both a
/// top-level `public/…` and a nested `…/public/…` — a plain substring match on
/// `/public/` would miss the leading segment.
fn has_segment(path: &Path, seg: &str) -> bool {
    path.components()
        .any(|c| c.as_os_str().to_string_lossy().to_lowercase() == seg)
}

/// Classify a changed path into an xyd reload category.
///
/// This is the pure kernel of the future Rust dev-watch service (plan S5).
pub fn classify(path: &Path) -> ChangeKind {
    let full = path.to_string_lossy().to_lowercase();
    let name = path
        .file_name()
        .map(|n| n.to_string_lossy().to_lowercase())
        .unwrap_or_default();

    if name == "docs.json" || name == "docs.ts" || name == "docs.tsx" {
        ChangeKind::Settings
    } else if name.starts_with(".env") {
        ChangeKind::Env
    } else if full.ends_with(".md") || full.ends_with(".mdx") {
        ChangeKind::Content
    } else if full.ends_with(".yaml") || full.ends_with(".yml") || full.ends_with(".json") {
        ChangeKind::Api
    } else if full.ends_with(".svg") || has_segment(path, "icons") {
        ChangeKind::Icon
    } else if has_segment(path, "public") {
        ChangeKind::Public
    } else {
        ChangeKind::Other
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn classifies_core_paths() {
        assert_eq!(classify(Path::new("docs.json")), ChangeKind::Settings);
        assert_eq!(classify(Path::new("docs.ts")), ChangeKind::Settings);
        assert_eq!(classify(Path::new("content/intro.md")), ChangeKind::Content);
        assert_eq!(classify(Path::new("guide.mdx")), ChangeKind::Content);
        assert_eq!(classify(Path::new("api/openapi.yaml")), ChangeKind::Api);
        assert_eq!(classify(Path::new("api/spec.json")), ChangeKind::Api);
        assert_eq!(classify(Path::new(".env.local")), ChangeKind::Env);
        assert_eq!(
            classify(Path::new("assets/icons/logo.svg")),
            ChangeKind::Icon
        );
        assert_eq!(classify(Path::new("public/robots.txt")), ChangeKind::Public);
        assert_eq!(classify(Path::new("README.txt")), ChangeKind::Other);
    }

    #[test]
    fn as_str_roundtrip() {
        assert_eq!(ChangeKind::Content.as_str(), "content");
        assert_eq!(ChangeKind::Settings.as_str(), "settings");
    }
}
