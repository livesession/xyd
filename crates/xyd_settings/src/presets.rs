//! The SYNC parts of `presets()` — port of the pure normalizations in
//! packages/xyd-plugin-docs/src/presets/docs/settings.ts (the LIVE copy used by
//! `appInit` via `readSettings` from `@xyd-js/plugin-docs`; a stale identical
//! copy in xyd-documan/src/settings.ts is dead code and lacks the diagrams
//! default below). `handleSyntaxHighlight` (async fetch/fs + @code-hike
//! getThemeColors) STAYS JS and runs separately in the shim; only the
//! deterministic mutations are here:
//!   - ensureNavigation: webeditor={} , navigation={sidebar:[]} , sidebar=[]
//!   - theme.head = [] when theme exists and head is empty/absent
//!   - ensureBasename: prefix theme.logo / theme.favicon with advanced.basename
//!   - diagrams default: `integrations.diagrams === true` → `["mermaid"]`

use serde_json::{Map, Value};

/// Node `path.join(basename, p)` for the config-relative asset paths presets
/// prefixes (no `..`, forward slashes): collapse separators, drop empty/`.`.
fn path_join(basename: &str, p: &str) -> String {
    let mut segs: Vec<&str> = Vec::new();
    for part in [basename, p] {
        for seg in part.split('/') {
            if seg.is_empty() || seg == "." {
                continue;
            }
            segs.push(seg);
        }
    }
    // path.join preserves a leading slash if basename started with one.
    let lead = basename.starts_with('/');
    let joined = segs.join("/");
    if lead {
        format!("/{joined}")
    } else {
        joined
    }
}

fn obj_mut<'a>(v: &'a mut Value, key: &str) -> Option<&'a mut Value> {
    v.as_object_mut()?.get_mut(key)
}

/// Apply the sync presets to a settings object in place.
pub fn presets(settings: &mut Value) {
    ensure_navigation(settings);

    // `if (settings?.theme && !settings?.theme?.head?.length) theme.head = []`
    if let Some(theme) = settings.get("theme") {
        if theme.is_object() {
            let head_empty = theme
                .get("head")
                .and_then(|h| h.as_array())
                .map(|a| a.is_empty())
                .unwrap_or(true);
            if head_empty {
                if let Some(theme_obj) = obj_mut(settings, "theme").and_then(|t| t.as_object_mut())
                {
                    theme_obj.insert("head".into(), Value::Array(vec![]));
                }
            }
        }
    }

    ensure_basename(settings);

    ensure_diagrams_default(settings);
}

/// `if (typeof integrations.diagrams === "boolean" && integrations.diagrams)
/// integrations.diagrams = ["mermaid"]` — enable mermaid only by default. Only
/// the boolean-`true` case is normalized; `false`, arrays, and objects (e.g.
/// `{ ".config": … }`) pass through untouched, matching the JS `typeof` guard.
fn ensure_diagrams_default(settings: &mut Value) {
    let Some(integrations) = settings
        .get_mut("integrations")
        .and_then(|i| i.as_object_mut())
    else {
        return;
    };
    if integrations.get("diagrams") == Some(&Value::Bool(true)) {
        integrations.insert(
            "diagrams".into(),
            Value::Array(vec![Value::String("mermaid".into())]),
        );
    }
}

/// `ensureNavigation`: webeditor default {}, navigation default {sidebar:[]},
/// sidebar default [].
fn ensure_navigation(settings: &mut Value) {
    let Some(obj) = settings.as_object_mut() else {
        return;
    };
    // `if (!json?.webeditor) json.webeditor = {}`
    if !obj.get("webeditor").map(truthy).unwrap_or(false) {
        obj.insert("webeditor".into(), Value::Object(Map::new()));
    }
    // `if (!json?.navigation) json.navigation = { sidebar: [] }`
    if !obj.get("navigation").map(truthy).unwrap_or(false) {
        let mut nav = Map::new();
        nav.insert("sidebar".into(), Value::Array(vec![]));
        obj.insert("navigation".into(), Value::Object(nav));
    }
    // `if (!json?.navigation?.sidebar) json.navigation.sidebar = []`
    if let Some(nav) = obj.get_mut("navigation").and_then(|n| n.as_object_mut()) {
        if !nav.get("sidebar").map(truthy).unwrap_or(false) {
            nav.insert("sidebar".into(), Value::Array(vec![]));
        }
    }
}

