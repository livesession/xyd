//! Frontmatter fast path (S6+ W4 slice B). Replaces the per-page
//! `@mdx-js/mdx` compile that `getFrontmatter` (packages/xyd-content/src/
//! navigation.ts) ran *purely to read the YAML frontmatter export* with a
//! direct YAML parse of the `---` block.
//!
//! Fidelity target: the JS path is remark-frontmatter + remark-mdx-frontmatter
//! (the eemeli `yaml` package, YAML **1.2 core schema**). Observed contract:
//!
//! - no `---` block → `frontmatter` is `undefined` → getFrontmatter THROWS
//! - empty `---\n---` → `frontmatter` is `null` → getFrontmatter THROWS
//! - a valid block → the parsed mapping
//!
//! serde_yaml is YAML-1.1-ish; the ONE scalar-resolution divergence that
//! matters for docs frontmatter is bare `yes|no|on|off|y|n` (1.1 → bool, 1.2 →
//! string). We detect that class and defer those files to the JS MDX path, so
//! the fast path is byte-exact with the JS impl for everything it accepts.

use serde_json::{Map, Value};

/// The outcome of parsing one file's frontmatter — mirrors the exact branches
/// the JS `job()` / `getFrontmatter()` take.
#[derive(Debug, Clone, PartialEq)]
pub enum Entry {
    /// File missing / unreadable — JS logs the "defined in navigation but the
    /// file does not exist" warning and records __xydFrontmatterNotExists.
    Missing,
    /// File present but no/empty frontmatter — JS `getFrontmatter` throws
    /// "Frontmatter not found in <file>".
    Throw,
    /// A YAML-1.1-vs-1.2 scalar divergence is present — defer to the JS MDX
    /// compile so parity is guaranteed.
    Fallback,
    /// Parsed frontmatter mapping.
    Parsed(Value),
}

impl Entry {
    fn status(&self) -> &'static str {
        match self {
            Entry::Missing => "missing",
            Entry::Throw => "throw",
            Entry::Fallback => "fallback",
            Entry::Parsed(_) => "ok",
        }
    }

    /// JSON envelope for the napi boundary: `{status, frontmatter?}`.
    pub fn to_envelope(&self) -> Value {
        let mut o = Map::new();
        o.insert("status".into(), Value::String(self.status().into()));
        if let Entry::Parsed(v) = self {
            o.insert("frontmatter".into(), v.clone());
        }
        Value::Object(o)
    }
}

/// Extract the leading frontmatter block. Mirrors remark-frontmatter's YAML
/// fence detection: the file must START with a `---` line, and the block ends
/// at the next line that is exactly `---`. (TOML `+++` is not used by xyd docs
/// frontmatter; such files fall back to JS.)
fn extract_block(content: &str) -> Option<Option<&str>> {
    // Strip a leading BOM (strip-bom-string equivalent; remark tolerates it).
    let content = content.strip_prefix('\u{feff}').unwrap_or(content);

    // The opening fence must be the very first line: `---` optionally followed
    // by trailing whitespace, then a newline.
    let rest = strip_open_fence(content)?;

    // Find the closing `---` line.
    let mut idx = 0usize;
    loop {
        let line_start = idx;
        let line_end = match rest[line_start..].find('\n') {
            Some(n) => line_start + n,
            None => rest.len(),
        };
        let line = rest[line_start..line_end].trim_end_matches('\r');
        if line.trim_end() == "---" {
            // Some(Some(inner)) — a real block (inner may be empty → Empty).
            let inner = &rest[..line_start];
            return Some(Some(inner));
        }
        if line_end >= rest.len() {
            // No closing fence — remark does not treat this as frontmatter.
            return Some(None);
        }
        idx = line_end + 1;
    }
}

/// Match `---` (+ optional trailing whitespace) as the first line; return the
/// remainder after its newline.
fn strip_open_fence(content: &str) -> Option<&str> {
    let nl = content.find('\n').unwrap_or(content.len());
    let first = content[..nl].trim_end_matches('\r');
    if first.trim_end() == "---" {
        if nl >= content.len() {
            Some("")
        } else {
            Some(&content[nl + 1..])
        }
    } else {
        None
    }
}

/// True if a plain (unquoted) scalar in the block would resolve differently
/// under YAML 1.1 (serde_yaml) vs 1.2 core (eemeli). The only class that bites
/// docs frontmatter is bare booleans `yes|no|on|off|y|n` (any case).
fn has_yaml11_bool_divergence(block: &str) -> bool {
    for raw_line in block.lines() {
        let line = raw_line.trim_end_matches('\r');
        // Only `key: value` scalar lines matter; skip comments/blank/list.
        let Some(colon) = line.find(": ") else {
            // also handle `key:<eol>` (value on next line / null) — no scalar
            continue;
        };
        let value = line[colon + 2..].trim();
        // Ignore quoted values (quotes force string in both schemas) and
        // values with inline comments/structure.
        if value.is_empty()
            || value.starts_with('"')
            || value.starts_with('\'')
            || value.starts_with('[')
            || value.starts_with('{')
            || value.starts_with('#')
        {
            continue;
        }
        let bare = value
            .split_once(" #")
            .map(|(v, _)| v.trim())
            .unwrap_or(value);
        let lower = bare.to_ascii_lowercase();
        if matches!(lower.as_str(), "yes" | "no" | "on" | "off" | "y" | "n") {
            return true;
        }
    }
    false
}

