//! IR-to-IR breaking-change differ: compares two OpenSDK specs (typically the
//! IR of two spec versions) and classifies every change by SDK-consumer impact.
//!
//! Rust port of `packages/xyd-opensdk-core/src/diff.ts`. It powers
//! `opensdk diff --fail-on breaking`, so a misclassification silently lets a
//! breaking change ship — the port is therefore gated byte-for-byte against a
//! golden corpus produced by the TypeScript original
//! (`packages/xyd-opensdk-core/__fixtures__/diff/`, see `tests/golden.rs`).
//!
//! # Why this operates on `serde_json::Value`
//!
//! The TS runs on `JSON.parse`d specs with no validation, and its output
//! depends on JS coercion rules applied to whatever is actually in the
//! document: truthiness of `required`, nullish-vs-falsy `wireName`,
//! `Array.join` flattening a missing `name` to `""`, `JSON.stringify` of an
//! absent enum `value` yielding `undefined`. Deserializing into typed structs
//! would normalize those away. Everything JS-semantic lives in [`jsval`].
//!
//! # Known divergences from the TypeScript
//!
//! All are cases where the TS **throws** on malformed input and this port stays
//! total instead. None are reachable from an IR the converter produces:
//!
//! - a non-array `resources` / `methods` / `params` / `values` / `variants`
//!   (TS: `for…of` / `.map` TypeError) is treated as empty;
//! - a missing/non-string `httpMethod` on a method whose binding changed
//!   (TS: `undefined.toUpperCase()` TypeError) renders via JS `String(...)`;
//! - a `null` entry inside `types` / params / fields (TS: reading `.name` off
//!   `null`) is skipped rather than panicking.
//!
//! Those TS-throws paths also leave two spots with no observable behavior to
//! port, so the choice here is by inspection rather than by oracle:
//!
//! - the `param-added`/`field-added` loops use key PRESENCE (`baseByName.has`)
//!   rather than truthiness, matching the TS line literally. The two only
//!   differ when a params/fields array holds a falsy entry, which the TS's
//!   `.map(p => [p.name, p])` throws on first;
//! - the same goes for `typeKey`'s `!ref` guard on a `false`/`0`/`""` type.
//!
//! One further divergence is structural: `typeKey`'s `default` branch returns
//! `ref.kind ?? 'any'` — the raw value, which in JS need not be a string. If a
//! spec had `kind: 5` on one side and `kind: "5"` on the other, JS would call
//! them different (`5 !== "5"`) where this port calls them equal. `kind` is a
//! string in every IR the converter emits.

mod jsval;
mod ordered;

use serde::{Deserialize, Serialize};
use serde_json::Value;

use jsval::{display, join_component, nullish_or, prop, strict_eq, stringify, truthy};
use ordered::{OrderedMap, OrderedSet};

/// How badly a change can break a generated SDK's consumers.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum IrSeverity {
    Breaking,
    Risky,
    Safe,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct IrChange {
    pub severity: IrSeverity,
    /// Machine-friendly change class, e.g. `method-removed`, `param-type-changed`.
    pub kind: String,
    /// Human-readable location, e.g. `pets.list.queryParams.limit`, `types.Pet.fields.name`.
    pub path: String,
    pub detail: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Default, Serialize, Deserialize)]
pub struct IrDiff {
    pub changes: Vec<IrChange>,
}

impl IrDiff {
    fn add(&mut self, severity: IrSeverity, kind: &str, path: String, detail: impl Into<String>) {
        self.changes.push(IrChange {
            severity,
            kind: kind.to_string(),
            path,
            detail: detail.into(),
        });
    }
}

use IrSeverity::{Breaking, Risky, Safe};

/// A JS `Map`/`Set` key. Keys are compared with SameValueZero, so numbers
/// collapse to their canonical string (`1` and `1.0` are one key) while objects
/// compare by reference — `Ref` carries a process-unique id to model that.
#[derive(Debug, Clone, PartialEq, Eq, Hash)]
enum JsKey {
    Undefined,
    Null,
    Bool(bool),
    Num(String),
    Str(String),
    Ref(u64),
}

