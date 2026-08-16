//! src/client.rs — port of client.ts.

use serde_json::Value;

use crate::naming::{pascal_case, snake_case};
use crate::rswriter::{braced, rs_doc, rs_string};

pub fn render_client_file(spec: &Value, env_var: &str) -> String {
    let empty = Vec::new();
    let resources = spec
        .get("resources")
        .and_then(|r| r.as_array())
        .unwrap_or(&empty);

    let accessors: String = resources
        .iter()
        .map(|r| {
            let name = r.get("name").and_then(|n| n.as_str()).unwrap_or("");
            let md = snake_case(name);
            let cls = pascal_case(name);
            braced(
                &format!("pub fn {}(&self) -> crate::{md}::{cls}", snake_case(name)),
                &format!("crate::{md}::{cls}::new(self.transport.clone())"),
            )
        })
        .collect::<Vec<_>>()
        .join("\n\n");

    let client_impl_members = vec![
        braced(
            "pub fn new(api_key: impl Into<String>) -> Self",
            "Client {\n    transport: Arc::new(Transport::new(Some(api_key.into()), None, None)),\n}",
        ),
        braced(
            "pub fn from_env() -> Self",
            &format!(
                "Client {{\n    transport: Arc::new(Transport::new(std::env::var({}).ok(), None, None)),\n}}",
                rs_string(env_var)
            ),
        ),
        braced("pub fn builder() -> ClientBuilder", "ClientBuilder::default()"),
        accessors,
    ];
    let client_impl_body = client_impl_members
        .into_iter()
        .filter(|s| !s.is_empty())
        .collect::<Vec<_>>()
        .join("\n\n");

    let builder_impl_body = [
        braced(
            "pub fn api_key(mut self, api_key: impl Into<String>) -> Self",
            "self.api_key = Some(api_key.into());\nself",
        ),
        braced(
            "pub fn base_url(mut self, base_url: impl Into<String>) -> Self",
            "self.base_url = Some(base_url.into());\nself",
        ),
        braced(
            "pub fn timeout_ms(mut self, timeout_ms: u64) -> Self",
            "self.timeout_ms = Some(timeout_ms);\nself",
        ),
        braced(
            "pub fn build(self) -> Client",
            "Client {\n    transport: Arc::new(Transport::new(self.api_key, self.base_url, self.timeout_ms)),\n}",
        ),
    ]
    .join("\n\n");

    let title = spec
        .get("info")
        .and_then(|i| i.get("title"))
        .and_then(|t| t.as_str())
        .unwrap_or("");
    let doc = rs_doc(Some(&format!("Client is the {title} API client.")));

    format!(
        "use std::sync::Arc;\n\nuse crate::transport::Transport;\n\n{doc}\npub struct Client {{\n    transport: Arc<Transport>,\n}}\n\n{}\n\n/// A builder for base URL / timeout overrides.\n#[derive(Default)]\npub struct ClientBuilder {{\n    api_key: Option<String>,\n    base_url: Option<String>,\n    timeout_ms: Option<u64>,\n}}\n\n{}\n",
        braced("impl Client", &client_impl_body),
        braced("impl ClientBuilder", &builder_impl_body)
    )
}