/// `ensureBasename`: prefix logo/favicon paths with advanced.basename.
fn ensure_basename(settings: &mut Value) {
    let basename = settings
        .get("advanced")
        .and_then(|a| a.get("basename"))
        .and_then(|b| b.as_str())
        .filter(|b| !b.is_empty())
        .map(|b| b.to_string());
    let Some(basename) = basename else {
        return;
    };

    let Some(theme) = settings.get_mut("theme").and_then(|t| t.as_object_mut()) else {
        return;
    };

    // logo: string → joined; object with light/dark/href → per-field join.
    match theme.get("logo").cloned() {
        Some(Value::String(logo)) => {
            theme.insert("logo".into(), Value::String(path_join(&basename, &logo)));
        }
        Some(Value::Object(logo)) => {
            if logo.contains_key("light") || logo.contains_key("dark") || logo.contains_key("href")
            {
                let light = logo.get("light").and_then(|v| v.as_str()).unwrap_or("");
                let dark = logo.get("dark").and_then(|v| v.as_str()).unwrap_or("");
                let mut out = Map::new();
                out.insert("light".into(), Value::String(path_join(&basename, light)));
                out.insert("dark".into(), Value::String(path_join(&basename, dark)));
                // `href: settings.theme.logo.href` — copied verbatim (undefined omits).
                if let Some(href) = logo.get("href") {
                    out.insert("href".into(), href.clone());
                }
                theme.insert("logo".into(), Value::Object(out));
            }
        }
        _ => {}
    }

    // favicon: string → joined.
    if let Some(fav) = theme.get("favicon").and_then(|v| v.as_str()) {
        let joined = path_join(&basename, fav);
        theme.insert("favicon".into(), Value::String(joined));
    }
}

/// JS truthiness for the `!x` guards ensureNavigation uses (objects/arrays are
/// truthy even when empty; null/undefined/"" are falsy).
fn truthy(v: &Value) -> bool {
    match v {
        Value::Null => false,
        Value::Bool(b) => *b,
        Value::String(s) => !s.is_empty(),
        Value::Number(n) => n.as_f64().map(|f| f != 0.0).unwrap_or(true),
        _ => true,
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn ensure_navigation_defaults() {
        let mut s = json!({});
        presets(&mut s);
        assert_eq!(s["webeditor"], json!({}));
        assert_eq!(s["navigation"]["sidebar"], json!([]));
    }

    #[test]
    fn keeps_existing_sidebar() {
        let mut s = json!({ "navigation": { "sidebar": ["intro"] } });
        presets(&mut s);
        assert_eq!(s["navigation"]["sidebar"], json!(["intro"]));
    }

    #[test]
    fn theme_head_init() {
        let mut s = json!({ "theme": { "name": "poetry" } });
        presets(&mut s);
        assert_eq!(s["theme"]["head"], json!([]));
    }

    #[test]
    fn basename_prefixes_logo_favicon() {
        let mut s = json!({
            "advanced": { "basename": "/docs" },
            "theme": { "name": "poetry", "logo": "logo.svg", "favicon": "fav.ico" }
        });
        presets(&mut s);
        assert_eq!(s["theme"]["logo"], json!("/docs/logo.svg"));
        assert_eq!(s["theme"]["favicon"], json!("/docs/fav.ico"));
    }

    #[test]
    fn diagrams_true_becomes_mermaid_array() {
        let mut s = json!({ "integrations": { "diagrams": true } });
        presets(&mut s);
        assert_eq!(s["integrations"]["diagrams"], json!(["mermaid"]));
    }

    #[test]
    fn diagrams_non_boolean_untouched() {
        // false, arrays, and objects pass through (matches the `typeof` guard).
        let mut s = json!({ "integrations": { "diagrams": false } });
        presets(&mut s);
        assert_eq!(s["integrations"]["diagrams"], json!(false));

        let mut s2 = json!({ "integrations": { "diagrams": ["mermaid", "graphviz"] } });
        presets(&mut s2);
        assert_eq!(
            s2["integrations"]["diagrams"],
            json!(["mermaid", "graphviz"])
        );

        let mut s3 =
            json!({ "integrations": { "diagrams": { ".config": { "interactive": true } } } });
        presets(&mut s3);
        assert_eq!(
            s3["integrations"]["diagrams"],
            json!({ ".config": { "interactive": true } })
        );
    }

    #[test]
    fn basename_prefixes_logo_object() {
        let mut s = json!({
            "advanced": { "basename": "/d" },
            "theme": { "logo": { "light": "l.svg", "dark": "dk.svg", "href": "/home" } }
        });
        presets(&mut s);
        assert_eq!(
            s["theme"]["logo"],
            json!({ "light": "/d/l.svg", "dark": "/d/dk.svg", "href": "/home" })
        );
    }
}
