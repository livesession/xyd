//! Port of `oas-core.ts` — `schemaObjectToUniformDefinitionProperty`(/-ies/
//! -Meta). Faithful to the letter, including the quirks the fixtures encode:
//! presence-not-truthiness meta checks (`"nullable" in` fires on `false`),
//! the required-override spread, the anyOf branch emitting NO meta, the
//! spread-merge in allOf, visitedRefs clone-at-set snapshots, and the arrayOf
//! store that is immediately overwritten (kept as the final store only).

use serde_json::Value;
use xyd_uniform::{property_type, DefinitionProperty, Meta};

use crate::doc::DocCtx;

/// TS `visitedRefs: Map<string, DefinitionProperty>` — insertion-ordered isn't
/// needed (lookup only), but values are SNAPSHOTS taken at set time.
pub type VisitedRefs = std::collections::HashMap<String, DefinitionProperty>;

const BUILT_IN_PROPERTIES: &[&str] = &["__internal_getRefPath"];

fn is_built_in_prop(name: &str) -> bool {
    BUILT_IN_PROPERTIES.contains(&name)
}

fn s(v: &Value, key: &str) -> Option<String> {
    v.get(key).and_then(|x| x.as_str()).map(String::from)
}

fn type_of(v: &Value) -> Option<String> {
    s(v, "type")
}

fn description_of(v: &Value) -> String {
    s(v, "description").unwrap_or_default()
}

fn required_includes(schema: &Value, name: &str) -> bool {
    schema
        .get("required")
        .and_then(|r| r.as_array())
        .map(|a| a.iter().any(|x| x.as_str() == Some(name)))
        .unwrap_or(false)
}

fn is_merge_type(t: &str) -> bool {
    t == property_type::XOR || t == property_type::UNION
}

fn is_of_type(t: &str) -> bool {
    t == property_type::XOR || t == property_type::UNION || t == property_type::ARRAY
}

/// Port of `schemaObjectToUniformDefinitionProperties`.
/// Returns Ok(array) or Err(single root property) mirroring the TS
/// `DefinitionProperty[] | DefinitionProperty | null` union
/// (None → the TS `null`).
pub enum PropsResult {
    List(Vec<DefinitionProperty>),
    Single(Box<DefinitionProperty>),
    None,
}

pub fn schema_object_to_properties(
    ctx: &DocCtx,
    schema_object: &Value,
    root_property: bool,
    visited: &mut VisitedRefs,
) -> PropsResult {
    let schema_object = ctx.resolve(schema_object);
    let mut properties: Vec<DefinitionProperty> = Vec::new();

    let has = |k: &str| schema_object.get(k).map(|v| !v.is_null()).unwrap_or(false);

    if has("anyOf") || has("oneOf") {
        if let Some(property) =
            schema_object_to_property(ctx, "", schema_object, false, false, visited, None)
        {
            if root_property {
                return PropsResult::Single(Box::new(property));
            }
            properties.push(property);
        }
    } else if has("allOf") {
        let mut component_paths: Vec<String> = Vec::new();
        let all_of = schema_object.get("allOf").and_then(|v| v.as_array());
        for schema in all_of.into_iter().flatten() {
            let schema = ctx.resolve(schema);
            if let Some(rp) = ctx.internal_ref_path(schema) {
                component_paths.extend(rp);
            }
            if let Some(props) = schema.get("properties").and_then(|p| p.as_object()) {
                for (prop_name, prop_schema) in props {
                    if is_built_in_prop(prop_name) {
                        continue;
                    }
                    let prop_schema = ctx.resolve(prop_schema);
                    let required = required_includes(schema, prop_name);
                    let array_of = type_of(prop_schema).as_deref() == Some("array");
                    if let Some(property) = schema_object_to_property(
                        ctx,
                        prop_name,
                        prop_schema,
                        required,
                        array_of,
                        visited,
                        None,
                    ) {
                        merge_or_push(&mut properties, prop_name, property);
                    }
                }
            }
        }
        ctx.set_internal_ref_path(schema_object, component_paths);
    } else if let Some(props) = schema_object.get("properties").and_then(|p| p.as_object()) {
        for (prop_name, prop_schema) in props {
            if is_built_in_prop(prop_name) {
                continue;
            }
            let prop_schema = ctx.resolve(prop_schema);
            let required = required_includes(schema_object, prop_name);
            let array_of = type_of(prop_schema).as_deref() == Some("array");
            if let Some(property) = schema_object_to_property(
                ctx,
                prop_name,
                prop_schema,
                required,
                array_of,
                visited,
                None,
            ) {
                properties.push(property);
            }
        }
    }

    PropsResult::List(properties)
}

