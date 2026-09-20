//! `@xyd-js/opensdk-*` emitter native surfaces (S6+ W7 wiring). Each takes the
//! OpenSDK IR (`OpensdkSpecJson`, JSON) and returns the FULL generated SDK file
//! tree as a `path -> { content, writeMode? }` JSON object — the TS
//! `Record<string, GeneratedFileEntry>` shape, byte-identical to the JS
//! emitter's output (the crates are golden-parity against the same fixtures).
//! The JS framework dispatches to these when @xyd-js/native is present, else
//! drives the per-capability JS emitter. One thin wrapper per language; the
//! ownership header + capability ordering already live in the pure crate.
//!
//! `writeMode` is emitted ONLY for the handful of non-default paths (7 across 5
//! languages), so the payload stays the same shape it always had. It used to be
//! rebuilt on the JS side by calling the TypeScript `generateProject` purely for
//! its write modes — which is what kept the TS emitters load-bearing even at
//! XYD_NATIVE=1.

use napi::bindgen_prelude::*;
use napi_derive::napi;

macro_rules! opensdk_surface {
    ($js_name:literal, $fn_name:ident, $crate_fn:path, $tag:literal) => {
        #[napi(js_name = $js_name)]
        pub fn $fn_name(spec_json: String, options_json: Option<String>) -> Result<String> {
            let spec: serde_json::Value = serde_json::from_str(&spec_json)
                .map_err(|e| Error::from_reason(format!(concat!("[", $tag, "] bad spec: {}"), e)))?;
            // An absent bag and `{}` behave identically; both keep every
            // spec-derived default, so the no-options path stays byte-exact.
            let options: serde_json::Value = match options_json {
                Some(raw) => serde_json::from_str(&raw).map_err(|e| {
                    Error::from_reason(format!(concat!("[", $tag, "] bad options: {}"), e))
                })?,
                None => serde_json::Value::Null,
            };
            let files = $crate_fn(&spec, &options);
            serde_json::to_string(&files).map_err(|e| {
                Error::from_reason(format!(concat!("[", $tag, "] serialize: {}"), e))
            })
        }
    };
}

opensdk_surface!(
    "opensdkGenerateGo",
    opensdk_generate_go,
    opensdk_go::generate_go_files,
    "opensdk_go"
);
opensdk_surface!(
    "opensdkGenerateNode",
    opensdk_generate_node,
    opensdk_node::generate_node_files,
    "opensdk_node"
);
opensdk_surface!(
    "opensdkGeneratePython",
    opensdk_generate_python,
    opensdk_python::generate_python_files,
    "opensdk_python"
);
opensdk_surface!(
    "opensdkGenerateRuby",
    opensdk_generate_ruby,
    opensdk_ruby::generate_ruby_files,
    "opensdk_ruby"
);
opensdk_surface!(
    "opensdkGenerateJava",
    opensdk_generate_java,
    opensdk_java::generate_java_files,
    "opensdk_java"
);
opensdk_surface!(
    "opensdkGenerateDotnet",
    opensdk_generate_dotnet,
    opensdk_dotnet::generate_dotnet_files,
    "opensdk_dotnet"
);
opensdk_surface!(
    "opensdkGenerateRust",
    opensdk_generate_rust,
    opensdk_rust::generate_rust_files,
    "opensdk_rust"
);

/// Per-language DOCS surface: every operation's usage snippet + type reference,
/// keyed `"<httpmethod-lowercase> <path>"` — exactly how `prepareFromIr` indexes
/// them on the JS side.
///
/// BATCH by design. The docs pipeline needs one entry per operation per language
/// (242 × 6 for the OpenAI spec), so a per-operation surface would mean ~1450
/// boundary crossings per build. One call per (language, spec) instead.
///
/// Returns `"null"` for a language with no docs capabilities (the Rust target,
/// which is absent from SDK_LANGS), letting the JS side fall back cleanly.
macro_rules! opensdk_docs_surface {
    ($js_name:literal, $fn_name:ident, $emitter:path, $tag:literal) => {
        #[napi(js_name = $js_name)]
        pub fn $fn_name(spec_json: String, options_json: Option<String>) -> Result<String> {
            let spec: serde_json::Value = serde_json::from_str(&spec_json)
                .map_err(|e| Error::from_reason(format!(concat!("[", $tag, "] bad spec: {}"), e)))?;
            let options: serde_json::Value = match options_json {
                Some(raw) => serde_json::from_str(&raw).map_err(|e| {
                    Error::from_reason(format!(concat!("[", $tag, "] bad options: {}"), e))
                })?,
                None => serde_json::Value::Null,
            };
            match $emitter.docs_map(&spec, &options) {
                Some(map) => serde_json::to_string(&map).map_err(|e| {
                    Error::from_reason(format!(concat!("[", $tag, "] serialize: {}"), e))
                }),
                None => Ok("null".to_string()),
            }
        }
    };
}

opensdk_docs_surface!(
    "opensdkDocsGo",
    opensdk_docs_go,
    opensdk_go::EMITTER,
    "opensdk_go"
);
opensdk_docs_surface!(
    "opensdkDocsNode",
    opensdk_docs_node,
    opensdk_node::EMITTER,
    "opensdk_node"
);
opensdk_docs_surface!(
    "opensdkDocsPython",
    opensdk_docs_python,
    opensdk_python::EMITTER,
    "opensdk_python"
);
opensdk_docs_surface!(
    "opensdkDocsRuby",
    opensdk_docs_ruby,
    opensdk_ruby::EMITTER,
    "opensdk_ruby"
);
opensdk_docs_surface!(
    "opensdkDocsJava",
    opensdk_docs_java,
    opensdk_java::EMITTER,
    "opensdk_java"
);
opensdk_docs_surface!(
    "opensdkDocsDotnet",
    opensdk_docs_dotnet,
    opensdk_dotnet::EMITTER,
    "opensdk_dotnet"
);
