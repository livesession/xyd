//! Port of `converters/*` — types, object/enum/union/input/interface/scalar,
//! operations, the field converter (with the circular-cache dance), and args.

use std::cell::RefCell;
use std::collections::HashSet;
use std::rc::Rc;

use xyd_uniform::{
    CodeBlock, CodeBlockTab, Definition, DefinitionProperty, DefinitionVariant, Example,
    ExampleGroup, Meta, Reference,
};

use crate::core::{field_meta, gql_object_props_uniformify, props_uniformify, uniformify, Ctx};
use crate::model::{FieldDef, Kind, TypeDef};
use crate::opendocs::{is_built_in_type, is_internal_opendocs_type, Node};
use crate::sample::simple_graphql_example;

/// `graphqlTypesToUniformReferences` — walk the definition-order type map.
pub fn convert_types(base: &Ctx) -> Vec<Reference> {
    let mut references = Vec::new();
    // The types converter shares ONE processedTypes set across object/input/
    // union conversions (TS `sharedProcessedTypes`); enum/scalar/interface get
    // fresh sets.
    let shared: Rc<RefCell<HashSet<String>>> = Rc::new(RefCell::new(HashSet::new()));
    let flat = base.options.flat.unwrap_or(false);
    let regions = base.options.regions.clone().unwrap_or_default();
    let region_ok = |key: String| -> bool { regions.is_empty() || regions.contains(&key) };

    for t in &base.model.types {
        if is_built_in_type(&t.name)
            || t.name == base.model.query_type
            || t.name == base.model.mutation_type
            || t.name == base.model.subscription_type
            || is_internal_opendocs_type(&t.name)
        {
            continue;
        }

        let reference = match t.kind {
            Kind::Object => {
                if !region_ok(format!("object.{}", t.name)) {
                    continue;
                }
                let ctx = Ctx {
                    processed: Rc::clone(&shared),
                    ..base.with_config(false, flat, false)
                };
                Some(object_to_ref(&ctx, t))
            }
            Kind::Input => {
                if !region_ok(format!("input.{}", t.name)) {
                    continue;
                }
                let ctx = Ctx {
                    processed: Rc::clone(&shared),
                    ..base.with_config(false, flat, false)
                };
                Some(input_to_ref(&ctx, t))
            }
            Kind::Enum => {
                if !region_ok(format!("enum.{}", t.name)) {
                    continue;
                }
                let ctx = base.with_config(false, false, false);
                Some(enum_to_ref(&ctx, t))
            }
            Kind::Scalar => {
                if !region_ok(format!("scalar.{}", t.name)) {
                    continue;
                }
                let ctx = base.with_config(false, false, false);
                Some(uniformify(&ctx, &Node::Type(t), vec![], vec![]))
            }
            Kind::Union => {
                if !region_ok(format!("union.{}", t.name)) {
                    continue;
                }
                let ctx = Ctx {
                    processed: Rc::clone(&shared),
                    ..base.with_config(false, flat, flat)
                };
                Some(union_to_ref(&ctx, t))
            }
            Kind::Interface => {
                if !region_ok(format!("interface.{}", t.name)) {
                    continue;
                }
                let ctx = base.with_config(false, flat, false);
                Some(interface_to_ref(&ctx, t))
            }
        };

        if let Some(r) = reference {
            references.push(r);
        }
    }
    references
}

