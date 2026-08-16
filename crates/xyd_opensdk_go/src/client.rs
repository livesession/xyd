//! client.go emitter — port of client.ts.

use serde_json::Value;

use crate::gowriter::{go_doc, go_field, go_file, go_struct, Imports};
use crate::naming::{json_string, pascal_case};
use crate::service::service_type_name;

pub struct GoCtx<'a> {
    pub module_path: String,
    pub pkg: String,
    pub types: &'a serde_json::Map<String, Value>,
    pub behavior: Value,
}

pub fn render_client_file(spec: &Value, ctx: &GoCtx) -> String {
    let mut imports = Imports::new();
    let option_q = imports.add(&format!("{}/option", ctx.module_path), None);
    let empty: Vec<Value> = Vec::new();
    let resources = spec
        .get("resources")
        .and_then(|r| r.as_array())
        .unwrap_or(&empty);

    let mut struct_fields = vec![go_field(
        "Options",
        &format!("[]{option_q}.RequestOption"),
        None,
    )];
    for r in resources {
        let rname = r.get("name").and_then(|n| n.as_str()).unwrap_or("");
        struct_fields.push(go_field(
            &pascal_case(rname),
            &service_type_name(&[rname.to_string()]),
            None,
        ));
    }
    let title = spec
        .get("info")
        .and_then(|i| i.get("title"))
        .and_then(|t| t.as_str())
        .unwrap_or("");
    let client_struct = go_struct(
        "Client",
        &struct_fields,
        &go_doc(
            Some(&format!("Client is the {title} API client.")),
            Some("Client"),
        ),
    );

    let env_var = spec
        .get("security")
        .and_then(|s| s.as_array())
        .and_then(|arr| {
            arr.iter()
                .find_map(|s| s.get("envVar").and_then(|e| e.as_str()))
        });

    let mut ctor_lines: Vec<String> = vec![format!("\tdefaults := []{option_q}.RequestOption{{}}")];
    if let Some(env) = env_var {
        imports.add("os", None);
        ctor_lines.push(format!(
            "\tif value, ok := os.LookupEnv({}); ok {{\n\t\tdefaults = append(defaults, {option_q}.WithAPIKey(value))\n\t}}",
            json_string(env)
        ));
    }
    ctor_lines.push("\topts = append(defaults, opts...)".to_string());
    ctor_lines.push("\tr = Client{Options: opts}".to_string());
    for res in resources {
        let rname = res.get("name").and_then(|n| n.as_str()).unwrap_or("");
        ctor_lines.push(format!(
            "\tr.{} = New{}(opts...)",
            pascal_case(rname),
            service_type_name(&[rname.to_string()])
        ));
    }

    let ctor_doc = match env_var {
        Some(env) => format!("NewClient creates a client seeded with the credential from {env}."),
        None => "NewClient creates a new API client with the given request options.".to_string(),
    };
    let ctor = format!(
        "{}\nfunc NewClient(opts ...{option_q}.RequestOption) (r Client) {{\n{}\n\treturn\n}}",
        go_doc(Some(&ctor_doc), Some("NewClient")),
        ctor_lines.join("\n")
    );

    go_file(&ctx.pkg, &imports, &[client_struct, ctor])
}
