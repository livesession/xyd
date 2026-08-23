//! OpenCLI doc → buildable Rust CLI project generator — Rust port of
//! `@xyd-js/opencli2rust` (S6+ W7). Pure: returns a virtual file map of Rust
//! source (generator-owned files `overwrite`, user scaffolds `skipIfExists`).
//! The regen-safe `writeProject` lifecycle (.sdk.lock / 3-way merge / .sdkignore)
//! is now ALSO Rust — ported in `xyd_opensdk_framework` and driven by this crate's
//! `regen` binary (`src/bin/regen.rs`, configured by a target crate's `regen.toml`),
//! which runs `opencli2rust` → `write_project` → `cargo fmt`. The lib itself stays
//! pure — it only produces the file map.

mod blobs;
mod cli;
mod command;
mod flags;
mod handler;
mod model;
mod naming;
mod rslit;
mod runtime;

use serde::Deserialize;
use serde_json::Value;

use cli::render_cli;
use command::{render_resource_file, ResourceFile};
use naming::{crate_name as to_crate_name, slug};
use rslit::GENERATED_HEADER;
use runtime::{
    actions_rs, cargo_toml, commands_rs, config_rs, custom_registry_rs, custom_scaffold_rs,
    gen_mod_rs, http_rs, main_rs, overrides_rs, runtime_mod_rs,
};

#[derive(Deserialize, Default)]
#[serde(rename_all = "camelCase", default)]
pub struct Options {
    pub crate_name: Option<String>,
    pub bin_name: Option<String>,
    pub edition: Option<String>,
    pub base_url: Option<String>,
    /// Top-level generated module (`src/<moduleName>/**`). Default: `"gen"`.
    pub module_name: Option<String>,
    /// Hand-owned impl module (`src/<implModule>/mod.rs`). Default: `"custom"`.
    pub impl_module: Option<String>,
}

/// A generated file: its content and how `writeProject` should treat it.
#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub enum WriteMode {
    /// Generator-owned — always regenerated.
    Overwrite,
    /// User-owned scaffold — written once, never clobbered.
    SkipIfExists,
}

#[derive(Clone)]
pub struct FileEntry {
    pub content: String,
    pub write_mode: WriteMode,
}

/// The virtual file map, insertion-ordered like the JS `ProjectFileMap`.
pub type FileMap = Vec<(String, FileEntry)>;

fn owned(content: String) -> FileEntry {
    FileEntry {
        content,
        write_mode: WriteMode::Overwrite,
    }
}
fn scaffold(content: String) -> FileEntry {
    FileEntry {
        content,
        write_mode: WriteMode::SkipIfExists,
    }
}

fn str_at(spec: &Value, path: &[&str]) -> Option<String> {
    let mut cur = spec;
    for k in path {
        cur = cur.get(k)?;
    }
    cur.as_str().map(|s| s.to_string())
}

/// Generate the Rust CLI project file map from an OpenCLI document.
pub fn opencli2rust(spec: &Value, options: Option<Options>) -> FileMap {
    let options = options.unwrap_or_default();
    let title = str_at(spec, &["info", "title"]).unwrap_or_default();
    let bin_name = options.bin_name.clone().unwrap_or_else(|| {
        let s = slug(if title.is_empty() { "cli" } else { &title });
        if s.is_empty() {
            "cli".to_string()
        } else {
            s
        }
    });
    let crate_name = options
        .crate_name
        .clone()
        .unwrap_or_else(|| to_crate_name(if title.is_empty() { &bin_name } else { &title }));
    let edition = options
        .edition
        .clone()
        .unwrap_or_else(|| "2021".to_string());
    let base_url = options.base_url.clone().unwrap_or_else(|| {
        spec.get("x-openapi")
            .and_then(|x| x.get("servers"))
            .and_then(|s| s.as_array())
            .and_then(|a| a.first())
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .to_string()
    });
    // The top-level generated module (`src/<moduleName>/**`) and the hand-owned
    // impl module (`src/<implModule>/mod.rs`). Defaults keep the historical
    // `gen`/`custom` layout byte-identical.
    let module_name = options
        .module_name
        .clone()
        .unwrap_or_else(|| "gen".to_string());
    let impl_module = options
        .impl_module
        .clone()
        .unwrap_or_else(|| "custom".to_string());

    let mut files: FileMap = Vec::new();

    let empty: Vec<Value> = Vec::new();
    let commands = spec
        .get("commands")
        .and_then(|c| c.as_array())
        .unwrap_or(&empty);
    let resources: Vec<ResourceFile> = commands
        .iter()
        .map(|c| render_resource_file(c, &module_name))
        .collect();
    // Aggregate the non-API runnable leaves; their presence gates the whole
    // `Actions` seam (main wiring, cli dispatch, runtime mod, actions.rs, scaffold).
    let action_paths: Vec<Vec<String>> = resources
        .iter()
        .flat_map(|r| r.action_paths.clone())
        .collect();
    let has_actions = !action_paths.is_empty();

    files.push((
        "Cargo.toml".into(),
        scaffold(cargo_toml(spec, &crate_name, &bin_name, &edition)),
    ));
    files.push((".gitignore".into(), scaffold("/target\n".to_string())));

    files.push((
        "src/main.rs".into(),
        owned(main_rs(has_actions, &module_name, &impl_module)),
    ));

    for r in &resources {
        files.push((r.path.clone(), owned(r.content.clone())));
    }
    files.push((
        format!("src/{module_name}/cmd/mod.rs"),
        owned(cmd_mod_rs(&resources)),
    ));
    files.push((
        format!("src/{module_name}/cli.rs"),
        owned(render_cli(spec, &bin_name, &resources, &action_paths)),
    ));
    files.push((format!("src/{module_name}/mod.rs"), owned(gen_mod_rs())));
    files.push((
        format!("src/{module_name}/runtime/mod.rs"),
        owned(runtime_mod_rs(has_actions)),
    ));
    files.push((
        format!("src/{module_name}/runtime/http.rs"),
        owned(http_rs()),
    ));
    files.push((
        format!("src/{module_name}/runtime/config.rs"),
        owned(config_rs(spec, &bin_name, &base_url)),
    ));
    files.push((
        format!("src/{module_name}/runtime/overrides.rs"),
        owned(overrides_rs()),
    ));
    files.push((
        format!("src/{module_name}/runtime/custom.rs"),
        owned(custom_registry_rs()),
    ));
    if has_actions {
        files.push((
            format!("src/{module_name}/runtime/actions.rs"),
            owned(actions_rs()),
        ));
        files.push((
            format!("src/{module_name}/runtime/commands.rs"),
            owned(commands_rs(&action_paths)),
        ));
    }

    files.push((
        format!("src/{impl_module}/mod.rs"),
        scaffold(custom_scaffold_rs(has_actions, &module_name, &action_paths)),
    ));

    files
}

fn cmd_mod_rs(resources: &[ResourceFile]) -> String {
    let mods = resources
        .iter()
        .map(|r| format!("pub mod {};", r.mod_name))
        .collect::<Vec<_>>()
        .join("\n");
    if mods.is_empty() {
        format!("{GENERATED_HEADER}\n")
    } else {
        format!("{GENERATED_HEADER}\n\n{mods}\n")
    }
}

/// Flatten to `path -> content` (drops writeMode) — for golden comparison.
pub fn flatten(map: &FileMap) -> std::collections::BTreeMap<String, String> {
    map.iter()
        .map(|(p, e)| (p.clone(), e.content.clone()))
        .collect()
}
