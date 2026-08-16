//! `@xyd-js/opensdk-*` emitter native surfaces (S6+ W7 wiring). Each takes the
//! OpenSDK IR (`OpensdkSpecJson`, JSON) and returns the FULL generated SDK file
//! tree as a `path -> content` JSON object (byte-identical to the JS emitter's
//! output — the crates are golden-parity against the same fixtures). The JS
//! framework dispatches to these when @xyd-js/native is present, else drives the
//! per-capability JS emitter. One thin wrapper per language; the ownership
//! header + capability ordering already live in the pure crate.

use napi::bindgen_prelude::*;
use napi_derive::napi;

macro_rules! opensdk_surface {
    ($js_name:literal, $fn_name:ident, $crate_fn:path, $tag:literal) => {
        #[napi(js_name = $js_name)]
        pub fn $fn_name(spec_json: String) -> Result<String> {
            let spec: serde_json::Value = serde_json::from_str(&spec_json)
                .map_err(|e| Error::from_reason(format!(concat!("[", $tag, "] bad spec: {}"), e)))?;
            let files = $crate_fn(&spec);
            serde_json::to_string(&files).map_err(|e| {
                Error::from_reason(format!(concat!("[", $tag, "] serialize: {}"), e))
            })
        }
    };
}

opensdk_surface!(
    "opensdkGenerateGo",
    opensdk_generate_go,
    xyd_opensdk_go::generate_go,
    "xyd_opensdk_go"
);
opensdk_surface!(
    "opensdkGenerateNode",
    opensdk_generate_node,
    xyd_opensdk_node::generate_node,
    "xyd_opensdk_node"
);
opensdk_surface!(
    "opensdkGeneratePython",
    opensdk_generate_python,
    xyd_opensdk_python::generate_python,
    "xyd_opensdk_python"
);
opensdk_surface!(
    "opensdkGenerateRuby",
    opensdk_generate_ruby,
    xyd_opensdk_ruby::generate_ruby,
    "xyd_opensdk_ruby"
);
opensdk_surface!(
    "opensdkGenerateJava",
    opensdk_generate_java,
    xyd_opensdk_java::generate_java,
    "xyd_opensdk_java"
);
opensdk_surface!(
    "opensdkGenerateDotnet",
    opensdk_generate_dotnet,
    xyd_opensdk_dotnet::generate_dotnet,
    "xyd_opensdk_dotnet"
);
opensdk_surface!(
    "opensdkGenerateRust",
    opensdk_generate_rust,
    xyd_opensdk_rust::generate_rust,
    "xyd_opensdk_rust"
);
