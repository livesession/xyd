//! GraphQL SDL → Uniform `Reference[]` — the Rust port of `packages/xyd-gql`
//! (S6+ W1, the migration pattern-prover). The 19 committed fixtures under
//! `packages/xyd-gql/__fixtures__` are the behavioral spec; `tests/parity.rs`
//! gates structural parity against them.

mod convert;
mod core;
mod model;
mod opendocs;
mod sample;

use std::cell::RefCell;
use std::collections::HashMap;
use std::rc::Rc;

use serde::Deserialize;
use xyd_uniform::Reference;

/// Port of `GQLSchemaToReferencesOptions` (deserializes the JS options object).
#[derive(Debug, Clone, Default, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct Options {
    pub regions: Option<Vec<String>>,
    pub flat: Option<bool>,
    pub sort: Option<SortConfig>,
    pub route: Option<String>,
}

#[derive(Debug, Clone, Default, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct SortConfig {
    pub sort_stack: Option<Vec<Vec<String>>>,
    pub sort: Option<Vec<SortItem>>,
}

#[derive(Debug, Clone, Default, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct SortItem {
    pub node: Option<String>,
    pub group: Option<Vec<String>>,
    pub stack: Option<usize>,
}

/// JS source resolution (minus URLs, which the shim fetches): an existing file
/// path is read from disk; anything else is treated as raw SDL.
pub fn resolve_source(location: &str) -> String {
    if std::path::Path::new(location).exists() {
        if let Ok(content) = std::fs::read_to_string(location) {
            return content;
        }
    }
    location.to_string()
}

fn default_sort_order() -> Vec<SortItem> {
    [
        "query",
        "mutation",
        "subscription",
        "object",
        "interface",
        "union",
        "input",
        "enum",
        "scalar",
    ]
    .into_iter()
    .map(|n| SortItem {
        node: Some(n.to_string()),
        ..Default::default()
    })
    .collect()
}

#[derive(Debug)]
pub struct GqlError(pub String);

impl std::fmt::Display for GqlError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.0)
    }
}
impl std::error::Error for GqlError {}

/// Port of `gqlSchemaToReferences`, over RAW SDL strings (the shim/napi layer
/// resolves file paths / URLs to strings — the crate does no IO).
///
/// (`options.route` only attaches a non-serializable `__UNSAFE_route` thunk on
/// the JS side — it never appears in the JSON output, so it has no Rust
/// counterpart beyond being accepted in `Options`.)
pub fn gql_schema_to_references(
    sdl_sources: &[String],
    options: Option<Options>,
) -> Result<Vec<Reference>, GqlError> {
    gql_schema_to_references_full(sdl_sources, options).map(|(refs, _)| refs)
}

/// Like [`gql_schema_to_references`] but also returns the EFFECTIVE route
/// (code option overridden by `@docs(route:)`) — the shim reattaches it as the
/// JS `__UNSAFE_route` thunk, which `JSON.stringify` can't carry.
pub fn gql_schema_to_references_full(
    sdl_sources: &[String],
    options: Option<Options>,
) -> Result<(Vec<Reference>, Option<String>), GqlError> {
    let docs: Vec<_> = sdl_sources
        .iter()
        .map(|s| {
            async_graphql_parser::parse_schema(s).map_err(|e| GqlError(format!("parse error: {e}")))
        })
        .collect::<Result<_, _>>()?;

    let model = model::build_model(&docs);

    // Defaults + `@docs` schema-extension overrides (directive wins).
    let mut options = options.unwrap_or_default();
    if options.flat.is_none() {
        options.flat = Some(true); // JS: hasOwnProperty('flat') default true
    }
    let directive_options = opendocs::extensions_to_options(&model);
    if directive_options.flat.is_some() {
        options.flat = directive_options.flat;
    }
    if directive_options.sort.is_some() {
        options.sort = directive_options.sort;
    }
    if directive_options.route.is_some() {
        options.route = directive_options.route;
    }

    let props_cache = Rc::new(RefCell::new(HashMap::new()));
    let base = core::Ctx {
        model: &model,
        options: &options,
        flat_return: false,
        flat: false,
        flat_arg: false,
        processed: Rc::new(RefCell::new(std::collections::HashSet::new())),
        props_cache,
    };

    let mut references = Vec::new();
    references.extend(convert::convert_types(&base));
    references.extend(convert::convert_operations(&base, "query"));
    references.extend(convert::convert_operations(&base, "mutation"));
    references.extend(convert::convert_operations(&base, "subscription"));

    // Stable sort by the (possibly @docs-configured) sort order.
    let sort_config = options.sort.clone().unwrap_or_default();
    let sort_items = sort_config.sort.clone().unwrap_or_else(default_sort_order);
    let sort_stacks = sort_config.sort_stack.clone().unwrap_or_default();
    references.sort_by_key(|r| sort_order(r, &sort_items, &sort_stacks));

    Ok((references, options.route.clone()))
}

fn reference_groups(r: &Reference) -> Vec<String> {
    r.context
        .as_ref()
        .and_then(|c| c.get("group"))
        .and_then(|g| g.as_array())
        .map(|a| {
            a.iter()
                .filter_map(|v| v.as_str().map(String::from))
                .collect()
        })
        .unwrap_or_default()
}

fn type_short(r: &Reference) -> String {
    r.context
        .as_ref()
        .and_then(|c| c.get("graphqlTypeShort"))
        .and_then(|v| v.as_str())
        .unwrap_or("")
        .to_string()
}

fn sort_order(r: &Reference, sort_items: &[SortItem], sort_stacks: &[Vec<String>]) -> i64 {
    for (group_index, item) in sort_items.iter().enumerate() {
        if !matches_primary_group(r, item) {
            continue;
        }
        let stack_index = item.stack.unwrap_or(0);
        let position = position_in_group(r, stack_index, sort_stacks);
        return (group_index as i64) * 1000 + position;
    }
    i64::MAX
}

fn matches_primary_group(r: &Reference, item: &SortItem) -> bool {
    if let Some(node) = &item.node {
        return &type_short(r) == node;
    }
    if let Some(groups) = &item.group {
        if !groups.is_empty() {
            let ref_groups = reference_groups(r);
            return groups.iter().any(|g| ref_groups.contains(g));
        }
    }
    true
}

fn position_in_group(r: &Reference, stack_index: usize, sort_stacks: &[Vec<String>]) -> i64 {
    let Some(stack) = sort_stacks.get(stack_index) else {
        return 0;
    };
    let ref_groups = reference_groups(r);
    for (i, sg) in stack.iter().enumerate() {
        if ref_groups.contains(sg) {
            return i as i64;
        }
    }
    999
}
