//! Port of `tests-py.ts` `generateTests`: the generated SDK's own pytest suite —
//! `tests/utils.py` (verbatim), `tests/conftest.py` (a `__XYD_PKG__` seam), and
//! one `tests/test_<resource>.py` per top-level resource. Each method is called
//! with shared-planner example values (a required-only case, a "with all params"
//! case when it has optionals) and structurally checked via `assert_matches_type`;
//! a required string path param gets an empty-arg guard test. SYNC only.

use std::collections::HashMap;

use serde_json::Value;

use crate::example::render_py_example;
use crate::example_plan::{plan_method_example, MethodExample};
use crate::naming::{pascal_case, snake_case};
use crate::pytype::{py_type, PyUses};
use crate::resources::{plan_operation, py_page_name};
use crate::val::{arr, bool_field, str_field};

type TypeMap<'a> = HashMap<&'a str, &'a Value>;

/// `tests/utils.py` — the stdlib-only structural type check (fully verbatim).
const TEST_UTILS: &str = include_str!("test_utils.py.txt");
/// `tests/conftest.py` — the shared client fixture (one `__XYD_PKG__` seam).
const TEST_CONFTEST: &str = include_str!("test_conftest.py.txt");

/// `tests/utils.py`.
pub fn test_utils_py() -> String {
    TEST_UTILS.to_string()
}

/// `tests/conftest.py` — the shared `client` fixture against the mock base URL.
pub fn test_conftest_py(pkg: &str) -> String {
    TEST_CONFTEST.replace("__XYD_PKG__", pkg)
}

/// One collected method: its client accessor chain + a test-name prefix.
struct Flat<'a> {
    method: &'a Value,
    /// Attribute chain from `client`, e.g. ["videos", "characters"].
    chain: Vec<String>,
    /// Test-name qualifier for nested resources (empty for a top-level method).
    name_prefix: String,
}

/// Walk the resource subtree, flattening every method with its client chain.
fn collect_methods<'a>(
    resource: &'a Value,
    chain: &[String],
    prefix: &str,
    out: &mut Vec<Flat<'a>>,
) {
    for method in arr(resource, "methods") {
        out.push(Flat {
            method,
            chain: chain.to_vec(),
            name_prefix: prefix.to_string(),
        });
    }
    for sub in arr(resource, "resources") {
        let attr = snake_case(str_field(sub, "name").unwrap_or(""));
        let mut nested = chain.to_vec();
        nested.push(attr.clone());
        collect_methods(sub, &nested, &format!("{prefix}{attr}_"), out);
    }
}

/// The index (in path order) of the first required string path param, or None.
fn first_string_path_param(method: &Value) -> Option<usize> {
    arr(method, "pathParams").iter().position(|p| {
        let is_string = p
            .get("type")
            .map(|t| {
                str_field(t, "kind") == Some("scalar") && str_field(t, "scalar") == Some("string")
            })
            .unwrap_or(false);
        is_string && bool_field(p, "required") != Some(false)
    })
}

/// The type expression asserted against a call result: `bytes` for a binary
/// download, `<Page>[<Item>]` for a paginated list, the primary response type
/// otherwise, or None when the method has no response (no assertion emitted).
fn response_type_expr(
    method: &Value,
    uses: &mut PyUses,
    page_cursor: &mut bool,
    page_page: &mut bool,
) -> Option<String> {
    let plan = plan_operation(method);
    if plan.binary_content_type.is_some() {
        return Some("bytes".to_string());
    }
    if let Some(page) = py_page_name(&plan) {
        match page {
            "CursorPage" => *page_cursor = true,
            "Page" => *page_page = true,
            _ => {}
        }
        let item = py_type(
            method.get("pagination").and_then(|p| p.get("itemType")),
            uses,
        );
        return Some(format!("{page}[{item}]"));
    }
    match method.get("primaryResponse") {
        Some(p) if !p.is_null() => Some(py_type(Some(p), uses)),
        _ => None,
    }
}

/// Positional path args followed by `name=value` keyword args for one example.
fn render_call_args(ex: &MethodExample) -> String {
    let mut parts: Vec<String> = ex
        .path_args
        .iter()
        .map(|pa| render_py_example(&pa.value))
        .collect();
    for f in &ex.fields {
        parts.push(format!(
            "{}={}",
            snake_case(&f.name),
            render_py_example(&f.value)
        ));
    }
    parts.join(", ")
}

