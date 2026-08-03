//! Port of `gql-core.ts` — `uniformify` / `propsUniformify` /
//! `gqlFieldToUniformMeta` + the converter `Context`.

use std::cell::RefCell;
use std::collections::{HashMap, HashSet};
use std::rc::Rc;

use serde_json::{json, Map, Value};
use xyd_uniform::{
    Definition, DefinitionProperty, ExampleGroup, ExampleRoot, Meta, Reference, ReferenceCategory,
    ReferenceType, StrOrList, SymbolDef,
};

use crate::model::{FieldDef, Kind, SchemaModel, TypeDef};
use crate::opendocs::{self, Node};
use crate::Options;

/// The JS `Context` + the cross-run `__definitionProperties` cache. In TS the
/// cache lives as mutations on the graphql type OBJECTS (so it persists across
/// fresh Contexts for the whole run); `props_cache` reproduces that.
pub struct Ctx<'a> {
    pub model: &'a SchemaModel,
    pub options: &'a Options,
    pub flat_return: bool,
    pub flat: bool,
    pub flat_arg: bool,
    /// Per-Context processed set (TS `processedTypes`, shared where TS shares).
    pub processed: Rc<RefCell<HashSet<String>>>,
    /// Run-global `__definitionProperties` cache (TS type-object mutation).
    pub props_cache: Rc<RefCell<HashMap<String, Vec<DefinitionProperty>>>>,
}

impl<'a> Ctx<'a> {
    pub fn with_config(&self, flat_return: bool, flat: bool, flat_arg: bool) -> Ctx<'a> {
        Ctx {
            model: self.model,
            options: self.options,
            flat_return,
            flat,
            flat_arg,
            processed: Rc::clone(&self.processed),
            props_cache: Rc::clone(&self.props_cache),
        }
    }
}

/// `uniformify` — build a Reference envelope for a node. For FIELD nodes whose
/// flat type is a non-built-in named type, recurses to that type (the TS
/// else-branch); otherwise falls through with an empty canonical prefix.
pub fn uniformify(
    ctx: &Ctx,
    node: &Node,
    definitions: Vec<Definition>,
    examples: Vec<ExampleGroup>,
) -> Reference {
    let (canonical_prefix, type_short, ref_type, name, description) = match node {
        Node::Type(t) => {
            let (p, s, r) = match t.kind {
                Kind::Scalar => ("scalars", "scalar", ReferenceType::GraphqlScalar),
                Kind::Object => ("objects", "object", ReferenceType::GraphqlObject),
                Kind::Interface => ("interfaces", "interface", ReferenceType::GraphqlInterface),
                Kind::Union => ("unions", "union", ReferenceType::GraphqlUnion),
                Kind::Enum => ("enums", "enum", ReferenceType::GraphqlEnum),
                Kind::Input => ("inputs", "input", ReferenceType::GraphqlInput),
            };
            (p, s, Some(r), t.name.clone(), t.description.clone())
        }
        Node::Operation { op, field } => {
            let (p, s, r) = match *op {
                "query" => ("queries", "query", ReferenceType::GraphqlQuery),
                "mutation" => ("mutations", "mutation", ReferenceType::GraphqlMutation),
                _ => (
                    "subscriptions",
                    "subscription",
                    ReferenceType::GraphqlSubscription,
                ),
            };
            (p, s, Some(r), field.name.clone(), field.description.clone())
        }
        Node::Field(f) => {
            // Recurse to the flat type when it's a known non-built-in type.
            if !opendocs::is_built_in_type(&f.flat_type) {
                if let Some(td) = ctx.model.get_type(&f.flat_type) {
                    return uniformify(ctx, &Node::Type(td), definitions, examples);
                }
            }
            ("", "", None, f.name.clone(), f.description.clone())
        }
    };

    let od_canonical = opendocs::canonical(ctx.model, node);
    let canonical = if !od_canonical.is_empty() {
        od_canonical
    } else if !canonical_prefix.is_empty() {
        format!("{canonical_prefix}/{name}")
    } else {
        String::new()
    };

    let scopes = opendocs::scopes(ctx.model, node);
    let group = opendocs::to_group(ctx.model, node);

    Reference {
        title: name.clone(),
        description,
        canonical,
        category: Some(ReferenceCategory::Graphql),
        reference_type: ref_type,
        context: Some(json!({
            "graphqlTypeShort": type_short,
            "graphqlName": name,
            "group": group,
            "scopes": scopes,
        })),
        examples: ExampleRoot { groups: examples },
        definitions,
    }
}

