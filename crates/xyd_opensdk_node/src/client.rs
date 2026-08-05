//! `src/client.ts` + `src/index.ts`. Ports `src/client.ts`
//! (busybox omitted — off by default, out of fork scope).

use crate::ir::Spec;
use crate::jsrt::{camel_case, js_doc, json_string, slug};
use crate::resource::resource_class_name;

/// Emit `src/client.ts`: the top-level client with a field per top-level resource.
pub fn render_client_file(spec: &Spec, env_var: &str, client_name: &str) -> String {
    let resources = &spec.resources;
    let mut imports = vec![
        "import { APIClient, readEnv } from './core/request';".to_string(),
        "import type { ClientOptions } from './core/request';".to_string(),
    ];
    for r in resources {
        let file = if slug(&r.name).is_empty() {
            "resource".to_string()
        } else {
            slug(&r.name)
        };
        imports.push(format!(
            "import {{ {} }} from './resources/{}';",
            resource_class_name(std::slice::from_ref(&r.name)),
            file
        ));
    }

    let fields: Vec<String> = resources
        .iter()
        .map(|r| {
            format!(
                "  readonly {}: {};",
                camel_case(&r.name),
                resource_class_name(std::slice::from_ref(&r.name))
            )
        })
        .collect();

    let mut ctor_lines = vec![format!(
        "    super({{ ...options, apiKey: options.apiKey ?? readEnv({}) }});",
        json_string(env_var)
    )];
    for r in resources {
        ctor_lines.push(format!(
            "    this.{} = new {}(this);",
            camel_case(&r.name),
            resource_class_name(std::slice::from_ref(&r.name))
        ));
    }

    let doc = js_doc(Some(&format!("The {} API client.", spec.info.title)));
    let field_block = if fields.is_empty() {
        String::new()
    } else {
        format!("{}\n\n", fields.join("\n"))
    };
    format!(
        "{imports}\n\n{doc}export class {client_name} extends APIClient {{\n{field_block}  constructor(options: ClientOptions = {{}}) {{\n{ctor}\n  }}\n}}\n",
        imports = imports.join("\n"),
        ctor = ctor_lines.join("\n"),
    )
}

/// Emit `src/index.ts`: the public entry point.
pub fn render_root_index_file(
    spec: &Spec,
    error_classes: &[String],
    client_name: &str,
    default_export: bool,
) -> String {
    let mut errors = vec!["APIError".to_string()];
    errors.extend(error_classes.iter().cloned());
    let client_line = if default_export {
        format!("export {{ {client_name} as default }} from './client';")
    } else {
        format!("export {{ {client_name} }} from './client';")
    };
    let mut lines = vec![
        client_line,
        format!("export {{ {} }} from './core/error';", errors.join(", ")),
        "export type { ClientOptions, RequestOptions } from './core/request';".to_string(),
        "export * from './models';".to_string(),
    ];
    if !spec.resources.is_empty() {
        lines.push("export * from './resources/index';".to_string());
    }
    format!("{}\n", lines.join("\n"))
}
