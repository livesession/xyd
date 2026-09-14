//! Pure Rust port of `@xyd-js/opensdk-python`: OpenSDK IR -> generated Python
//! SDK source, byte-exact with the JS emitter's golden `output/` trees.
//!
//! Scope (S6+ W7 tail): the FULL framework `generate(spec, pythonEmitter)` file
//! map — the generated-code files (`pyproject.toml`, `<pkg>/__init__.py`,
//! `<pkg>/_client.py`, `<pkg>/models.py`, `<pkg>/resources.py`), the vendored
//! runtime (`<pkg>/_transport.py`, and `<pkg>/_pagination.py` only when some
//! method paginates), and the SDK's own pytest suite (`tests/utils.py`,
//! `tests/conftest.py`, one `tests/test_<resource>.py` per top-level resource).
//!
//! Plus the two DOCS capabilities, which are NOT part of the file map:
//! [`generate_python_usage`] and [`generate_python_type_reference`] (see
//! `docs.rs`), gated by `tests/docs.rs` against the per-operation `docs.json`
//! oracle captured from the TypeScript emitter.

mod behavior;
mod cli;
mod docs;
mod example;
mod example_plan;
mod naming;
mod project;
mod pytype;
mod resources;
mod runtime;
mod tests;
mod type_plan;
mod val;

pub use crate::docs::{generate_python_type_reference, generate_python_usage};

use std::collections::BTreeMap;

use serde_json::Value;

use crate::behavior::error_class_names;
use crate::project::{client_py, models_py, pyproject, resolve_options};
use crate::resources::{plan_operation, py_page_name, resources_py};
use crate::runtime::{pagination_py, transport_py};
use crate::tests::{resource_test_py, test_conftest_py, test_utils_py};
use crate::val::{arr, pystr, str_field};

/// Prepend the `.py` comment header exactly once (orchestrator `withFileHeader`).
// The header text + per-extension comment table live in xyd_opensdk_core. The
// shared table is wider than this crate's old gate, but provably output-neutral:
// the only other extension in these goldens is one the table does not cover.
pub(crate) fn with_py_header(content: &str) -> String {
    // Path-free signature kept so all 16 call sites stay untouched; every one
    // of them is a .py file (pyproject.toml deliberately gets no header).
    xyd_opensdk_core::header::with_file_header("x.py", content.to_string())
}

/// Generate the in-scope Python SDK files from an OpenSDK IR document, keyed by
/// their project-relative path (the same keys the framework file map uses for
/// these capabilities). `pyproject.toml` gets no header (`.toml` has no
/// commentable syntax in the orchestrator's table); every `.py` file does.
///
/// Equivalent to [`generate_python_with`] with no emitter options.
pub fn generate_python(spec: &Value) -> BTreeMap<String, String> {
    generate_python_with(spec, &Value::Null)
}

