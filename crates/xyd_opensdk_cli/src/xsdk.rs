//! `src/cli/xsdk.ts` + the `embedXSdk` half of `@xyd-js/opensdk-uniform`.
//!
//! The CI/CD-side spec enricher: read a RAW OpenAPI spec, compute every
//! operation's per-language SDK artifacts (signature, usage sample,
//! request/response type reference) through the emitters' DOCS capabilities,
//! and write the spec back with `x-sdk` extensions embedded (root + per
//! operation). Ship the result as your published OpenAPI and a docs site
//! renders SDK-native docs from it WITHOUT running the generator.
//!
//! Only `embedXSdk` is ported from `opensdk-uniform` — the rest of that package
//! is the DOCS-side reader (`attachSdkExamples` / `attachSdkFromSpec`), which
//! consumes Uniform `Reference`s and belongs to the docs pipeline, not the CLI.
//!
//! The heavy lifting is already Rust: `EmitterFns::docs_map(spec, options)` is
//! the port of `prepareSdk` + `operationDocs`, keyed identically
//! (`"<httpmethod-lowercase> <path>"`).

use std::collections::BTreeMap;
use std::io::Write;

use serde_json::{Map, Value};

use xyd_opensdk_core::emitter::{EmitterFns, OperationDocs};

use crate::error::{Error, Result};

/// One SDK language in the switcher. `id` is the public `x-sdk` key (the coder
/// highlight id — `typescript`/`csharp`, NOT the canonical emitter id).
struct SdkLang {
    id: &'static str,
    emitter: &'static EmitterFns,
}

/// The SDK languages, in switcher order (`SDK_LANGS`).
fn sdk_langs() -> Vec<SdkLang> {
    vec![
        SdkLang {
            id: "go",
            emitter: &xyd_opensdk_go::EMITTER,
        },
        SdkLang {
            id: "python",
            emitter: &xyd_opensdk_python::EMITTER,
        },
        SdkLang {
            id: "typescript",
            emitter: &xyd_opensdk_node::EMITTER,
        },
        SdkLang {
            id: "ruby",
            emitter: &xyd_opensdk_ruby::EMITTER,
        },
        SdkLang {
            id: "java",
            emitter: &xyd_opensdk_java::EMITTER,
        },
        SdkLang {
            id: "csharp",
            emitter: &xyd_opensdk_dotnet::EMITTER,
        },
    ]
}

const XSDK_KEY: &str = "x-sdk";

const HTTP_METHODS: [&str; 8] = [
    "get", "put", "post", "delete", "options", "head", "patch", "trace",
];

/// The result of embedding: the enriched doc, how many operations got an
/// `x-sdk`, and which languages were embedded.
#[derive(Debug, Clone)]
pub struct EmbedXSdkResult {
    pub doc: Value,
    pub operations: usize,
    pub languages: Vec<String>,
}

