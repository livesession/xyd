//! `xyd_opensdk_node` — pure Rust port of the `@xyd-js/opensdk-node` emitter
//! (OpenSDK IR → an openai-node-shaped TypeScript SDK). W7 of the S6+ Rust
//! migration.
//!
//! Scope: the full buildable-SDK file tree — `package.json` / `tsconfig.json` /
//! `README.md`, `src/index.ts`, `src/client.ts`, `src/models.ts`,
//! `src/resources/index.ts`, `src/resources/<resource>.ts`, the vendored
//! dependency-free `src/core/**` runtime (error/resource/request + optional
//! pagination), and the generated `tests/**` suite (`tsconfig.test.json`,
//! `_shims.d.ts`, `setup.ts`, one `<resource>.test.ts` per top-level resource).
//! Deferred (not ported here): the optional busybox helpers, `publish.ts`, and
//! the napi surface + JS shim.
//!
//! Entry point: [`generate_node`] — pure, IR JSON in, virtual file map out.

use std::collections::BTreeMap;

mod behavior;
mod busybox;
mod cli;
mod client;
mod docs;
mod example;
mod example_plan;
mod ir;
mod jsrt;
mod model;
mod plan;
mod project;
mod resource;
mod runtime;
mod tests_gen;
mod type_plan;

use ir::{Resource, Spec};
use resource::NodeCtx;

pub use docs::{generate_node_type_reference, generate_node_usage};

/// Generate the buildable Node SDK's generated-code files from an OpenSDK IR
/// document. Returns a virtual file map `{ relativePath: contents }` (the
/// framework orchestrator's contract, minus the deferred runtime/test files).
pub fn generate_node(spec_json: &serde_json::Value) -> BTreeMap<String, String> {
    generate_node_with(spec_json, &serde_json::Value::Null)
}

/// [`generate_node`] honoring `emitterOptions` (`packageName`, `exportDefault`,
/// `exportPackage`, `baseURL`, `envVar`, `tests`, `busybox`). Pass `Value::Null`
/// for none.
pub fn generate_node_with(
    spec_json: &serde_json::Value,
    options: &serde_json::Value,
) -> BTreeMap<String, String> {
    let spec: Spec = serde_json::from_value(spec_json.clone())
        .expect("OpenSDK IR did not match the expected shape");
    if xyd_opensdk_cli_common::is_cli_spec(spec_json) {
        return cli::generate_cli(&spec, spec_json);
    }
    generate_from_spec(&spec, spec_json, options)
}

/// Whether some method returns a vendored page container (gates `pagination.ts`).
fn uses_pagination(resources: &[Resource], types: &[&ir::NamedType]) -> bool {
    resources.iter().any(|r| {
        r.methods
            .iter()
            .any(|m| plan::plan_operation(m, types).page_name.is_some())
            || uses_pagination(&r.resources, types)
    })
}

fn generate_from_spec(
    spec: &Spec,
    spec_json: &serde_json::Value,
    options: &serde_json::Value,
) -> BTreeMap<String, String> {
    let opts = project::resolve_node_options(spec, options);
    let error_classes = behavior::error_class_names(spec);
    let types: Vec<&ir::NamedType> = spec.types.iter().collect();
    let auto_generate_for_post = spec
        .sdk
        .as_ref()
        .and_then(|s| s.idempotency.as_ref())
        .and_then(|i| i.auto_generate_for_post)
        .unwrap_or(true);
    let ctx = NodeCtx {
        types,
        auto_generate_for_post,
    };

    let mut files: BTreeMap<String, String> = BTreeMap::new();
    let mut add = |path: &str, content: String| {
        let content = with_file_header(path, content);
        if files.insert(path.to_string(), content).is_some() {
            panic!("emitter \"node\": re-emitted {path}");
        }
    };

    // generateProject (no ownership header on .json / .md)
    add("package.json", project::package_json(&opts.pkg, spec));
    add("tsconfig.json", project::tsconfig_json());
    add(
        "README.md",
        project::readme(&opts.pkg, spec, &opts.client_name, opts.default_export),
    );

    // generateClient
    add(
        "src/index.ts",
        client::render_root_index_file(
            spec,
            &error_classes,
            &opts.client_name,
            opts.default_export,
            opts.busybox.as_ref(),
        ),
    );
    add(
        "src/client.ts",
        client::render_client_file(
            spec,
            &opts.env_var,
            &opts.client_name,
            opts.busybox.as_ref(),
        ),
    );

    // The error-helper "busybox" — ONE shared definition, exposed per the
    // configured style (statics on the client / flat exports / a namespace).
    // Absent unless `emitterOptions.busybox` is set, so goldens are untouched.
    if opts.busybox.is_some() {
        add("src/busybox.ts", crate::busybox::render_busybox_file());
    }

    // generateTypes
    add("src/models.ts", model::render_models_file(spec));

    // generateResources
    if !spec.resources.is_empty() {
        for r in &spec.resources {
            let (path, content) = resource::render_resource_file(r, &ctx);
            add(&path, content);
        }
        add(
            "src/resources/index.ts",
            resource::render_resources_index_file(&spec.resources),
        );
    }

    // generateRuntime — the vendored dependency-free fetch runtime. pagination.ts
    // is included only when some list method returns a vendored page container.
    let with_pagination = uses_pagination(&spec.resources, &ctx.types);
    for (path, content) in
        runtime::runtime_files(spec_json, &opts.base_url, &opts.pkg, with_pagination)
    {
        add(&path, content);
    }

    // generateTests — the SDK's own openai-node-shaped suite (default ON).
    // Opt out with `emitterOptions.tests === false`.
    if xyd_opensdk_core::emitter::emit_tests(options) {
        for (path, content) in tests_gen::test_files(
            &spec.resources,
            &ctx,
            &opts.client_name,
            opts.default_export,
        ) {
            add(&path, content);
        }
    }

    files
}

/// Prepend the rendered ownership header + one blank line for `.ts` files
/// (other extensions have no idiomatic comment here → untouched).
// The header text + per-extension comment table live in xyd_opensdk_core. The
// shared table is wider than this crate's old gate, but provably output-neutral:
// the only other extension in these goldens is one the table does not cover.
pub(crate) fn with_file_header(rel_path: &str, content: String) -> String {
    xyd_opensdk_core::header::with_file_header(rel_path, content)
}

/// This crate as plain data, for a Rust-side dispatcher and the A2 docs surface.
///
/// Additive only: no call site today, and the two docs slots are `None` until A2
/// implements them. See `xyd_opensdk_core::emitter` for why this is a data
/// descriptor rather than a trait.
pub const EMITTER: xyd_opensdk_core::emitter::EmitterFns =
    xyd_opensdk_core::emitter::EmitterFns::new("node", generate_node);

/// The generated file map WITH per-file write semantics.
///
/// The regen-safety contract: `skipIfExists` protects a user-owned scaffold,
/// `mergeJson` deep-merges into the user's file. The flat [`generate_node`]
/// above stays the byte-exact source of content; this only pairs it with the
/// shared write-mode table.
pub fn generate_node_files(
    spec: &serde_json::Value,
    options: &serde_json::Value,
) -> std::collections::BTreeMap<String, xyd_opensdk_core::emitter::GeneratedFile> {
    xyd_opensdk_core::emitter::attach_write_modes("node", generate_node_with(spec, options))
}
