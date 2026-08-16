//! Port of `@readme/oas-to-har@26.0.4`'s `oasToHar`, plus the slices of the
//! `oas@25.3.0` `Oas`/`Operation` model it leans on (`url`/`defaultVariables`,
//! `getParameters`, `getContentType`, `is{Json,FormUrlEncoded,Multipart}`).
//! Security is a no-op here because xyd always passes `auth === null`
//! (`configureSecurity` returns early), so no security-scheme headers are ever
//! emitted — auth reaches the request only as an explicit header parameter.

use serde_json::{Map, Value};

use crate::jsutil::{encode_uri_component, js_string};
use crate::mime;
use crate::remove_undefined::remove_undefined_objects;
use crate::style::{format_style, formatter, Param};

/// A HAR `postData` object (the subset the clients read).
#[derive(Debug, Default, Clone)]
pub struct PostData {
    pub mime_type: String,
    pub text: Option<String>,
    pub params: Option<Vec<HarNameValue>>,
}

#[derive(Debug, Clone)]
pub struct HarNameValue {
    pub name: String,
    pub value: String,
}

/// The raw HAR request (`log.entries[0].request`) before httpsnippet's
/// `prepare()` normalization.
#[derive(Debug, Default)]
pub struct Har {
    pub method: String,
    pub url: String,
    pub query_string: Vec<HarNameValue>,
    pub headers: Vec<HarNameValue>,
    pub cookies: Vec<HarNameValue>,
    pub post_data: Option<PostData>,
    pub http_version: String,
}

fn strip_trailing_slash(url: &str) -> String {
    url.strip_suffix('/').unwrap_or(url).to_string()
}

fn ensure_protocol(url: &str) -> String {
    if url.starts_with("//") {
        return format!("https:{url}");
    }
    if !url.contains("//") {
        return format!("https://{url}");
    }
    url.to_string()
}

/// `normalizedUrl(api, selected)`.
fn normalized_url(spec: &Value, selected: usize) -> String {
    let example = "https://example.com";
    let url = spec
        .get("servers")
        .and_then(|s| s.as_array())
        .and_then(|a| a.get(selected))
        .and_then(|s| s.get("url"))
        .and_then(|u| u.as_str())
        .filter(|u| !u.is_empty());
    let mut url = match url {
        Some(u) => strip_trailing_slash(u),
        None => return ensure_protocol(example),
    };
    if url.starts_with('/') && !url.starts_with("//") {
        // `new URL(example).pathname = url` → origin + pathname.
        url = format!("{example}{url}");
    }
    ensure_protocol(&url)
}

/// `defaultVariables(selected)` (user vars are always empty in xyd).
fn default_variables(spec: &Value, selected: usize) -> Map<String, Value> {
    let mut out = Map::new();
    let vars = spec
        .get("servers")
        .and_then(|s| s.as_array())
        .and_then(|a| a.get(selected))
        .and_then(|s| s.get("variables"))
        .and_then(|v| v.as_object());
    if let Some(vars) = vars {
        for (key, def) in vars {
            let d = def.get("default").map(js_string).unwrap_or_default();
            out.insert(key.clone(), Value::String(d));
        }
    }
    out
}

const SERVER_VAR_CHARS: &str = "-_:.[]";

/// `replaceUrl(url, variables)` — substitute `{var}` with resolved defaults.
fn replace_url(url: &str, variables: &Map<String, Value>) -> String {
    let bytes: Vec<char> = url.chars().collect();
    let mut out = String::new();
    let mut i = 0;
    while i < bytes.len() {
        if bytes[i] == '{' {
            // Find a matching `}` with an allowed variable name in between.
            if let Some(close) = (i + 1..bytes.len()).find(|&j| bytes[j] == '}') {
                let key: String = bytes[i + 1..close].iter().collect();
                let valid = !key.is_empty()
                    && key
                        .chars()
                        .all(|c| c.is_ascii_alphanumeric() || SERVER_VAR_CHARS.contains(c));
                if valid {
                    if let Some(v) = variables.get(&key) {
                        out.push_str(&js_string(v));
                    } else {
                        out.push_str(&format!("{{{key}}}"));
                    }
                    i = close + 1;
                    continue;
                }
            }
        }
        out.push(bytes[i]);
        i += 1;
    }
    strip_trailing_slash(&out)
}

/// `oas.url(selected, variables)`.
fn oas_url(spec: &Value, selected: usize, variables: &Map<String, Value>) -> String {
    let url = normalized_url(spec, selected);
    replace_url(&url, variables).trim().to_string()
}

