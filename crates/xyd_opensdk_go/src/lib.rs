//! Go SDK emitter — OpenSDK IR → buildable Go SDK (Rust port of
//! @xyd-js/opensdk-go). Operates on serde_json::Value for the IR.
//!
//! COVERAGE: the FULL generated file tree — the framework driver (ownership
//! header + capability order) + go.mod + client.go + types.go + <resource>.go
//! (generated code), the vendored fixed runtime (option/, internal/requestconfig/,
//! packages/{apijson,param}, and the on-demand apiform/pagination packages), and
//! the SDK's OWN test suite (internal/testutil + <resource>_test.go) — all
//! byte-identical to the JS emitter's goldens. `generate_go` returns the complete
//! path→content map.

mod cli;
mod client;
mod example_go;
mod example_plan;
mod gotype;
mod gowriter;
mod model;
mod naming;
mod plan;
mod runtime;
mod service;

use serde_json::{Map, Value};

use client::{render_client_file, GoCtx};
use model::render_types_file;
use naming::go_package_name;
use service::render_service_file;

struct Options {
    pkg: String,
    module_path: String,
    go_version: String,
    base_url: String,
}

/// `emitterOptions` over the spec-derived defaults (mirrors `emitter.ts`'s
/// `resolveOptions`). `options` is the TS options bag as JSON; `Value::Null`
/// means none were supplied, and every field falls back to what it derived
/// before options existed — so the no-options path is byte-identical.
fn resolve_options(spec: &Value, options: &Value) -> Options {
    use xyd_opensdk_core::emitter::opt_str;

    let title = spec
        .get("info")
        .and_then(|i| i.get("title"))
        .and_then(|t| t.as_str())
        .unwrap_or("");
    let pkg = opt_str(options, "packageName")
        .map(str::to_string)
        .unwrap_or_else(|| go_package_name(title));
    let module_path = opt_str(options, "modulePath")
        .map(str::to_string)
        .unwrap_or_else(|| format!("github.com/example/{pkg}"));
    let base_url = opt_str(options, "baseURL")
        .map(str::to_string)
        .unwrap_or_else(|| {
            spec.get("servers")
                .and_then(|s| s.as_array())
                .and_then(|a| a.first())
                .and_then(|s| s.as_str())
                .unwrap_or("")
                .to_string()
        });
    Options {
        pkg,
        module_path,
        go_version: opt_str(options, "goVersion").unwrap_or("1.22").to_string(),
        base_url,
    }
}

/// Prepend the .go ownership header (only for .go files), once.
// The header text + per-extension comment table live in xyd_opensdk_core. The
// shared table is wider than this crate's old gate, but provably output-neutral:
// the only other extension in these goldens is one the table does not cover.
pub(crate) fn with_header(rel: &str, content: String) -> String {
    xyd_opensdk_core::header::with_file_header(rel, content)
}

/// Emit the full generated Go SDK file map (go.mod, client.go, types.go,
/// per-resource service files, the vendored runtime, and the SDK's own test
/// suite). Returns a sorted path→content map.
///
/// Equivalent to [`generate_go_with`] with no emitter options.
pub fn generate_go(spec: &Value) -> std::collections::BTreeMap<String, String> {
    generate_go_with(spec, &Value::Null)
}

/// [`generate_go`] honoring `emitterOptions` (`modulePath`, `packageName`,
/// `goVersion`, `baseURL`, `tests`). Pass `Value::Null` for none.
pub fn generate_go_with(
    spec: &Value,
    options: &Value,
) -> std::collections::BTreeMap<String, String> {
    if xyd_opensdk_cli_common::is_cli_spec(spec) {
        return cli::generate_cli(spec);
    }
    let opts = resolve_options(spec, options);
    let types = spec.get("types").and_then(|t| t.as_array());
    let mut type_map: Map<String, Value> = Map::new();
    if let Some(types) = types {
        for t in types {
            if let Some(name) = t.get("name").and_then(|n| n.as_str()) {
                type_map.insert(name.to_string(), t.clone());
            }
        }
    }

    let sdk_behavior = xyd_opensdk_core::behavior::resolve_behavior(spec);
    let ctx = GoCtx {
        module_path: opts.module_path.clone(),
        pkg: opts.pkg.clone(),
        types: &type_map,
        behavior: sdk_behavior.clone(),
    };

    let mut files: std::collections::BTreeMap<String, String> = Default::default();

    // generateProject
    files.insert(
        "go.mod".to_string(),
        with_header(
            "go.mod",
            format!("module {}\n\ngo {}\n", opts.module_path, opts.go_version),
        ),
    );
    // generateClient
    files.insert(
        "client.go".to_string(),
        with_header("client.go", render_client_file(spec, &ctx)),
    );
    // generateTypes
    if types.map(|t| !t.is_empty()).unwrap_or(false) {
        files.insert(
            "types.go".to_string(),
            with_header("types.go", render_types_file(spec, &opts.pkg)),
        );
    }
    // generateResources
    if let Some(resources) = spec.get("resources").and_then(|r| r.as_array()) {
        for r in resources {
            let (path, content) = render_service_file(r, &ctx);
            files.insert(path.clone(), with_header(&path, content));
        }
    }
    // generateRuntime — the vendored net/http client + requestconfig + apijson +
    // param, plus the on-demand apiform/pagination packages.
    for (path, content) in runtime::runtime_files(
        spec,
        &opts.module_path,
        &opts.base_url,
        &opts.pkg,
        &type_map,
        &sdk_behavior,
    ) {
        let c = with_header(&path, content);
        files.insert(path, c);
    }
    // generateTests — the SDK's own openai-go-shaped test suite (skipped when
    // there are no resources with methods, matching the JS emitter). Opt out
    // with `emitterOptions.tests === false`.
    if xyd_opensdk_core::emitter::emit_tests(options) {
        for (path, content) in
            example_go::generate_go_tests(spec, &type_map, &opts.module_path, &opts.pkg)
        {
            let c = with_header(&path, content);
            files.insert(path, c);
        }
    }

    files
}

/// This crate as plain data, for a Rust-side dispatcher and the A2 docs surface.
///
/// Additive only: no call site today, and the two docs slots are `None` until A2
/// implements them. See `xyd_opensdk_core::emitter` for why this is a data
/// descriptor rather than a trait.
pub const EMITTER: xyd_opensdk_core::emitter::EmitterFns =
    xyd_opensdk_core::emitter::EmitterFns::new("go", generate_go);

/// The generated file map WITH per-file write semantics.
///
/// The regen-safety contract: `skipIfExists` protects a user-owned scaffold,
/// `mergeJson` deep-merges into the user's file. The flat [`generate_go`]
/// above stays the byte-exact source of content; this only pairs it with the
/// shared write-mode table.
pub fn generate_go_files(
    spec: &serde_json::Value,
    options: &serde_json::Value,
) -> std::collections::BTreeMap<String, xyd_opensdk_core::emitter::GeneratedFile> {
    xyd_opensdk_core::emitter::attach_write_modes("go", generate_go_with(spec, options))
}
