//! The nominal symbol table — port of src/nominal.ts. Works on the RAW
//! (un-dereferenced) document so component identity survives; self/circular
//! refs resolve through a reserved placeholder; structurally identical
//! hoisted inline types dedup (components keep their identity).

use serde_json::{Map, Value};
use std::collections::{HashMap, HashSet};

use crate::jsrt::{js_object_keys, pascal_case, stable_stringify, unique_name};
use crate::model::{Discriminator, EnumValue, Field, NamedType, TypeRef};
use crate::schema::{
    array_items, get_default, get_description, get_enum, is_array, is_nullable, is_object_schema,
    is_ref, is_truthy_flag, map_values, merge_all_of, non_null_types, ref_str, scalar_type,
};

/// The component key of a `#/components/schemas/Name` ref.
fn component_key(r: &str) -> Option<&str> {
    r.strip_prefix("#/components/schemas/")
        .filter(|k| !k.is_empty())
}

/// A `{type:'null'}` / `const: null` / `enum: [null]` union variant.
fn is_null_variant(v: &Value) -> bool {
    if is_ref(v) {
        return false;
    }
    if v.get("const") == Some(&Value::Null) {
        return true;
    }
    if let Some(Value::Array(e)) = v.get("enum") {
        if e.len() == 1 && e[0].is_null() {
            return true;
        }
    }
    let types: Vec<&str> = match v.get("type") {
        Some(Value::String(s)) => vec![s.as_str()],
        Some(Value::Array(arr)) => arr.iter().filter_map(|t| t.as_str()).collect(),
        _ => vec![],
    };
    !types.is_empty() && types.iter().all(|t| *t == "null")
}

/// Drop null-only variants; they mark the union reference nullable instead.
fn split_null_variants<'v>(variants: &[&'v Value]) -> (Vec<&'v Value>, bool) {
    let kept: Vec<&Value> = variants
        .iter()
        .copied()
        .filter(|v| !is_null_variant(v))
        .collect();
    let nullable = kept.len() != variants.len();
    (kept, nullable)
}

/// The single string const of a schema (`const` or a 1-value enum).
fn string_const(s: Option<&Value>) -> Option<&str> {
    let values = get_enum(s)?;
    if values.len() == 1 {
        values[0].as_str()
    } else {
        None
    }
}

/// JS truthiness for schema fields gated with a bare `if (x)`.
fn truthy(v: Option<&Value>) -> bool {
    match v {
        None | Some(Value::Null) => false,
        Some(Value::Bool(b)) => *b,
        Some(Value::String(s)) => !s.is_empty(),
        Some(Value::Number(n)) => n.as_f64().map(|f| f != 0.0).unwrap_or(true),
        Some(_) => true, // objects and arrays (even empty) are truthy
    }
}

/// The `oneOf || anyOf` union member list (JS truthiness on the whole field,
/// then the `Array.isArray(u) && u.length` gate).
fn union_members(s: &Value) -> Option<Vec<&Value>> {
    let u = if truthy(s.get("oneOf")) {
        s.get("oneOf")
    } else if truthy(s.get("anyOf")) {
        s.get("anyOf")
    } else {
        None
    }?;
    match u {
        Value::Array(arr) if !arr.is_empty() => Some(arr.iter().collect()),
        _ => None,
    }
}

pub struct SymbolTable<'a> {
    schemas: Option<&'a Map<String, Value>>,
    /// name -> slot; tombstoned on hoist-dedup rollback. Insertion-ordered.
    slots: Vec<Option<NamedType>>,
    index: HashMap<String, usize>,
    used: HashSet<String>,
    by_component: HashMap<String, String>,
    by_shape: HashMap<String, String>,
}

impl<'a> SymbolTable<'a> {
    pub fn new(doc: &'a Value) -> Self {
        SymbolTable {
            schemas: doc
                .get("components")
                .and_then(|c| c.get("schemas"))
                .and_then(|s| s.as_object()),
            slots: Vec::new(),
            index: HashMap::new(),
            used: HashSet::new(),
            by_component: HashMap::new(),
            by_shape: HashMap::new(),
        }
    }

    /// All named types in resolution order.
    pub fn emit(&self) -> Vec<NamedType> {
        self.slots.iter().flatten().cloned().collect()
    }

    pub fn get(&self, name: &str) -> Option<&NamedType> {
        self.index
            .get(name)
            .and_then(|&i| self.slots.get(i))
            .and_then(|s| s.as_ref())
    }