/// `dedupeCommonParameters` + `getParameters()` merge, then map to `Param`s.
fn get_parameters(spec: &Value, path: &str, method: &str) -> Vec<Value> {
    let path_item = spec.get("paths").and_then(|p| p.get(path));
    let op_params: Vec<Value> = path_item
        .and_then(|pi| pi.get(method))
        .and_then(|op| op.get("parameters"))
        .and_then(|p| p.as_array())
        .cloned()
        .unwrap_or_default();
    let common_params: Vec<Value> = path_item
        .and_then(|pi| pi.get("parameters"))
        .and_then(|p| p.as_array())
        .cloned()
        .unwrap_or_default();

    let mut params = op_params.clone();
    for cp in &common_params {
        let dup = op_params.iter().any(|p| {
            let (n1, n2) = (
                p.get("name").and_then(|v| v.as_str()),
                cp.get("name").and_then(|v| v.as_str()),
            );
            let (i1, i2) = (
                p.get("in").and_then(|v| v.as_str()),
                cp.get("in").and_then(|v| v.as_str()),
            );
            if let (Some(n1), Some(n2)) = (n1, n2) {
                n1 == n2 && i1 == i2
            } else {
                let (r1, r2) = (
                    p.get("$ref").and_then(|v| v.as_str()),
                    cp.get("$ref").and_then(|v| v.as_str()),
                );
                match (r1, r2) {
                    (Some(r1), Some(r2)) => r1 == r2,
                    _ => false,
                }
            }
        });
        if !dup {
            params.push(cp.clone());
        }
    }
    params
}

fn to_param(raw: &Value) -> Option<Param> {
    let name = raw.get("name")?.as_str()?.to_string();
    let location = raw
        .get("in")
        .and_then(|v| v.as_str())
        .unwrap_or("query")
        .to_string();
    Some(Param {
        name,
        location,
        style: raw.get("style").and_then(|v| v.as_str()).map(String::from),
        explode: raw.get("explode").and_then(|v| v.as_bool()),
        schema: raw.get("schema").cloned(),
        allow_reserved: raw
            .get("allowReserved")
            .and_then(|v| v.as_bool())
            .unwrap_or(false),
        required: raw
            .get("required")
            .and_then(|v| v.as_bool())
            .unwrap_or(false),
    })
}

/// `getContentType()` — default `application/json`, first content key wins,
/// then the LAST json-matching key wins.
fn get_content_type(op: &Value) -> String {
    let types: Vec<String> = op
        .get("requestBody")
        .and_then(|rb| rb.get("content"))
        .and_then(|c| c.as_object())
        .map(|c| c.keys().cloned().collect())
        .unwrap_or_default();
    let mut content_type = "application/json".to_string();
    if let Some(first) = types.first() {
        content_type = first.clone();
    }
    for t in &types {
        if mime::is_json(t) {
            content_type = t.clone();
        }
    }
    content_type
}

/// `getResponseContentType(content)`.
fn get_response_content_type(content: &Map<String, Value>) -> String {
    let types: Vec<&String> = content.keys().collect();
    if types.is_empty() {
        return "application/json".to_string();
    }
    if let Some(json) = types.iter().find(|t| mime::is_json(t)) {
        return (*json).clone();
    }
    types[0].clone()
}

/// `appendHarValue(harParam, name, value)`.
fn append_har_value(out: &mut Vec<HarNameValue>, name: &str, value: &Value) {
    match value {
        Value::Null => {
            // JS `String(null)` still pushes for a bare null, but `undefined`
            // (our None) returns early. A JSON null reaching here is stringified.
            out.push(HarNameValue {
                name: name.to_string(),
                value: "null".to_string(),
            });
        }
        Value::Array(a) => {
            for el in a {
                append_har_value(out, name, el);
            }
        }
        Value::Object(o) => {
            for (k, v) in o {
                append_har_value(out, k, v);
            }
        }
        other => out.push(HarNameValue {
            name: name.to_string(),
            value: js_string(other),
        }),
    }
}

/// `stringifyParameter(param)` for form-urlencoded params.
fn stringify_parameter(v: &Value) -> String {
    match v {
        Value::Null => "null".to_string(),
        Value::String(s) => s.clone(),
        Value::Number(_) | Value::Bool(_) => js_string(v),
        Value::Array(a) if a.iter().all(is_primitive) => js_string(v),
        _ => serde_json::to_string(v).unwrap_or_default(),
    }
}

fn is_primitive(v: &Value) -> bool {
    matches!(v, Value::String(_) | Value::Number(_) | Value::Bool(_))
}

/// `stringify(json)` = `JSON.stringify(removeUndefinedObjects(json))`.
fn stringify_body(v: &Value) -> String {
    // No `RAW_BODY` handling needed — the sampler never produces it.
    let cleaned = remove_undefined_objects(v).unwrap_or(Value::Null);
    serde_json::to_string(&cleaned).unwrap_or_default()
}

/// `encodeBodyForHAR(body)`.
fn encode_body_for_har(v: &Value) -> String {
    if is_primitive(v) {
        return js_string(v);
    }
    stringify_body(v)
}

