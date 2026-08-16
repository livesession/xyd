//! Cargo.toml + src/lib.rs — port of project.ts.

use serde_json::Value;

use crate::naming::snake_case;
use crate::rswriter::rs_string;

pub fn render_cargo_toml(spec: &Value, crate_name: &str, edition: &str) -> String {
    let info = spec.get("info");
    let title = info
        .and_then(|i| i.get("title"))
        .and_then(|t| t.as_str())
        .unwrap_or("");
    let summary = format!("Rust client for the {title} API");
    let description = info
        .and_then(|i| i.get("description"))
        .and_then(|d| d.as_str())
        .map(|d| d.trim())
        .filter(|d| !d.is_empty())
        .map(|d| d.to_string())
        .unwrap_or_else(|| summary.clone());
    let license = info
        .and_then(|i| i.get("license"))
        .and_then(|l| l.get("identifier"))
        .and_then(|x| x.as_str())
        .filter(|s| !s.is_empty())
        .unwrap_or("MIT");
    let version = info
        .and_then(|i| i.get("version"))
        .and_then(|v| v.as_str())
        .filter(|s| !s.is_empty())
        .unwrap_or("0.0.0");

    let mut pkg = vec![
        "[package]".to_string(),
        format!("name = {}", rs_string(crate_name)),
        format!("version = {}", rs_string(version)),
        format!("edition = {}", rs_string(edition)),
        format!("description = {}", rs_string(description.as_str())),
        format!("license = {}", rs_string(license)),
    ];
    if let Some(hp) = info
        .and_then(|i| i.get("homepage"))
        .and_then(|v| v.as_str())
    {
        // JS `if (info.homepage)` — truthiness (non-empty string).
        if !hp.is_empty() {
            pkg.push(format!("homepage = {}", rs_string(hp)));
        }
    }
    if let Some(rp) = info
        .and_then(|i| i.get("repository"))
        .and_then(|v| v.as_str())
    {
        if !rp.is_empty() {
            pkg.push(format!("repository = {}", rs_string(rp)));
        }
    }

    format!(
        "{}\n\n# Field docs are OpenAPI descriptions (arbitrary markdown), not Rust doctests.\n[lib]\ndoctest = false\n\n[dependencies]\nreqwest = {{ version = \"0.12\", default-features = false, features = [\"json\", \"multipart\", \"rustls-tls\"] }}\ntokio = {{ version = \"1\", features = [\"time\"] }}\nserde = {{ version = \"1\", features = [\"derive\"] }}\nserde_json = \"1\"\nthiserror = \"1\"\nuuid = {{ version = \"1\", features = [\"v4\"] }}\n\n[dev-dependencies]\ntokio = {{ version = \"1\", features = [\"macros\", \"rt-multi-thread\"] }}\n",
        pkg.join("\n")
    )
}

pub fn render_lib_rs(spec: &Value) -> String {
    let resource_mods: Vec<String> = spec
        .get("resources")
        .and_then(|r| r.as_array())
        .map(|arr| {
            arr.iter()
                .map(|r| snake_case(r.get("name").and_then(|n| n.as_str()).unwrap_or("")))
                .collect()
        })
        .unwrap_or_default();

    let mut mod_names = vec![
        "error".to_string(),
        "transport".to_string(),
        "models".to_string(),
        "client".to_string(),
    ];
    mod_names.extend(resource_mods.iter().cloned());
    let mods: Vec<String> = mod_names.iter().map(|m| format!("pub mod {m};")).collect();

    let mut reexports = vec![
        "pub use client::{Client, ClientBuilder};".to_string(),
        "pub use error::{Error, ErrorKind};".to_string(),
        "pub use models::*;".to_string(),
        "pub use transport::Page;".to_string(),
    ];
    reexports.extend(resource_mods.iter().map(|m| format!("pub use {m}::*;")));

    format!(
        "#![allow(dead_code, unused_imports, unused_variables, unused_mut, clippy::all)]\n\n{}\n\n{}\n",
        mods.join("\n"),
        reexports.join("\n")
    )
}
