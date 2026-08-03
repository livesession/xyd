//! OpenDocs `@docs`/`@doc` directive semantics — port of `src/opendocs.ts`.

use crate::model::{
    directive_bool, directive_scope_values, directive_string, directive_string_list, FieldDef,
    Kind, SchemaModel, ScopeRef, TypeDef,
};
use crate::{Options, SortItem};
use async_graphql_value::ConstValue;

/// The node kinds `uniformify` distinguishes (port of the JS instanceof chain).
#[derive(Debug, Clone)]
pub enum Node<'a> {
    Type(&'a TypeDef),
    Operation { op: &'a str, field: &'a FieldDef },
    Field(&'a FieldDef),
}

/// `openDocsExtensionsToOptions`: read `extend schema @docs(...)`.
pub fn extensions_to_options(model: &SchemaModel) -> Options {
    let mut options = Options::default();
    for d in &model.schema_extension_directives {
        if d.name.node != "docs" {
            continue;
        }
        if let Some(flat) = directive_bool(d, "flattenTypes") {
            options.flat = Some(flat);
        }
        if let Some(v) = d.get_argument("sort") {
            if let ConstValue::List(items) = &v.node {
                let mut sort_items = Vec::new();
                for item in items {
                    let ConstValue::Object(fields) = item else {
                        continue;
                    };
                    let mut si = SortItem::default();
                    for (k, fv) in fields {
                        match (k.as_str(), fv) {
                            ("node", ConstValue::String(s)) => si.node = Some(s.clone()),
                            ("group", ConstValue::List(gs)) => {
                                si.group = Some(
                                    gs.iter()
                                        .filter_map(|g| match g {
                                            ConstValue::String(s) => Some(s.clone()),
                                            _ => None,
                                        })
                                        .collect(),
                                )
                            }
                            ("stack", ConstValue::Number(n)) => {
                                si.stack = n.as_i64().map(|i| i as usize)
                            }
                            _ => {}
                        }
                    }
                    sort_items.push(si);
                }
                options.sort.get_or_insert_with(Default::default).sort = Some(sort_items);
            }
        }
        if let Some(v) = d.get_argument("sortStack") {
            if let ConstValue::List(items) = &v.node {
                let mut stacks = Vec::new();
                for item in items {
                    if let ConstValue::List(vals) = item {
                        stacks.push(
                            vals.iter()
                                .filter_map(|g| match g {
                                    ConstValue::String(s) => Some(s.clone()),
                                    _ => None,
                                })
                                .collect(),
                        );
                    }
                }
                options.sort.get_or_insert_with(Default::default).sort_stack = Some(stacks);
            }
        }
        if let Some(route) = directive_string(d, "route") {
            options.route = Some(route);
        }
    }
    options
}

/// `openDocsToGroup` — groups for a node: rootGroups + (operation metadata ||
/// `@doc(group:)` on the node) || kind default.
pub fn to_group(model: &SchemaModel, node: &Node) -> Vec<String> {
    let mut groups: Vec<String> = model.root_groups.clone().unwrap_or_default();
    let mut directive_groups = false;

    // Operation field metadata (from docDirectiveChain).
    if let Node::Operation { op, field } = node {
        let key = format!("{}.{}", op_root_name(op), field.name);
        if let Some(md) = model.field_metadata.get(&key) {
            if let Some(g) = &md.groups {
                directive_groups = true;
                groups.extend(g.clone());
            }
        }
    }

    // `@doc(group:)` directly on the node.
    if !directive_groups {
        let directives = match node {
            Node::Type(t) => &t.directives,
            Node::Operation { field, .. } => &field.directives,
            Node::Field(f) => &f.directives,
        };
        for d in directives {
            if d.name.node == "doc" {
                if let Some(g) = directive_string_list(d, "group") {
                    directive_groups = true;
                    groups.extend(g);
                }
            }
        }
    }

    // Kind defaults.
    if !directive_groups {
        match node {
            Node::Type(t) => match t.kind {
                Kind::Object => groups.push("Objects".into()),
                Kind::Interface => groups.push("Interfaces".into()),
                Kind::Union => groups.push("Unions".into()),
                Kind::Enum => groups.push("Enums".into()),
                Kind::Input => groups.push("Inputs".into()),
                Kind::Scalar => groups.push("Scalars".into()),
            },
            Node::Operation { op, .. } => match *op {
                "query" => groups.push("Queries".into()),
                "mutation" => groups.push("Mutations".into()),
                "subscription" => groups.push("Subscriptions".into()),
                _ => {}
            },
            Node::Field(_) => {}
        }
    }

    groups
}

/// `openDocsCanonical` — metadata path (operations) or `@doc(path:)` on the node.
pub fn canonical(model: &SchemaModel, node: &Node) -> String {
    if let Node::Operation { op, field } = node {
        let key = format!("{}.{}", op_root_name(op), field.name);
        if let Some(md) = model.field_metadata.get(&key) {
            if let Some(p) = &md.path {
                return p.clone();
            }
        }
    }
    let directives = match node {
        Node::Type(t) => &t.directives,
        Node::Operation { field, .. } => &field.directives,
        Node::Field(f) => &f.directives,
    };
    for d in directives {
        if d.name.node == "doc" {
            if let Some(p) = directive_string(d, "path") {
                return p;
            }
        }
    }
    String::new()
}

/// `extractScopesFromDocDirective` — `@doc(scopes: [ENUM | "literal"])`;
/// enum refs resolve through `OpenDocsScope`'s `@scope(value:)`.
pub fn scopes(model: &SchemaModel, node: &Node) -> Vec<String> {
    let directives = match node {
        Node::Type(t) => &t.directives,
        Node::Operation { field, .. } => &field.directives,
        Node::Field(f) => &f.directives,
    };
    let mut out = Vec::new();
    for d in directives {
        if d.name.node != "doc" {
            continue;
        }
        for scope in directive_scope_values(d, "scopes") {
            match scope {
                ScopeRef::Literal(s) => out.push(s),
                ScopeRef::Enum(value_name) => {
                    // The current type if it's an enum, else OpenDocsScope.
                    let enum_type = match node {
                        Node::Type(t) if t.kind == Kind::Enum => Some(*t),
                        _ => model.get_type("OpenDocsScope"),
                    };
                    if let Some(et) = enum_type {
                        if let Some(ev) = et.values.iter().find(|v| v.name == value_name) {
                            for ed in &ev.directives {
                                if ed.name.node == "scope" {
                                    if let Some(v) = directive_string(ed, "value") {
                                        out.push(v);
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    out
}

fn op_root_name(op: &str) -> &'static str {
    match op {
        "query" => "Query",
        "mutation" => "Mutation",
        "subscription" => "Subscription",
        _ => "Query",
    }
}

/// Internal opendocs types excluded from output (port of `isInternalOpenDocsType`).
pub fn is_internal_opendocs_type(name: &str) -> bool {
    matches!(
        name,
        "OpenDocsScope"
            | "OpenDocsSidebarItemType"
            | "OpenDocsPage"
            | "OpenDocsExampleInput"
            | "OpenDocsSortInput"
            | "OpenDocsSortStackInput"
    )
}

/// graphql-js built-in scalars + introspection (port of `isBuiltInType`).
pub fn is_built_in_type(name: &str) -> bool {
    matches!(name, "String" | "Int" | "Float" | "Boolean" | "ID") || name.starts_with("__")
}