/// Embed `x-sdk` artifacts into a RAW (un-dereferenced) OpenAPI document.
pub fn embed_xsdk(raw_doc: &Value, langs: Option<&[String]>) -> Result<EmbedXSdkResult> {
    // `openapi2opensdk` needs `$ref` identity, so it runs on the RAW doc.
    let ir = xyd_openapi2opensdk::openapi2opensdk(raw_doc, None)
        .map_err(|_| Error::msg("embedXSdk: unsupported OpenAPI document (not 3.x / no paths)"))?;
    let ir = serde_json::to_value(&ir).map_err(|e| Error::msg(e.to_string()))?;

    let selected: Vec<SdkLang> = match langs {
        Some(wanted) => sdk_langs()
            .into_iter()
            .filter(|l| wanted.iter().any(|w| w == l.id))
            .collect(),
        None => sdk_langs(),
    };
    if selected.is_empty() {
        return Err(Error::msg(format!(
            "embedXSdk: no known SDK languages in [{}]",
            langs.map(|l| l.join(", ")).unwrap_or_default()
        )));
    }

    // One docs pass per language over the whole IR (the batch surface), keyed
    // `"<method> <path>"` exactly like the operation loop below looks it up.
    let no_options = Value::Null;
    let docs: Vec<(&'static str, BTreeMap<String, OperationDocs>)> = selected
        .iter()
        .filter_map(|l| l.emitter.docs_map(&ir, &no_options).map(|m| (l.id, m)))
        .collect();

    let mut doc = raw_doc.clone();
    let mut operations = 0usize;

    let path_names: Vec<String> = doc
        .get("paths")
        .and_then(Value::as_object)
        .map(|p| p.keys().cloned().collect())
        .unwrap_or_default();

    for spec_path in path_names {
        for method in HTTP_METHODS {
            let key = format!("{method} {spec_path}");
            let mut xop = Map::new();
            for (id, map) in &docs {
                let Some(found) = map.get(&key) else { continue };
                let mut entry = Map::new();
                if !found.usage.is_empty() {
                    entry.insert("usage".into(), Value::String(found.usage.clone()));
                }
                let tref = &found.type_reference;
                entry.insert("signature".into(), Value::String(tref.signature.clone()));
                let mut types = Map::new();
                types.insert(
                    "request".into(),
                    serde_json::to_value(&tref.request).map_err(|e| Error::msg(e.to_string()))?,
                );
                types.insert(
                    "response".into(),
                    serde_json::to_value(&tref.response).map_err(|e| Error::msg(e.to_string()))?,
                );
                entry.insert("types".into(), Value::Object(types));
                xop.insert((*id).to_string(), Value::Object(entry));
            }
            if xop.is_empty() {
                continue;
            }
            let Some(op) = doc
                .get_mut("paths")
                .and_then(|p| p.get_mut(&spec_path))
                .and_then(|pi| pi.get_mut(method))
                .and_then(Value::as_object_mut)
            else {
                continue;
            };
            op.insert(XSDK_KEY.into(), Value::Object(xop));
            operations += 1;
        }
    }

    let languages: Vec<String> = selected.iter().map(|l| l.id.to_string()).collect();
    if let Some(root) = doc.as_object_mut() {
        root.insert(
            XSDK_KEY.into(),
            serde_json::json!({ "languages": languages.clone() }),
        );
    }
    Ok(EmbedXSdkResult {
        doc,
        operations,
        languages,
    })
}

#[derive(Debug, Clone, Default)]
pub struct XsdkCommandOptions {
    /// OpenAPI spec path (yaml/json).
    pub spec: String,
    /// Write the enriched spec to a file; default stdout. Extension picks format.
    pub output: Option<String>,
    /// Restrict to a subset of SDK language ids (default: all six).
    pub langs: Option<Vec<String>>,
}

/// Read a spec, returning its text and whether it is JSON.
fn read_source(source: &str) -> Result<(String, bool)> {
    if source.starts_with("http://") || source.starts_with("https://") {
        // The TS uses `fetch`; this crate stays HTTP-free (the same call every
        // other ported converter makes its caller pre-fetch).
        return Err(Error::msg(format!(
            "Failed to fetch OpenAPI spec from {source}: remote specs are not supported by the \
             Rust `opensdk xsdk` — download the spec and pass a local path."
        )));
    }
    let content =
        std::fs::read_to_string(source).map_err(|e| Error::msg(format!("read {source}: {e}")))?;
    let json = source.ends_with(".json") || content.trim_start().starts_with('{');
    Ok((content, json))
}

fn serialize(doc: &Value, as_json: bool) -> Result<String> {
    if as_json {
        return Ok(format!(
            "{}\n",
            serde_json::to_string_pretty(doc).map_err(|e| Error::msg(e.to_string()))?
        ));
    }
    // js-yaml `dump(doc, { noRefs: true, lineWidth: -1 })`. serde_yaml never
    // emits anchors/aliases for a `Value`, so `noRefs` is structural here; the
    // exact line breaking is NOT byte-identical to js-yaml (documented
    // divergence — the contract is that the output re-parses to the same doc
    // and carries no `&ref` anchors).
    serde_yaml::to_string(doc).map_err(|e| Error::msg(format!("yaml: {e}")))
}

pub fn xsdk_command(opts: &XsdkCommandOptions) -> Result<()> {
    let (content, json) = read_source(&opts.spec)?;
    let doc: Value = if json {
        serde_json::from_str(&content).map_err(|e| Error::msg(format!("json: {e}")))?
    } else {
        xyd_openapi::parse_spec(&content, &opts.spec).map_err(|e| Error::msg(e.to_string()))?
    };

    let result = embed_xsdk(&doc, opts.langs.as_deref())?;

    let out_json = match opts.output.as_deref() {
        Some(output) => output.ends_with(".json"),
        None => json,
    };
    let out = serialize(&result.doc, out_json)?;

    match opts.output.as_deref() {
        Some(output) => {
            std::fs::write(output, &out).map_err(|e| Error::msg(format!("write {output}: {e}")))?;
            println!(
                "[xsdk] embedded {} for {} operation(s) → {output}",
                result.languages.join(", "),
                result.operations
            );
        }
        None => {
            let mut stdout = std::io::stdout();
            let _ = stdout.write_all(out.as_bytes());
            let _ = stdout.flush();
        }
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn the_switcher_order_is_the_public_language_list() {
        let ids: Vec<&str> = sdk_langs().iter().map(|l| l.id).collect();
        assert_eq!(
            ids,
            ["go", "python", "typescript", "ruby", "java", "csharp"]
        );
    }

    #[test]
    fn unknown_only_languages_fail_loudly() {
        let doc = serde_json::json!({
            "openapi": "3.0.0",
            "info": { "title": "t", "version": "1" },
            "paths": { "/pets": { "get": { "operationId": "listPets", "responses": {} } } }
        });
        let err = embed_xsdk(&doc, Some(&["cobol".to_string()])).unwrap_err();
        assert_eq!(err.0, "embedXSdk: no known SDK languages in [cobol]");
    }

    #[test]
    fn a_non_openapi3_document_is_rejected() {
        let err = embed_xsdk(&serde_json::json!({ "swagger": "2.0" }), None).unwrap_err();
        assert_eq!(
            err.0,
            "embedXSdk: unsupported OpenAPI document (not 3.x / no paths)"
        );
    }

    #[test]
    fn remote_specs_are_rejected_with_a_pointer_to_a_local_path() {
        let err = read_source("https://example.com/openapi.json").unwrap_err();
        assert!(
            err.0.contains("Failed to fetch OpenAPI spec from"),
            "{}",
            err.0
        );
    }
}
