//! Java SDK emitter — OpenSDK IR → generated Java SDK code (Rust port of
//! `@xyd-js/opensdk-java`, S6+ W7). Emits the FULL generated file tree across
//! the framework capability order: generateProject (pom.xml), generateClient
//! (Client.java), generateTypes (POJOs/enums/mapped-union holders),
//! generateResources (per-resource services + `<Qualifier><Method>Params`
//! builders), generateRuntime (the vendored FIXED runtime — Json.java,
//! Transport.java, the status-mapped exception hierarchy, the
//! CursorPage/Page/OffsetPage containers) and generateTests (the SDK's own
//! dependency-free assertion suite).
//!
//! `.java` is not in the framework orchestrator's header-comment map, so
//! `javaFile` applies the ownership header itself; `pom.xml` (unknown ext) gets
//! none — matching the JS `generate()`.

mod cli;
mod client;
mod example;
mod example_plan;
mod ir;
mod javatype;
mod javawriter;
mod jsrt;
mod model;
mod plan;
mod project;
mod runtime;
mod service;
mod tests_gen;

use serde_json::Value;
use std::collections::BTreeMap;

use client::render_client_file;
use ir::build_types;
use model::render_type_files;
use project::{pom_xml, resolve_java_options};
use runtime::render_runtime_files;
use service::render_resource_files;
use tests_gen::generate_java_tests;

/// Emit the generated-code file map for a Java SDK from an OpenSDK IR document.
/// Returns `{ relativePath: contents }` for the covered capabilities only (the
/// vendored runtime + tests stay with the JS emitter).
///
/// Equivalent to [`generate_java_with`] with no emitter options.
pub fn generate_java(spec: &Value) -> BTreeMap<String, String> {
    generate_java_with(spec, &Value::Null)
}

/// [`generate_java`] honoring `emitterOptions` (`packageName`, `basePackage`,
/// `baseURL`, `tests`). Pass `Value::Null` for none.
pub fn generate_java_with(spec: &Value, options: &Value) -> BTreeMap<String, String> {
    if xyd_opensdk_cli_common::is_cli_spec(spec) {
        return cli::generate_cli(spec);
    }
    let types_map = build_types(spec);
    let ctx = resolve_java_options(spec, types_map, options);

    let mut files: BTreeMap<String, String> = BTreeMap::new();
    let mut put = |path: String, content: String| {
        files.insert(path, content);
    };

    // generateProject → pom.xml
    put("pom.xml".to_string(), pom_xml(&ctx, spec));

    // generateClient → Client.java
    put(
        format!("{}Client.java", ctx.src_dir),
        render_client_file(spec, &ctx),
    );

    // generateTypes → one file per named type
    let types: Vec<Value> = spec
        .get("types")
        .and_then(|t| t.as_array())
        .cloned()
        .unwrap_or_default();
    for f in render_type_files(&types, &ctx) {
        put(f.path, f.content);
    }

    // generateResources → services + params
    let resources: Vec<Value> = spec
        .get("resources")
        .and_then(|r| r.as_array())
        .cloned()
        .unwrap_or_default();
    for f in render_resource_files(&resources, &ctx) {
        put(f.path, f.content);
    }

    // generateRuntime → Json, exceptions, Transport, page containers
    for f in render_runtime_files(spec, &ctx) {
        put(f.path, f.content);
    }

    // generateTests → the SDK's own assertion suite (one per top-level resource)
    if xyd_opensdk_core::emitter::emit_tests(options) {
        for f in generate_java_tests(spec, &ctx) {
            put(f.path, f.content);
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
    xyd_opensdk_core::emitter::EmitterFns::new("java", generate_java);

/// The generated file map WITH per-file write semantics.
///
/// The regen-safety contract: `skipIfExists` protects a user-owned scaffold,
/// `mergeJson` deep-merges into the user's file. The flat [`generate_java`]
/// above stays the byte-exact source of content; this only pairs it with the
/// shared write-mode table.
pub fn generate_java_files(
    spec: &serde_json::Value,
    options: &serde_json::Value,
) -> std::collections::BTreeMap<String, xyd_opensdk_core::emitter::GeneratedFile> {
    xyd_opensdk_core::emitter::attach_write_modes("java", generate_java_with(spec, options))
}