fn has_schema_type(schema: &Value, discriminator: &str) -> bool {
    match schema.get("type") {
        Some(Value::Array(a)) => a.iter().any(|t| t.as_str() == Some(discriminator)),
        Some(Value::String(s)) => s == discriminator,
        _ => false,
    }
}

/// Build the raw HAR request for `(spec, path, method, values)`.
pub fn oas_to_har(spec: &Value, path: &str, method: &str, values: &Value) -> Har {
    let op = spec
        .get("paths")
        .and_then(|p| p.get(path))
        .and_then(|pi| pi.get(method))
        .cloned()
        .unwrap_or(Value::Null);

    // formData = { ...defaultFormDataTypes, ...values } — only the `.server`
    // handling and per-`in` lookups matter downstream.
    let get_map =
        |key: &str| -> Option<&Map<String, Value>> { values.get(key).and_then(|v| v.as_object()) };
    let selected = values
        .get("server")
        .and_then(|s| s.get("selected"))
        .and_then(|v| v.as_u64())
        .unwrap_or(0) as usize;
    let variables = default_variables(spec, selected);

    let base = oas_url(spec, selected, &variables);
    let mut url = format!("{base}{path}").replace([' ', '\t', '\n', '\r'], "%20");

    let params: Vec<Param> = get_parameters(spec, path, method)
        .iter()
        .filter_map(to_param)
        .collect();

    // Path param substitution: /{([-_a-zA-Z0-9[\]]+)}/g
    url = substitute_path_params(&url, &params, values);

    let mut har = Har {
        method: method.to_uppercase(),
        url,
        http_version: "HTTP/1.1".to_string(),
        ..Default::default()
    };

    // Query params.
    for p in params.iter().filter(|p| p.location == "query") {
        let value = formatter(get_map("query"), p, "query", true);
        if let Some(v) = value {
            append_har_value(&mut har.query_string, &p.name, &v);
        }
    }
    // Cookie params.
    for p in params.iter().filter(|p| p.location == "cookie") {
        let value = formatter(get_map("cookie"), p, "cookie", true);
        if let Some(v) = value {
            append_har_value(&mut har.cookies, &p.name, &v);
        }
    }

    let header_values = get_map("header");
    // Response → accept header (first response with content).
    if let Some(responses) = op.get("responses").and_then(|r| r.as_object()) {
        for (_status, r) in responses {
            if r.get("$ref").is_some() {
                continue;
            }
            let Some(content) = r.get("content").and_then(|c| c.as_object()) else {
                continue;
            };
            let has_accept = header_values
                .map(|h| h.keys().any(|k| k.to_lowercase() == "accept"))
                .unwrap_or(false);
            if has_accept {
                break;
            }
            har.headers.push(HarNameValue {
                name: "accept".to_string(),
                value: get_response_content_type(content),
            });
            break;
        }
    }

    // Content type + header params.
    let mut has_content_type = false;
    let mut content_type = get_content_type(&op);
    for p in params.iter().filter(|p| p.location == "header") {
        let value = formatter(header_values, p, "header", true);
        let Some(v) = value else { continue };
        if p.name.to_lowercase() == "content-type" {
            has_content_type = true;
            content_type = js_string(&v);
        }
        append_har_value(&mut har.headers, &p.name, &v);
    }

    // formData.header accept / authorization fallbacks.
    if let Some(header_values) = header_values {
        if let Some(accept_key) = header_values.keys().find(|k| k.to_lowercase() == "accept") {
            if !har
                .headers
                .iter()
                .any(|h| h.name.to_lowercase() == "accept")
            {
                har.headers.push(HarNameValue {
                    name: "accept".to_string(),
                    value: js_string(&header_values[accept_key]),
                });
            }
        }
        if let Some(auth_key) = header_values
            .keys()
            .find(|k| k.to_lowercase() == "authorization")
        {
            if !har
                .headers
                .iter()
                .any(|h| h.name.to_lowercase() == "authorization")
            {
                har.headers.push(HarNameValue {
                    name: "authorization".to_string(),
                    value: js_string(&header_values[auth_key]),
                });
            }
        }
    }

    // Request body.
    let request_body_schema = op
        .get("requestBody")
        .and_then(|rb| rb.get("content"))
        .and_then(|c| c.get(&content_type))
        .and_then(|ct| ct.get("schema"))
        .cloned();
    let has_request_body = op.get("requestBody").is_some();
    let schema_non_empty = request_body_schema
        .as_ref()
        .and_then(|s| s.as_object())
        .map(|o| !o.is_empty())
        .unwrap_or(false);

    if has_request_body && schema_non_empty {
        let schema = request_body_schema.clone().unwrap();
        if mime::is_form_url_encoded(&content_type) {
            let form = get_map("formData");
            if let Some(form) = form.filter(|f| !f.is_empty()) {
                if let Some(Value::Object(clean)) =
                    remove_undefined_objects(&Value::Object(form.clone()))
                {
                    let mut post = PostData {
                        mime_type: "application/x-www-form-urlencoded".to_string(),
                        params: Some(Vec::new()),
                        text: None,
                    };
                    for (name, v) in &clean {
                        post.params.as_mut().unwrap().push(HarNameValue {
                            name: name.clone(),
                            value: stringify_parameter(v),
                        });
                    }
                    har.post_data = Some(post);
                }
            }
        } else if let Some(body) = values.get("body").filter(|b| {
            !b.is_null()
                && (is_primitive(b)
                    || b.as_object().map(|o| !o.is_empty()).unwrap_or(false)
                    || b.as_array().map(|a| !a.is_empty()).unwrap_or(false))
        }) {
            let is_multipart = mime::is_multipart(&content_type);
            let is_json = mime::is_json(&content_type);
            if is_multipart || is_json {
                // Multipart file uploads are out of scope (not wired upstream
                // either); treat everything here as the JSON branch.
                let clean_body = remove_undefined_objects(body).unwrap_or(Value::Null);
                let text = if has_schema_type(&schema, "string")
                    || has_schema_type(&schema, "integer")
                    || has_schema_type(&schema, "number")
                    || has_schema_type(&schema, "boolean")
                {
                    // JSON.stringify(JSON.parse(cleanBody)); fall back to
                    // stringify(body) on parse failure (the JS outer catch).
                    scalar_body_text(&clean_body, body)
                } else {
                    // getTypedFormatsInSchema("json", …) is empty for specs
                    // without `format: "json"` request-body props → this path.
                    encode_body_for_har(body)
                };
                har.post_data = Some(PostData {
                    mime_type: content_type.clone(),
                    text: Some(text),
                    params: None,
                });
            } else {
                har.post_data = Some(PostData {
                    mime_type: content_type.clone(),
                    text: Some(encode_body_for_har(body)),
                    params: None,
                });
            }
        }
    }

    // content-type header.
    let post_has_text = har
        .post_data
        .as_ref()
        .and_then(|p| p.text.as_ref())
        .map(|t| !t.is_empty())
        .unwrap_or(false);
    if (post_has_text || (has_request_body && schema_non_empty)) && !has_content_type {
        har.headers.push(HarNameValue {
            name: "content-type".to_string(),
            value: content_type.clone(),
        });
    }

    // Drop empty postData.
    if let Some(pd) = &har.post_data {
        if pd.text.is_none() && pd.params.is_none() {
            har.post_data = None;
        }
    }

    har
}