fn js_key(v: Option<&Value>, next_ref: &mut u64) -> JsKey {
    match v {
        None => JsKey::Undefined,
        Some(Value::Null) => JsKey::Null,
        Some(Value::Bool(b)) => JsKey::Bool(*b),
        Some(Value::Number(n)) => JsKey::Num(jsval::number(n)),
        Some(Value::String(s)) => JsKey::Str(s.clone()),
        Some(_) => {
            *next_ref += 1;
            JsKey::Ref(*next_ref)
        }
    }
}

/// `for (const x of maybeArray || [])` — a missing/null list iterates as empty.
fn items(v: Option<&Value>) -> &[Value] {
    match v {
        Some(Value::Array(a)) => a.as_slice(),
        _ => &[],
    }
}

/// Stable structural key for a TypeRef (nullable excluded — tracked separately).
fn type_key(r: Option<&Value>) -> String {
    if !truthy(r) {
        return "none".to_string();
    }
    let kind = prop(r, "kind");
    let tag = match kind {
        Some(Value::String(s)) => s.as_str(),
        _ => "",
    };
    match tag {
        "scalar" => {
            let scalar = match nullish_or(prop(r, "scalar"), None) {
                Some(v) => display(Some(v)),
                None => String::new(),
            };
            let format = prop(r, "format");
            let format = if truthy(format) {
                format!("/{}", display(format))
            } else {
                String::new()
            };
            // `ref.const !== undefined` — an explicit `null` DOES count.
            let konst = match prop(r, "const") {
                Some(c) => format!("={}", stringify(Some(c)).unwrap_or_default()),
                None => String::new(),
            };
            format!("scalar:{scalar}{format}{konst}")
        }
        "ref" => {
            let name = match nullish_or(prop(r, "name"), None) {
                Some(v) => display(Some(v)),
                None => String::new(),
            };
            format!("ref:{name}")
        }
        "array" => format!("array<{}>", type_key(prop(r, "items"))),
        "map" => format!("map<{}>", type_key(prop(r, "values"))),
        // default: `ref.kind ?? 'any'`
        _ => match kind {
            None | Some(Value::Null) => "any".to_string(),
            other => display(other),
        },
    }
}

/// `JSON.stringify(v ?? null)` — the whole-subtree string compare the TS uses
/// for per-operation `security` and the `sdk` behavior block.
fn stringify_or_null(v: Option<&Value>) -> String {
    match v {
        None | Some(Value::Null) => "null".to_string(),
        some => stringify(some).unwrap_or_else(|| "null".to_string()),
    }
}

/// Depth-first flatten of the resource tree into `(methodKey, method)` pairs.
/// The key is `[...resourceNames, method.action].join('.')`, so a resource or
/// action with no name contributes an empty segment (`"empty.."`).
fn walk_methods(spec: &Value) -> Vec<(String, &Value)> {
    fn visit<'a>(
        resources: Option<&'a Value>,
        parent: &[String],
        out: &mut Vec<(String, &'a Value)>,
    ) {
        for resource in items(resources) {
            let resource = Some(resource);
            let mut path = parent.to_vec();
            path.push(join_component(prop(resource, "name")));
            for method in items(prop(resource, "methods")) {
                let mut key_parts = path.clone();
                key_parts.push(join_component(prop(Some(method), "action")));
                out.push((key_parts.join("."), method));
            }
            let children = prop(resource, "resources");
            if !items(children).is_empty() {
                visit(children, &path, out);
            }
        }
    }
    let mut out = Vec::new();
    visit(prop(Some(spec), "resources"), &[], &mut out);
    out
}