/// `gqlOperationToUniformRef` for one root type ("query" | "mutation" | "subscription").
pub fn convert_operations(base: &Ctx, op: &str) -> Vec<Reference> {
    let root_name = match op {
        "query" => &base.model.query_type,
        "mutation" => &base.model.mutation_type,
        _ => &base.model.subscription_type,
    };
    let Some(root) = base.model.get_type(root_name) else {
        return vec![];
    };

    // filterFieldsByRegions — NOTE: the JS subscription converter passes the
    // "mutation" prefix (faithfully preserved quirk).
    let region_prefix = match op {
        "query" => "query",
        _ => "mutation",
    };
    let regions = base.options.regions.clone().unwrap_or_default();

    let flat = base.options.flat.unwrap_or(false);
    let mut references = Vec::new();

    for field in &root.fields {
        if !regions.is_empty() {
            let key = format!("{region_prefix}.{}", field.name);
            if !regions.contains(&key) {
                continue;
            }
        }

        // Args: fresh processed set, {flat, flatArg}.
        let arg_ctx = Ctx {
            processed: Rc::new(RefCell::new(HashSet::new())),
            ..base.with_config(false, flat, flat)
        };
        let args = args_to_properties(&arg_ctx, &field.args);

        // Returns: fresh processed set, {flatReturn}.
        let ret_ctx = Ctx {
            processed: Rc::new(RefCell::new(HashSet::new())),
            ..base.with_config(flat, false, false)
        };
        let returns = field_to_property(&ret_ctx, field, None);
        let return_properties: Vec<DefinitionProperty> = if flat {
            vec![returns]
        } else {
            returns.properties.clone().unwrap_or_default()
        };

        let definitions = vec![
            Definition {
                title: "Arguments".into(),
                properties: args.clone(),
                ..Default::default()
            },
            Definition {
                title: "Returns".into(),
                properties: return_properties.clone(),
                ..Default::default()
            },
        ];

        let code = simple_graphql_example(op, &field.name, &args, &return_properties);
        let example_group = ExampleGroup {
            description: Some(String::new()),
            kind: None,
            examples: vec![Example {
                description: None,
                codeblock: CodeBlock {
                    title: None,
                    tabs: vec![CodeBlockTab {
                        title: String::new(),
                        code,
                        language: "graphql".into(),
                        context: None,
                        highlighted: None,
                    }],
                },
            }],
        };

        let op_ctx = base.with_config(false, false, false);
        references.push(uniformify(
            &op_ctx,
            &Node::Operation { op, field },
            definitions,
            vec![example_group],
        ));
    }
    references
}

// ---- per-kind refs ----

fn object_to_ref(ctx: &Ctx, t: &TypeDef) -> Reference {
    let mut variants: Vec<DefinitionVariant> = Vec::new();
    for field in &t.fields {
        if field.args.is_empty() {
            continue;
        }
        let args = args_to_properties(ctx, &field.args);
        variants.push(DefinitionVariant {
            title: String::new(),
            properties: args,
            meta: Some(vec![Meta::new("symbolName", field.name.clone())]),
            ..Default::default()
        });
    }
    let argument_definition = Definition {
        title: "Arguments".into(),
        properties: vec![],
        variants: Some(variants),
        meta: Some(vec![Meta::new("type", "arguments")]),
        ..Default::default()
    };

    let mut graphql_fields = Vec::new();
    for field in &t.fields {
        graphql_fields.push(field_to_property(ctx, field, None));
    }
    let fields_definition = Definition {
        title: "Fields".into(),
        properties: graphql_fields,
        meta: Some(vec![Meta::new("type", "fields")]),
        ..Default::default()
    };

    uniformify(
        ctx,
        &Node::Type(t),
        vec![argument_definition, fields_definition],
        vec![],
    )
}

fn input_to_ref(ctx: &Ctx, t: &TypeDef) -> Reference {
    let prop = gql_object_props_uniformify(ctx, t, vec![]);
    uniformify(
        ctx,
        &Node::Type(t),
        vec![Definition {
            title: "Fields".into(),
            properties: prop.properties.unwrap_or_default(),
            ..Default::default()
        }],
        vec![],
    )
}

fn enum_to_ref(ctx: &Ctx, t: &TypeDef) -> Reference {
    let props: Vec<DefinitionProperty> = t
        .values
        .iter()
        .map(|v| DefinitionProperty {
            name: Some(v.name.clone()),
            property_type: "string".into(),
            description: Some(v.description.clone()),
            ..Default::default()
        })
        .collect();
    uniformify(
        ctx,
        &Node::Type(t),
        vec![Definition {
            title: "Valid values".into(),
            properties: props,
            ..Default::default()
        }],
        vec![],
    )
}

fn union_to_ref(ctx: &Ctx, t: &TypeDef) -> Reference {
    let properties = union_properties(ctx, t);
    uniformify(
        ctx,
        &Node::Type(t),
        vec![Definition {
            title: "Possible types".into(),
            properties,
            ..Default::default()
        }],
        vec![],
    )
}