    fn set_type(&mut self, name: &str, t: NamedType) {
        match self.index.get(name) {
            Some(&i) => self.slots[i] = Some(t),
            None => {
                self.index.insert(name.to_string(), self.slots.len());
                self.slots.push(Some(t));
            }
        }
    }

    fn delete_type(&mut self, name: &str) {
        if let Some(i) = self.index.remove(name) {
            self.slots[i] = None;
        }
    }

    fn component_schema(&self, key: &str) -> Option<&'a Value> {
        self.schemas?.get(key)
    }

    /// Follow a `$ref` chain through components.schemas to its raw schema.
    /// Returns None when `member` isn't a ref (JS returns undefined).
    fn resolve_ref_schema(&self, member: &Value) -> Option<&'a Value> {
        if !is_ref(member) {
            return None;
        }
        let mut visited: HashSet<String> = HashSet::new();
        let key0 = component_key(ref_str(member)?)?;
        visited.insert(key0.to_string());
        let mut current: Option<&'a Value> = self.component_schema(key0);
        while let Some(c) = current {
            if !is_ref(c) {
                break;
            }
            let key = component_key(ref_str(c)?)?;
            if visited.contains(key) {
                return None;
            }
            visited.insert(key.to_string());
            current = self.component_schema(key);
        }
        current
    }

    /// mergeAllOf with `$ref` members resolved against the components.
    fn merged_all_of(&self, s: &Value) -> Value {
        let mut seen = HashSet::new();
        merge_all_of(Some(s), &|m| self.resolve_ref_schema(m), &mut seen)
            .unwrap_or_else(|| s.clone())
    }

    /// Resolve a schema (through `$ref` chains) and flatten allOf into its
    /// effective object shape (pagination-envelope detection).
    pub fn resolve_object_schema(&self, schema: Option<&Value>) -> Option<Value> {
        let schema = schema?;
        let raw: &Value = if is_ref(schema) {
            self.resolve_ref_schema(schema)?
        } else {
            schema
        };
        Some(self.merged_all_of(raw))
    }

    /// The `allOf: [$ref X, {nullable/description-only}]` wrapper pattern.
    fn wrapper_ref_key(&self, s: &Value) -> Option<(String, bool)> {
        let all_of = match s.get("allOf") {
            Some(Value::Array(arr)) if !arr.is_empty() => arr,
            _ => return None,
        };
        if let Some(Value::Object(props)) = s.get("properties") {
            if !props.is_empty() {
                return None;
            }
        }
        let mut key: Option<String> = None;
        let mut nullable = is_nullable(Some(s));
        for member in all_of {
            if is_ref(member) {
                if key.is_some() {
                    return None; // two refs -> real composition, flatten it
                }
                key = Some(component_key(ref_str(member)?)?.to_string());
                continue;
            }
            let m = member;
            let has_props = matches!(m.get("properties"), Some(Value::Object(p)) if !p.is_empty());
            let structural = has_props
                || m.get("enum").is_some()
                || m.get("const").is_some()
                || truthy(m.get("oneOf"))
                || truthy(m.get("anyOf"))
                || truthy(m.get("allOf"))
                || truthy(m.get("items"))
                || m.get("additionalProperties").is_some();
            if structural {
                return None;
            }
            if is_nullable(Some(m)) {
                nullable = true;
            }
        }
        key.map(|k| (k, nullable))
    }

    /// Resolve a schema (or `$ref`) into a structural TypeRef; inline
    /// objects/enums/unions hoist under a deterministic name from `hint`.
    pub fn resolve_type_ref(&mut self, schema: Option<&Value>, hint: &str) -> TypeRef {
        let Some(schema) = schema else {
            return TypeRef::any();
        };

        if is_ref(schema) {
            if let Some(key) = ref_str(schema).and_then(component_key) {
                let key = key.to_string();
                return TypeRef::reference(self.register_component(&key));
            }
            return TypeRef::any();
        }

        let s = schema;
        let nullable = is_nullable(Some(s));

        // single-value const / 1-value enum -> a literal scalar
        if let Some(enum_values) = get_enum(Some(s)) {
            if enum_values.len() == 1 {
                if enum_values[0].is_null() {
                    return maybe_null(TypeRef::any(), true);
                }
                let value = enum_values[0].clone();
                return maybe_null(self.const_scalar(s, &value), nullable);
            }
            // enum -> a named enum
            let values: Vec<Value> = enum_values.into_iter().cloned().collect();
            let s_clone = s.clone();
            let name = self.hoist(hint, |st, self_name| {
                st.build_enum(&s_clone, &values, Some(self_name))
            });
            return maybe_null(TypeRef::reference(name), nullable);
        }

        // oneOf / anyOf -> a named union
        if let Some(union) = union_members(s) {
            let (kept, null_variant) = split_null_variants(&union);
            if kept.is_empty() {
                return maybe_null(TypeRef::any(), true);
            }
            if kept.len() == 1 {
                // `oneOf: [T, null]` is not a union — it's a nullable T.
                let inner = self.resolve_type_ref(Some(kept[0]), hint);
                return maybe_null(inner, nullable || null_variant);
            }
            let s_clone = s.clone();
            let kept_owned: Vec<Value> = kept.iter().map(|v| (*v).clone()).collect();
            let name = self.hoist(hint, |st, self_name| {
                st.build_union(self_name, &s_clone, &kept_owned)
            });
            return maybe_null(TypeRef::reference(name), nullable || null_variant);
        }

        // array
        if is_array(Some(s)) {
            let items = self.resolve_type_ref(array_items(Some(s)), &format!("{hint}Item"));
            let mut r = TypeRef::of_kind("array");
            r.items = Some(Box::new(items));
            return maybe_null(r, nullable);
        }

        // scalar
        if let Some(scalar) = scalar_type(Some(s)) {
            let mut r = TypeRef::of_kind("scalar");
            r.scalar = Some(scalar.to_string());
            if let Some(f) = s.get("format").and_then(|f| f.as_str()) {
                if !f.is_empty() {
                    r.format = Some(f.to_string());
                }
            }
            return maybe_null(r, nullable);
        }

        // allOf wrapper around a single $ref -> a (nullable) reference
        if let Some((key, wrapper_nullable)) = self.wrapper_ref_key(s) {
            let r = TypeRef::reference(self.register_component(&key));
            return maybe_null(r, nullable || wrapper_nullable);
        }

        // map / object on the flattened shape
        let merged = self.merged_all_of(s);
        if let Some(as_map) = self.map_ref(&merged, hint) {
            return maybe_null(as_map, nullable);
        }
        if is_object_schema(Some(&merged)) || truthy(merged.get("allOf")) {
            let merged_clone = merged.clone();
            let name = self.hoist(hint, |st, self_name| {
                st.build_struct(self_name, &merged_clone)
            });
            return maybe_null(TypeRef::reference(name), nullable);
        }

        maybe_null(TypeRef::any(), nullable)
    }

    /// A map TypeRef for an object with no fixed properties.
    fn map_ref(&mut self, merged: &Value, hint: &str) -> Option<TypeRef> {
        if matches!(merged.get("properties"), Some(Value::Object(p)) if !p.is_empty()) {
            return None;
        }
        if let Some(value_schema) = map_values(Some(merged)) {
            let value_schema = value_schema.clone();
            let values = self.resolve_type_ref(Some(&value_schema), &format!("{hint}Value"));
            let mut r = TypeRef::of_kind("map");
            r.values = Some(Box::new(values));
            return Some(r);
        }
        let ap = merged.get("additionalProperties");
        if ap == Some(&Value::Bool(true)) || (ap.is_none() && is_object_schema(Some(merged))) {
            let mut r = TypeRef::of_kind("map");
            r.values = Some(Box::new(TypeRef::any()));
            return Some(r);
        }
        None
    }

    /// Register a component `$ref` target, building it once.
    fn register_component(&mut self, key: &str) -> String {
        if let Some(existing) = self.by_component.get(key) {
            return existing.clone();
        }
        let name = unique_name(&pascal_case(key), &mut self.used);
        self.by_component.insert(key.to_string(), name.clone());
        // Reserve a placeholder so self/circular refs resolve first.
        self.set_type(&name, NamedType::placeholder(name.clone()));

        let schema = self.component_schema(key).cloned();
        let built = self.build_from_schema(&name, schema.as_ref());
        self.set_type(&name, built);
        name
    }

    /// Hoist an inline type under a fresh name derived from `hint`.
    fn hoist(&mut self, hint: &str, build: impl FnOnce(&mut Self, &str) -> NamedType) -> String {
        let base = {
            let p = pascal_case(hint);
            if p.is_empty() {
                "Type".to_string()
            } else {
                p
            }
        };
        let name = unique_name(&base, &mut self.used);
        self.set_type(&name, NamedType::placeholder(name.clone()));
        let mut built = build(self, &name);
        built.name = name.clone(); // the hoisted name is authoritative

        // Inline dedup: identical body (name/description excluded) reuses the
        // earlier hoisted type. Components stay out of the index.
        let shape = structural_key(&built);
        if let Some(existing) = self.by_shape.get(&shape) {
            let existing = existing.clone();
            self.delete_type(&name);
            self.used.remove(&name);
            return existing;
        }
        self.by_shape.insert(shape, name.clone());
        self.set_type(&name, built);
        name
    }

    /// Classify a raw schema into a NamedType body under a reserved `name`.
    fn build_from_schema(&mut self, name: &str, schema: Option<&Value>) -> NamedType {
        let Some(schema) = schema else {
            let of = self.resolve_type_ref(None, name);
            return alias(name, of, None);
        };
        if is_ref(schema) {
            let of = self.resolve_type_ref(Some(schema), name);
            return alias(name, of, None);
        }
        let s = schema;

        if let Some(enum_values) = get_enum(Some(s)) {
            // a component-level standalone const -> an alias of the literal scalar
            if enum_values.len() == 1 {
                if enum_values[0].is_null() {
                    let mut of = TypeRef::any();
                    of.nullable = Some(true);
                    return alias(name, of, None);
                }
                let value = enum_values[0].clone();
                let mut of = self.const_scalar(s, &value);
                if is_nullable(Some(s)) {
                    of.nullable = Some(true);
                }
                let desc = get_description(Some(s)).map(|d| d.to_string());
                return alias(name, of, desc);
            }
            let values: Vec<Value> = enum_values.into_iter().cloned().collect();
            return self.build_enum(s, &values, Some(name));
        }

        if let Some(union) = union_members(s) {
            let (kept, null_variant) = split_null_variants(&union);
            if kept.is_empty() {
                let mut of = TypeRef::any();
                of.nullable = Some(true);
                return alias(name, of, None);
            }
            if kept.len() == 1 {
                // `oneOf: [T, null]` component -> the component IS a (nullable) T
                if is_ref(kept[0]) {
                    let mut of = self.resolve_type_ref(Some(kept[0]), name);
                    if null_variant {
                        of.nullable = Some(true);
                    }
                    return alias(name, of, None);
                }
                let kept0 = kept[0].clone();
                let mut built = self.build_from_schema(name, Some(&kept0));
                if null_variant && built.kind == "alias" {
                    if let Some(of) = built.of.as_mut() {
                        of.nullable = Some(true);
                    }
                }
                return built;
            }
            let kept_owned: Vec<Value> = kept.iter().map(|v| (*v).clone()).collect();
            return self.build_union(name, s, &kept_owned);
        }

        // a component that is itself an allOf wrapper around one $ref -> alias
        if let Some((key, wrapper_nullable)) = self.wrapper_ref_key(s) {
            let mut of = TypeRef::reference(self.register_component(&key));
            if wrapper_nullable {
                of.nullable = Some(true);
            }
            return alias(name, of, None);
        }

        let merged = self.merged_all_of(s);
        if let Some(as_map) = self.map_ref(&merged, name) {
            return alias(name, as_map, None);
        }
        if is_object_schema(Some(&merged)) || truthy(merged.get("allOf")) {
            return self.build_struct(name, &merged);
        }

        // top-level scalar / array component -> an alias (newtype)
        let of = self.resolve_type_ref(Some(s), name);
        alias(name, of, None)
    }

    /// A fixed-literal scalar TypeRef for a single-value const / 1-value enum.
    fn const_scalar(&self, s: &Value, value: &Value) -> TypeRef {
        let base: String = match scalar_type(Some(s)) {
            Some(t) => t.to_string(),
            None => match value {
                Value::Number(n) => {
                    let integral = n.as_i64().is_some()
                        || n.as_u64().is_some()
                        || n.as_f64().map(|f| f.fract() == 0.0).unwrap_or(false);
                    if integral { "integer" } else { "number" }.to_string()
                }
                Value::Bool(_) => "boolean".to_string(),
                _ => "string".to_string(),
            },
        };
        let mut r = TypeRef::of_kind("scalar");
        r.scalar = Some(base);
        r.konst = Some(value.clone());
        if let Some(f) = s.get("format").and_then(|f| f.as_str()) {
            if !f.is_empty() {
                r.format = Some(f.to_string());
            }
        }
        r
    }

    fn build_enum(&mut self, s: &Value, values: &[Value], name: Option<&str>) -> NamedType {
        let types = non_null_types(Some(s));
        let base = if types.contains(&"integer") || types.contains(&"number") {
            "integer"
        } else {
            "string"
        };
        let enum_values: Vec<EnumValue> = values
            .iter()
            .filter(|v| !v.is_null())
            .map(|v| EnumValue { value: v.clone() })
            .collect();
        let mut t = NamedType::placeholder(name.unwrap_or("").to_string());
        t.kind = "enum".to_string();
        t.base = Some(base.to_string());
        t.values = Some(enum_values);
        t.description = get_description(Some(s)).map(|d| d.to_string());
        t
    }

    /// Callers pass null-filtered `variants`.
    fn build_union(&mut self, name: &str, s: &Value, variants: &[Value]) -> NamedType {
        // Every variant a string const -> ONE named enum.
        if let Some(consts) = const_strings(variants) {
            return self.build_enum(s, &consts, Some(name));
        }

        let semantics = if matches!(s.get("oneOf"), Some(Value::Array(_))) {
            "oneOf"
        } else {
            "anyOf"
        };
        let disc = s.get("discriminator");
        let disc_prop = disc
            .and_then(|d| d.get("propertyName"))
            .and_then(|p| p.as_str())
            .map(|p| p.to_string());
        let variant_refs: Vec<TypeRef> = variants
            .iter()
            .enumerate()
            .map(|(i, v)| {
                let suffix = variant_suffix(v, i, disc_prop.as_deref());
                self.resolve_type_ref(Some(v), &format!("{name}{suffix}"))
            })
            .collect();

        let mut t = NamedType::placeholder(name.to_string());
        t.kind = "union".to_string();
        t.semantics = Some(semantics.to_string());
        t.variants = Some(variant_refs.clone());
        if let Some(prop_name) = disc_prop.as_deref() {
            if !prop_name.is_empty() {
                let mut d = Discriminator {
                    property_name: prop_name.to_string(),
                    mapping: None,
                };
                d.mapping =
                    self.discriminator_mapping(disc.unwrap(), variants, &variant_refs, prop_name);
                t.discriminator = Some(d);
            }
        }
        t.description = get_description(Some(s)).map(|d| d.to_string());
        t
    }

    /// discriminator value -> variant TYPE NAME map (explicit mapping first,
    /// else derived from const-valued discriminator properties).
    fn discriminator_mapping(
        &mut self,
        disc: &Value,
        variants: &[Value],
        variant_refs: &[TypeRef],
        disc_prop: &str,
    ) -> Option<Map<String, Value>> {
        let mut out: Map<String, Value> = Map::new();
        let explicit = disc
            .get("mapping")
            .and_then(|m| m.as_object())
            .filter(|m| !m.is_empty());
        if let Some(mapping) = explicit {
            let entries: Vec<(String, String)> = js_object_keys(mapping)
                .into_iter()
                .filter_map(|value| {
                    let target = mapping.get(value)?.as_str()?;
                    let key = component_key(target).or_else(|| {
                        if self
                            .schemas
                            .map(|s| s.contains_key(target))
                            .unwrap_or(false)
                        {
                            Some(target)
                        } else {
                            None
                        }
                    })?;
                    if self.schemas.map(|s| s.contains_key(key)).unwrap_or(false) {
                        Some((value.clone(), key.to_string()))
                    } else {
                        None
                    }
                })
                .collect();
            for (value, key) in entries {
                let name = self.register_component(&key);
                out.insert(value, Value::String(name));
            }
        } else {
            for (i, v) in variants.iter().enumerate() {
                let Some(r) = variant_refs.get(i) else {
                    continue;
                };
                if r.kind != "ref" {
                    continue;
                }
                let Some(ref_name) = r.name.clone() else {
                    continue;
                };
                let raw: Option<&Value> = if is_ref(v) {
                    self.resolve_ref_schema(v)
                } else {
                    Some(v)
                };
                let Some(raw) = raw else { continue };
                let merged = self.merged_all_of(raw);
                let value = merged
                    .get("properties")
                    .and_then(|p| p.get(disc_prop))
                    .filter(|p| !is_ref(p))
                    .and_then(|p| string_const(Some(p)).map(|s| s.to_string()));
                if let Some(value) = value {
                    out.insert(value, Value::String(ref_name));
                }
            }
        }
        if out.is_empty() {
            None
        } else {
            Some(out)
        }
    }

    fn build_struct(&mut self, name: &str, s: &Value) -> NamedType {
        let required: HashSet<String> = match s.get("required") {
            Some(Value::Array(arr)) => arr
                .iter()
                .filter_map(|r| r.as_str().map(|x| x.to_string()))
                .collect(),
            _ => HashSet::new(),
        };
        let empty = Map::new();
        let props = s
            .get("properties")
            .and_then(|p| p.as_object())
            .unwrap_or(&empty)
            .clone();

        let mut fields: Vec<Field> = Vec::new();
        for prop_name in js_object_keys(&props) {
            let prop_schema = &props[prop_name];
            let field_type = self.resolve_type_ref(
                Some(prop_schema),
                &format!("{name}{}", pascal_case(prop_name)),
            );
            let mut field = Field {
                name: prop_name.clone(),
                field_type,
                required: required.contains(prop_name),
                nullable: None,
                read_only: None,
                write_only: None,
                deprecated: None,
                default: None,
                description: None,
            };
            if !is_ref(prop_schema) {
                if is_nullable(Some(prop_schema)) {
                    field.nullable = Some(true);
                }
                if is_truthy_flag(prop_schema, "readOnly") {
                    field.read_only = Some(true);
                }
                if is_truthy_flag(prop_schema, "writeOnly") {
                    field.write_only = Some(true);
                }
                if is_truthy_flag(prop_schema, "deprecated") {
                    field.deprecated = Some(true);
                }
                if let Some(d) = get_default(Some(prop_schema)) {
                    field.default = Some(d.clone());
                }
                if let Some(d) = get_description(Some(prop_schema)) {
                    field.description = Some(d.to_string());
                }
            }
            fields.push(field);
        }

        let mut t = NamedType::placeholder(name.to_string());
        t.fields = Some(fields);
        t.description = get_description(Some(s)).map(|d| d.to_string());
        t
    }
}