/// Diff two OpenSDK IRs. `base` is the published/old surface, `head` the new
/// one; severities describe the impact on consumers of the generated SDK.
pub fn diff_ir(base: &Value, head: &Value) -> IrDiff {
    let mut out = IrDiff::default();
    let mut next_ref: u64 = 0;

    // ---- methods (keyed by resource path + action) --------------------------
    let mut base_methods: OrderedMap<String, &Value> = OrderedMap::new();
    for (key, method) in walk_methods(base) {
        base_methods.set(key, method);
    }
    let mut head_methods: OrderedMap<String, &Value> = OrderedMap::new();
    for (key, method) in walk_methods(head) {
        head_methods.set(key, method);
    }

    for (key, b) in base_methods.iter() {
        match head_methods.get(key) {
            Some(h) => diff_method(key, Some(b), Some(h), &mut out),
            None => out.add(
                Breaking,
                "method-removed",
                key.clone(),
                "method no longer exists",
            ),
        }
    }
    for (key, _) in head_methods.iter() {
        if !base_methods.has(key) {
            out.add(Safe, "method-added", key.clone(), "new method");
        }
    }

    // ---- named types ---------------------------------------------------------
    let mut base_types: OrderedMap<JsKey, &Value> = OrderedMap::new();
    for t in items(prop(Some(base), "types")) {
        base_types.set(js_key(prop(Some(t), "name"), &mut next_ref), t);
    }
    let mut head_types: OrderedMap<JsKey, &Value> = OrderedMap::new();
    for t in items(prop(Some(head), "types")) {
        head_types.set(js_key(prop(Some(t), "name"), &mut next_ref), t);
    }

    for (key, b) in base_types.iter() {
        // The key is derived from this very object's `name`, so interpolating
        // the stored value's `name` reproduces `` `types.${name}` ``.
        let path = format!("types.{}", display(prop(Some(b), "name")));
        match head_types.get(key) {
            Some(h) => diff_type(&path, Some(b), Some(h), &mut out),
            None => out.add(
                Breaking,
                "type-removed",
                path,
                "named type no longer exists",
            ),
        }
    }
    for (key, h) in head_types.iter() {
        if !base_types.has(key) {
            let path = format!("types.{}", display(prop(Some(h), "name")));
            out.add(Safe, "type-added", path, "new named type");
        }
    }

    // ---- security ------------------------------------------------------------
    if security_key(prop(Some(base), "security")) != security_key(prop(Some(head), "security")) {
        out.add(
            Breaking,
            "security-changed",
            "security".to_string(),
            "default security requirements changed",
        );
    }

    // ---- sdk behavior (runtime policy, not API surface) ----------------------
    if stringify_or_null(prop(Some(base), "sdk")) != stringify_or_null(prop(Some(head), "sdk")) {
        out.add(
            Safe,
            "sdk-behavior-changed",
            "sdk".to_string(),
            "declared runtime behavior changed",
        );
    }

    out
}

/// `JSON.stringify(security.map(x => ({kind, name, in, scheme})))` — only those
/// four keys, in that literal order, with `undefined` values omitted (so a
/// scheme that differs only in `type`/`envVar`/`bearerFormat` is NOT a change).
fn security_key(security: Option<&Value>) -> String {
    let mut out = String::from("[");
    for (i, entry) in items(security).iter().enumerate() {
        if i > 0 {
            out.push(',');
        }
        out.push('{');
        let mut first = true;
        for field in ["kind", "name", "in", "scheme"] {
            let Some(value) = prop(Some(entry), field) else {
                continue; // `undefined` properties are dropped by JSON.stringify
            };
            if !first {
                out.push(',');
            }
            first = false;
            out.push('"');
            out.push_str(field);
            out.push_str("\":");
            out.push_str(&stringify(Some(value)).unwrap_or_default());
        }
        out.push('}');
    }
    out.push(']');
    out
}

