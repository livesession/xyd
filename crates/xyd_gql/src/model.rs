//! Semantic schema model over `async-graphql-parser`'s AST.
//!
//! Replicates the parts of the JS pipeline that shape output:
//! - `mergeTypeDefs` union-merge of same-named type definitions (fields merged
//!   by name, first occurrence wins for order/content — `1.basic` defines
//!   `type Book` three times);
//! - `extend type Query/Mutation/Subscription` field merging + the
//!   `docDirectiveChain` metadata (per-field groups/path from `@doc`, merged
//!   with type-level `@doc`);
//! - `extend schema @docs(...)` root groups + options (handled in opendocs.rs
//!   from the extensions collected here);
//! - definition-order type map (the JS typeMap order that fixture ordering
//!   depends on, post-sort).

use async_graphql_parser::types::{
    ConstDirective, EnumValueDefinition, FieldDefinition, InputValueDefinition, ServiceDocument,
    Type, TypeDefinition, TypeKind, TypeSystemDefinition,
};
use async_graphql_parser::Positioned;
use async_graphql_value::ConstValue;

/// One field/arg/enum-value carrying everything the converters read.
#[derive(Debug, Clone)]
pub struct FieldDef {
    pub name: String,
    pub description: String,
    /// Rendered type string, e.g. `String!`, `[Book!]!` (graphql-js `toJSON()`).
    pub type_str: String,
    /// The flat (unwrapped) named type.
    pub flat_type: String,
    /// NonNull at the top level, or a list of non-null items (JS `required` meta).
    pub required: bool,
    pub args: Vec<FieldDef>,
    pub directives: Vec<ConstDirective>,
    /// Coerced default value (JS `field.defaultValue` semantics via ConstValue→JSON).
    pub default_value: Option<serde_json::Value>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Kind {
    Scalar,
    Object,
    Interface,
    Union,
    Enum,
    Input,
}

#[derive(Debug, Clone)]
pub struct TypeDef {
    pub name: String,
    pub description: String,
    pub kind: Kind,
    pub fields: Vec<FieldDef>,
    /// Union members.
    pub members: Vec<String>,
    /// Enum values.
    pub values: Vec<FieldDef>,
    pub directives: Vec<ConstDirective>,
}

/// `docDirectiveChain` output: per-operation-field groups/path.
#[derive(Debug, Clone, Default)]
pub struct FieldMetadata {
    pub groups: Option<Vec<String>>,
    pub path: Option<String>,
}

#[derive(Debug, Default)]
pub struct SchemaModel {
    /// Definition-order type map (merged), opendocs internals INCLUDED (the
    /// converters exclude them; scope lookups need OpenDocsScope present).
    pub types: Vec<TypeDef>,
    /// Root operation type names (schema definition may rename them).
    pub query_type: String,
    pub mutation_type: String,
    pub subscription_type: String,
    /// `extend schema @docs(...)` directives, in order.
    pub schema_extension_directives: Vec<ConstDirective>,
    /// `docDirectiveChain` metadata: "Query.field" → {groups, path}.
    pub field_metadata: std::collections::HashMap<String, FieldMetadata>,
    /// Root groups from `extend schema @docs(group: [...])`.
    pub root_groups: Option<Vec<String>>,
}

impl SchemaModel {
    pub fn get_type(&self, name: &str) -> Option<&TypeDef> {
        self.types.iter().find(|t| t.name == name)
    }
}

fn pos_str(p: &Option<Positioned<String>>) -> String {
    p.as_ref().map(|d| d.node.clone()).unwrap_or_default()
}

fn type_strings(ty: &Type) -> (String, String, bool) {
    // Display renders exactly the graphql-js toString: Named!/[Inner]!
    let type_str = ty.to_string();
    let flat = flat_name(ty);
    // JS `required`: NonNull at top level OR a (nullable) list of non-null items.
    let top_non_null = !ty.nullable;
    let list_of_non_null = match &ty.base {
        async_graphql_parser::types::BaseType::List(inner) => ty.nullable && !inner.nullable,
        _ => false,
    };
    (type_str, flat, top_non_null || list_of_non_null)
}

fn flat_name(ty: &Type) -> String {
    match &ty.base {
        async_graphql_parser::types::BaseType::Named(n) => n.to_string(),
        async_graphql_parser::types::BaseType::List(inner) => flat_name(inner),
    }
}

fn const_to_json(v: &ConstValue) -> serde_json::Value {
    v.clone().into_json().unwrap_or(serde_json::Value::Null)
}

fn input_value_to_field(iv: &InputValueDefinition) -> FieldDef {
    let (type_str, flat_type, required) = type_strings(&iv.ty.node);
    FieldDef {
        name: iv.name.node.to_string(),
        description: pos_str(&iv.description),
        type_str,
        flat_type,
        required,
        args: vec![],
        directives: iv.directives.iter().map(|d| d.node.clone()).collect(),
        default_value: iv.default_value.as_ref().map(|d| const_to_json(&d.node)),
    }
}

fn field_def_to_field(f: &FieldDefinition) -> FieldDef {
    let (type_str, flat_type, required) = type_strings(&f.ty.node);
    FieldDef {
        name: f.name.node.to_string(),
        description: pos_str(&f.description),
        type_str,
        flat_type,
        required,
        args: f
            .arguments
            .iter()
            .map(|a| input_value_to_field(&a.node))
            .collect(),
        directives: f.directives.iter().map(|d| d.node.clone()).collect(),
        default_value: None,
    }
}

fn enum_value_to_field(ev: &EnumValueDefinition) -> FieldDef {
    FieldDef {
        name: ev.value.node.to_string(),
        description: pos_str(&ev.description),
        type_str: String::new(),
        flat_type: String::new(),
        required: false,
        args: vec![],
        directives: ev.directives.iter().map(|d| d.node.clone()).collect(),
        default_value: None,
    }
}

fn type_def_from_ast(td: &TypeDefinition) -> TypeDef {
    let name = td.name.node.to_string();
    let description = pos_str(&td.description);
    let directives: Vec<ConstDirective> = td.directives.iter().map(|d| d.node.clone()).collect();
    match &td.kind {
        TypeKind::Scalar => TypeDef {
            name,
            description,
            kind: Kind::Scalar,
            fields: vec![],
            members: vec![],
            values: vec![],
            directives,
        },
        TypeKind::Object(o) => TypeDef {
            name,
            description,
            kind: Kind::Object,
            fields: o
                .fields
                .iter()
                .map(|f| field_def_to_field(&f.node))
                .collect(),
            members: vec![],
            values: vec![],
            directives,
        },
        TypeKind::Interface(i) => TypeDef {
            name,
            description,
            kind: Kind::Interface,
            fields: i
                .fields
                .iter()
                .map(|f| field_def_to_field(&f.node))
                .collect(),
            members: vec![],
            values: vec![],
            directives,
        },
        TypeKind::Union(u) => TypeDef {
            name,
            description,
            kind: Kind::Union,
            fields: vec![],
            members: u.members.iter().map(|m| m.node.to_string()).collect(),
            values: vec![],
            directives,
        },
        TypeKind::Enum(e) => TypeDef {
            name,
            description,
            kind: Kind::Enum,
            fields: vec![],
            members: vec![],
            values: e
                .values
                .iter()
                .map(|v| enum_value_to_field(&v.node))
                .collect(),
            directives,
        },
        TypeKind::InputObject(io) => TypeDef {
            name,
            description,
            kind: Kind::Input,
            fields: io
                .fields
                .iter()
                .map(|f| input_value_to_field(&f.node))
                .collect(),
            members: vec![],
            values: vec![],
            directives,
        },
    }
}

/// Merge `other` into `base` (mergeTypeDefs union semantics): fields/values
/// merged by name, first occurrence wins; missing description filled in.
fn merge_type(base: &mut TypeDef, other: TypeDef) {
    if base.description.is_empty() {
        base.description = other.description;
    }
    for f in other.fields {
        if !base.fields.iter().any(|e| e.name == f.name) {
            base.fields.push(f);
        }
    }
    for v in other.values {
        if !base.values.iter().any(|e| e.name == v.name) {
            base.values.push(v);
        }
    }
    for m in other.members {
        if !base.members.contains(&m) {
            base.members.push(m);
        }
    }
    base.directives.extend(other.directives);
}

/// Build the model from parsed documents. `docs[0]` is the opendocs helper
/// schema, `docs[1]` the (first) user schema — mirroring the JS pipeline where
/// `docDirectiveChain` reads metadata from the RAW USER SDL only.
pub fn build_model(docs: &[ServiceDocument]) -> SchemaModel {
    let mut model = SchemaModel {
        query_type: "Query".to_string(),
        mutation_type: "Mutation".to_string(),
        subscription_type: "Subscription".to_string(),
        ..Default::default()
    };

    // Pass 1: type definitions (merged, definition order) + schema defs/extensions.
    for doc in docs {
        for def in &doc.definitions {
            match def {
                TypeSystemDefinition::Schema(s) => {
                    if let Some(q) = &s.node.query {
                        model.query_type = q.node.to_string();
                    }
                    if let Some(m) = &s.node.mutation {
                        model.mutation_type = m.node.to_string();
                    }
                    if let Some(su) = &s.node.subscription {
                        model.subscription_type = su.node.to_string();
                    }
                    if s.node.extend {
                        for d in &s.node.directives {
                            model.schema_extension_directives.push(d.node.clone());
                        }
                    }
                }
                TypeSystemDefinition::Type(t) => {
                    let td = type_def_from_ast(&t.node);
                    if let Some(existing) = model.types.iter_mut().find(|e| e.name == td.name) {
                        merge_type(existing, td);
                    } else {
                        model.types.push(td);
                    }
                }
                TypeSystemDefinition::Directive(_) => {}
            }
        }
    }

    // Pass 2: docDirectiveChain — @docs root groups + per-field @doc metadata
    // from ROOT-TYPE EXTENSIONS in the user SDL. (The JS pipeline prepends
    // opendocs.graphql and reads schemaContents[1]; the Rust entry passes USER
    // sources only, so the first doc IS the first user file.)
    if let Some(user) = docs.first() {
        extract_doc_directive_chain(user, &mut model);
    }

    model
}

fn extract_doc_directive_chain(doc: &ServiceDocument, model: &mut SchemaModel) {
    // Root groups from `extend schema @docs(group: [...])`.
    for def in &doc.definitions {
        if let TypeSystemDefinition::Schema(s) = def {
            if s.node.extend {
                for d in &s.node.directives {
                    if d.node.name.node == "docs" {
                        if let Some(groups) = directive_string_list(&d.node, "group") {
                            model.root_groups = Some(groups);
                        }
                    }
                }
            }
        }
    }

    // Per-field metadata from `extend type Query/Mutation/Subscription`.
    for def in &doc.definitions {
        let TypeSystemDefinition::Type(t) = def else {
            continue;
        };
        if !t.node.extend {
            continue;
        }
        let type_name = t.node.name.node.to_string();
        if !matches!(type_name.as_str(), "Query" | "Mutation" | "Subscription") {
            continue;
        }
        let type_doc = t.node.directives.iter().find(|d| d.node.name.node == "doc");
        let type_groups = type_doc.and_then(|d| directive_string_list(&d.node, "group"));
        let type_path = type_doc.and_then(|d| directive_string(&d.node, "path"));

        let TypeKind::Object(obj) = &t.node.kind else {
            continue;
        };
        for f in &obj.fields {
            let field_name = f.node.name.node.to_string();
            let field_doc = f.node.directives.iter().find(|d| d.node.name.node == "doc");
            let field_groups = field_doc.and_then(|d| directive_string_list(&d.node, "group"));
            let field_path = field_doc.and_then(|d| directive_string(&d.node, "path"));

            // Path merge: type+field paths join; type-only path appends /<field>.
            let mut path = field_path.clone();
            if let (Some(tp), Some(fp)) = (&type_path, &field_path) {
                path = Some(format!("{tp}/{fp}"));
            } else if let Some(tp) = &type_path {
                path = Some(tp.clone());
            }
            if field_path.is_none() {
                if let Some(p) = &path {
                    path = Some(format!("{p}/{field_name}"));
                }
            }

            let groups = field_groups.or_else(|| type_groups.clone());
            model.field_metadata.insert(
                format!("{type_name}.{field_name}"),
                FieldMetadata { groups, path },
            );
        }
    }
}

// ---- directive-argument helpers (shared with opendocs.rs) ----

pub fn directive_string(d: &ConstDirective, arg: &str) -> Option<String> {
    d.get_argument(arg).and_then(|v| match &v.node {
        ConstValue::String(s) => Some(s.clone()),
        _ => None,
    })
}

pub fn directive_string_list(d: &ConstDirective, arg: &str) -> Option<Vec<String>> {
    d.get_argument(arg).and_then(|v| match &v.node {
        ConstValue::List(items) => Some(
            items
                .iter()
                .filter_map(|i| match i {
                    ConstValue::String(s) => Some(s.clone()),
                    _ => None,
                })
                .collect(),
        ),
        _ => None,
    })
}

pub fn directive_bool(d: &ConstDirective, arg: &str) -> Option<bool> {
    d.get_argument(arg).and_then(|v| match &v.node {
        ConstValue::Boolean(b) => Some(*b),
        _ => None,
    })
}

/// Enum values in a directive list arg (e.g. `scopes: [READ_USER]`), plus
/// string literals (both allowed by the JS impl).
pub fn directive_scope_values(d: &ConstDirective, arg: &str) -> Vec<ScopeRef> {
    let Some(v) = d.get_argument(arg) else {
        return vec![];
    };
    let ConstValue::List(items) = &v.node else {
        return vec![];
    };
    items
        .iter()
        .filter_map(|i| match i {
            ConstValue::Enum(name) => Some(ScopeRef::Enum(name.to_string())),
            ConstValue::String(s) => Some(ScopeRef::Literal(s.clone())),
            _ => None,
        })
        .collect()
}

#[derive(Debug, Clone)]
pub enum ScopeRef {
    /// An `OpenDocsScope` enum value — resolved via its `@scope(value: …)`.
    Enum(String),
    /// A raw string literal, pushed as-is.
    Literal(String),
}
