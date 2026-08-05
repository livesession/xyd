//! `package.json` / `tsconfig.json` / `README.md` + resolved options.
//! Ports `src/project.ts` (busybox omitted — off by default, out of fork scope).

use serde_json::{json, Value};

use crate::ir::Spec;
use crate::jsrt::{npm_package_name, pascal_case, screaming_snake_case};

pub struct ResolvedNodeOptions {
    pub pkg: String,
    /// Baked into the fetch runtime — consumed by the deferred `generateRuntime`.
    #[allow(dead_code)]
    pub base_url: String,
    pub env_var: String,
    pub client_name: String,
    pub default_export: bool,
}

/// Resolve options. The fork build only exercises the default (no-options) path:
/// default export, PascalCase client name, env var from security or the pkg stem.
pub fn resolve_node_options(spec: &Spec) -> ResolvedNodeOptions {
    let pkg = npm_package_name(&spec.info.title);
    let client_name = pascal_case(&pkg);
    let env_var = spec
        .security
        .iter()
        .find_map(|s| s.env_var.clone())
        .unwrap_or_else(|| format!("{}_API_KEY", screaming_snake_case(&pkg)));
    ResolvedNodeOptions {
        base_url: spec.servers.first().cloned().unwrap_or_default(),
        env_var,
        client_name,
        default_export: true,
        pkg,
    }
}

/// The generated `package.json` (dependency-free, tsc-built).
pub fn package_json(pkg: &str, spec: &Spec) -> String {
    let info = &spec.info;
    // Build in the exact key order the TS emitter assembles.
    let mut manifest = serde_json::Map::new();
    manifest.insert("name".into(), json!(pkg));
    let version = if info.version.is_empty() {
        "0.0.0".to_string()
    } else {
        info.version.clone()
    };
    manifest.insert("version".into(), json!(version));
    if let Some(desc) = info.description.as_deref() {
        if !desc.is_empty() {
            manifest.insert("description".into(), json!(desc));
        }
    }
    if let Some(name) = info.contact.as_ref().and_then(|c| c.name.as_deref()) {
        manifest.insert("author".into(), json!(name));
    }
    if let Some(id) = info.license.as_ref().and_then(|l| l.identifier.as_deref()) {
        manifest.insert("license".into(), json!(id));
    }
    if let Some(home) = info.homepage.as_deref() {
        manifest.insert("homepage".into(), json!(home));
    }
    if let Some(repo) = info.repository.as_deref() {
        manifest.insert("repository".into(), json!({ "type": "git", "url": repo }));
    }
    manifest.insert("type".into(), json!("module"));
    manifest.insert("main".into(), json!("./dist/index.js"));
    manifest.insert("types".into(), json!("./dist/index.d.ts"));
    manifest.insert(
        "exports".into(),
        json!({ ".": { "types": "./dist/index.d.ts", "import": "./dist/index.js" } }),
    );
    manifest.insert("files".into(), json!(["dist", "src"]));
    manifest.insert(
        "scripts".into(),
        json!({ "build": "tsc", "prepare": "tsc" }),
    );
    manifest.insert("engines".into(), json!({ "node": ">=18" }));
    manifest.insert("dependencies".into(), json!({}));
    manifest.insert("devDependencies".into(), json!({ "typescript": "^5.6.2" }));
    format!("{}\n", pretty(&Value::Object(manifest)))
}

/// The generated `tsconfig.json`.
pub fn tsconfig_json() -> String {
    let config = json!({
        "compilerOptions": {
            "target": "ES2022",
            "module": "ESNext",
            "moduleResolution": "bundler",
            "lib": ["ES2022", "DOM"],
            "strict": true,
            "esModuleInterop": true,
            "skipLibCheck": true,
            "forceConsistentCasingInFileNames": true,
            "declaration": true,
            "outDir": "./dist"
        },
        "include": ["src"]
    });
    format!("{}\n", pretty(&config))
}

/// A minimal README scaffold.
pub fn readme(pkg: &str, spec: &Spec, client_name: &str, default_export: bool) -> String {
    let summary = match spec.info.description.as_deref() {
        Some(d) if !d.is_empty() => format!("\n{d}\n"),
        _ => String::new(),
    };
    let import_line = if default_export {
        format!("import {client_name} from '{pkg}';")
    } else {
        format!("import {{ {client_name} }} from '{pkg}';")
    };
    format!(
        "# {pkg}\n{summary}\n## Usage\n\n```ts\n{import_line}\n\nconst client = new {client_name}({{ apiKey: process.env.API_KEY }});\n```\n"
    )
}

/// 2-space pretty JSON matching JS `JSON.stringify(x, null, 2)` (empty
/// object/array stay inline; ASCII output; forward slashes unescaped).
fn pretty(v: &Value) -> String {
    let mut out = String::new();
    write_pretty(v, 0, &mut out);
    out
}

fn write_pretty(v: &Value, indent: usize, out: &mut String) {
    match v {
        Value::Object(map) => {
            if map.is_empty() {
                out.push_str("{}");
                return;
            }
            out.push_str("{\n");
            let pad = "  ".repeat(indent + 1);
            let last = map.len() - 1;
            for (i, (k, val)) in map.iter().enumerate() {
                out.push_str(&pad);
                out.push_str(&crate::jsrt::json_string(k));
                out.push_str(": ");
                write_pretty(val, indent + 1, out);
                if i != last {
                    out.push(',');
                }
                out.push('\n');
            }
            out.push_str(&"  ".repeat(indent));
            out.push('}');
        }
        Value::Array(arr) => {
            if arr.is_empty() {
                out.push_str("[]");
                return;
            }
            out.push_str("[\n");
            let pad = "  ".repeat(indent + 1);
            let last = arr.len() - 1;
            for (i, val) in arr.iter().enumerate() {
                out.push_str(&pad);
                write_pretty(val, indent + 1, out);
                if i != last {
                    out.push(',');
                }
                out.push('\n');
            }
            out.push_str(&"  ".repeat(indent));
            out.push(']');
        }
        Value::String(s) => out.push_str(&crate::jsrt::json_string(s)),
        Value::Bool(b) => out.push_str(if *b { "true" } else { "false" }),
        Value::Number(n) => out.push_str(&n.to_string()),
        Value::Null => out.push_str("null"),
    }
}
