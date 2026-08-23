//! Mintlify → xyd migrator (port of `mintlify/mintlify.ts`).
//!
//! S1 provides detection (`is_mintlify`). The migrator itself is staged:
//!   * S2 — `settings.rs`: `docs.json`/`mint.json` → xyd `docs.json` (byte-parity).
//!   * S3 — `content.rs` + `serialize.rs`: `.mdx` → `.md` (MDX rewrite + serializer).

use std::path::Path;

use crate::gen::runtime::Error;

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

/// Migrate a detected Mintlify docs tree to xyd. TODO(S2/S3): implement natively.
pub async fn migrate(_docs_path: &Path) -> Result<(), Error> {
    Err(Error::Invalid(
        "mintlify migration is not yet implemented natively (S2/S3)".into(),
    ))
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