/// TS allOf-properties merge: `{...existing, ...property}` + the description/
/// meta rules.
fn merge_or_push(
    properties: &mut Vec<DefinitionProperty>,
    name: &str,
    property: DefinitionProperty,
) {
    if let Some(idx) = properties
        .iter()
        .position(|p| p.name.as_deref() == Some(name))
    {
        let existing = properties[idx].clone();
        properties[idx] = spread_merge(&existing, &property);
    } else {
        properties.push(property);
    }
}

fn spread_merge(
    existing: &DefinitionProperty,
    property: &DefinitionProperty,
) -> DefinitionProperty {
    // {...existing, ...property}: property's present fields win; then the
    // explicit description/meta overrides.
    let mut out = existing.clone();
    out.name = property.name.clone().or(out.name);
    out.property_type = property.property_type.clone();
    if property.description.is_some() {
        out.description = property.description.clone();
    }
    if property.examples.is_some() {
        out.examples = property.examples.clone();
    }
    if property.symbol_def.is_some() {
        out.symbol_def = property.symbol_def.clone();
    }
    if property.context.is_some() {
        out.context = property.context.clone();
    }
    if property.properties.is_some() {
        out.properties = property.properties.clone();
    }
    if property.of_property.is_some() {
        out.of_property = property.of_property.clone();
    }
    // description: property.description || existing.description || ""
    let desc = property
        .description
        .clone()
        .filter(|d| !d.is_empty())
        .or_else(|| existing.description.clone().filter(|d| !d.is_empty()))
        .unwrap_or_default();
    out.description = Some(desc);
    // meta: [...existing.meta, ...property.meta]
    let mut meta = existing.meta.clone().unwrap_or_default();
    meta.extend(property.meta.clone().unwrap_or_default());
    out.meta = Some(meta);
    out
}

