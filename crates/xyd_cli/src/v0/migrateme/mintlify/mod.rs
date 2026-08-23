//! Mintlify → xyd migrator (port of `mintlify/mintlify.ts`).
//!
//!   * detection — `is_mintlify`.
//!   * `settings.rs` — `docs.json`/`mint.json` → xyd `docs.json` (byte-parity gate).
//!   * `content.rs` + `serialize.rs` — `.mdx` → `.md` (MDX rewrite + serializer; byte-parity
//!     on curated inputs, semantic equivalence on the documented `content-divergent/` cases).

mod content;
mod serialize;
mod settings;

use std::path::Path;

use crate::opencli::runtime::Error;

/// True when `file_name` (already lowercased) is a Mintlify config (`docs.json` /
/// `mint.json`) whose `$schema` is Mintlify's.
pub fn is_mintlify(docs_path: &Path, file_name: &str) -> bool {
    if file_name != "docs.json" && file_name != "mint.json" {
        return false;
    }
    let Ok(content) = std::fs::read_to_string(docs_path.join(file_name)) else {
        return false;
    };
    let Ok(value) = serde_json::from_str::<serde_json::Value>(&content) else {
        return false;
    };
    value.get("$schema").and_then(serde_json::Value::as_str)
        == Some("https://mintlify.com/docs.json")
}

/// Migrate a detected Mintlify docs tree to xyd, in place: convert `docs.json`/`mint.json`
/// → xyd settings, move stray images into `public/`, and rewrite every `.mdx` to `.md`.
pub fn migrate(docs_path: &Path) -> Result<(), Error> {
    // Resolve the config: prefer docs.json, else mint.json.
    let config_path = if docs_path.join("docs.json").is_file() {
        docs_path.join("docs.json")
    } else {
        docs_path.join("mint.json")
    };
    let raw = std::fs::read_to_string(&config_path)
        .map_err(|e| Error::Invalid(format!("cannot read {}: {e}", config_path.display())))?;
    let docs_json: serde_json::Value = serde_json::from_str(&raw)
        .map_err(|e| Error::Invalid(format!("invalid Mintlify configuration: {e}")))?;

    // docs.json → xyd settings (JSON.stringify(x, null, 2), no trailing newline).
    let xyd_settings = settings::convert(docs_path, &docs_json);
    let out = serde_json::to_string_pretty(&xyd_settings)
        .map_err(|e| Error::Invalid(format!("cannot serialize settings: {e}")))?;
    std::fs::write(docs_path.join("docs.json"), out)
        .map_err(|e| Error::Invalid(format!("cannot write docs.json: {e}")))?;

    settings::migrate_public_resources(docs_path);
    content::migrate_content(docs_path)?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use std::fs;

    use super::is_mintlify;

    #[test]
    fn detects_mintlify_config() {
        let dir = std::env::temp_dir().join(format!("xyd-mintlify-{}", std::process::id()));
        fs::create_dir_all(&dir).unwrap();

        fs::write(
            dir.join("docs.json"),
            r#"{ "$schema": "https://mintlify.com/docs.json", "name": "x" }"#,
        )
        .unwrap();
        assert!(is_mintlify(&dir, "docs.json"));

        fs::write(
            dir.join("other.json"),
            r#"{ "$schema": "https://mintlify.com/docs.json" }"#,
        )
        .unwrap();
        assert!(!is_mintlify(&dir, "other.json")); // wrong filename

        fs::write(
            dir.join("mint.json"),
            r#"{ "$schema": "https://example.com/x" }"#,
        )
        .unwrap();
        assert!(!is_mintlify(&dir, "mint.json")); // wrong schema

        let _ = fs::remove_dir_all(&dir);
    }
}
