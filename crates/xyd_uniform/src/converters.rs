//! Reference → input JSON Schema — port of packages/xyd-uniform/src/converters.ts.
//! Operates on raw JSON values (the JS impl reads fields loosely and copies
//! `description` through whatever it is, including null); field-presence
//! semantics mirror `JSON.stringify` (undefined keys omitted).

use serde_json::{Map, Value};

use crate::jsrt::truthy;

const TYPE_ENUM: &str = "$$enum";
const TYPE_ARRAY: &str = "$$array";
const TYPE_XOR: &str = "$$xor";
const TYPE_UNION: &str = "$$union";

/// Port of `uniformToInputJsonSchema(reference)`. Returns None where JS
/// returns null.
pub fn uniform_to_input_json_schema(reference: &Value) -> Option<Value> {
    let definitions = reference.get("definitions")?.as_array()?;
    if definitions.is_empty() {
        return None;
    }

    let mut input_definitions: Vec<Value> = Vec::new();

    for def in definitions {
        if def.get("type").and_then(|t| t.as_str()) == Some("return") {
            continue;
        }

        let mut definition_schemas: Vec<Value> = Vec::new();

        // Main properties.
        if let Some(props) = def.get("properties").and_then(|p| p.as_array()) {
            if !props.is_empty() {
                if let Some(result) = properties_array_to_schema(props, def.get("type")) {
                    definition_schemas.push(result);
                }
            }
        }

        // Variant properties → oneOf.
        if let Some(variants) = def.get("variants").and_then(|v| v.as_array()) {
            if !variants.is_empty() {
                let mut variant_schemas: Vec<Value> = Vec::new();
                for variant in variants {
                    if let Some(props) = variant.get("properties").and_then(|p| p.as_array()) {
                        if !props.is_empty() {
                            if let Some(result) = properties_array_to_schema(props, def.get("type"))
                            {
                                variant_schemas.push(result);
                            }
                        }
                    }
                }
                if variant_schemas.len() == 1 {
                    definition_schemas.push(variant_schemas.into_iter().next().unwrap());
                } else if !variant_schemas.is_empty() {
                    let mut o = Map::new();
                    o.insert("oneOf".into(), Value::Array(variant_schemas));
                    definition_schemas.push(Value::Object(o));
                }
            }
        }

        if definition_schemas.len() == 1 {
            input_definitions.push(definition_schemas.into_iter().next().unwrap());
        } else if definition_schemas.len() > 1 {
            let mut o = Map::new();
            o.insert("allOf".into(), Value::Array(definition_schemas));
            input_definitions.push(Value::Object(o));
        }
    }

    if input_definitions.is_empty() {
        None
    } else if input_definitions.len() == 1 {
        Some(input_definitions.into_iter().next().unwrap())
    } else {
        let mut o = Map::new();
        o.insert("allOf".into(), Value::Array(input_definitions));
        Some(Value::Object(o))
    }
}

/// Copy `description` the way `{description: x.description}` does: key exists
/// → copied verbatim (even null); key absent → omitted.
fn copy_description(prop: &Value, out: &mut Map<String, Value>) {
    if let Some(d) = prop.get("description") {
        out.insert("description".into(), d.clone());
    }
}

/// The array overload of `uniformPropertiesToJsonSchema(properties[], id?)`.
fn properties_array_to_schema(properties: &[Value], id: Option<&Value>) -> Option<Value> {
    let mut json_schema_props: Map<String, Value> = Map::new();
    let mut required_fields: Vec<Value> = Vec::new();

    for property in properties {
        let name = property
            .get("name")
            .and_then(|n| n.as_str())
            .unwrap_or("")
            .to_string();
        if let Some(v) = uniform_properties_to_json_schema(property) {
            json_schema_props.insert(name.clone(), v);
        }
        let is_required = property
            .get("meta")
            .and_then(|m| m.as_array())
            .map(|metas| {
                metas.iter().any(|meta| {
                    meta.get("name").and_then(|n| n.as_str()) == Some("required")
                        && meta.get("value").and_then(|v| v.as_str()) == Some("true")
                })
            })
            .unwrap_or(false);
        if is_required {
            required_fields.push(Value::String(name));
        }
    }

    let mut schema = Map::new();
    // `$id: id || undefined` — truthiness gate, omitted when falsy.
    if truthy(id) {
        schema.insert("$id".into(), id.unwrap().clone());
    }
    schema.insert("type".into(), Value::String("object".into()));
    schema.insert("properties".into(), Value::Object(json_schema_props));
    if !required_fields.is_empty() {
        schema.insert("required".into(), Value::Array(required_fields));
    }
    Some(Value::Object(schema))
}