/// Port of `schemaObjectToUniformDefinitionProperty`.
#[allow(clippy::too_many_arguments)]
pub fn schema_object_to_property(
    ctx: &DocCtx,
    name: &str,
    schema: &Value,
    required: bool,
    array_of: bool,
    visited: &mut VisitedRefs,
    parent_property: Option<DefinitionProperty>,
) -> Option<DefinitionProperty> {
    if name == "__UNSAFE_refPath" {
        return None;
    }
    if schema.is_null() {
        return None;
    }
    let schema = ctx.resolve(schema);

    // Circular guard: a stamped schema whose refPath was already visited
    // returns a deep copy of the SNAPSHOT with the current name.
    let ref_path = ctx.ref_path(schema).unwrap_or("").to_string();
    if !ref_path.is_empty() {
        if let Some(def_prop) = visited.get(&ref_path) {
            let mut v = def_prop.clone();
            v.name = Some(name.to_string());
            return Some(v);
        }
    }

    if let Some(p) = parent_property {
        visited.insert(ref_path.clone(), p);
    }

    let has = |k: &str| schema.get(k).map(|v| !v.is_null()).unwrap_or(false);

    // anyOf → $$union (NOTE: no meta on the union property — TS omits it).
    if has("anyOf") {
        let mut component_paths: Vec<String> = Vec::new();
        let mut properties: Vec<DefinitionProperty> = Vec::new();
        for variant in schema
            .get("anyOf")
            .and_then(|v| v.as_array())
            .into_iter()
            .flatten()
        {
            let variant = ctx.resolve(variant);
            if let Some(rp) = ctx.internal_ref_path(variant) {
                component_paths.extend(rp);
            }
            if let Some(property) =
                schema_object_to_property(ctx, name, variant, required, false, visited, None)
            {
                if is_merge_type(&property.property_type) {
                    properties.extend(property.properties.unwrap_or_default());
                } else {
                    let mut p = property;
                    let title = s(variant, "title");
                    p.name = Some(
                        title
                            .or_else(|| p.name.clone().filter(|n| !n.is_empty()))
                            .unwrap_or_default(),
                    );
                    properties.push(p);
                }
            }
        }
        ctx.set_internal_ref_path(schema, component_paths);

        let prop = DefinitionProperty {
            name: Some(name.to_string()),
            property_type: property_type::UNION.to_string(),
            description: Some(description_of(schema)),
            properties: Some(properties),
            ..Default::default()
        };
        if !ref_path.is_empty() {
            visited.insert(ref_path, prop.clone());
        }
        return Some(prop);
    }

    let meta = property_meta(schema, name, required);

    // oneOf → $$xor.
    if has("oneOf") {
        let mut component_paths: Vec<String> = Vec::new();
        let mut properties: Vec<DefinitionProperty> = Vec::new();
        for variant in schema
            .get("oneOf")
            .and_then(|v| v.as_array())
            .into_iter()
            .flatten()
        {
            let variant = ctx.resolve(variant);
            if let Some(rp) = ctx.internal_ref_path(variant) {
                component_paths.extend(rp);
            }
            if let Some(property) =
                schema_object_to_property(ctx, name, variant, required, false, visited, None)
            {
                let mut p = property;
                let title = s(variant, "title");
                p.name = Some(
                    title
                        .or_else(|| p.name.clone().filter(|n| !n.is_empty()))
                        .unwrap_or_default(),
                );
                properties.push(p);
            }
        }
        ctx.set_internal_ref_path(schema, component_paths);

        let prop = DefinitionProperty {
            name: Some(name.to_string()),
            property_type: property_type::XOR.to_string(),
            description: Some(description_of(schema)),
            properties: Some(properties),
            meta: Some(meta),
            ..Default::default()
        };
        if !ref_path.is_empty() {
            visited.insert(ref_path, prop.clone());
        }
        return Some(prop);
    }

    // allOf → merged property.
    if has("allOf") {
        let mut component_paths: Vec<String> = Vec::new();
        let mut merged = DefinitionProperty {
            name: Some(name.to_string()),
            property_type: type_of(schema).unwrap_or_default(),
            description: Some(description_of(schema)),
            properties: Some(vec![]),
            meta: Some(meta),
            ..Default::default()
        };

        for variant in schema
            .get("allOf")
            .and_then(|v| v.as_array())
            .into_iter()
            .flatten()
        {
            let variant = ctx.resolve(variant);
            if let Some(rp) = ctx.internal_ref_path(variant) {
                component_paths.extend(rp);
            }
            if merged.property_type.is_empty() {
                if let Some(t) = type_of(variant) {
                    merged.property_type = t;
                }
            }

            if let Some(props) = variant.get("properties").and_then(|p| p.as_object()) {
                for (prop_name, prop_schema) in props {
                    if is_built_in_prop(prop_name) {
                        continue;
                    }
                    let prop_schema = ctx.resolve(prop_schema);
                    let req = required_includes(variant, prop_name);
                    if let Some(property) = schema_object_to_property(
                        ctx,
                        prop_name,
                        prop_schema,
                        req,
                        false,
                        visited,
                        None,
                    ) {
                        let list = merged.properties.get_or_insert_with(Vec::new);
                        if let Some(idx) = list
                            .iter()
                            .position(|p| p.name.as_deref() == Some(prop_name.as_str()))
                        {
                            let existing = list[idx].clone();
                            list[idx] = spread_merge(&existing, &property);
                        } else {
                            list.push(property);
                        }
                    }
                }
            } else if let Some(property) =
                schema_object_to_property(ctx, "", variant, false, false, visited, None)
            {
                if is_of_type(&property.property_type) {
                    merged.of_property = Some(Box::new(property));
                } else if merged.of_property.is_some() {
                    let d = property
                        .description
                        .clone()
                        .filter(|d| !d.is_empty())
                        .or_else(|| {
                            merged
                                .of_property
                                .as_ref()
                                .and_then(|o| o.description.clone())
                                .filter(|d| !d.is_empty())
                        })
                        .unwrap_or_default();
                    merged.description = Some(d);
                } else {
                    merged
                        .properties
                        .get_or_insert_with(Vec::new)
                        .push(property);
                }
            }
        }

        ctx.set_internal_ref_path(schema, component_paths);
        if !ref_path.is_empty() {
            visited.insert(ref_path, merged.clone());
        }
        return Some(merged);
    }

    let mut property = DefinitionProperty {
        name: Some(name.to_string()),
        property_type: type_of(schema).unwrap_or_else(|| "object".to_string()),
        description: Some(description_of(schema)),
        meta: Some(meta.clone()),
        ..Default::default()
    };

    // enum → $$enum with value-named child properties.
    if let Some(enum_values) = schema.get("enum").and_then(|e| e.as_array()) {
        // TS builds a synthetic {properties: {<String(v)>: {type}}} object and
        // runs the plain-properties path over it (JS object keys: last-wins,
        // string-coerced).
        // JS builds an OBJECT keyed by String(value) → integer-like keys sort
        // ascending first (Object key ordering), duplicates last-write-wins at
        // the first position.
        let mut m = serde_json::Map::new();
        for v in enum_values {
            m.insert(json_key(v), serde_json::Value::Null);
        }
        let keys: Vec<String> = crate::util::js_object_keys(&m)
            .into_iter()
            .cloned()
            .collect();
        let enum_properties: Vec<DefinitionProperty> = keys
            .iter()
            .map(|key| DefinitionProperty {
                name: Some(key.clone()),
                property_type: type_of(schema).unwrap_or_else(|| "object".to_string()),
                description: Some(String::new()),
                meta: Some(vec![]),
                ..Default::default()
            })
            .collect();

        let mut meta = meta;
        meta.push(Meta {
            name: "enum-type".into(),
            value: schema.get("type").cloned().map(Some).unwrap_or(None),
        });

        let enum_property = DefinitionProperty {
            name: Some(name.to_string()),
            property_type: property_type::ENUM.to_string(),
            description: Some(description_of(schema)),
            meta: Some(meta),
            properties: Some(enum_properties),
            of_property: Some(Box::new(DefinitionProperty {
                name: Some(String::new()),
                description: Some(String::new()),
                property_type: type_of(schema).unwrap_or_default(),
                ..Default::default()
            })),
            ..Default::default()
        };

        if !ref_path.is_empty() {
            visited.insert(ref_path, enum_property.clone());
        }
        return Some(enum_property);
    }

    if let Some(props) = schema.get("properties").and_then(|p| p.as_object()) {
        let mut list = Vec::new();
        for (prop_name, prop_schema) in props {
            if is_built_in_prop(prop_name) {
                continue;
            }
            let prop_schema = ctx.resolve(prop_schema);
            let req = required_includes(schema, prop_name);
            let array_of = type_of(prop_schema).as_deref() == Some("array");
            if let Some(nested) =
                schema_object_to_property(ctx, prop_name, prop_schema, req, array_of, visited, None)
            {
                list.push(nested);
            }
        }
        property.properties = Some(list);
    } else if type_of(schema).as_deref() == Some("array") {
        if let Some(items) = schema.get("items") {
            let items_resolved = ctx.resolve(items);
            // Only when items isn't a bare unresolvable $ref (post-deref it never is).
            let mut array_property = DefinitionProperty {
                name: Some(name.to_string()),
                property_type: property_type::ARRAY.to_string(),
                description: Some(description_of(schema)),
                meta: Some(meta.clone()),
                properties: Some(vec![]),
                ..Default::default()
            };

            let items_property = schema_object_to_property(
                ctx,
                "",
                items_resolved,
                required,
                true,
                visited,
                Some(array_property.clone()),
            );

            if let Some(items_property) = items_property {
                let items_has_of = items_property
                    .of_property
                    .as_ref()
                    .map(|o| !o.property_type.is_empty())
                    .unwrap_or(false);
                if array_of || is_of_type(&items_property.property_type) || items_has_of {
                    array_property.of_property = Some(Box::new(DefinitionProperty {
                        name: Some(String::new()),
                        property_type: items_property.property_type.clone(),
                        properties: Some(items_property.properties.clone().unwrap_or_default()),
                        description: Some(items_property.description.clone().unwrap_or_default()),
                        meta: Some(items_property.meta.clone().unwrap_or_default()),
                        of_property: items_property.of_property.clone(),
                        ..Default::default()
                    }));
                } else {
                    array_property.properties = Some(vec![items_property]);
                }
            }
            if !ref_path.is_empty() {
                visited.insert(ref_path, array_property.clone());
            }
            return Some(array_property);
        }
    }

    if !ref_path.is_empty() {
        visited.insert(ref_path, property.clone());
    }
    Some(property)
}

