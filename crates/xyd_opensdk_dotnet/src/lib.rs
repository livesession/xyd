//! xyd_opensdk_dotnet — Rust port of the substantive IR→C# generated-code
//! emission from `@xyd-js/opensdk-dotnet` (System.Net.Http + System.Text.Json).
//!
//! SCOPE (byte-exact against the golden `output/` tree): the generated-per-file
//! code — `<Sdk>.csproj`, `Client.cs`, `Models.cs`, and one `<Resource>Service.cs`
//! per top-level resource. The vendored fixed runtime (`Transport.cs`,
//! `Pagination.cs`), the generated `<Sdk>.Tests/**` project, napi, and the JS
//! shim are DEFERRED — this crate is the pure emission core.

mod client;
mod cstype;
mod cswriter;
mod jsrt;
mod model;
mod plan;
mod service;

use std::collections::BTreeMap;

use serde_json::Value;

use client::{render_client_file, DotnetClientCtx};
use cswriter::{escape_xml, CSPROJ_HEADER};
use jsrt::pascal_case;
use model::render_models_file;
use service::{render_service_file, Behavior, DotnetServiceCtx};

struct ResolvedOptions {
    sdk: String,
    namespace: String,
    base_url: String,
    target_framework: String,
    env_var: Option<String>,
}

fn resolve_options(spec: &Value) -> ResolvedOptions {
    let title = spec
        .get("info")
        .and_then(|i| i.get("title"))
        .and_then(Value::as_str)
        .unwrap_or("");
    let sdk = {
        let p = pascal_case(title);
        if p.is_empty() {
            "Client".to_string()
        } else {
            p
        }
    };
    let namespace = format!("Example.{sdk}");
    let base_url = spec
        .get("servers")
        .and_then(Value::as_array)
        .and_then(|s| s.first())
        .and_then(Value::as_str)
        .unwrap_or("")
        .to_string();
    let env_var = spec
        .get("security")
        .and_then(Value::as_array)
        .and_then(|arr| {
            arr.iter()
                .find_map(|s| s.get("envVar").and_then(Value::as_str))
        })
        .map(str::to_string);
    ResolvedOptions {
        sdk,
        namespace,
        base_url,
        target_framework: "net8.0".to_string(),
        env_var,
    }
}

/// Resolve the idempotency policy `service.ts` reads (defaults: autoGenerateForPost=true, maxRetries=2).
fn resolve_behavior(spec: &Value) -> Behavior {
    let sdk = spec.get("sdk");
    let auto_generate_for_post = sdk
        .and_then(|s| s.get("idempotency"))
        .and_then(|i| i.get("autoGenerateForPost"))
        .and_then(Value::as_bool)
        .unwrap_or(true);
    let max_retries = sdk
        .and_then(|s| s.get("retry"))
        .and_then(|r| r.get("maxRetries"))
        .and_then(Value::as_i64)
        .unwrap_or(2);
    Behavior {
        auto_generate_for_post,
        max_retries,
    }
}

/// XML-escaped `.csproj` string with NuGet packaging metadata from `spec.info`.
fn csproj_file(sdk: &str, namespace_name: &str, target_framework: &str, spec: &Value) -> String {
    let info = spec.get("info").cloned().unwrap_or(Value::Null);
    let get_str = |path: &[&str]| -> Option<String> {
        let mut cur = &info;
        for p in path {
            cur = cur.get(*p)?;
        }
        cur.as_str().filter(|s| !s.is_empty()).map(str::to_string)
    };
    let version = get_str(&["version"]).unwrap_or_else(|| "0.0.0".to_string());
    let mut pkg: Vec<String> = vec![
        "    <IsPackable>true</IsPackable>".to_string(),
        format!("    <PackageId>{}</PackageId>", escape_xml(sdk)),
        format!("    <Version>{}</Version>", escape_xml(&version)),
    ];
    if let Some(name) = get_str(&["contact", "name"]) {
        pkg.push(format!("    <Authors>{}</Authors>", escape_xml(&name)));
    }
    if let Some(desc) = get_str(&["description"]) {
        pkg.push(format!(
            "    <Description>{}</Description>",
            escape_xml(&desc)
        ));
    }
    if let Some(lic) = get_str(&["license", "identifier"]) {
        pkg.push(format!(
            "    <PackageLicenseExpression>{}</PackageLicenseExpression>",
            escape_xml(&lic)
        ));
    }
    if let Some(repo) = get_str(&["repository"]) {
        pkg.push(format!(
            "    <RepositoryUrl>{}</RepositoryUrl>",
            escape_xml(&repo)
        ));
    }
    if let Some(home) = get_str(&["homepage"]) {
        pkg.push(format!(
            "    <PackageProjectUrl>{}</PackageProjectUrl>",
            escape_xml(&home)
        ));
    }
    format!(
        "{CSPROJ_HEADER}\n<Project Sdk=\"Microsoft.NET.Sdk\">\n\n  <PropertyGroup>\n    <TargetFramework>{target_framework}</TargetFramework>\n    <LangVersion>latest</LangVersion>\n    <Nullable>enable</Nullable>\n    <ImplicitUsings>disable</ImplicitUsings>\n    <RootNamespace>{namespace_name}</RootNamespace>\n    <AssemblyName>{sdk}</AssemblyName>\n    <GenerateDocumentationFile>false</GenerateDocumentationFile>\n{}\n  </PropertyGroup>\n\n</Project>\n",
        pkg.join("\n")
    )
}

/// Generate the substantive IR→C# files (`.csproj`, `Client.cs`, `Models.cs`,
/// `<Resource>Service.cs`). The vendored runtime + tests are out of scope.
pub fn generate_dotnet(spec: &Value) -> BTreeMap<String, String> {
    let opts = resolve_options(spec);

    // Symbol table for lookups (order-independent; iteration uses the array).
    let types_arr = spec
        .get("types")
        .and_then(Value::as_array)
        .cloned()
        .unwrap_or_default();
    let mut table: BTreeMap<String, Value> = BTreeMap::new();
    for t in &types_arr {
        if let Some(name) = t.get("name").and_then(Value::as_str) {
            table.insert(name.to_string(), t.clone());
        }
    }

    let mut files: BTreeMap<String, String> = BTreeMap::new();

    // generateProject → <Sdk>.csproj
    files.insert(
        format!("{}.csproj", opts.sdk),
        csproj_file(&opts.sdk, &opts.namespace, &opts.target_framework, spec),
    );

    // generateClient → Client.cs
    files.insert(
        "Client.cs".to_string(),
        render_client_file(
            spec,
            &DotnetClientCtx {
                sdk: &opts.sdk,
                namespace: &opts.namespace,
                base_url: &opts.base_url,
                env_var: opts.env_var.as_deref(),
            },
        ),
    );

    // generateTypes → Models.cs (always emitted, even for an empty symbol table)
    files.insert(
        "Models.cs".to_string(),
        render_models_file(&types_arr, &opts.namespace, &table),
    );

    // generateResources → one <Resource>Service.cs per top-level resource
    let resources = spec
        .get("resources")
        .and_then(Value::as_array)
        .cloned()
        .unwrap_or_default();
    let svc_ctx = DotnetServiceCtx {
        namespace: &opts.namespace,
        types: &table,
        behavior: resolve_behavior(spec),
    };
    for r in &resources {
        let (path, content) = render_service_file(r, &svc_ctx);
        files.insert(path, content);
    }

    files
}
