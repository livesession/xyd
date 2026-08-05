//! OpenCLI → buildable Go CLI project generator — Rust port of
//! `@xyd-js/opencli2go` (S6+ W7). Pure: an OpenCLI doc (`serde_json::Value`)
//! → a virtual file map `{ relativePath: contents }` of Go source, byte-exact
//! with the JS emitter. The `writeProject` fs step stays JS (out of scope).

mod command;
mod flags;
mod golit;
mod handler;
mod maincmd;
mod model;
mod naming;
mod runtime;

use serde::Deserialize;
use serde_json::Value;
use std::collections::BTreeMap;

use command::render_resource_file;
use maincmd::render_main;
use naming::slug;
use runtime::{config_go, runtime_go};

#[derive(Deserialize, Default)]
#[serde(rename_all = "camelCase", default)]
pub struct Options {
    pub module_path: Option<String>,
    pub bin_name: Option<String>,
    pub go_version: Option<String>,
    pub base_url: Option<String>,
}

/// Generate the Go CLI project file map from an OpenCLI document.
pub fn opencli2go(spec: &Value, options: Option<Options>) -> BTreeMap<String, String> {
    let options = options.unwrap_or_default();

    let title = spec
        .get("info")
        .and_then(|i| i.get("title"))
        .and_then(|t| t.as_str())
        .unwrap_or("cli");
    let bin_name = options.bin_name.clone().unwrap_or_else(|| {
        let s = slug(title);
        if s.is_empty() {
            "cli".to_string()
        } else {
            s
        }
    });
    let module = options
        .module_path
        .clone()
        .unwrap_or_else(|| format!("example.com/{bin_name}"));
    let go_version = options
        .go_version
        .clone()
        .unwrap_or_else(|| "1.22".to_string());
    let base_url = options.base_url.clone().unwrap_or_else(|| {
        spec.get("x-openapi")
            .and_then(|x| x.get("servers"))
            .and_then(|s| s.as_array())
            .and_then(|a| a.first())
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .to_string()
    });

    let mut files: BTreeMap<String, String> = BTreeMap::new();
    files.insert(
        "go.mod".to_string(),
        format!("module {module}\n\ngo {go_version}\n"),
    );

    let mut constructors: Vec<String> = Vec::new();
    if let Some(cmds) = spec.get("commands").and_then(|c| c.as_array()) {
        for top in cmds {
            let resource = render_resource_file(top, &module);
            files.insert(resource.path, resource.content);
            constructors.push(resource.constructor);
        }
    }

    files.insert(
        format!("cmd/{bin_name}/main.go"),
        render_main(spec, &bin_name, &module, &constructors),
    );
    files.insert("internal/runtime/runtime.go".to_string(), runtime_go());
    files.insert(
        "internal/runtime/config.go".to_string(),
        config_go(spec, &bin_name, &base_url),
    );

    files
}