/// JS `String(v)` for object-key coercion of enum values.
fn json_key(v: &Value) -> String {
    match v {
        Value::String(s) => s.clone(),
        Value::Null => "null".to_string(),
        Value::Bool(b) => b.to_string(),
        Value::Number(n) => n.to_string(),
        other => other.to_string(),
    }
}

/// Port of `schemaObjectToUniformDefinitionPropertyMeta` with the required
/// OVERRIDE applied first (TS: `{...schema, required: required?[name]:undefined}`).
pub fn property_meta(schema: &Value, name: &str, required: bool) -> Vec<Meta> {
    let mut meta = Vec::new();
    if schema.is_null() {
        return meta;
    }

    // The override discards the schema's own `required` entirely.
    if required {
        // required: [name] → the array branch matches `name`.
        let _ = name;
        meta.push(Meta::new("required", "true"));
    }

    if schema.get("deprecated").map(is_truthy).unwrap_or(false) {
        meta.push(Meta::new("deprecated", "true"));
    }
    if let Some(default) = schema.get("default") {
        meta.push(Meta {
            name: "defaults".into(),
            value: Some(default.clone()),
        });
    }
    // Presence, not truthiness — `nullable: false` ALSO yields "true" (TS quirk).
    if schema.get("nullable").is_some() {
        meta.push(Meta::new("nullable", "true"));
    }
    if let Some(example) = schema.get("example") {
        // TS: `typeof example === "object" ? JSON.stringify(example) : example`
        // — JS typeof covers objects, arrays AND null ("object" for all three).
        let value = if example.is_object() || example.is_array() || example.is_null() {
            Value::String(serde_json::to_string(example).unwrap_or_default())
        } else {
            example.clone()
        };
        meta.push(Meta {
            name: "example".into(),
            value: Some(value),
        });
    }
    if let Some(examples) = schema.get("examples") {
        meta.push(Meta {
            name: "examples".into(),
            value: Some(examples.clone()),
        });
    }
    if let Some(maximum) = schema.get("maximum") {
        meta.push(Meta {
            name: "maximum".into(),
            value: Some(maximum.clone()),
        });
    }
    if let Some(minimum) = schema.get("minimum") {
        meta.push(Meta {
            name: "minimum".into(),
            value: Some(minimum.clone()),
        });
    }

    meta
}

fn is_truthy(v: &Value) -> bool {
    match v {
        Value::Bool(b) => *b,
        Value::Null => false,
        Value::Number(n) => n.as_f64().map(|f| f != 0.0).unwrap_or(true),
        Value::String(s) => !s.is_empty(),
        _ => true,
    }
}
