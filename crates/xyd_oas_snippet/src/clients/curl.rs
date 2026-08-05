//! `src/targets/shell/curl/client.ts`. xyd passes `{ indent: "     " }` (five
//! spaces); `escapeBrackets` is dead in httpsnippet@11 (never read by this
//! client), so `indent` is the only meaningful option.

use serde_json::Value;

use super::{header_string, json_stringify_pretty};
use crate::code_builder::CodeBuilder;
use crate::mime::is_mime_type_json;
use crate::prepare::Prepared;

/// httpsnippet's shell `quote()`.
fn quote(value: &str) -> String {
    let safe = !value.is_empty()
        && value
            .chars()
            .all(|c| c.is_ascii_alphanumeric() || "-_/.@%^=:".contains(c));
    if safe {
        return value.to_string();
    }
    format!("'{}'", value.replace('\'', "'\\''"))
}

/// `getHeader(headers, name)` (case-insensitive).
fn get_header<'a>(headers: &'a serde_json::Map<String, Value>, name: &str) -> Option<&'a Value> {
    headers
        .iter()
        .find(|(k, _)| k.to_lowercase() == name.to_lowercase())
        .map(|(_, v)| v)
}

pub fn convert(req: &Prepared) -> String {
    let indent = "     "; // xyd's five-space indent
    let join = format!(" \\\n{indent}");
    let mut cb = CodeBuilder::new(indent, Some(&join));

    // arg(short=false)(longName) → "--"+longName
    let arg = |long: &str| format!("--{long}");

    let formatted_url = quote(&req.full_url);
    cb.push0(&format!("curl {} {}", arg("request"), req.method));
    cb.push0(&format!("{}{}", arg("url "), formatted_url));
    if req.http_version == "HTTP/1.0" {
        cb.push0("--http1.0");
    }
    // accept-encoding → --compressed
    if get_header(&req.all_headers, "accept-encoding").is_some() {
        cb.push0("--compressed");
    }

    // headers, sorted (ASCII).
    let mut keys: Vec<&String> = req.headers_obj.keys().collect();
    keys.sort();
    for key in keys {
        let header = format!("{key}: {}", header_string(&req.headers_obj[key]));
        cb.push0(&format!("{} {}", arg("header"), quote(&header)));
    }
    if let Some(Value::String(cookie)) = req.all_headers.get("cookie") {
        cb.push0(&format!("{} {}", arg("cookie"), quote(cookie)));
    }

    let pd = &req.post_data;
    match pd.mime_type.as_str() {
        "application/x-www-form-urlencoded" => {
            if let Some(params) = &pd.params {
                for p in params {
                    let encoded = crate::jsutil::encode_uri_component(&p.name);
                    let name = if encoded != p.name {
                        encoded
                    } else {
                        p.name.clone()
                    };
                    cb.push0(&format!(
                        "--data-urlencode {}",
                        quote(&format!("{name}={}", p.value))
                    ));
                }
            } else if let Some(text) = &pd.text {
                cb.push0(&format!("{} {}", arg("data"), quote(text)));
            }
        }
        _ => {
            if let Some(text) = &pd.text {
                if !text.is_empty() {
                    let mut built = false;
                    if is_mime_type_json(&pd.mime_type) && text.chars().count() > 20 {
                        if let Ok(parsed) = serde_json::from_str::<Value>(text) {
                            built = true;
                            // `JSON.stringify(x, null, "  ")` — serde_json's
                            // pretty printer already uses a two-space indent.
                            let pretty = json_stringify_pretty(&parsed);
                            if text.find('\'').map(|i| i > 0).unwrap_or(false) {
                                cb.push0(&format!("{} @- <<EOF\n{pretty}\nEOF", arg("data")));
                            } else {
                                cb.push0(&format!("{} '\n{pretty}\n'", arg("data")));
                            }
                        }
                    }
                    if !built {
                        cb.push0(&format!("{} {}", arg("data"), quote(text)));
                    }
                }
            }
        }
    }

    cb.join()
}