fn diff_method(key: &str, b: Option<&Value>, h: Option<&Value>, out: &mut IrDiff) {
    let (b_verb, h_verb) = (prop(b, "httpMethod"), prop(h, "httpMethod"));
    let (b_path, h_path) = (prop(b, "path"), prop(h, "path"));
    if !strict_eq(b_verb, h_verb) || !strict_eq(b_path, h_path) {
        out.add(
            Breaking,
            "binding-changed",
            key.to_string(),
            format!(
                "{} {} -> {} {}",
                display(b_verb).to_uppercase(),
                display(b_path),
                display(h_verb).to_uppercase(),
                display(h_path),
            ),
        );
    }

    for group in ["pathParams", "queryParams", "headerParams"] {
        diff_params(
            &format!("{key}.{group}"),
            prop(b, group),
            prop(h, group),
            out,
        );
    }

    let b_body = prop(b, "requestBody");
    let h_body = prop(h, "requestBody");
    let body_path = format!("{key}.requestBody");
    if truthy(b_body) && !truthy(h_body) {
        out.add(Breaking, "body-removed", body_path, "request body removed");
    } else if !truthy(b_body) && truthy(h_body) {
        let required = truthy(prop(h_body, "required"));
        out.add(
            if required { Breaking } else { Safe },
            "body-added",
            body_path,
            if required {
                "new required request body"
            } else {
                "new optional request body"
            },
        );
    } else if truthy(b_body) && truthy(h_body) {
        let (bt, ht) = (
            type_key(prop(b_body, "type")),
            type_key(prop(h_body, "type")),
        );
        if bt != ht {
            out.add(
                Breaking,
                "body-type-changed",
                body_path.clone(),
                format!("{bt} -> {ht}"),
            );
        }
        if !truthy(prop(b_body, "required")) && truthy(prop(h_body, "required")) {
            out.add(
                Breaking,
                "body-required-flip",
                body_path.clone(),
                "optional -> required",
            );
        }
        let (b_enc, h_enc) = (prop(b_body, "encoding"), prop(h_body, "encoding"));
        if !strict_eq(b_enc, h_enc) {
            out.add(
                Breaking,
                "body-encoding-changed",
                body_path,
                format!("{} -> {}", display(b_enc), display(h_enc)),
            );
        }
    }

    let (b_resp, h_resp) = (
        type_key(prop(b, "primaryResponse")),
        type_key(prop(h, "primaryResponse")),
    );
    if b_resp != h_resp {
        out.add(
            Breaking,
            "response-type-changed",
            format!("{key}.primaryResponse"),
            format!("{b_resp} -> {h_resp}"),
        );
    }

    let b_pg = prop(b, "pagination");
    let h_pg = prop(h, "pagination");
    if truthy(b_pg) && !truthy(h_pg) {
        out.add(
            Breaking,
            "pagination-removed",
            format!("{key}.pagination"),
            "method no longer paginates",
        );
    } else if truthy(b_pg) && truthy(h_pg) {
        let (b_style, h_style) = (prop(b_pg, "style"), prop(h_pg, "style"));
        if !strict_eq(b_style, h_style) {
            out.add(
                Breaking,
                "pagination-style-changed",
                format!("{key}.pagination"),
                format!("{} -> {}", display(b_style), display(h_style)),
            );
        }
    }

    if !truthy(prop(b, "deprecated")) && truthy(prop(h, "deprecated")) {
        out.add(
            Risky,
            "deprecated-added",
            key.to_string(),
            "method marked deprecated",
        );
    }

    if stringify_or_null(prop(b, "security")) != stringify_or_null(prop(h, "security")) {
        out.add(
            Breaking,
            "security-changed",
            format!("{key}.security"),
            "per-operation security changed",
        );
    }
}