fn alias(name: &str, of: TypeRef, description: Option<String>) -> NamedType {
    let mut t = NamedType::placeholder(name.to_string());
    t.kind = "alias".to_string();
    t.of = Some(of);
    t.description = description;
    t
}

fn maybe_null(mut r: TypeRef, nullable: bool) -> TypeRef {
    if nullable {
        r.nullable = Some(true);
    }
    r
}

/// Structural hash of a NamedType body — name/description excluded.
fn structural_key(t: &NamedType) -> String {
    let mut v = serde_json::to_value(t).expect("NamedType serializes");
    if let Some(obj) = v.as_object_mut() {
        obj.remove("name");
        obj.remove("description");
    }
    stable_stringify(&v)
}

/// The consts when EVERY variant is a string const / 1-value enum (deduped).
fn const_strings(variants: &[Value]) -> Option<Vec<Value>> {
    let mut out: Vec<Value> = Vec::new();
    let mut seen: HashSet<String> = HashSet::new();
    for v in variants {
        if is_ref(v) {
            return None;
        }
        let value = string_const(Some(v))?;
        if seen.insert(value.to_string()) {
            out.push(Value::String(value.to_string()));
        }
    }
    Some(out)
}

/// Hoist-name suffix for an inline union variant.
fn variant_suffix(v: &Value, index: usize, disc_prop: Option<&str>) -> String {
    let fallback = format!("Variant{index}");
    if is_ref(v) {
        return fallback;
    }
    let s = v;

    // a lone const variant among mixed variants -> named after its value
    if let Some(own) = string_const(Some(s)) {
        let p = pascal_case(own);
        return if p.is_empty() { fallback } else { p };
    }

    let empty = Map::new();
    let props = s
        .get("properties")
        .and_then(|p| p.as_object())
        .unwrap_or(&empty);
    let candidates: Vec<&str> = match disc_prop {
        Some(d) => vec![d, "type", "role"],
        None => vec!["type", "role"],
    };
    for key in candidates {
        if let Some(p) = props.get(key) {
            if !is_ref(p) {
                if let Some(value) = string_const(Some(p)) {
                    let pc = pascal_case(value);
                    return if pc.is_empty() { fallback } else { pc };
                }
            }
        }
    }
    if let Some(title) = s.get("title").and_then(|t| t.as_str()) {
        if !title.trim().is_empty() {
            let pc = pascal_case(title);
            return if pc.is_empty() { fallback } else { pc };
        }
    }
    if is_array(Some(s)) {
        return "Array".to_string();
    }
    if let Some(scalar) = scalar_type(Some(s)) {
        return pascal_case(scalar);
    }
    fallback
}
