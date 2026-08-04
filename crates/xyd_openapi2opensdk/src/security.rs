//! Security-scheme mapping — port of src/security.ts.

use serde_json::Value;

use crate::jsrt::{js_object_keys, screaming_snake_case};
use crate::model::Security;

/// Map one OpenAPI securityScheme object into the OpenSDK security shape.
pub fn map_security_scheme(
    value: Option<&Value>,
    scheme_name: Option<&str>,
    env_var: Option<&str>,
) -> Option<Security> {
    let scheme = value?.as_object()?;
    let scheme_type = scheme.get("type")?;

    let mut entry = Security {
        scheme_type: scheme_type.clone(),
        kind: "other".to_string(),
        scheme_name: scheme_name.map(|s| s.to_string()),
        env_var: env_var.map(|s| s.to_string()),
        scheme: None,
        bearer_format: None,
        location: None,
        name: None,
    };

    match scheme_type.as_str() {
        Some("http") => {
            // JS `entry.scheme = scheme.scheme` — undefined assignment omits.
            entry.scheme = scheme.get("scheme").cloned();
            if let Some(bf) = scheme.get("bearerFormat") {
                // JS truthiness gate on bearerFormat.
                let truthy = match bf {
                    Value::String(s) => !s.is_empty(),
                    Value::Bool(b) => *b,
                    Value::Null => false,
                    Value::Number(n) => n.as_f64().map(|f| f != 0.0).unwrap_or(true),
                    _ => true,
                };
                if truthy {
                    entry.bearer_format = Some(bf.clone());
                }
            }
            let s = scheme
                .get("scheme")
                .and_then(|v| v.as_str())
                .unwrap_or("")
                .to_lowercase();
            entry.kind = if s == "basic" { "basic" } else { "bearer" }.to_string();
        }
        Some("apiKey") => {
            entry.location = scheme.get("in").cloned();
            entry.name = scheme.get("name").cloned();
            entry.kind = match scheme.get("in").and_then(|v| v.as_str()) {
                Some("query") => "apiKey-query",
                Some("cookie") => "apiKey-cookie",
                _ => "apiKey-header",
            }
            .to_string();
        }
        _ => {}
    }

    Some(entry)
}

/// The document's `components.securitySchemes` with a best-guess env var.
pub fn security_schemes(doc: &Value, sdk_name: &str, auth_env_var: Option<&str>) -> Vec<Security> {
    let Some(schemes) = doc
        .get("components")
        .and_then(|c| c.get("securitySchemes"))
        .and_then(|s| s.as_object())
    else {
        return vec![];
    };

    let default_env = auth_env_var
        .map(|s| s.to_string())
        .unwrap_or_else(|| format!("{}_API_KEY", screaming_snake_case(sdk_name)));

    js_object_keys(schemes)
        .into_iter()
        .filter_map(|name| map_security_scheme(schemes.get(name), Some(name), Some(&default_env)))
        .collect()
}

/// Map a per-operation `security` requirement list into the OpenSDK shape.
pub fn security_requirements(doc: &Value, requirements: &[Value]) -> Vec<Security> {
    let empty = serde_json::Map::new();
    let schemes = doc
        .get("components")
        .and_then(|c| c.get("securitySchemes"))
        .and_then(|s| s.as_object())
        .unwrap_or(&empty);

    let mut out = Vec::new();
    for requirement in requirements {
        let Some(req) = requirement.as_object() else {
            continue;
        };
        for scheme_name in js_object_keys(req) {
            if let Some(entry) =
                map_security_scheme(schemes.get(scheme_name), Some(scheme_name), None)
            {
                out.push(entry);
            }
        }
    }
    out
}
