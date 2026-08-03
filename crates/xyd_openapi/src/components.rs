//! Port of `oas-componentSchemas.ts` — component schemas → References,
//! including the pure-JSON example groups (these ARE generated in Rust;
//! only endpoint code samples stay a JS post-pass).

use serde_json::Value;
use xyd_uniform::{
    CodeBlock, CodeBlockTab, Definition, DefinitionProperty, Example, ExampleGroup, ExampleRoot,
    Reference, ReferenceType,
};

use crate::core::{schema_object_to_properties, PropsResult, VisitedRefs};
use crate::doc::DocCtx;
use crate::paths::definition_property_type_def;
use crate::Options;

/// `schemaComponentsToUniformReferences`.
pub fn schema_components_to_references(ctx: &DocCtx, options: &Options) -> Vec<Reference> {
    let mut references = Vec::new();

    let Some(schemas) = ctx
        .raw
        .get("components")
        .and_then(|c| c.get("schemas"))
        .and_then(|s| s.as_object())
    else {
        return references;
    };

    let regions = options.regions.clone().unwrap_or_default();

    for (component_schema_name, component_schema) in schemas {
        if !regions.is_empty() {
            let key = format!("/components/schemas/{component_schema_name}");
            if !regions.contains(&key) {
                continue;
            }
        }
        let component_schema = ctx.resolve(component_schema);

        let mut properties: Vec<DefinitionProperty> = Vec::new();
        let mut root_property: Option<DefinitionProperty> = None;
        let mut visited = VisitedRefs::new();
        match schema_object_to_properties(ctx, component_schema, false, &mut visited) {
            PropsResult::List(list) => properties = list,
            PropsResult::Single(single) => root_property = Some(single),
            PropsResult::None => {}
        }

        let symbol_def = definition_property_type_def(ctx, component_schema);

        let definition = Definition {
            title: component_schema_name.clone(),
            properties,
            root_property,
            meta: Some(vec![]),
            symbol_def,
            ..Default::default()
        };

        let mut context = serde_json::Map::new();
        context.insert(
            "componentSchema".into(),
            Value::String(component_schema_name.clone()),
        );
        context.insert(
            "group".into(),
            Value::Array(vec![Value::String("Objects".into())]),
        );

        references.push(Reference {
            title: component_schema_name.clone(),
            description: component_schema
                .get("description")
                .and_then(|d| d.as_str())
                .unwrap_or("")
                .to_string(),
            canonical: format!("objects/{component_schema_name}"),
            definitions: vec![definition],
            examples: ExampleRoot {
                groups: schema_example_group(ctx, component_schema),
            },
            reference_type: Some(ReferenceType::RestComponentSchema),
            context: Some(Value::Object(context)),
            category: None,
        });
    }

    references
}

/// `createSchemaExampleGroup`.
fn schema_example_group(ctx: &DocCtx, schema: &Value) -> Vec<ExampleGroup> {
    let mut visited = ExampleVisited::new();
    let Some(example) = generate_schema_example(ctx, schema, &mut visited, None) else {
        return vec![];
    };
    // JS: `if (!example) return []` — FALSY, not just null ("" / 0 / false too).
    if !is_truthy(&example) {
        return vec![];
    }

    vec![ExampleGroup {
        description: Some("Example".into()),
        kind: None,
        examples: vec![Example {
            description: None,
            codeblock: CodeBlock {
                title: None,
                tabs: vec![CodeBlockTab {
                    title: "json".into(),
                    language: "json".into(),
                    code: serde_json::to_string_pretty(&example).unwrap_or_default(),
                    context: None,
                    highlighted: None,
                }],
            },
        }],
    }]
}

/// visitedExample: Map<SchemaObject, any> — keyed by node identity.
type ExampleVisited = std::collections::HashMap<usize, Value>;

fn node_addr(v: &Value) -> usize {
    v as *const Value as usize
}

/// `generateSchemaExample` — with the JS truthy-cache semantics (a cached
/// falsy value — null/""/0/false — does NOT short-circuit).
fn generate_schema_example(
    ctx: &DocCtx,
    schema: &Value,
    visited: &mut ExampleVisited,
    parent: Option<&Value>,
) -> Option<Value> {
    if schema.is_null() {
        return None;
    }
    let schema = ctx.resolve(schema);
    let id = node_addr(schema);

    if let Some(cached) = visited.get(&id) {
        // JS: `if (cached)` — truthiness gate.
        if is_truthy(cached) {
            return Some(cached.clone());
        }
    }
    if let Some(p) = parent {
        visited.insert(id, p.clone());
    }

    if let Some(examples) = schema.get("examples").and_then(|e| e.as_array()) {
        let v = examples.first().cloned().unwrap_or(Value::Null);
        visited.insert(id, v.clone());
        return Some(v);
    }
    if let Some(example) = schema.get("example") {
        visited.insert(id, example.clone());
        return Some(example.clone());
    }

    let schema_type = schema.get("type").and_then(|t| t.as_str());

    if schema_type == Some("object") {
        if let Some(props_node) = schema.get("properties") {
            let props = props_node.as_object();
            let Some(props) = props else {
                return Some(Value::Null);
            };
            let mut result = serde_json::Map::new();
            for (prop_name, prop_schema) in props {
                // JS passes the under-construction object as `parent` — the
                // pre-registration only matters for cycles, which resolve to
                // the (partial) parent; passing the current partial map mirrors
                // the observable output for the committed fixtures.
                let partial = Value::Object(result.clone());
                let v = generate_schema_example(ctx, prop_schema, visited, Some(&partial))
                    .unwrap_or(Value::Null);
                result.insert(prop_name.clone(), v);
            }
            // JS-mutation artifact the oracles encode: the deref stamped
            // `__UNSAFE_refPath` onto properties CONTAINERS holding a direct
            // $ref child; Object.entries then yields it and the example gets
            // a trailing `"__UNSAFE_refPath": null`.
            if ctx.ref_path(props_node).is_some() {
                result.insert("__UNSAFE_refPath".into(), Value::Null);
            }
            let out = Value::Object(result);
            visited.insert(id, out.clone());
            return Some(out);
        }
    }

    if schema_type == Some("array") {
        if let Some(items) = schema.get("items") {
            let item_example = generate_schema_example(ctx, items, visited, None);
            let v = match item_example {
                Some(item) if is_truthy(&item) => Value::Array(vec![item]),
                _ => Value::Array(vec![]),
            };
            visited.insert(id, v.clone());
            return Some(v);
        }
    }

    Some(match schema_type {
        Some("string") => Value::String(String::new()),
        Some("number") | Some("integer") => Value::from(0),
        Some("boolean") => Value::Bool(false),
        _ => Value::Null,
    })
}

fn is_truthy(v: &Value) -> bool {
    match v {
        Value::Null => false,
        Value::Bool(b) => *b,
        Value::Number(n) => n.as_f64().map(|f| f != 0.0).unwrap_or(true),
        Value::String(s) => !s.is_empty(),
        _ => true, // objects/arrays are truthy in JS
    }
}
