//! `opensdk run` — the chain.json target loop.
//!
//! The chain ENGINE (`xyd_opensdk_chain`) owns `resolve_chain` + `process_source`
//! (merge inputs, apply overlays → one processed spec). The TARGET LOOP lives
//! here, exactly as the TypeScript keeps it out of the converter packages:
//! it needs `generate_command` and `publish_target`, which need the emitters.
//! Where the TS injects those as closures, this calls them directly — the
//! indirection existed only to keep the chain package emitter-free.

use std::path::Path;

use serde_json::Value;

use xyd_opensdk_chain::{process_source, resolve_chain, ChainSource};
use xyd_opensdk_config::{merge_publish_targets, ChainTarget};

use crate::error::{Error, Result};
use crate::exec::EmitterPublishOptions;
use crate::generate::{generate_command, merge_behavior_overrides, GenerateCommandOptions};
use crate::grouping::ConverterInputs;
use crate::paths;
use crate::publish::publish_target;

#[derive(Debug, Clone, Default)]
pub struct RunOptions {
    /// Path to the chain file.
    pub chain: String,
    /// Only this target (else every declared target).
    pub target: Option<String>,
    /// Only targets bound to this source.
    pub source: Option<String>,
    /// Also publish each generated target.
    pub publish: bool,
    /// Process + print without writing SDKs or pushing.
    pub dry_run: bool,
}

fn object<'a>(doc: &'a Value, key: &str) -> &'a serde_json::Map<String, Value> {
    static EMPTY: std::sync::OnceLock<serde_json::Map<String, Value>> = std::sync::OnceLock::new();
    doc.get(key)
        .and_then(Value::as_object)
        .unwrap_or_else(|| EMPTY.get_or_init(serde_json::Map::new))
}

pub fn run_chain(opts: &RunOptions, cwd: &Path) -> Result<()> {
    let doc = resolve_chain(&opts.chain, cwd).map_err(|e| Error::msg(e.to_string()))?;
    let targets = object(&doc, "targets").clone();
    let sources = object(&doc, "sources").clone();

    if let Some(t) = opts.target.as_deref() {
        if !targets.contains_key(t) {
            return Err(Error::msg(format!("Unknown target \"{t}\"")));
        }
    }
    if let Some(s) = opts.source.as_deref() {
        if !sources.contains_key(s) {
            return Err(Error::msg(format!("Unknown source \"{s}\"")));
        }
    }

    let candidates: Vec<String> = match opts.target.as_deref() {
        Some(t) => vec![t.to_string()],
        None => targets.keys().cloned().collect(),
    };
    let target_names: Vec<String> = candidates
        .into_iter()
        .filter(|n| match opts.source.as_deref() {
            None => true,
            Some(s) => {
                targets
                    .get(n)
                    .and_then(|t| t.get("source"))
                    .and_then(Value::as_str)
                    == Some(s)
            }
        })
        .collect();
    if target_names.is_empty() {
        return Err(Error::msg(
            "No targets to run for the given --target/--source.",
        ));
    }

    let parse_target = |name: &str| -> Result<ChainTarget> {
        serde_json::from_value(targets[name].clone())
            .map_err(|e| Error::msg(format!("invalid chain target \"{name}\": {e}")))
    };

    // Process each referenced source exactly once (first-seen order, matching
    // `new Set(...)`) → a processed spec path.
    let mut spec_by_name: Vec<(String, String)> = Vec::new();
    for name in &target_names {
        let sname = parse_target(name)?.source;
        if spec_by_name.iter().any(|(n, _)| *n == sname) {
            continue;
        }
        let raw = sources
            .get(&sname)
            .ok_or_else(|| Error::msg(format!("Unknown source \"{sname}\"")))?;
        let source: ChainSource = serde_json::from_value(raw.clone())
            .map_err(|e| Error::msg(format!("invalid chain source \"{sname}\": {e}")))?;
        let processed = process_source(&source, cwd).map_err(|e| Error::msg(e.to_string()))?;
        let processed = processed.to_string_lossy().to_string();
        println!("Processed source \"{sname}\" → {processed}");
        spec_by_name.push((sname, processed));
    }

    let dry_suffix = if opts.dry_run { " (dry-run)" } else { "" };
    for tname in &target_names {
        let t = parse_target(tname)?;
        // Resolve against the run cwd so a relative/default output roots at the
        // caller's cwd.
        let output = paths::resolve_str(
            cwd,
            &t.output
                .clone()
                .unwrap_or_else(|| paths::join("./sdk", tname)),
        );
        let publish = merge_publish_targets(&[
            doc.get("publish").and_then(as_publish).as_ref(),
            t.publish.as_ref(),
        ]);
        let spec = spec_by_name
            .iter()
            .find(|(n, _)| *n == t.source)
            .map(|(_, p)| p.clone())
            .expect("every referenced source was processed");

        println!(
            "Generating target \"{tname}\" ({}) → {output}{dry_suffix}",
            t.target
        );
        let grouping = t.grouping.as_ref();
        generate_command(
            &GenerateCommandOptions {
                inputs: ConverterInputs {
                    sdk_name: t.sdk_name.clone(),
                    mount_rules: grouping
                        .and_then(|g| g.mount_rules.as_ref())
                        .map(|m| Value::Object(m.clone())),
                    operation_hints: grouping
                        .and_then(|g| g.operation_hints.as_ref())
                        .map(|h| serde_json::to_value(h).expect("hints serialize")),
                    grouping: None,
                    sdk: Some(merge_behavior_overrides(&[
                        doc.get("behavior"),
                        t.behavior.as_ref(),
                    ])),
                },
                spec,
                lang: t.target.clone(),
                output: output.clone(),
                dry_run: opts.dry_run,
                no_tests: t.tests == Some(false),
                emitter_options: t.options.clone(),
                publish: publish.clone(),
                merge: false,
            },
            cwd,
        )?;

        if opts.publish {
            let token = publish
                .as_ref()
                .and_then(|p| p.token_env.as_deref())
                .and_then(|env| match std::env::var(env) {
                    Ok(v) if !v.is_empty() => Some(v),
                    _ => {
                        eprintln!("Warning: publish.tokenEnv \"{env}\" is not set.");
                        None
                    }
                });
            println!(
                "Publishing target \"{tname}\" ({}) from {output}{dry_suffix}",
                t.target
            );
            publish_target(
                &t.target,
                Path::new(&output),
                &EmitterPublishOptions {
                    registry: publish.as_ref().and_then(|p| p.registry.clone()),
                    token,
                    version: publish.as_ref().and_then(|p| p.version.clone()),
                    tag: None,
                    dry_run: opts.dry_run,
                },
            )?;
        }
    }
    Ok(())
}

fn as_publish(v: &Value) -> Option<xyd_opensdk_config::PublishTarget> {
    serde_json::from_value(v.clone()).ok()
}
