//! Operation → typed Method — port of src/method.ts.

use serde_json::{Map, Value};
use std::collections::{HashMap, HashSet};

use crate::action::DerivedTarget;
use crate::jsrt::{js_object_keys, unique_name};
use crate::model::{Method, Pagination, Param, RequestBody, Response, TypeRef};
use crate::nominal::SymbolTable;
use crate::schema::{is_array, is_ref, ref_str};
use crate::security::security_requirements;

/// Well-known auth headers the runtime adds — never surfaced as params.
const AUTH_HEADERS: [&str; 4] = ["authorization", "x-api-key", "api-key", "cookie"];

const LIMIT_PARAMS: [&str; 3] = ["limit", "page_size", "per_page"];
const CURSOR_PARAMS: [&str; 4] = ["after", "cursor", "starting_after", "page"];
const OFFSET_PARAMS: [&str; 3] = ["offset", "skip", "start"];

/// Resolve a `#/components/<section>/<name>` object ref against the raw doc.
fn deref_object<'a>(doc: &'a Value, node: Option<&'a Value>) -> Option<&'a Value> {
    let node = node?;
    if !is_ref(node) {
        return Some(node);
    }
    let r = ref_str(node)?;
    let rest = r.strip_prefix("#/components/")?;
    let (section, name) = rest.split_once('/')?;
    // JS regex is (\w+)/(.+): section must be word chars.
    if !section
        .chars()
        .all(|c| c.is_ascii_alphanumeric() || c == '_')
    {
        return None;
    }
    let resolved = doc.get("components")?.get(section)?.get(name)?;
    if is_ref(resolved) {
        deref_object(doc, Some(resolved))
    } else {
        Some(resolved)
    }
}

/// Pick the content entry to model (JSON, then multipart, then form, then first).
fn pick_content(content: Option<&Value>) -> Option<(String, &Value)> {
    let map = content?.as_object()?;
    for ct in [
        "application/json",
        "multipart/form-data",
        "application/x-www-form-urlencoded",
    ] {
        if let Some(media) = map.get(ct) {
            return Some((ct.to_string(), media));
        }
    }
    let first = js_object_keys(map).into_iter().next()?;
    Some((first.clone(), &map[first]))
}

fn encoding_for(content_type: &str) -> String {
    if content_type.contains("multipart") {
        "multipart"
    } else if content_type.contains("x-www-form-urlencoded") {
        "form"
    } else {
        "json"
    }
    .to_string()
}

/// Identifier-safe param name (`ids[]` -> `ids`; `_` if nothing survives).
fn identifier_name(wire: &str) -> String {
    let cleaned: String = wire
        .chars()
        .filter(|c| c.is_ascii_alphanumeric() || *c == '_')
        .collect();
    if cleaned.is_empty() {
        "_".to_string()
    } else {
        cleaned
    }
}

fn truthy(v: Option<&Value>) -> bool {
    match v {
        None | Some(Value::Null) => false,
        Some(Value::Bool(b)) => *b,
        Some(Value::String(s)) => !s.is_empty(),
        Some(Value::Number(n)) => n.as_f64().map(|f| f != 0.0).unwrap_or(true),
        Some(_) => true,
    }
}

fn str_field(v: &Value, key: &str) -> Option<String> {
    // JS `if (x.field) out = x.field` — truthiness gate on strings.
    v.get(key)
        .and_then(|s| s.as_str())
        .filter(|s| !s.is_empty())
        .map(|s| s.to_string())
}

