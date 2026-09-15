//! `src/cli/parse.ts` — OpenAPI spec → OpenSDK IR as JSON (stdout or `--output`).

use std::io::Write;
use std::path::Path;

use serde_json::Value;

use crate::error::{Error, Result};
use crate::grouping::{converter_options, ConverterInputs};

#[derive(Debug, Clone, Default)]
pub struct ParseCommandOptions {
    pub inputs: ConverterInputs,
    pub spec: String,
    pub output: Option<String>,
}

pub fn parse_command(opts: &ParseCommandOptions, cwd: &Path) -> Result<()> {
    let options = converter_options(&opts.inputs, cwd)?;
    // NOTE: `parse` deliberately calls the CONVERTER, not `load_ir` — feeding it
    // an already-parsed IR is an error, not a pass-through (same as the TS).
    let doc = xyd_oas_doc::read_spec(&opts.spec).map_err(|e| Error::msg(e.to_string()))?;
    let converter_opts = serde_json::from_value(Value::Object(options))
        .map_err(|e| Error::msg(format!("bad converter options: {e}")))?;
    let ir = xyd_openapi2opensdk::openapi2opensdk(&doc, Some(converter_opts))
        .map_err(|e| Error::msg(e.to_string()))?;
    let json = format!(
        "{}\n",
        serde_json::to_string_pretty(&ir).map_err(|e| Error::msg(e.to_string()))?
    );
    match opts.output.as_deref() {
        Some(output) => {
            std::fs::write(output, &json)
                .map_err(|e| Error::msg(format!("write {output}: {e}")))?;
            println!("Wrote IR to {output}");
        }
        None => {
            let mut stdout = std::io::stdout();
            let _ = stdout.write_all(json.as_bytes());
            let _ = stdout.flush();
        }
    }
    Ok(())
}
