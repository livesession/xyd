//! `src/targets/javascript/fetch/client.ts` with default options
//! (`indent: "  ", credentials: null`). The options object is rendered by the
//! `stringify-object` port with the body-wrapping `transform`. Multipart is out
//! of scope.

use serde_json::{Map, Value};

use crate::code_builder::CodeBuilder;
use crate::prepare::Prepared;
use crate::stringify_object::{stringify_object, Options};

pub fn convert(req: &Prepared) -> String {
    let indent = "  ";
    let mut cb = CodeBuilder::new(indent, None);

    let pd = &req.post_data;

    // Build the ordered options object: method, [headers], [body].
    let mut options = Map::new();
    options.insert("method".to_string(), Value::String(req.method.clone()));
    if !req.all_headers.is_empty() {
        options.insert(
            "headers".to_string(),
            Value::Object(req.all_headers.clone()),
        );
    }
    match pd.mime_type.as_str() {
        "application/x-www-form-urlencoded" => {
            if let Some(params_obj) = &pd.params_obj {
                options.insert("body".to_string(), Value::Object(params_obj.clone()));
            } else if let Some(text) = &pd.text {
                options.insert("body".to_string(), Value::String(text.clone()));
            }
        }
        "application/json" => {
            if let Some(json_obj) = &pd.json_obj {
                options.insert("body".to_string(), json_obj.clone());
            }
        }
        _ => {
            if let Some(text) = pd.text.as_ref().filter(|t| !t.is_empty()) {
                options.insert("body".to_string(), Value::String(text.clone()));
            }
        }
    }

    let mime = pd.mime_type.clone();
    let transform = move |property: &str, original: String| -> String {
        if property == "body" {
            if mime == "application/x-www-form-urlencoded" {
                return format!("new URLSearchParams({original})");
            } else if mime == "application/json" {
                return format!("JSON.stringify({original})");
            }
        }
        original
    };

    let rendered = stringify_object(
        &Value::Object(options),
        &Options {
            indent,
            inline_character_limit: Some(80),
            transform: Some(&transform),
        },
    );

    cb.push0(&format!("const options = {rendered};"));
    cb.blank();
    cb.push0(&format!("fetch('{}', options)", req.full_url));
    cb.push(".then(res => res.json())", 1);
    cb.push(".then(res => console.log(res))", 1);
    cb.push(".catch(err => console.error(err));", 1);

    cb.join()
}