/// Build one typed Method from an operation.
#[allow(clippy::too_many_arguments)]
pub fn build_method(
    doc: &Value,
    method: &str,
    path: &str,
    operation: &Value,
    path_item_params: &[Value],
    target: &DerivedTarget,
    symbols: &mut SymbolTable,
    behavior: &Value,
) -> Method {
    let mut out = Method {
        action: target.action.clone(),
        http_method: method.to_lowercase(),
        path: path.to_string(),
        operation_id: None,
        description: None,
        deprecated: None,
        inject_idempotency_key: None,
        path_params: None,
        query_params: None,
        header_params: None,
        request_body: None,
        responses: None,
        primary_response: None,
        pagination: None,
        security: None,
    };
    // Hoisted inline types are named from this hint (full resource path).
    let hint = {
        let mut segs = target.resource_path.clone();
        segs.push(target.action.clone());
        segs.join("-")
    };
    out.operation_id = str_field(operation, "operationId");
    out.description =
        str_field(operation, "description").or_else(|| str_field(operation, "summary"));
    if truthy(operation.get("deprecated")) {
        out.deprecated = Some(true);
    }

    // Parameters: path-item params first; `seen` skips later duplicates.
    let empty_vec: Vec<Value> = Vec::new();
    let op_params = match operation.get("parameters") {
        Some(Value::Array(arr)) => arr,
        _ => &empty_vec,
    };
    let param_list: Vec<&Value> = path_item_params
        .iter()
        .chain(op_params.iter())
        .filter_map(|p| deref_object(doc, Some(p)))
        .filter(|p| truthy(p.get("name")) && truthy(p.get("in")))
        .collect();

    let mut seen: HashSet<String> = HashSet::new();
    let mut path_params: Vec<Param> = Vec::new();
    let mut query_params: Vec<Param> = Vec::new();
    let mut header_params: Vec<Param> = Vec::new();
    let mut used_names: HashMap<&str, HashSet<String>> = HashMap::new();
    used_names.insert("path", HashSet::new());
    used_names.insert("query", HashSet::new());
    used_names.insert("header", HashSet::new());

    let ordered_path = &target.path_param_names;

    // Detect-and-strip: the spec-declared idempotency-key header never
    // surfaces as a param; the runtime injects a generated key instead.
    let idempotency_header = behavior
        .get("idempotency")
        .and_then(|i| i.get("headerName"))
        .and_then(|h| h.as_str())
        .unwrap_or("")
        .to_lowercase();

    for p in param_list {
        let p_in = p.get("in").and_then(|v| v.as_str()).unwrap_or("");
        let p_name = p.get("name").and_then(|v| v.as_str()).unwrap_or("");
        let key = format!("{p_in}:{p_name}");
        if seen.contains(&key) {
            continue;
        }
        seen.insert(key);
        if p_in == "cookie" {
            continue;
        }
        if p_in == "header" && p_name.to_lowercase() == idempotency_header {
            out.inject_idempotency_key = Some(true);
            continue;
        }
        if p_in == "header" && AUTH_HEADERS.contains(&p_name.to_lowercase().as_str()) {
            continue;
        }
        let Some(used) = used_names.get_mut(p_in) else {
            continue;
        };

        let name = unique_name(&identifier_name(p_name), used);
        let mut param = Param {
            name: name.clone(),
            param_type: symbols.resolve_type_ref(p.get("schema"), &format!("{hint}-{name}")),
            required: truthy(p.get("required")),
            wire_name: None,
            description: None,
            default: None,
            example: None,
            deprecated: None,
            explode: None,
            style: None,
        };
        if name != p_name {
            param.wire_name = Some(p_name.to_string());
        }
        param.description = str_field(p, "description");

        // param metadata: default (schema), example (param, then schema), deprecated
        let schema = deref_object(doc, p.get("schema"));
        if let Some(d) = schema.and_then(|s| s.get("default")) {
            param.default = Some(d.clone());
        }
        let example = p
            .get("example")
            .or_else(|| schema.and_then(|s| s.get("example")))
            .or_else(|| {
                schema
                    .and_then(|s| s.get("examples"))
                    .and_then(|e| e.as_array())
                    .and_then(|arr| arr.first())
            });
        if let Some(e) = example {
            param.example = Some(e.clone());
        }
        if truthy(p.get("deprecated")) || truthy(schema.and_then(|s| s.get("deprecated"))) {
            param.deprecated = Some(true);
        }
        if let Some(Value::Bool(explode)) = p.get("explode") {
            param.explode = Some(*explode);
        }
        if truthy(p.get("style")) {
            param.style = p.get("style").cloned();
        }

        match p_in {
            "path" => path_params.push(param),
            "query" => query_params.push(param),
            "header" => header_params.push(param),
            _ => {}
        }
    }
    // keep path params in URL order (indexOf semantics: missing -> -1 sorts first)
    let idx_of = |p: &Param| -> i64 {
        let wire = p.wire_name.as_deref().unwrap_or(&p.name);
        ordered_path
            .iter()
            .position(|w| w == wire)
            .map(|i| i as i64)
            .unwrap_or(-1)
    };
    path_params.sort_by_key(idx_of);

    if !path_params.is_empty() {
        out.path_params = Some(path_params);
    }
    if !query_params.is_empty() {
        out.query_params = Some(query_params.clone());
    }
    if !header_params.is_empty() {
        out.header_params = Some(header_params);
    }

    // Request body.
    if let Some(body_node) = deref_object(doc, operation.get("requestBody")) {
        if let Some((content_type, media)) = pick_content(body_node.get("content")) {
            let mut body = RequestBody {
                content_type: content_type.clone(),
                body_type: symbols
                    .resolve_type_ref(media.get("schema"), &format!("{hint}-request")),
                required: truthy(body_node.get("required")),
                encoding: encoding_for(&content_type),
                description: None,
            };
            body.description = str_field(body_node, "description");
            out.request_body = Some(body);
        }
    }

    // Responses.
    let mut responses: Vec<Response> = Vec::new();
    let mut primary: Option<TypeRef> = None;
    let mut primary_status = String::new();
    let empty_map = Map::new();
    let responses_map = operation
        .get("responses")
        .and_then(|r| r.as_object())
        .unwrap_or(&empty_map);
    for status in js_object_keys(responses_map) {
        let Some(res) = deref_object(doc, responses_map.get(status)) else {
            continue;
        };
        let picked = pick_content(res.get("content"));
        let mut entry = Response {
            status: status.clone(),
            description: None,
            content_type: None,
            response_type: None,
        };
        entry.description = str_field(res, "description");
        if let Some((content_type, media)) = picked {
            entry.content_type = Some(content_type);
            entry.response_type =
                Some(symbols.resolve_type_ref(media.get("schema"), &format!("{hint}-response")));
        }
        // primary = first 2xx with a body type
        if primary.is_none() && is_2xx(status) {
            if let Some(t) = &entry.response_type {
                primary = Some(t.clone());
                primary_status = status.clone();
            }
        }
        responses.push(entry);
    }
    if !responses.is_empty() {
        out.responses = Some(responses);
    }
    if let Some(p) = &primary {
        out.primary_response = Some(p.clone());
    }

    // Pagination.
    let pagination = detect_pagination(
        doc,
        operation,
        &primary_status,
        symbols,
        &target.action,
        &out.http_method,
        primary.as_ref(),
        &query_params,
    );
    if let Some(pg) = pagination {
        out.pagination = Some(pg);
    }

    // Per-operation security — only when declared AND different from the doc default.
    if let Some(op_sec) = operation.get("security") {
        let doc_sec = doc.get("security").cloned().unwrap_or(Value::Array(vec![]));
        let same = serde_json::to_string(op_sec).unwrap_or_default()
            == serde_json::to_string(&doc_sec).unwrap_or_default();
        if !same {
            if let Some(arr) = op_sec.as_array() {
                out.security = Some(security_requirements(doc, arr));
            }
        }
    }

    out
}