/// A `def test_...(self, client): result = call; assert_matches_type(...)` block.
fn render_method_test(name: &str, call: &str, response_type: Option<&str>) -> String {
    let mut lines = vec![format!("    def {name}(self, client: Client) -> None:")];
    match response_type {
        Some(rt) => {
            lines.push(format!("        result = {call}"));
            lines.push(format!(
                "        assert_matches_type({rt}, result, path=[\"response\"])"
            ));
        }
        None => lines.push(format!("        {call}")),
    }
    lines.join("\n")
}

/// The empty-path-param guard test: an empty target raises ValueError.
fn render_path_params_test(
    name: &str,
    call_chain: &str,
    ex: &MethodExample,
    target_idx: usize,
) -> String {
    let n = snake_case(&ex.path_args[target_idx].name);
    let mut parts: Vec<String> = Vec::new();
    for (i, pa) in ex.path_args.iter().enumerate() {
        parts.push(if i == target_idx {
            "\"\"".to_string()
        } else {
            render_py_example(&pa.value)
        });
    }
    for f in &ex.fields {
        parts.push(format!(
            "{}={}",
            snake_case(&f.name),
            render_py_example(&f.value)
        ));
    }
    [
        format!("    def {name}(self, client: Client) -> None:"),
        format!(
            "        with pytest.raises(ValueError, match=r\"Expected a non-empty value for `{n}` but received ''\"):"
        ),
        format!("            {call_chain}({})", parts.join(", ")),
    ]
    .join("\n")
}

/// `tests/test_<resource>.py` for one top-level resource (walks its whole subtree).
pub fn resource_test_py(resource: &Value, pkg: &str, types: &TypeMap) -> String {
    let mut uses = PyUses::new();
    let mut page_cursor = false;
    let mut page_page = false;
    let mut uses_pytest = false;

    let root_attr = snake_case(str_field(resource, "name").unwrap_or(""));
    let mut collected: Vec<Flat> = Vec::new();
    collect_methods(resource, &[root_attr], "", &mut collected);

    let mut blocks: Vec<String> = Vec::new();
    for f in &collected {
        let action = snake_case(str_field(f.method, "action").unwrap_or(""));
        let base = format!("{}{action}", f.name_prefix);
        let mut chain = f.chain.clone();
        chain.push(action.clone());
        let call_chain = format!("client.{}", chain.join("."));
        let response_type =
            response_type_expr(f.method, &mut uses, &mut page_cursor, &mut page_page);

        let required = plan_method_example(f.method, types, false);
        blocks.push(render_method_test(
            &format!("test_method_{base}"),
            &format!("{call_chain}({})", render_call_args(&required)),
            response_type.as_deref(),
        ));

        if required.has_optional {
            let all = plan_method_example(f.method, types, true);
            blocks.push(render_method_test(
                &format!("test_method_{base}_with_all_params"),
                &format!("{call_chain}({})", render_call_args(&all)),
                response_type.as_deref(),
            ));
        }

        if let Some(target_idx) = first_string_path_param(f.method) {
            uses_pytest = true;
            blocks.push(render_path_params_test(
                &format!("test_path_params_{base}"),
                &call_chain,
                &required,
                target_idx,
            ));
        }
    }

    let mut groups: Vec<Vec<String>> = vec![vec!["from __future__ import annotations".to_string()]];
    if let Some(tl) = uses.typing_import() {
        groups.push(vec![tl]);
    }
    if uses_pytest {
        groups.push(vec!["import pytest".to_string()]);
    }
    let mut local = vec![
        "from tests.utils import assert_matches_type".to_string(),
        format!("from {pkg} import Client"),
        format!("from {pkg}.models import *  # noqa: F401,F403"),
    ];
    if page_cursor || page_page {
        let mut names: Vec<&str> = Vec::new();
        if page_cursor {
            names.push("CursorPage");
        }
        if page_page {
            names.push("Page");
        }
        local.push(format!(
            "from {pkg}._pagination import {}",
            names.join(", ")
        ));
    }
    groups.push(local);

    let imports = groups
        .iter()
        .map(|g| g.join("\n"))
        .collect::<Vec<_>>()
        .join("\n\n");
    let body = if blocks.is_empty() {
        "    pass".to_string()
    } else {
        blocks.join("\n\n")
    };
    format!(
        "{imports}\n\n\nclass Test{}:\n{body}\n",
        pascal_case(str_field(resource, "name").unwrap_or(""))
    )
}