/// The single-property overload of `uniformPropertiesToJsonSchema`.
pub fn uniform_properties_to_json_schema(prop: &Value) -> Option<Value> {
    if let Some(arr) = prop.as_array() {
        // (callers in this crate use properties_array_to_schema directly, but
        // keep the array overload for API parity)
        return properties_array_to_schema(arr, None);
    }

    let prop_type = prop.get("type").and_then(|t| t.as_str()).unwrap_or("");

    // Enum.
    if prop_type == TYPE_ENUM {
        let mut schema = Map::new();
        copy_description(prop, &mut schema);

        // enumType: ofProperty.type || meta("enum-type").value || "string"
        let of_type = prop
            .get("ofProperty")
            .and_then(|o| o.get("type"))
            .filter(|t| truthy(Some(t)));
        let meta_type = prop
            .get("meta")
            .and_then(|m| m.as_array())
            .and_then(|metas| {
                metas
                    .iter()
                    .find(|meta| meta.get("name").and_then(|n| n.as_str()) == Some("enum-type"))
                    .and_then(|meta| meta.get("value"))
                    .filter(|v| truthy(Some(v)))
                    .cloned()
            });
        let enum_type = match (of_type, meta_type) {
            (Some(t), _) => t.clone(),
            (None, Some(t)) => t,
            (None, None) => Value::String("string".into()),
        };
        schema.insert("type".into(), enum_type);

        if let Some(props) = prop.get("properties").and_then(|p| p.as_array()) {
            if !props.is_empty() {
                let values: Vec<Value> = props
                    .iter()
                    .map(|p| p.get("name").cloned().unwrap_or(Value::Null))
                    .collect();
                schema.insert("enum".into(), Value::Array(values));
            }
        }
        return Some(Value::Object(schema));
    }

    // Array.
    if prop_type == TYPE_ARRAY {
        let mut schema = Map::new();
        schema.insert("type".into(), Value::String("array".into()));
        copy_description(prop, &mut schema);
        if let Some(of) = prop.get("ofProperty") {
            if truthy(Some(of)) {
                if let Some(items) = uniform_properties_to_json_schema(of) {
                    schema.insert("items".into(), items);
                }
            }
        }
        return Some(Value::Object(schema));
    }

    // XOR → oneOf / UNION → anyOf.
    if prop_type == TYPE_XOR || prop_type == TYPE_UNION {
        let key = if prop_type == TYPE_XOR {
            "oneOf"
        } else {
            "anyOf"
        };
        let mut schema = Map::new();
        copy_description(prop, &mut schema);
        if let Some(props) = prop.get("properties").and_then(|p| p.as_array()) {
            if !props.is_empty() {
                let alts: Vec<Value> = props
                    .iter()
                    .map(|p| {
                        uniform_properties_to_json_schema(p).unwrap_or(Value::Object(Map::new()))
                    })
                    .filter(|s| s.as_object().map(|o| !o.is_empty()).unwrap_or(true))
                    .collect();
                schema.insert(key.into(), Value::Array(alts));
            }
        }
        return Some(Value::Object(schema));
    }

    // `if (properties.ofProperty)` — recurse into the referenced property.
    if let Some(of) = prop.get("ofProperty") {
        if truthy(Some(of)) {
            return uniform_properties_to_json_schema(of);
        }
    }

    // Plain property.
    let mut schema = Map::new();
    if let Some(t) = prop.get("type") {
        schema.insert("type".into(), t.clone());
    }
    copy_description(prop, &mut schema);

    if prop_type == "object" {
        if let Some(props) = prop.get("properties").and_then(|p| p.as_array()) {
            if !props.is_empty() {
                if let Some(nested) = properties_array_to_schema(props, None) {
                    if let Some(nested_obj) = nested.as_object() {
                        if let Some(p) = nested_obj.get("properties") {
                            schema.insert("properties".into(), p.clone());
                        }
                        if let Some(r) = nested_obj.get("required") {
                            schema.insert("required".into(), r.clone());
                        }
                    }
                }
            }
        }
    }

    Some(Value::Object(schema))
}
