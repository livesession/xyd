//! `src/targets/python/requests/client.ts` with default options
//! (`indent: "    ", pretty: true`). Multipart file handling is omitted (not in
//! scope).

use serde_json::Value;

use super::{header_string, json_stringify};
use crate::code_builder::CodeBuilder;
use crate::jsutil::{escape_double, js_number_string};
use crate::prepare::Prepared;

const BUILT_IN_METHODS: &[&str] = &["HEAD", "GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"];

fn concat_values(
    concat_type: &str,
    values: &[String],
    pretty: bool,
    indentation: &str,
    indent_level: usize,
) -> String {
    let current_indent = indentation.repeat(indent_level);
    let closing_indent = indentation.repeat(indent_level.saturating_sub(1));
    let join = if pretty {
        format!(",\n{current_indent}")
    } else {
        ", ".to_string()
    };
    let (open, close) = if concat_type == "object" {
        ("{", "}")
    } else {
        ("[", "]")
    };
    if pretty {
        return format!(
            "{open}\n{current_indent}{}\n{closing_indent}{close}",
            values.join(&join)
        );
    }
    if concat_type == "object" && !values.is_empty() {
        return format!("{open} {} {close}", values.join(&join));
    }
    format!("{open}{}{close}", values.join(&join))
}

/// `literalRepresentation2(value, { indent, pretty }, indentLevel)`.
fn literal_representation(
    value: &Value,
    indent: &str,
    pretty_opt: bool,
    indent_level: Option<usize>,
) -> String {
    let indent_level = match indent_level {
        None => 1,
        Some(l) => l + 1,
    };
    match value {
        Value::Number(n) => js_number_string(n),
        Value::Array(a) => {
            let mut pretty = false;
            let reprs: Vec<String> = a
                .iter()
                .map(|v| {
                    if let Value::Object(o) = v {
                        pretty = o.len() > 1;
                    }
                    literal_representation(v, indent, pretty_opt, Some(indent_level))
                })
                .collect();
            concat_values("array", &reprs, pretty, indent, indent_level)
        }
        Value::Object(o) => {
            let pairs: Vec<String> = o
                .iter()
                .map(|(k, v)| {
                    format!(
                        "\"{k}\": {}",
                        literal_representation(v, indent, pretty_opt, Some(indent_level))
                    )
                })
                .collect();
            concat_values(
                "object",
                &pairs,
                pretty_opt && pairs.len() > 1,
                indent,
                indent_level,
            )
        }
        Value::Null => "None".to_string(),
        Value::Bool(b) => if *b { "True" } else { "False" }.to_string(),
        Value::String(s) => format!("\"{}\"", s.replace('"', "\\\"")),
    }
}

pub fn convert(req: &Prepared) -> String {
    let indent = "    ";
    let mut cb = CodeBuilder::new(indent, None);
    cb.push0("import requests");
    cb.blank();
    cb.push0(&format!("url = \"{}\"", req.full_url));
    cb.blank();

    let headers = &req.all_headers;
    let mut has_payload = false;
    let mut json_payload = false;
    let pd = &req.post_data;

    match pd.mime_type.as_str() {
        "application/json" => {
            if let Some(json_obj) = &pd.json_obj {
                cb.push0(&format!(
                    "payload = {}",
                    literal_representation(json_obj, indent, true, None)
                ));
                json_payload = true;
                has_payload = true;
            }
        }
        _ => {
            if pd.mime_type == "application/x-www-form-urlencoded" {
                if let Some(params_obj) = &pd.params_obj {
                    cb.push0(&format!(
                        "payload = {}",
                        literal_representation(
                            &Value::Object(params_obj.clone()),
                            indent,
                            true,
                            None
                        )
                    ));
                    has_payload = true;
                }
            } else if let Some(text) = &pd.text {
                let string_payload = json_stringify(&Value::String(text.clone()));
                if !string_payload.is_empty() {
                    cb.push0(&format!("payload = {string_payload}"));
                    has_payload = true;
                }
            }
        }
    }

    let header_count = headers.len();
    if header_count == 0 && has_payload {
        cb.blank();
    } else if header_count == 1 {
        for (h, v) in headers {
            cb.push0(&format!(
                "headers = {{\"{h}\": \"{}\"}}",
                escape_double(&header_string(v))
            ));
            cb.blank();
        }
    } else if header_count > 1 {
        cb.push0("headers = {");
        for (i, (h, v)) in headers.into_iter().enumerate() {
            let esc = escape_double(&header_string(v));
            if i + 1 != header_count {
                cb.push(&format!("\"{h}\": \"{esc}\","), 1);
            } else {
                cb.push(&format!("\"{h}\": \"{esc}\""), 1);
            }
        }
        cb.push0("}");
        cb.blank();
    }

    let mut request = if BUILT_IN_METHODS.contains(&req.method.as_str()) {
        format!("response = requests.{}(url", req.method.to_lowercase())
    } else {
        format!("response = requests.request(\"{}\", url", req.method)
    };
    if has_payload {
        if json_payload {
            request.push_str(", json=payload");
        } else {
            request.push_str(", data=payload");
        }
    }
    if header_count > 0 {
        request.push_str(", headers=headers");
    }
    request.push(')');
    cb.push0(&request);
    cb.blank();
    cb.push0("print(response.text)");

    cb.join()
}