/// Parse one file's content into an `Entry`.
pub fn parse_content(content: &str) -> Entry {
    let block = match extract_block(content) {
        // No opening fence → frontmatter undefined → throw.
        None => return Entry::Throw,
        Some(None) => return Entry::Throw, // opening fence but no closing → not frontmatter
        Some(Some(inner)) => inner,
    };

    // Empty block (`---\n---`) → frontmatter null → throw.
    if block.trim().is_empty() {
        return Entry::Throw;
    }

    if has_yaml11_bool_divergence(block) {
        return Entry::Fallback;
    }

    match serde_yaml::from_str::<serde_yaml::Value>(block) {
        Ok(yaml) => match yaml_to_json(&yaml) {
            Some(Value::Object(map)) => Entry::Parsed(Value::Object(map)),
            // A non-mapping top-level (scalar/sequence) is not how frontmatter
            // is authored; defer to JS rather than guess.
            _ => Entry::Fallback,
        },
        // serde_yaml choked on something eemeli might accept → defer to JS.
        Err(_) => Entry::Fallback,
    }
}

/// Read + parse a batch of files. `paths` are absolute. Returns
/// `{path: {status, frontmatter?}}` preserving input order irrelevance (the
/// caller keys by path).
pub fn frontmatter_batch(paths: &[String]) -> Map<String, Value> {
    let mut out = Map::new();
    for path in paths {
        let entry = match std::fs::read_to_string(path) {
            Ok(content) => parse_content(&content),
            Err(_) => Entry::Missing,
        };
        out.insert(path.clone(), entry.to_envelope());
    }
    out
}

/// Convert serde_yaml::Value → serde_json::Value with JS-number semantics:
/// integral floats stay ints, so `order: 3` is `3` not `3.0`. Non-scalar
/// mapping keys (rare in frontmatter) coerce to their display string, matching
/// JS object-key stringification.
fn yaml_to_json(v: &serde_yaml::Value) -> Option<Value> {
    Some(match v {
        serde_yaml::Value::Null => Value::Null,
        serde_yaml::Value::Bool(b) => Value::Bool(*b),
        serde_yaml::Value::Number(n) => {
            if let Some(i) = n.as_i64() {
                Value::Number(i.into())
            } else if let Some(u) = n.as_u64() {
                Value::Number(u.into())
            } else {
                let f = n.as_f64()?;
                // Integral float → integer (JS has one Number type; 3.0 prints "3").
                if f.fract() == 0.0 && f.is_finite() && f.abs() < 9.007_199_254_740_992e15 {
                    Value::Number((f as i64).into())
                } else {
                    serde_json::Number::from_f64(f).map(Value::Number)?
                }
            }
        }
        serde_yaml::Value::String(s) => Value::String(s.clone()),
        serde_yaml::Value::Sequence(seq) => {
            Value::Array(seq.iter().filter_map(yaml_to_json).collect())
        }
        serde_yaml::Value::Mapping(map) => {
            let mut o = Map::new();
            for (k, val) in map {
                let key = match k {
                    serde_yaml::Value::String(s) => s.clone(),
                    serde_yaml::Value::Bool(b) => b.to_string(),
                    serde_yaml::Value::Number(n) => n.to_string(),
                    serde_yaml::Value::Null => "null".to_string(),
                    _ => return None,
                };
                if let Some(jv) = yaml_to_json(val) {
                    o.insert(key, jv);
                }
            }
            Value::Object(o)
        }
        serde_yaml::Value::Tagged(t) => yaml_to_json(&t.value)?,
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    fn parsed(content: &str) -> Value {
        match parse_content(content) {
            Entry::Parsed(v) => v,
            other => panic!("expected Parsed, got {other:?}"),
        }
    }

    #[test]
    fn no_frontmatter_throws() {
        assert_eq!(parse_content("# hi\n"), Entry::Throw);
    }

    #[test]
    fn empty_frontmatter_throws() {
        assert_eq!(parse_content("---\n---\n# hi\n"), Entry::Throw);
    }

    #[test]
    fn scalars_match_eemeli() {
        // eemeli 1.2 core: yes→string handled via Fallback; here the plain set.
        let v = parsed(
            "---\ntitle: X\nhidden: true\norder: 3\nversion: 1.10\ncode: \"007\"\nnil: null\n---\n",
        );
        assert_eq!(
            v,
            json!({"title":"X","hidden":true,"order":3,"version":1.1,"code":"007","nil":null})
        );
    }

    #[test]
    fn yes_no_defers_to_js() {
        assert_eq!(parse_content("---\nflag: yes\n---\n"), Entry::Fallback);
        assert_eq!(parse_content("---\nflag: off\n---\n"), Entry::Fallback);
    }

    #[test]
    fn nested_and_sequences() {
        let v = parsed("---\ngroup: [a, b]\nseo:\n  title: T\n---\n");
        assert_eq!(v, json!({"group":["a","b"],"seo":{"title":"T"}}));
    }

    #[test]
    fn quoted_yes_is_string_fast_path() {
        // quoted → string in both schemas → NOT a divergence, fast path keeps it
        let v = parsed("---\nflag: \"yes\"\n---\n");
        assert_eq!(v, json!({"flag":"yes"}));
    }
}
