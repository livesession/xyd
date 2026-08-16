//! client.ts — Client.java (top-level client + per-resource accessors + builder).

use serde_json::Value;

use crate::ir::{arr_field, str_field};
use crate::javawriter::{java_doc, java_file};
use crate::jsrt::{camel_case, json_str, service_type_name};
use crate::project::JavaCtx;

pub fn render_client_file(spec: &Value, ctx: &JavaCtx) -> String {
    let resources = arr_field(spec, "resources");
    let rname = |r: &Value| str_field(r, "name").unwrap_or("").to_string();

    let mut field_lines: Vec<String> = vec!["  private final Transport transport;".to_string()];
    for r in &resources {
        let n = rname(r);
        field_lines.push(format!(
            "  private final {} {};",
            service_type_name(std::slice::from_ref(&n)),
            camel_case(&n)
        ));
    }

    let mut ctor_lines: Vec<String> =
        vec!["    this.transport = new Transport(baseUrl, apiKey);".to_string()];
    for r in &resources {
        let n = rname(r);
        ctor_lines.push(format!(
            "    this.{} = new {}(transport);",
            camel_case(&n),
            service_type_name(std::slice::from_ref(&n))
        ));
    }
    let ctor = format!(
        "  public Client(String apiKey, String baseUrl) {{\n{}\n  }}",
        ctor_lines.join("\n")
    );

    let accessors = resources
        .iter()
        .map(|r| {
            let n = rname(r);
            format!(
                "  public {} {}() {{\n    return {};\n  }}",
                service_type_name(std::slice::from_ref(&n)),
                camel_case(&n),
                camel_case(&n)
            )
        })
        .collect::<Vec<_>>()
        .join("\n\n");

    let default_base_url = json_str(&ctx.base_url);
    let key_expr = match &ctx.env_var {
        Some(ev) => format!("apiKey != null ? apiKey : System.getenv({})", json_str(ev)),
        None => "apiKey".to_string(),
    };
    let from_env_doc = match &ctx.env_var {
        Some(ev) => java_doc(
            Some(&format!(
                "Create a client seeded with the credential from {ev}."
            )),
            "  ",
        ),
        None => java_doc(
            Some("Create a client using the default configuration."),
            "  ",
        ),
    };

    let builder = [
        "  public static final class Builder {".to_string(),
        "    private String apiKey;".to_string(),
        format!("    private String baseUrl = {default_base_url};"),
        "".to_string(),
        "    public Builder apiKey(String apiKey) {".to_string(),
        "      this.apiKey = apiKey;".to_string(),
        "      return this;".to_string(),
        "    }".to_string(),
        "".to_string(),
        "    public Builder baseUrl(String baseUrl) {".to_string(),
        "      this.baseUrl = baseUrl;".to_string(),
        "      return this;".to_string(),
        "    }".to_string(),
        "".to_string(),
        "    public Client build() {".to_string(),
        format!("      String key = {key_expr};"),
        "      return new Client(key, baseUrl);".to_string(),
        "    }".to_string(),
        "  }".to_string(),
    ]
    .join("\n");

    let doc = java_doc(
        Some(&format!(
            "Client is the {} API client.",
            str_field(spec.get("info").unwrap_or(&Value::Null), "title").unwrap_or("")
        )),
        "",
    );
    let head = if doc.is_empty() {
        String::new()
    } else {
        format!("{doc}\n")
    };

    let members = [
        field_lines.join("\n"),
        ctor,
        accessors,
        "  public static Builder builder() {\n    return new Builder();\n  }".to_string(),
        format!("{from_env_doc}\n  public static Client fromEnv() {{\n    return builder().build();\n  }}"),
        builder,
    ]
    .into_iter()
    .filter(|s| !s.is_empty())
    .collect::<Vec<_>>()
    .join("\n\n");

    let body = format!("{head}public final class Client {{\n{members}\n}}");
    java_file(&ctx.full_package, &[], &body)
}