/// `propsUniformify` — one field/arg → DefinitionProperty.
pub fn props_uniformify(
    ctx: &Ctx,
    field: &FieldDef,
    properties: Option<Vec<DefinitionProperty>>,
    extra_meta: Vec<Meta>,
) -> DefinitionProperty {
    let obj_ref = uniformify(ctx, &Node::Field(field), vec![], vec![]);

    let mut context = Map::new();
    context.insert("graphqlName".into(), Value::String(field.name.clone()));
    context.insert(
        "graphqlTypeFlat".into(),
        Value::String(field.flat_type.clone()),
    );
    context.insert(
        "graphqlBuiltInType".into(),
        Value::Bool(opendocs::is_built_in_type(&field.flat_type)),
    );

    let mut meta = field_meta(field);
    meta.extend(extra_meta);

    DefinitionProperty {
        name: Some(field.name.clone()),
        property_type: field.type_str.clone(),
        description: Some(field.description.clone()),
        context: Some(Value::Object(context)),
        properties: Some(properties.unwrap_or_default()),
        meta: Some(meta),
        symbol_def: Some(SymbolDef {
            canonical: Some(StrOrList::One(obj_ref.canonical)),
            ..Default::default()
        }),
        ..Default::default()
    }
}

/// `gqlObjectPropsUniformify` — an object/input TYPE as a DefinitionProperty
/// (used for input-object args and union members).
pub fn gql_object_props_uniformify(
    ctx: &Ctx,
    obj: &TypeDef,
    extra_meta: Vec<Meta>,
) -> DefinitionProperty {
    let obj_ref = uniformify(ctx, &Node::Type(obj), vec![], vec![]);

    let mut nested: Vec<DefinitionProperty> = Vec::new();
    if !ctx.flat_arg {
        for f in &obj.fields {
            nested.push(crate::convert::field_to_property(ctx, f, None));
        }
    }

    DefinitionProperty {
        name: Some(obj.name.clone()),
        property_type: obj.name.clone(),
        description: Some(obj.description.clone()),
        context: obj_ref.context.clone(),
        properties: Some(nested),
        meta: Some(extra_meta),
        symbol_def: Some(SymbolDef {
            canonical: Some(StrOrList::One(obj_ref.canonical)),
            ..Default::default()
        }),
        ..Default::default()
    }
}

/// `gqlFieldToUniformMeta` — required / @deprecated / defaults.
pub fn field_meta(field: &FieldDef) -> Vec<Meta> {
    let mut meta = Vec::new();
    if field.required {
        meta.push(Meta::new("required", "true"));
    }
    for d in &field.directives {
        if d.name.node == "deprecated" {
            let mut found_reason = false;
            for (arg_name, arg_value) in &d.arguments {
                if arg_name.node == "reason" {
                    found_reason = true;
                    let v = match &arg_value.node {
                        async_graphql_value::ConstValue::String(s) => s.clone(),
                        _ => "true".to_string(),
                    };
                    meta.push(Meta::new("deprecated", v));
                }
            }
            if !found_reason {
                meta.push(Meta::new("deprecated", "true"));
            }
        }
    }
    if let Some(default) = &field.default_value {
        meta.push(Meta {
            name: "defaults".into(),
            value: Some(default.clone()),
        });
    }
    meta
}
