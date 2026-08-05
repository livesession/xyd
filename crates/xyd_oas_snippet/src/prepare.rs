//! Port of httpsnippet's `HTTPSnippet.prepare()` for the request shapes xyd
//! produces. Builds the derived request the clients read: `headersObj`,
//! `allHeaders` (with `cookie`), `fullUrl` (base + qs-rendered search), and the
//! normalized `postData` (`jsonObj` for JSON, `paramsObj`/`text` for
//! form-urlencoded). Because oas-to-har HARs are `harIsAlreadyEncoded`, the
//! search string is rendered with `encode: false`.

use serde_json::{Map, Value};

use crate::har::{Har, HarNameValue};
use crate::jsutil::{js_string, qs_encode};

/// The prepared request the clients consume.
pub struct Prepared {
    pub method: String,
    pub full_url: String,
    pub http_version: String,
    pub headers_obj: Map<String, Value>,
    pub all_headers: Map<String, Value>,
    pub post_data: PreparedPostData,
}

#[derive(Default)]
pub struct PreparedPostData {
    pub mime_type: String,
    pub text: Option<String>,
    pub params: Option<Vec<HarNameValue>>,
    pub params_obj: Option<Map<String, Value>>,
    pub json_obj: Option<Value>,
}

/// httpsnippet's `reducer`: first value stays scalar, dupes become an array.
fn reduce(pairs: &[HarNameValue]) -> Map<String, Value> {
    let mut acc: Map<String, Value> = Map::new();
    for p in pairs {
        let v = Value::String(p.value.clone());
        match acc.get_mut(&p.name) {
            None => {
                acc.insert(p.name.clone(), v);
            }
            Some(Value::Array(a)) => a.push(v),
            Some(existing) => {
                let prev = existing.clone();
                acc.insert(p.name.clone(), Value::Array(vec![prev, v]));
            }
        }
    }
    acc
}

/// `qs.stringify` for the two configurations httpsnippet uses:
/// `encode` toggles RFC3986 percent-encoding of keys/values; `indices` toggles
/// `key[i]=` array bracketing vs. repeated `key=`.
fn qs_stringify(obj: &Map<String, Value>, encode: bool, indices: bool) -> String {
    let enc = |s: &str| if encode { qs_encode(s) } else { s.to_string() };
    let mut parts: Vec<String> = Vec::new();
    for (key, value) in obj {
        match value {
            Value::Array(a) => {
                for (i, el) in a.iter().enumerate() {
                    let v = enc(&js_string(el));
                    if indices {
                        parts.push(format!("{}={v}", enc(&format!("{key}[{i}]"))));
                    } else {
                        parts.push(format!("{}={v}", enc(key)));
                    }
                }
            }
            _ => parts.push(format!("{}={}", enc(key), enc(&js_string(value)))),
        }
    }
    parts.join("&")
}

/// Split a URL into (base-without-query, existing-query-pairs). oas-to-har URLs
/// never carry a query, but we honor one defensively.
fn split_url(url: &str) -> (String, Vec<HarNameValue>) {
    match url.split_once('?') {
        None => (url.to_string(), Vec::new()),
        Some((base, query)) => {
            let mut pairs = Vec::new();
            for part in query.split('&').filter(|p| !p.is_empty()) {
                let (name, value) = part.split_once('=').unwrap_or((part, ""));
                pairs.push(HarNameValue {
                    name: name.to_string(),
                    value: value.to_string(),
                });
            }
            (base.to_string(), pairs)
        }
    }
}

/// Port of `prepare(harRequest, { harIsAlreadyEncoded: true })`.
pub fn prepare(har: &Har) -> Prepared {
    // headersObj (HTTP/1.1 → header names kept as-is).
    let headers_obj = reduce(&har.headers);

    // Cookies → allHeaders.cookie (already-encoded → `name=value`).
    let mut all_headers: Map<String, Value> = Map::new();
    if !har.cookies.is_empty() {
        let cookie = har
            .cookies
            .iter()
            .map(|c| format!("{}={}", c.name, c.value))
            .collect::<Vec<_>>()
            .join("; ");
        all_headers.insert("cookie".to_string(), Value::String(cookie));
    }
    for (k, v) in &headers_obj {
        all_headers.insert(k.clone(), v.clone());
    }

    // queryObj = reduce(queryString) merged with any query already in the URL.
    let (base_url, url_pairs) = split_url(&har.url);
    let mut query_obj = reduce(&har.query_string);
    for p in &url_pairs {
        query_obj
            .entry(p.name.clone())
            .or_insert_with(|| Value::String(p.value.clone()));
    }

    // harIsAlreadyEncoded → search rendered with encode:false, indices:false.
    let search = qs_stringify(&query_obj, false, false);
    let full_url = if search.is_empty() {
        base_url.clone()
    } else {
        format!("{base_url}?{search}")
    };

    // postData normalization.
    let mut post = PreparedPostData::default();
    match &har.post_data {
        None => {
            post.mime_type = "application/octet-stream".to_string();
        }
        Some(pd) => {
            post.mime_type = if pd.mime_type.is_empty() {
                "application/octet-stream".to_string()
            } else {
                pd.mime_type.clone()
            };
            post.text = pd.text.clone();
            post.params = pd.params.clone();

            match post.mime_type.as_str() {
                "application/x-www-form-urlencoded" => {
                    if let Some(params) = &post.params {
                        let params_obj = reduce(params);
                        post.text = Some(qs_stringify(&params_obj, true, true));
                        post.params_obj = Some(params_obj);
                    } else {
                        post.text = Some(String::new());
                    }
                }
                "text/json" | "text/x-json" | "application/json" | "application/x-json" => {
                    post.mime_type = "application/json".to_string();
                    if let Some(text) = &post.text {
                        if !text.is_empty() {
                            match serde_json::from_str::<Value>(text) {
                                Ok(v) => post.json_obj = Some(v),
                                Err(_) => post.mime_type = "text/plain".to_string(),
                            }
                        }
                    }
                }
                _ => {}
            }
        }
    }

    Prepared {
        method: har.method.clone(),
        full_url,
        http_version: har.http_version.clone(),
        headers_obj,
        all_headers,
        post_data: post,
    }
}