fn is_2xx(status: &str) -> bool {
    status.len() == 3 && status.starts_with('2') && status.chars().all(|c| c.is_ascii_digit())
}

/// The paged element type: the primary response struct's itemsField array element.
fn resolve_item_type(
    primary: Option<&TypeRef>,
    symbols: &SymbolTable,
    items_field: &str,
) -> Option<TypeRef> {
    let primary = primary?;
    if primary.kind != "ref" {
        return None;
    }
    let named = symbols.get(primary.name.as_deref()?)?;
    if named.kind != "struct" {
        return None;
    }
    let field = named
        .fields
        .as_ref()?
        .iter()
        .find(|f| f.name == items_field)?;
    if field.field_type.kind == "array" {
        field.field_type.items.as_deref().cloned()
    } else {
        None
    }
}

/// Heuristic cursor/list pagination detection.
#[allow(clippy::too_many_arguments)]
fn detect_pagination(
    doc: &Value,
    operation: &Value,
    status: &str,
    symbols: &mut SymbolTable,
    action: &str,
    http_method: &str,
    primary: Option<&TypeRef>,
    query_params: &[Param],
) -> Option<Pagination> {
    if status.is_empty() {
        return None;
    }
    let res = deref_object(doc, operation.get("responses").and_then(|r| r.get(status)))?;
    let picked = pick_content(res.get("content"));
    let schema =
        symbols.resolve_object_schema(picked.and_then(|(_, media)| media.get("schema")))?;
    let props = schema.get("properties").and_then(|p| p.as_object())?;

    let limit_param = query_params
        .iter()
        .find(|p| LIMIT_PARAMS.contains(&p.name.as_str()))
        .map(|p| p.name.clone());

    let items_field = ["data", "items", "results"]
        .into_iter()
        .find(|f| props.get(*f).map(|s| is_array(Some(s))).unwrap_or(false))?;

    let next_field = ["has_more", "next", "next_cursor", "has_next"]
        .into_iter()
        .find(|f| props.contains_key(*f));

    let Some(next_field) = next_field else {
        // OFFSET style: integer offset/skip/start query param, no marker needed.
        let offset_param = query_params
            .iter()
            .find(|p| {
                OFFSET_PARAMS.contains(&p.name.as_str())
                    && p.param_type.kind == "scalar"
                    && p.param_type.scalar.as_deref() == Some("integer")
            })
            .map(|p| p.name.clone());
        if http_method == "get" && action == "list" {
            if let Some(offset_param) = offset_param {
                let mut pg = Pagination {
                    style: "offset".to_string(),
                    items_field: items_field.to_string(),
                    next_field: None,
                    offset_param: Some(offset_param),
                    item_type: None,
                    cursor_param: None,
                    limit_param: None,
                };
                pg.item_type = resolve_item_type(primary, symbols, items_field);
                pg.limit_param = limit_param;
                return Some(pg);
            }
        }
        // Marker-less single-page envelope (GET /models style).
        if http_method != "get" || action != "list" || !["data", "items"].contains(&items_field) {
            return None;
        }
        let mut pg = Pagination {
            style: "page".to_string(),
            items_field: items_field.to_string(),
            next_field: None,
            offset_param: None,
            item_type: None,
            cursor_param: None,
            limit_param: None,
        };
        pg.item_type = resolve_item_type(primary, symbols, items_field);
        pg.limit_param = limit_param;
        return Some(pg);
    };

    let cursor_param = query_params
        .iter()
        .find(|p| CURSOR_PARAMS.contains(&p.name.as_str()))
        .map(|p| p.name.clone());

    let mut pg = Pagination {
        style: "cursor".to_string(),
        items_field: items_field.to_string(),
        next_field: Some(next_field.to_string()),
        offset_param: None,
        item_type: None,
        cursor_param: None,
        limit_param: None,
    };
    pg.item_type = resolve_item_type(primary, symbols, items_field);
    pg.cursor_param = cursor_param;
    pg.limit_param = limit_param;
    Some(pg)
}