/// [`generate_python`] honoring `emitterOptions` (`packageName`, `baseURL`,
/// `tests`). Pass `Value::Null` for none.
pub fn generate_python_with(spec: &Value, options: &Value) -> BTreeMap<String, String> {
    if xyd_opensdk_cli_common::is_cli_spec(spec) {
        return cli::generate_cli(spec);
    }
    let opts = resolve_options(spec, options);
    let pkg = &opts.pkg;
    let mut files: BTreeMap<String, String> = BTreeMap::new();

    // generateProject -> pyproject.toml (skipIfExists; no ownership header).
    files.insert("pyproject.toml".to_string(), pyproject(pkg, spec));

    // generateClient -> <pkg>/__init__.py + <pkg>/_client.py.
    // The public error surface: APIError plus the sdk.errors policy kinds.
    let mut errors: Vec<String> = vec!["APIError".to_string()];
    errors.extend(error_class_names(spec));
    let mut all_names: Vec<String> = vec!["Client".to_string()];
    all_names.extend(errors.iter().cloned());
    all_names.sort();
    let all_joined = all_names
        .iter()
        .map(|n| pystr(n))
        .collect::<Vec<_>>()
        .join(", ");
    let init = format!(
        "from ._client import Client\nfrom ._transport import {}\n\n__all__ = [{}]\n",
        errors.join(", "),
        all_joined
    );
    files.insert(format!("{pkg}/__init__.py"), with_py_header(&init));
    files.insert(
        format!("{pkg}/_client.py"),
        with_py_header(&client_py(spec, &opts.env_var)),
    );

    // generateTypes -> <pkg>/models.py (always emitted; resources star-imports it).
    files.insert(format!("{pkg}/models.py"), with_py_header(&models_py(spec)));

    // generateResources -> <pkg>/resources.py.
    files.insert(
        format!("{pkg}/resources.py"),
        with_py_header(&resources_py(spec)),
    );

    // generateRuntime -> <pkg>/_transport.py (+ <pkg>/_pagination.py only when
    // some method returns a page — no dead runtime for a spec with no lists).
    files.insert(
        format!("{pkg}/_transport.py"),
        with_py_header(&transport_py(spec, pkg, &opts.base_url)),
    );
    if any_paginated(spec) {
        files.insert(
            format!("{pkg}/_pagination.py"),
            with_py_header(&pagination_py()),
        );
    }

    // generateTests -> tests/utils.py + tests/conftest.py + one
    // tests/test_<resource>.py per top-level resource (skipped when there are no
    // resources, matching the JS emitter). Opt out with
    // `emitterOptions.tests === false`.
    if xyd_opensdk_core::emitter::emit_tests(options) {
        let resources = arr(spec, "resources");
        if !resources.is_empty() {
            let types: std::collections::HashMap<&str, &Value> = arr(spec, "types")
                .iter()
                .filter_map(|t| str_field(t, "name").map(|n| (n, t)))
                .collect();
            files.insert(
                "tests/utils.py".to_string(),
                with_py_header(&test_utils_py()),
            );
            files.insert(
                "tests/conftest.py".to_string(),
                with_py_header(&test_conftest_py(pkg)),
            );
            for r in resources {
                let name = str_field(r, "name").unwrap_or("");
                files.insert(
                    format!("tests/test_{}.py", crate::naming::snake_case(name)),
                    with_py_header(&resource_test_py(r, pkg, &types)),
                );
            }
        }
    }

    files
}

/// Whether any method in the spec returns a Python page container (drives the
/// `_pagination.py` gate; mirrors runtime.ts's `walkMethods(...).some(...)`).
fn any_paginated(spec: &Value) -> bool {
    fn walk(resources: &[Value]) -> bool {
        resources.iter().any(|r| {
            arr(r, "methods")
                .iter()
                .any(|m| py_page_name(&plan_operation(m)).is_some())
                || walk(arr(r, "resources"))
        })
    }
    walk(arr(spec, "resources"))
}

/// The single `resources.py` file (with the `.py` ownership header), as the
/// framework's `generateResources` capability emits it. Exposed so the
/// per-method complex-corpus goldens (`<op>/output.py`, which are exactly this
/// file for a one-method IR slice) can be verified against real emitter output.
pub fn generate_resources_py(spec: &Value) -> String {
    with_py_header(&resources_py(spec))
}

/// This crate as plain data, for a Rust-side dispatcher and the A2 docs surface.
///
/// Additive only: no call site today, and the two docs slots are `None` until A2
/// implements them. See `xyd_opensdk_core::emitter` for why this is a data
/// descriptor rather than a trait.
pub const EMITTER: xyd_opensdk_core::emitter::EmitterFns =
    xyd_opensdk_core::emitter::EmitterFns::new("python", generate_python);

/// The generated file map WITH per-file write semantics.
///
/// The regen-safety contract: `skipIfExists` protects a user-owned scaffold,
/// `mergeJson` deep-merges into the user's file. The flat [`generate_python`]
/// above stays the byte-exact source of content; this only pairs it with the
/// shared write-mode table.
pub fn generate_python_files(
    spec: &serde_json::Value,
    options: &serde_json::Value,
) -> std::collections::BTreeMap<String, xyd_opensdk_core::emitter::GeneratedFile> {
    xyd_opensdk_core::emitter::attach_write_modes("python", generate_python_with(spec, options))
}
