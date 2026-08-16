//! client.ts — Client.cs: the top-level `<Sdk>Client` with a get-only property
//! per top-level resource service and a credential-seeding constructor.

use serde_json::Value;

use crate::cswriter::{cs_doc, cs_file, indent};
use crate::jsrt::{json_string, pascal_case};
use crate::service::service_class_name;

pub struct DotnetClientCtx<'a> {
    pub sdk: &'a str,
    pub namespace: &'a str,
    pub base_url: &'a str,
    pub env_var: Option<&'a str>,
}

/// Emit `Client.cs`.
pub fn render_client_file(spec: &Value, ctx: &DotnetClientCtx) -> String {
    let usings = vec!["System".to_string(), "System.Net.Http".to_string()];
    let resources = spec
        .get("resources")
        .and_then(Value::as_array)
        .cloned()
        .unwrap_or_default();
    let class_name = format!("{}Client", ctx.sdk);

    let mut members: Vec<String> = vec!["private readonly Transport _transport;".to_string()];
    for r in &resources {
        let name = r.get("name").and_then(Value::as_str).unwrap_or("");
        members.push(format!(
            "public {} {} {{ get; }}",
            service_class_name(&[name.to_string()]),
            pascal_case(name)
        ));
    }

    let mut ctor_lines: Vec<String> = Vec::new();
    if let Some(env_var) = ctx.env_var {
        ctor_lines.push(format!(
            "apiKey ??= Environment.GetEnvironmentVariable({});",
            json_string(env_var)
        ));
    }
    ctor_lines.push(format!(
        "_transport = new Transport(baseUrl ?? {}, apiKey, httpClient);",
        json_string(ctx.base_url)
    ));
    for r in &resources {
        let name = r.get("name").and_then(Value::as_str).unwrap_or("");
        ctor_lines.push(format!(
            "{} = new {}(_transport);",
            pascal_case(name),
            service_class_name(&[name.to_string()])
        ));
    }

    let ctor_doc = match ctx.env_var {
        Some(env_var) => format!(
            "Creates a client. When apiKey is null the credential is read from the {env_var} environment variable."
        ),
        None => "Creates a client with the given credential and base URL.".to_string(),
    };
    let ctor = format!(
        "{}\npublic {class_name}(string? apiKey = null, string? baseUrl = null, HttpClient? httpClient = null)\n{{\n{}\n}}",
        cs_doc(Some(&ctor_doc)),
        indent(&ctor_lines.join("\n"))
    );

    let title = spec
        .get("info")
        .and_then(|i| i.get("title"))
        .and_then(Value::as_str)
        .unwrap_or("");
    let doc = cs_doc(Some(&format!("{title} API client.")));
    let body = [members.join("\n"), ctor].join("\n\n");
    let decl = format!(
        "{doc}\npublic sealed class {class_name}\n{{\n{}\n}}",
        indent(&body)
    );

    cs_file(&usings, ctx.namespace, &[decl])
}
