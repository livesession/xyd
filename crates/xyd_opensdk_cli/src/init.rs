//! `src/cli/init.ts` — scaffold a config: `sdk.json` (default), a `chain.json`
//! pipeline (`--chain`), or an `opensdk.config.mjs` plugin bundle.
//!
//! The `mjs` bundle is still SCAFFOLDED (it is a legitimate artifact for a JS
//! toolchain) even though this binary cannot LOAD one — see [`crate::config`].

use std::path::Path;

use serde_json::{json, Map, Value};

use crate::error::{Error, Result};
use crate::paths;

#[derive(Debug, Clone, Default)]
pub struct InitOptions {
    pub project: Option<String>,
    /// `json` (default) scaffolds sdk.json; `mjs` the opensdk.config.mjs bundle.
    pub format: Option<String>,
    /// Write the config under a subdir (e.g. `.sdk` / `.chain`).
    pub dir: Option<String>,
    /// Seed the scaffolded language section (default `typescript`).
    pub lang: Option<String>,
    /// Scaffold a `chain.json` pipeline instead of sdk.json.
    pub chain: bool,
}

/// `JSON.stringify(doc, null, 2) + "\n"`.
fn stringify(doc: &Value) -> String {
    format!(
        "{}\n",
        serde_json::to_string_pretty(doc).expect("template serializes")
    )
}

/// The templates build their object key BY KEY (rather than through one `json!`
/// literal) because two of the keys are computed from `lang` — and because the
/// emitted key ORDER is part of the golden.
pub fn chain_json_template(lang: &str) -> String {
    let mut targets = Map::new();
    targets.insert(
        format!("{lang}-sdk"),
        json!({
            "target": lang,
            "source": "main",
            "output": format!("./sdk/{lang}"),
            "publish": { "registry": "https://registry.npmjs.org", "tokenEnv": "NPM_TOKEN" }
        }),
    );
    let mut doc = Map::new();
    doc.insert(
        "$schema".into(),
        json!("https://unpkg.com/@xyd-js/opensdk-schemas/chain.schema.json"),
    );
    doc.insert("version".into(), json!(1));
    // Package identity threaded onto every SDK; per-target `publish` adds the
    // registry + tokenEnv.
    doc.insert(
        "publish".into(),
        json!({ "author": "Acme", "license": "MIT", "repository": "https://github.com/acme/acme" }),
    );
    // Named sources: each produces ONE processed spec. Multiple `inputs` are
    // merged; `overlays` (OpenAPI Overlay 1.0.0) patch the result.
    doc.insert(
        "sources".into(),
        json!({
            "main": {
                "inputs": [{ "location": "./openapi.yaml" }],
                "output": "./.chain/main.openapi.json"
            }
        }),
    );
    // Named targets: each generates (and, with `--publish`, publishes) one SDK.
    doc.insert("targets".into(), Value::Object(targets));
    stringify(&Value::Object(doc))
}

pub fn sdk_json_template(lang: &str) -> String {
    let mut doc = Map::new();
    doc.insert(
        "$schema".into(),
        json!("https://unpkg.com/@xyd-js/opensdk-schemas/sdk.schema.json"),
    );
    doc.insert("version".into(), json!(1));
    doc.insert("sdkName".into(), json!("acme"));
    // Global runtime behavior, deep-merged over the canonical
    // defaultSdkBehavior() (arrays replace entirely). A per-language `behavior`
    // block overrides this for that language.
    doc.insert(
        "behavior".into(),
        json!({ "retry": { "maxRetries": 3 }, "timeout": { "defaultTimeoutMs": 30000 } }),
    );
    // Package identity threaded onto every manifest. A language section's
    // `publish` overrides these + carries the registry + `tokenEnv`.
    doc.insert(
        "publish".into(),
        json!({ "author": "Acme", "license": "MIT", "repository": "https://github.com/acme/acme" }),
    );
    // Per-language section: emitter options + `output` + optional
    // `behavior`/`publish`. Keys accept aliases (typescript->node, ...).
    doc.insert(
        lang.to_string(),
        json!({
            "packageName": "acme",
            "output": format!("./sdk/{lang}"),
            "publish": { "registry": "https://registry.npmjs.org", "tokenEnv": "NPM_TOKEN" }
        }),
    );
    stringify(&Value::Object(doc))
}