fn diff_params(path_prefix: &str, base: Option<&Value>, head: Option<&Value>, out: &mut IrDiff) {
    let mut next_ref: u64 = 0;
    let mut base_by_name: OrderedMap<JsKey, &Value> = OrderedMap::new();
    for p in items(base) {
        base_by_name.set(js_key(prop(Some(p), "name"), &mut next_ref), p);
    }
    let mut head_by_name: OrderedMap<JsKey, &Value> = OrderedMap::new();
    for p in items(head) {
        head_by_name.set(js_key(prop(Some(p), "name"), &mut next_ref), p);
    }

    for (key, b) in base_by_name.iter() {
        let b = Some(*b);
        let h = head_by_name.get(key).copied();
        let path = format!("{path_prefix}.{}", display(prop(b, "name")));
        if !truthy(h) {
            out.add(
                Breaking,
                "param-removed",
                path,
                "parameter no longer exists",
            );
            continue;
        }
        let (bt, ht) = (type_key(prop(b, "type")), type_key(prop(h, "type")));
        if bt != ht {
            out.add(
                Breaking,
                "param-type-changed",
                path.clone(),
                format!("{bt} -> {ht}"),
            );
        }
        if !truthy(prop(b, "required")) && truthy(prop(h, "required")) {
            out.add(
                Breaking,
                "param-required-flip",
                path.clone(),
                "optional -> required",
            );
        }
        let b_wire = nullish_or(prop(b, "wireName"), prop(b, "name"));
        let h_wire = nullish_or(prop(h, "wireName"), prop(h, "name"));
        if !strict_eq(b_wire, h_wire) {
            out.add(
                Risky,
                "param-wire-name-changed",
                path.clone(),
                format!("{} -> {}", display(b_wire), display(h_wire)),
            );
        }
        if !truthy(prop(b, "deprecated")) && truthy(prop(h, "deprecated")) {
            out.add(
                Risky,
                "deprecated-added",
                path,
                "parameter marked deprecated",
            );
        }
    }

    for (key, h) in head_by_name.iter() {
        if base_by_name.has(key) {
            continue;
        }
        let h = Some(*h);
        let path = format!("{path_prefix}.{}", display(prop(h, "name")));
        let required = truthy(prop(h, "required"));
        out.add(
            if required { Breaking } else { Safe },
            "param-added",
            path,
            if required {
                "new REQUIRED parameter"
            } else {
                "new optional parameter"
            },
        );
    }
}

fn diff_type(path: &str, b: Option<&Value>, h: Option<&Value>, out: &mut IrDiff) {
    let (b_kind, h_kind) = (prop(b, "kind"), prop(h, "kind"));
    if !strict_eq(b_kind, h_kind) {
        out.add(
            Breaking,
            "type-kind-changed",
            path.to_string(),
            format!("{} -> {}", display(b_kind), display(h_kind)),
        );
        return;
    }

    let kind = match b_kind {
        Some(Value::String(s)) => s.as_str(),
        _ => "",
    };

    match kind {
        "struct" => diff_fields(path, prop(b, "fields"), prop(h, "fields"), out),
        "enum" => {
            let enum_values = |list: Option<&Value>| {
                let mut set: OrderedSet<Option<String>> = OrderedSet::new();
                for v in items(list) {
                    set.add(stringify(prop(Some(v), "value")));
                }
                set
            };
            let b_vals = enum_values(prop(b, "values"));
            let h_vals = enum_values(prop(h, "values"));
            for v in b_vals.iter() {
                if !h_vals.has(v) {
                    out.add(
                        Breaking,
                        "enum-value-removed",
                        format!("{path}.{}", opt_display(v)),
                        "enum value removed",
                    );
                }
            }
            for v in h_vals.iter() {
                // risky: consumers may switch exhaustively over a closed set
                if !b_vals.has(v) {
                    out.add(
                        Risky,
                        "enum-value-added",
                        format!("{path}.{}", opt_display(v)),
                        "enum value added",
                    );
                }
            }
        }
        "union" => {
            let variants = |list: Option<&Value>| {
                let mut set: OrderedSet<String> = OrderedSet::new();
                for v in items(list) {
                    set.add(type_key(Some(v)));
                }
                set
            };
            let b_variants = variants(prop(b, "variants"));
            let h_variants = variants(prop(h, "variants"));
            for v in b_variants.iter() {
                if !h_variants.has(v) {
                    out.add(
                        Breaking,
                        "union-variant-removed",
                        format!("{path}.{v}"),
                        "union variant removed",
                    );
                }
            }
            for v in h_variants.iter() {
                if !b_variants.has(v) {
                    out.add(
                        Safe,
                        "union-variant-added",
                        format!("{path}.{v}"),
                        "union variant added",
                    );
                }
            }
        }
        "alias" => {
            let (b_of, h_of) = (type_key(prop(b, "of")), type_key(prop(h, "of")));
            if b_of != h_of {
                out.add(
                    Breaking,
                    "alias-target-changed",
                    path.to_string(),
                    format!("{b_of} -> {h_of}"),
                );
            }
        }
        _ => {}
    }
}

