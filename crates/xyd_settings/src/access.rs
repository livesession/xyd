//! `buildAccessMap` / `resolvePageAccess` / `matchPattern` — port of
//! packages/xyd-plugin-access-control/src/access.ts. Pure data: given the
//! pagePathMapping keys, a per-page metadata map, and the accessControl config,
//! compute each page's access level.

use serde_json::{Map, Value};

/// `matchPattern`: glob with `**` → `.*` and `*` → `[^/]*`, anchored. Ported
/// without a regex engine — a small backtracking matcher over the same
/// semantics (segments: `*` matches within a path segment, `**` across).
pub fn match_pattern(pattern: &str, path: &str) -> bool {
    // Translate to a token stream mirroring the JS regex build:
    //   "**" → AnySeq (.*)   "*" → AnySegment ([^/]*)   literal → exact bytes
    enum Tok {
        AnySeq,
        AnySegment,
        Lit(char),
    }
    let mut toks = Vec::new();
    let chars: Vec<char> = pattern.chars().collect();
    let mut i = 0;
    while i < chars.len() {
        if chars[i] == '*' {
            if i + 1 < chars.len() && chars[i + 1] == '*' {
                toks.push(Tok::AnySeq);
                i += 2;
            } else {
                toks.push(Tok::AnySegment);
                i += 1;
            }
        } else {
            toks.push(Tok::Lit(chars[i]));
            i += 1;
        }
    }

    let p: Vec<char> = path.chars().collect();
    fn m(toks: &[Tok], ti: usize, p: &[char], pi: usize) -> bool {
        if ti == toks.len() {
            return pi == p.len();
        }
        match &toks[ti] {
            Tok::Lit(c) => pi < p.len() && p[pi] == *c && m(toks, ti + 1, p, pi + 1),
            Tok::AnySegment => {
                // `[^/]*` — zero+ non-slash chars, greedy with backtrack.
                let mut k = pi;
                loop {
                    if m(toks, ti + 1, p, k) {
                        return true;
                    }
                    if k < p.len() && p[k] != '/' {
                        k += 1;
                    } else {
                        return false;
                    }
                }
            }
            Tok::AnySeq => {
                // `.*` — zero+ any chars, greedy with backtrack.
                let mut k = pi;
                loop {
                    if m(toks, ti + 1, p, k) {
                        return true;
                    }
                    if k < p.len() {
                        k += 1;
                    } else {
                        return false;
                    }
                }
            }
        }
    }
    m(&toks, 0, &p, 0)
}

/// `resolvePageAccess` — frontmatter overrides → pattern rules → defaultAccess.
pub fn resolve_page_access(page_path: &str, metadata: &Value, config: &Value) -> String {
    let normalized = if page_path.starts_with('/') {
        page_path.to_string()
    } else {
        format!("/{page_path}")
    };

    // 1. Frontmatter overrides.
    match metadata.get("public") {
        Some(Value::Bool(true)) => return "public".to_string(),
        Some(Value::Bool(false)) => {
            let groups = metadata.get("accessGroups").and_then(|g| g.as_array());
            if let Some(groups) = groups {
                if !groups.is_empty() {
                    return join_groups(groups);
                }
            }
            return "authenticated".to_string();
        }
        _ => {}
    }

    // 2. Pattern rules (first match wins).
    if let Some(rules) = config.get("rules").and_then(|r| r.as_array()) {
        for rule in rules {
            let pat = rule.get("match").and_then(|m| m.as_str()).unwrap_or("");
            if match_pattern(pat, &normalized) {
                if rule.get("access").and_then(|a| a.as_str()) == Some("public") {
                    return "public".to_string();
                }
                if let Some(groups) = rule.get("groups").and_then(|g| g.as_array()) {
                    if !groups.is_empty() {
                        return join_groups(groups);
                    }
                }
                return "authenticated".to_string();
            }
        }
    }

    // 3. Default access.
    if config.get("defaultAccess").and_then(|d| d.as_str()) == Some("protected") {
        "authenticated".to_string()
    } else {
        "public".to_string()
    }
}

fn join_groups(groups: &[Value]) -> String {
    groups
        .iter()
        .filter_map(|g| g.as_str())
        .collect::<Vec<_>>()
        .join(",")
}

/// `buildAccessMap` — iterate the pagePathMapping keys, resolving each.
pub fn build_access_map(
    page_path_mapping: &Map<String, Value>,
    metadata_map: &Map<String, Value>,
    config: &Value,
) -> Map<String, Value> {
    let empty = Value::Object(Map::new());
    let mut out = Map::new();
    // JS iterates Object.keys(pagePathMapping) in insertion order.
    for page_path in page_path_mapping.keys() {
        let metadata = metadata_map.get(page_path).unwrap_or(&empty);
        out.insert(
            page_path.clone(),
            Value::String(resolve_page_access(page_path, metadata, config)),
        );
    }
    out
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn glob_matching() {
        assert!(match_pattern("/protected/**", "/protected/a/b"));
        assert!(match_pattern("/admin/*", "/admin/x"));
        assert!(!match_pattern("/admin/*", "/admin/x/y")); // * doesn't cross /
        assert!(match_pattern("/admin/**", "/admin/x/y"));
        assert!(!match_pattern("/protected/**", "/public/a"));
    }

    #[test]
    fn frontmatter_overrides() {
        let cfg = json!({ "defaultAccess": "public" });
        assert_eq!(
            resolve_page_access("/a", &json!({ "public": true }), &cfg),
            "public"
        );
        assert_eq!(
            resolve_page_access("/a", &json!({ "public": false }), &cfg),
            "authenticated"
        );
        assert_eq!(
            resolve_page_access(
                "/a",
                &json!({ "public": false, "accessGroups": ["admin", "staff"] }),
                &cfg
            ),
            "admin,staff"
        );
    }

    #[test]
    fn rules_then_default() {
        let cfg = json!({
            "defaultAccess": "public",
            "rules": [
                { "match": "/admin/**", "access": "protected", "groups": ["admin"] },
                { "match": "/protected/**", "access": "protected" }
            ]
        });
        assert_eq!(resolve_page_access("admin/x", &json!({}), &cfg), "admin");
        assert_eq!(
            resolve_page_access("protected/y", &json!({}), &cfg),
            "authenticated"
        );
        assert_eq!(resolve_page_access("guides/z", &json!({}), &cfg), "public");
    }

    #[test]
    fn default_protected() {
        let cfg = json!({ "defaultAccess": "protected" });
        assert_eq!(resolve_page_access("/a", &json!({}), &cfg), "authenticated");
    }
}