pub fn mjs_template() -> String {
    // Byte-identical to the TypeScript template literal.
    r#"// opensdk plugin bundle. The built-in emitters (go/python/node/ruby/java/dotnet)
// are registered automatically; register your OWN emitter here — it must
// implement the @xyd-js/opensdk-framework Emitter contract. (For declarative
// config without custom emitters, prefer sdk.json — run `opensdk init`.)
//
// import { myEmitter } from './src/my-emitter.mjs';

/** @type {import('@xyd-js/opensdk-cli').OpensdkCliConfig} */
export default {
  emitters: [
    // myEmitter,
  ],
  emitterOptions: {
    // go: { modulePath: 'github.com/acme/acme-go' },
    // python: { packageName: 'acme' },
    // Generated SDKs ship a self-test suite by default. Opt a language out with
    // <lang>.tests: false (same effect as `generate --no-tests`):
    // go: { tests: false },
  },
  // Declarative runtime behavior, deep-merged over the canonical defaults
  // (@xyd-js/opensdk-core defaultSdkBehavior()); arrays replace entirely.
  //
  // sdk: {
  //   retry: { maxRetries: 3 },
  //   timeout: { defaultTimeoutMs: 30000 },
  // },
  //
  // Spec-external resource grouping (Stainless-style beta/admin namespacing).
  // mountRules: { assistants: 'beta/assistants' },
  // operationHints: { 'POST /assistants': { mountOn: 'beta/assistants' } },
};
"#
    .to_string()
}

/// What an `init` invocation WOULD write: the absolute path, the file body, and
/// the name used in the "already initialized" error.
///
/// Split out of [`init_command`] so the whole decision — which template, which
/// path, which `--dir` handling — is a pure function the oracle can compare.
#[derive(Debug, Clone, PartialEq)]
pub struct InitPlan {
    pub path: String,
    pub body: String,
    pub exists_label: &'static str,
}

pub fn init_plan(opts: &InitOptions, cwd: &Path) -> InitPlan {
    let project_dir = paths::resolve_str(cwd, opts.project.as_deref().unwrap_or("."));
    let lang = opts.lang.as_deref().unwrap_or("typescript");
    let dir = opts.dir.as_deref().unwrap_or(".");

    if opts.chain {
        return InitPlan {
            path: paths::join_all(&[&project_dir, dir, "chain.json"]),
            body: chain_json_template(lang),
            exists_label: "chain.json",
        };
    }
    if opts.format.as_deref() == Some("mjs") {
        // NOTE: the TS resolves this one WITHOUT `--dir` (and does no mkdir).
        return InitPlan {
            path: paths::join_all(&[&project_dir, "opensdk.config.mjs"]),
            body: mjs_template(),
            exists_label: "opensdk.config.mjs",
        };
    }
    InitPlan {
        path: paths::join_all(&[&project_dir, dir, "sdk.json"]),
        body: sdk_json_template(lang),
        exists_label: "sdk.json",
    }
}

pub fn init_command(opts: &InitOptions, cwd: &Path) -> Result<()> {
    let plan = init_plan(opts, cwd);
    if Path::new(&plan.path).exists() {
        return Err(Error::msg(format!(
            "Project already initialized — {} exists",
            plan.exists_label
        )));
    }
    // The TS only mkdirs for the sdk.json/chain.json paths; doing it for the
    // mjs one too is additive (it can only turn an ENOENT into a success).
    let parent = paths::dirname(&plan.path);
    std::fs::create_dir_all(&parent).map_err(|e| Error::msg(format!("create {parent}: {e}")))?;
    std::fs::write(&plan.path, &plan.body)
        .map_err(|e| Error::msg(format!("write {}: {e}", plan.path)))?;
    println!("Created {}", plan.path);
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn sdk_json_template_key_order_and_seeded_language() {
        let body = sdk_json_template("typescript");
        let doc: Value = serde_json::from_str(&body).unwrap();
        let keys: Vec<&str> = doc
            .as_object()
            .unwrap()
            .keys()
            .map(String::as_str)
            .collect();
        assert_eq!(
            keys,
            [
                "$schema",
                "version",
                "sdkName",
                "behavior",
                "publish",
                "typescript"
            ]
        );
        assert_eq!(doc["typescript"]["output"], json!("./sdk/typescript"));
        assert!(body.ends_with("}\n"));
    }

    #[test]
    fn chain_json_template_names_the_target_after_the_language() {
        let doc: Value = serde_json::from_str(&chain_json_template("go")).unwrap();
        assert_eq!(doc["targets"]["go-sdk"]["target"], json!("go"));
        assert_eq!(doc["targets"]["go-sdk"]["source"], json!("main"));
        assert_eq!(
            doc["sources"]["main"]["inputs"][0]["location"],
            json!("./openapi.yaml")
        );
    }

    #[test]
    fn mjs_template_carries_the_emitters_seam() {
        assert!(mjs_template().contains("emitters"));
        assert!(mjs_template().ends_with("};\n"));
    }
}