pub fn union_properties(ctx: &Ctx, t: &TypeDef) -> Vec<DefinitionProperty> {
    let mut out = Vec::new();
    for member in &t.members {
        if let Some(mt) = ctx.model.get_type(member) {
            if mt.kind == Kind::Object {
                out.push(gql_object_props_uniformify(ctx, mt, vec![]));
            }
        }
    }
    out
}

fn interface_to_ref(ctx: &Ctx, t: &TypeDef) -> Reference {
    let properties: Vec<DefinitionProperty> = t
        .fields
        .iter()
        .map(|f| field_to_property(ctx, f, None))
        .collect();
    uniformify(
        ctx,
        &Node::Type(t),
        vec![Definition {
            title: "Fields".into(),
            properties,
            ..Default::default()
        }],
        vec![],
    )
}

// ---- args ----

/// `gqlArgToUniformDefinitionProperty`.
pub fn args_to_properties(ctx: &Ctx, args: &[FieldDef]) -> Vec<DefinitionProperty> {
    let mut out = Vec::new();
    for arg in args {
        let flat_td = ctx.model.get_type(&arg.flat_type);
        if let Some(input_td) = flat_td.filter(|t| t.kind == Kind::Input) {
            let meta = field_meta(arg);
            let def_property = gql_object_props_uniformify(ctx, input_td, vec![]);
            let mut merged_meta = def_property.meta.clone().unwrap_or_default();
            merged_meta.extend(meta);
            out.push(DefinitionProperty {
                property_type: arg.type_str.clone(),
                name: Some(arg.name.clone()),
                description: Some(arg.description.clone()),
                meta: Some(merged_meta),
                ..def_property
            });
        } else {
            out.push(props_uniformify(ctx, arg, None, vec![]));
        }
    }
    out
}

// ---- the field converter (GQLFieldConverter.convert) ----

/// `gqlFieldToUniformDefinitionProperty` — with the flat shortcut, nested
/// recursion, and the faithful `__definitionProperties` cache mutations.
pub fn field_to_property(ctx: &Ctx, field: &FieldDef, parent: Option<&str>) -> DefinitionProperty {
    // Flat shortcut.
    if ctx.options.flat.unwrap_or(false) && (ctx.flat_return || ctx.flat) {
        let mut props = props_uniformify(ctx, field, Some(vec![]), vec![]);
        if ctx.flat_return {
            props.name = Some(String::new());
            return props;
        }
        return props;
    }

    let flat_td = ctx.model.get_type(&field.flat_type);
    let properties: Option<Vec<DefinitionProperty>> = match flat_td.map(|t| &t.kind) {
        Some(Kind::Object) | Some(Kind::Input) | Some(Kind::Interface) => {
            Some(nested_properties(ctx, flat_td.unwrap()))
        }
        Some(Kind::Union) => Some(union_properties(ctx, flat_td.unwrap())),
        // Scalars (incl. built-ins/unknowns) → the JS definitionPropsFromNestedObj
        // walk bottoms out at [] for leaf types.
        _ => Some(vec![]),
    };

    let resp = props_uniformify(ctx, field, properties, vec![]);

    // TS: nestedType.__definitionProperties = resp.properties;
    //     if (parent) parent.__definitionProperties = resp.properties;
    let resp_props = resp.properties.clone().unwrap_or_default();
    if flat_td.is_some() {
        ctx.props_cache
            .borrow_mut()
            .insert(field.flat_type.clone(), resp_props.clone());
    }
    if let Some(p) = parent {
        ctx.props_cache
            .borrow_mut()
            .insert(p.to_string(), resp_props);
    }

    resp
}

/// `nestedProperties` — circular-safe recursion into an object/input/interface.
fn nested_properties(ctx: &Ctx, td: &TypeDef) -> Vec<DefinitionProperty> {
    if ctx.processed.borrow().contains(&td.name) {
        // Already processed: return the cached props (or [] to break the cycle).
        return ctx
            .props_cache
            .borrow()
            .get(&td.name)
            .cloned()
            .unwrap_or_default();
    }
    ctx.processed.borrow_mut().insert(td.name.clone());

    let mut properties = Vec::new();
    for f in &td.fields {
        properties.push(field_to_property(ctx, f, Some(&td.name)));
    }
    properties
}
