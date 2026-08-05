//! `integrationsToPlugins` / `accessControlToPlugins` — port of the pure
//! config→plugin-specifier maps in packages/xyd-documan/src/utils.ts
//! (~1404-1465). Each emits a JS `Plugins` array whose elements are either a
//! bare specifier string (`"@xyd-js/plugin-orama"`) or a `[specifier, config]`
//! tuple; the config values are plain settings data, so the whole transform is
//! cleanly portable over a JSON boundary. The `resolvedPlugins` contribution
//! merge that CONSUMES these specifiers is NOT portable — it operates on live
//! JS module values (React components, remark/rehype functions, hooks) that a
//! JSON boundary would drop — so it stays JS. See the crate docs.

use serde_json::{Map, Value};

/// JS truthiness for the `if (x)` guards these functions use: objects/arrays are
/// truthy even when empty; `null`/`false`/`0`/`""` are falsy.
fn truthy(v: Option<&Value>) -> bool {
    match v {
        None | Some(Value::Null) => false,
        Some(Value::Bool(b)) => *b,
        Some(Value::String(s)) => !s.is_empty(),
        Some(Value::Number(n)) => n.as_f64().map(|f| f != 0.0).unwrap_or(true),
        _ => true,
    }
}

/// `["<specifier>", <config>]` tuple element.
fn tuple(specifier: &str, config: &Value) -> Value {
    Value::Array(vec![Value::String(specifier.to_string()), config.clone()])
}

fn get<'a>(v: &'a Value, key: &str) -> Option<&'a Value> {
    v.as_object().and_then(|o| o.get(key))
}

/// `integrationsToPlugins(integrations)` → plugin specifier array.
/// `Err` mirrors the JS `throw new Error("Only one search integration…")`.
pub fn integrations_to_plugins(integrations: &Value) -> Result<Vec<Value>, String> {
    let mut plugins: Vec<Value> = Vec::new();
    let mut found_search = 0;

    // search.orama: boolean → bare specifier; object → tuple with the config.
    let orama = integrations.get("search").and_then(|s| get(s, "orama"));
    if truthy(orama) {
        match orama {
            Some(Value::Bool(_)) => plugins.push(Value::String("@xyd-js/plugin-orama".to_string())),
            Some(cfg) => plugins.push(tuple("@xyd-js/plugin-orama", cfg)),
            None => {}
        }
        found_search += 1;
    }

    let algolia = integrations.get("search").and_then(|s| get(s, "algolia"));
    if truthy(algolia) {
        plugins.push(tuple("@xyd-js/plugin-algolia", algolia.unwrap()));
        found_search += 1;
    }

    if found_search > 1 {
        return Err("Only one search integration is allowed".to_string());
    }

    // .apps.supademo
    let supademo = integrations.get(".apps").and_then(|a| get(a, "supademo"));
    if truthy(supademo) {
        plugins.push(tuple("@xyd-js/plugin-supademo", supademo.unwrap()));
    }

    // support.{chatwoot,intercom,livechat}
    for (key, specifier) in [
        ("chatwoot", "@xyd-js/plugin-chatwoot"),
        ("intercom", "@xyd-js/plugin-intercom"),
        ("livechat", "@xyd-js/plugin-livechat"),
    ] {
        let cfg = integrations.get("support").and_then(|s| get(s, key));
        if truthy(cfg) {
            plugins.push(tuple(specifier, cfg.unwrap()));
        }
    }

    // diagrams: object with `.config.interactive` truthy → extra-diagram, `{}`.
    if let Some(diagrams) = integrations.get("diagrams") {
        if diagrams.is_object() {
            if let Some(config) = get(diagrams, ".config") {
                if truthy(config.as_object().and_then(|c| c.get("interactive"))) {
                    plugins.push(tuple(
                        "@xyd-js/plugin-extra-diagram",
                        &Value::Object(Map::new()),
                    ));
                }
            }
        }
    }

    Ok(plugins)
}

/// `accessControlToPlugins(accessControl)` — a single `[specifier, config]` when
/// present (JS truthy guard), else empty.
pub fn access_control_to_plugins(access_control: &Value) -> Vec<Value> {
    if truthy(Some(access_control)) {
        vec![tuple(
            "@xyd-js/plugin-access-control/plugin",
            access_control,
        )]
    } else {
        Vec::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn orama_boolean_is_bare_specifier() {
        let out = integrations_to_plugins(&json!({ "search": { "orama": true } })).unwrap();
        assert_eq!(out, vec![json!("@xyd-js/plugin-orama")]);
    }

    #[test]
    fn orama_object_is_tuple() {
        let out = integrations_to_plugins(&json!({ "search": { "orama": { "index": "docs" } } }))
            .unwrap();
        assert_eq!(
            out,
            vec![json!(["@xyd-js/plugin-orama", { "index": "docs" }])]
        );
    }

    #[test]
    fn algolia_is_tuple() {
        let out =
            integrations_to_plugins(&json!({ "search": { "algolia": { "appId": "X" } } })).unwrap();
        assert_eq!(
            out,
            vec![json!(["@xyd-js/plugin-algolia", { "appId": "X" }])]
        );
    }

    #[test]
    fn two_search_integrations_errors() {
        let err = integrations_to_plugins(
            &json!({ "search": { "orama": true, "algolia": { "appId": "X" } } }),
        )
        .unwrap_err();
        assert_eq!(err, "Only one search integration is allowed");
    }

    #[test]
    fn supademo_support_and_diagram() {
        let out = integrations_to_plugins(&json!({
            ".apps": { "supademo": { "apiKey": "k" } },
            "support": { "chatwoot": { "token": "t" }, "intercom": { "appId": "a" }, "livechat": { "license": "l" } },
            "diagrams": { ".config": { "interactive": true } }
        }))
        .unwrap();
        assert_eq!(
            out,
            vec![
                json!(["@xyd-js/plugin-supademo", { "apiKey": "k" }]),
                json!(["@xyd-js/plugin-chatwoot", { "token": "t" }]),
                json!(["@xyd-js/plugin-intercom", { "appId": "a" }]),
                json!(["@xyd-js/plugin-livechat", { "license": "l" }]),
                json!(["@xyd-js/plugin-extra-diagram", {}]),
            ]
        );
    }

    #[test]
    fn diagram_without_interactive_skipped() {
        let out = integrations_to_plugins(
            &json!({ "diagrams": { ".config": { "interactive": false } } }),
        )
        .unwrap();
        assert!(out.is_empty());
        // array/boolean diagrams (not an object with .config) are also skipped here.
        let out2 = integrations_to_plugins(&json!({ "diagrams": true })).unwrap();
        assert!(out2.is_empty());
    }

    #[test]
    fn falsy_integrations_skipped() {
        let out = integrations_to_plugins(&json!({
            "search": { "orama": false, "algolia": null },
            "support": { "chatwoot": false }
        }))
        .unwrap();
        assert!(out.is_empty());
        assert!(integrations_to_plugins(&json!({})).unwrap().is_empty());
    }

    #[test]
    fn access_control_present_and_absent() {
        let cfg = json!({ "provider": { "type": "jwt" }, "defaultAccess": "public" });
        assert_eq!(
            access_control_to_plugins(&cfg),
            vec![json!(["@xyd-js/plugin-access-control/plugin", cfg])]
        );
        assert!(access_control_to_plugins(&Value::Null).is_empty());
    }
}
