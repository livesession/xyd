//! securitySchemesToXOpenApi — port of security.ts.

use serde_json::Value;

use crate::jsrt::{js_object_keys, screaming_snake_case};
use crate::model::Security;

pub fn security_schemes_to_x_openapi(
    doc: &Value,
    cli_name: &str,
    auth_env_var: Option<&str>,
) -> Vec<Security> {
    let Some(schemes) = doc
        .get("components")
        .and_then(|c| c.get("securitySchemes"))
        .and_then(|s| s.as_object())
    else {
        return vec![];
    };

    let default_env = auth_env_var
        .map(|s| s.to_string())
        .unwrap_or_else(|| format!("{}_API_KEY", screaming_snake_case(cli_name)));

    let mut out = Vec::new();
    // JS `for (const value of Object.values(schemes))` — value order.
    for key in js_object_keys(schemes) {
        let scheme = &schemes[key];
        let Some(scheme_type) = scheme.get("type") else {
            continue;
        };

        let mut entry = Security {
            scheme_type: scheme_type.clone(),
            kind: "other".to_string(),
            env_var: default_env.clone(),
            scheme: None,
            bearer_format: None,
            location: None,
            name: None,
        };

        match scheme_type.as_str() {
            Some("http") => {
                entry.scheme = scheme.get("scheme").cloned();
                if let Some(bf) = scheme.get("bearerFormat") {
                    let truthy = crate::jsrt::truthy(Some(bf));
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

        out.push(entry);
    }
    out
}