/// `` `${v}` `` where `v` is a `JSON.stringify` result — `undefined` for an
/// enum entry with no `value` key.
fn opt_display(v: &Option<String>) -> String {
    v.clone().unwrap_or_else(|| "undefined".to_string())
}

fn diff_fields(type_path: &str, base: Option<&Value>, head: Option<&Value>, out: &mut IrDiff) {
    let mut next_ref: u64 = 0;
    let mut base_by_name: OrderedMap<JsKey, &Value> = OrderedMap::new();
    for f in items(base) {
        base_by_name.set(js_key(prop(Some(f), "name"), &mut next_ref), f);
    }
    let mut head_by_name: OrderedMap<JsKey, &Value> = OrderedMap::new();
    for f in items(head) {
        head_by_name.set(js_key(prop(Some(f), "name"), &mut next_ref), f);
    }

    for (key, b) in base_by_name.iter() {
        let b = Some(*b);
        let h = head_by_name.get(key).copied();
        let path = format!("{type_path}.fields.{}", display(prop(b, "name")));
        if !truthy(h) {
            out.add(Breaking, "field-removed", path, "field no longer exists");
            continue;
        }
        let (bt, ht) = (type_key(prop(b, "type")), type_key(prop(h, "type")));
        if bt != ht {
            out.add(
                Breaking,
                "field-type-changed",
                path.clone(),
                format!("{bt} -> {ht}"),
            );
        }
        let b_required = truthy(prop(b, "required"));
        if b_required != truthy(prop(h, "required")) {
            out.add(
                Breaking,
                "field-required-flip",
                path.clone(),
                if b_required {
                    "required -> optional"
                } else {
                    "optional -> required"
                },
            );
        }
        let b_nullable = truthy(prop(b, "nullable"));
        if b_nullable != truthy(prop(h, "nullable")) {
            out.add(
                Risky,
                "field-nullable-flip",
                path.clone(),
                if b_nullable {
                    "nullable -> non-null"
                } else {
                    "non-null -> nullable"
                },
            );
        }
        if !truthy(prop(b, "deprecated")) && truthy(prop(h, "deprecated")) {
            out.add(Risky, "deprecated-added", path, "field marked deprecated");
        }
    }

    for (key, h) in head_by_name.iter() {
        if base_by_name.has(key) {
            continue;
        }
        let h = Some(*h);
        let path = format!("{type_path}.fields.{}", display(prop(h, "name")));
        let required = truthy(prop(h, "required"));
        out.add(
            if required { Breaking } else { Safe },
            "field-added",
            path,
            if required {
                "new REQUIRED field"
            } else {
                "new optional field"
            },
        );
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn severity_serializes_lowercase_and_field_order_matches_ts() {
        let diff = IrDiff {
            changes: vec![IrChange {
                severity: Risky,
                kind: "deprecated-added".into(),
                path: "pets.list".into(),
                detail: "method marked deprecated".into(),
            }],
        };
        assert_eq!(
            serde_json::to_string(&diff).unwrap(),
            r#"{"changes":[{"severity":"risky","kind":"deprecated-added","path":"pets.list","detail":"method marked deprecated"}]}"#
        );
    }

    #[test]
    fn type_key_covers_every_branch() {
        assert_eq!(type_key(None), "none");
        assert_eq!(type_key(Some(&Value::Null)), "none");
        assert_eq!(type_key(Some(&json!({"kind": "scalar"}))), "scalar:");
        assert_eq!(
            type_key(Some(
                &json!({"kind": "scalar", "scalar": "string", "format": "uuid"})
            )),
            "scalar:string/uuid"
        );
        // an empty `format` is falsy -> omitted; a `null` const is still emitted
        assert_eq!(
            type_key(Some(
                &json!({"kind": "scalar", "scalar": "s", "format": ""})
            )),
            "scalar:s"
        );
        assert_eq!(
            type_key(Some(&json!({"kind": "scalar", "const": null}))),
            "scalar:=null"
        );
        assert_eq!(
            type_key(Some(&json!({"kind": "ref", "name": "Pet"}))),
            "ref:Pet"
        );
        assert_eq!(type_key(Some(&json!({"kind": "array"}))), "array<none>");
        assert_eq!(
            type_key(Some(&json!({"kind": "map", "values": {"kind": "any"}}))),
            "map<any>"
        );
        assert_eq!(type_key(Some(&json!({"kind": "weird"}))), "weird");
        assert_eq!(type_key(Some(&json!({}))), "any");
        // nullable is deliberately NOT part of the key
        assert_eq!(
            type_key(Some(
                &json!({"kind": "scalar", "scalar": "s", "nullable": true})
            )),
            type_key(Some(&json!({"kind": "scalar", "scalar": "s"})))
        );
    }

    #[test]
    fn security_key_ignores_non_identifying_fields() {
        let a = json!([{"type": "http", "kind": "bearer", "scheme": "bearer", "envVar": "A"}]);
        let b = json!([{"type": "oauth2", "kind": "bearer", "scheme": "bearer", "envVar": "B"}]);
        assert_eq!(security_key(Some(&a)), security_key(Some(&b)));
        assert_eq!(
            security_key(Some(&a)),
            r#"[{"kind":"bearer","scheme":"bearer"}]"#
        );
        assert_eq!(security_key(None), "[]");

        let c = json!([{"kind": "apiKey-header", "name": "X-Key", "in": "header"}]);
        assert_ne!(security_key(Some(&a)), security_key(Some(&c)));
    }

    #[test]
    fn method_key_uses_array_join_coercion() {
        // A resource/action with no name contributes an EMPTY segment.
        let spec = json!({"resources": [{"resources": [{"methods": [{"path": "/x"}]}]}]});
        let keys: Vec<String> = walk_methods(&spec).into_iter().map(|(k, _)| k).collect();
        assert_eq!(keys, vec![".."]);
    }

    #[test]
    fn identical_specs_produce_no_changes() {
        let spec = json!({
            "types": [{"name": "Pet", "kind": "struct", "fields": [{"name": "id", "type": {"kind": "scalar", "scalar": "string"}}]}],
            "resources": [{"name": "pets", "methods": [{"action": "list", "httpMethod": "get", "path": "/pets"}]}],
        });
        assert_eq!(diff_ir(&spec, &spec).changes, vec![]);
    }

    #[test]
    fn malformed_input_does_not_panic() {
        let junk = json!({"resources": "not-an-array", "types": 7, "security": "x", "sdk": 1});
        let empty = json!({});
        // Total where the TS would throw; see the module-level divergence note.
        let _ = diff_ir(&junk, &empty);
        let _ = diff_ir(&empty, &junk);
        let _ = diff_ir(&Value::Null, &Value::Null);
    }
}