fn scalar_body_text(clean_body: &Value, body: &Value) -> String {
    // `JSON.stringify(JSON.parse(cleanBody))`.
    let parse_src = js_string(clean_body);
    match serde_json::from_str::<Value>(&parse_src) {
        Ok(v) => serde_json::to_string(&v).unwrap_or_default(),
        Err(_) => stringify_body(body),
    }
}

/// Path-param substitution over the URL.
fn substitute_path_params(url: &str, params: &[Param], values: &Value) -> String {
    let chars: Vec<char> = url.chars().collect();
    let path_values = values.get("path").and_then(|v| v.as_object());
    let mut out = String::new();
    let mut i = 0;
    while i < chars.len() {
        if chars[i] == '{' {
            if let Some(close) = (i + 1..chars.len()).find(|&j| chars[j] == '}') {
                let key: String = chars[i + 1..close].iter().collect();
                // /{([-_a-zA-Z0-9[\]]+)}/
                let valid = !key.is_empty()
                    && key
                        .chars()
                        .all(|c| c.is_ascii_alphanumeric() || "-_[]".contains(c));
                if valid {
                    let param = params.iter().find(|p| p.name == key);
                    let replacement = match param {
                        Some(p) if p.style.is_some() => {
                            format_style(&resolve_path_value(path_values, p), p)
                                .map(|v| js_string(&v))
                                .unwrap_or_default()
                        }
                        Some(p) => {
                            let v = formatter(path_values, p, "path", false)
                                .map(|v| js_string(&v))
                                .unwrap_or_default();
                            encode_uri_component(&v)
                        }
                        None => {
                            // { name: key } fallback (no style): formatter →
                            // returns the literal key, then encodeURIComponent.
                            encode_uri_component(&key)
                        }
                    };
                    out.push_str(&replacement);
                    i = close + 1;
                    continue;
                }
            }
        }
        out.push(chars[i]);
        i += 1;
    }
    out
}

fn resolve_path_value(path_values: Option<&Map<String, Value>>, p: &Param) -> Value {
    path_values
        .and_then(|m| m.get(&p.name))
        .cloned()
        .unwrap_or(Value::Null)
}
