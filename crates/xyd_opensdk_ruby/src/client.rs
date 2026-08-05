//! Port of client.ts — `lib/<pkg>/client.rb` emission.

use serde_json::Value;

use crate::naming::snake_case;
use crate::service::resource_class_name;
use crate::writer::{block, indent, rb_comment, rb_string};

pub fn render_client_file(spec: &Value, module_name: &str, env_var: &str) -> String {
    let resources = spec
        .get("resources")
        .and_then(|r| r.as_array())
        .cloned()
        .unwrap_or_default();
    let mut members: Vec<String> = Vec::new();

    if !resources.is_empty() {
        let readers: Vec<String> = resources
            .iter()
            .map(|r| format!(":{}", snake_case(name_of(r))))
            .collect();
        members.push(format!("attr_reader {}", readers.join(", ")));
    }

    let mut ctor = vec![
        "def initialize(api_key: nil, base_url: nil, timeout: nil)".to_string(),
        indent(&format!("api_key = ENV[{}] if api_key.nil?", rb_string(env_var))),
        indent(&format!(
            "@transport = {module_name}::Transport.new(api_key: api_key, base_url: base_url, timeout: timeout)"
        )),
    ];
    for r in &resources {
        let sn = snake_case(name_of(r));
        ctor.push(indent(&format!(
            "@{sn} = {module_name}::Resources::{}.new(@transport)",
            resource_class_name(&[name_of(r).to_string()])
        )));
    }
    ctor.push("end".to_string());
    members.push(ctor.join("\n"));

    let title = spec
        .get("info")
        .and_then(|i| i.get("title"))
        .and_then(|t| t.as_str())
        .unwrap_or("");
    let doc = rb_comment(&format!("Client is the {title} API client."));
    let client_class = format!("{doc}\n{}", block("class Client", &members.join("\n\n")));
    format!(
        "{}\n",
        block(&format!("module {module_name}"), &client_class)
    )
}

fn name_of(v: &Value) -> &str {
    v.get("name").and_then(|n| n.as_str()).unwrap_or("")
}
