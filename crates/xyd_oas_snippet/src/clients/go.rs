//! `src/targets/go/native/client.ts` with default options
//! (`showBoilerplate: true, checkErrors: false, printBody: true, timeout: -1`).

use serde_json::Value;

use super::{header_string, json_stringify};
use crate::code_builder::CodeBuilder;
use crate::jsutil::escape_double;
use crate::prepare::Prepared;

pub fn convert(req: &Prepared) -> String {
    let mut cb = CodeBuilder::new("\t", None);
    let indent = 1usize;

    let has_text = req
        .post_data
        .text
        .as_ref()
        .map(|t| !t.is_empty())
        .unwrap_or(false);

    // Boilerplate + imports.
    cb.push0("package main");
    cb.blank();
    cb.push0("import (");
    cb.push("\"fmt\"", indent);
    if has_text {
        cb.push("\"strings\"", indent);
    }
    cb.push("\"net/http\"", indent);
    cb.push("\"io\"", indent);
    cb.push0(")");
    cb.blank();
    cb.push0("func main() {");
    cb.blank();

    let client = "http.DefaultClient";

    cb.push(&format!("url := \"{}\"", req.full_url), indent);
    cb.blank();

    if has_text {
        let text = req.post_data.text.clone().unwrap_or_default();
        cb.push(
            &format!(
                "payload := strings.NewReader({})",
                json_stringify(&Value::String(text))
            ),
            indent,
        );
        cb.blank();
        cb.push(
            &format!(
                "req, _ := http.NewRequest(\"{}\", url, payload)",
                req.method
            ),
            indent,
        );
        cb.blank();
    } else {
        cb.push(
            &format!("req, _ := http.NewRequest(\"{}\", url, nil)", req.method),
            indent,
        );
        cb.blank();
    }

    if !req.all_headers.is_empty() {
        for (key, value) in &req.all_headers {
            cb.push(
                &format!(
                    "req.Header.Add(\"{key}\", \"{}\")",
                    escape_double(&header_string(value))
                ),
                indent,
            );
        }
        cb.blank();
    }

    cb.push(&format!("res, _ := {client}.Do(req)"), indent);

    cb.blank();
    cb.push("defer res.Body.Close()", indent);
    cb.push("body, _ := io.ReadAll(res.Body)", indent);

    cb.blank();
    cb.push("fmt.Println(string(body))", indent);

    cb.blank();
    cb.push0("}");

    cb.join()
}
