//! Port of opensdk-core `config.ts`: the declarative configuration schema for
//! SDK generation.
//!
//! These are pure data types — the shape of an `sdk.json` (plus the
//! grouping/hint primitives shared with the converter) and of a `chain.json`
//! (the multi-source/multi-target pipeline `opensdk run` drives). One function
//! lives here, [`merge_publish_targets`], and it is the whole of `config.ts`'s
//! runtime behaviour.
//!
//! ## Deliberate divergences from the TypeScript
//!
//! Each is unobservable for every config in the repo, and each is here because
//! the alternative is worse than the divergence:
//!
//! 1. **No `deny_unknown_fields`, anywhere.** A TS interface silently ignores
//!    keys it does not declare; `deny_unknown_fields` would turn a
//!    forward-compatible config into a hard error. Unknown keys are either
//!    captured (where the interface has an index signature — [`SdkJson`],
//!    [`LanguageSection`], [`PublishTarget`]) or dropped (where it does not —
//!    [`ChainTarget`], [`ChainSource`], [`ChainInput`]), exactly matching what a
//!    TS consumer can reach.
//!
//! 2. **An explicit JSON `null` on a declared `Option<String>` field reads as
//!    absent**, where TS would hand the consumer `null`. The JSON Schema types
//!    every one of these as `"type": "string"`, so a `null` is already invalid
//!    config; representing it would cost a `Option<Option<_>>` on ~30 fields.
//!
//! 3. **Key order inside a merged [`PublishTarget`] is declaration order, then
//!    unknown keys**, where TS preserves first-seen insertion order across
//!    layers. Not observable: every consumer reads a publish target
//!    field-by-field (`applyPublishIdentity` in the CLI threads `author` →
//!    `info.contact.name`, `license` → `info.license.identifier`, …) — none
//!    iterates or serializes it.
//!
//! 4. **`grouping.operationHints` is a [`BTreeMap`], so it is key-sorted.** It is
//!    a pure lookup table (`operationHints["POST /threads/runs"]`), never
//!    iterated into output. `mountRules` is the opposite case and keeps its
//!    insertion order — see the field docs there.
//!
//! 5. **A non-declared `sdk.json` key whose object does not FIT
//!    [`LanguageSection`] is bucketed as a non-section value** rather than as a
//!    malformed section. That is the honest reading of the declared
//!    `[language: string]: LanguageSection | unknown` union: it is a section
//!    only if it has the section's shape.

use std::collections::BTreeMap;

use serde::{Deserialize, Serialize};
use serde_json::{Map, Value};

/// An ordered JSON object. Backed by `IndexMap` (serde_json `preserve_order`),
/// so insertion order survives a round trip.
pub type JsonObject = Map<String, Value>;

/// `version: number | string` — the config schema version.
///
/// Untagged so `1` and `"1"` both parse and each re-serializes as itself.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(untagged)]
pub enum ConfigVersion {
    Number(serde_json::Number),
    Text(String),
}

/// A per-operation mount/action override keyed by `"METHOD /path"`
/// (e.g. `{ "POST /assistants": { "mountOn": "beta/assistants" } }`).
///
/// A near-twin of `xyd_openapi2opensdk::options::OperationHint`. Kept separate
/// on purpose: that one is the CONVERTER's input bag (deserialize-only, and the
/// converter must not take a dependency edge on the config layer). This one is
/// the config schema's own type and round-trips.
#[derive(Debug, Clone, Default, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OperationHint {
    /// Re-mount the operation under this resource path (slash/space-separated
    /// segments).
    #[serde(skip_serializing_if = "Option::is_none")]
    pub mount_on: Option<String>,
    /// Override the derived action verb.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub action: Option<String>,
}

/// A publish target: how one language's generated SDK is published to its
/// registry, plus package identity threaded onto the IR (`spec.info`).
///
/// The IR already carries `version`, `contact` (author) and `license` from the
/// OpenAPI `info`; the identity fields here OVERRIDE/fill those before emit. The
/// mechanics fields (`registry`, `token_env`, `package_name`) are consumed by
/// `opensdk publish` and never baked into a manifest.
///
/// [`Self::extra`] exists because the TS merge is `Object.entries`-based and
/// therefore carries unknown keys through verbatim; the JSON Schema declares
/// `additionalProperties: false`, so in practice it is always empty.
#[derive(Debug, Clone, Default, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PublishTarget {
    // ── identity → merged onto spec.info (language-agnostic) ──
    /// Package author (`spec.info.contact.name`).
    #[serde(skip_serializing_if = "Option::is_none")]
    pub author: Option<String>,
    /// SPDX license id (`spec.info.license.identifier`), e.g. `"MIT"`.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub license: Option<String>,
    /// Source repository URL (`spec.info.repository`).
    #[serde(skip_serializing_if = "Option::is_none")]
    pub repository: Option<String>,
    /// Project homepage URL (`spec.info.homepage`).
    #[serde(skip_serializing_if = "Option::is_none")]
    pub homepage: Option<String>,
    /// Package version override (else `spec.info.version`).
    #[serde(skip_serializing_if = "Option::is_none")]
    pub version: Option<String>,
    // ── mechanics → consumed by `opensdk publish`, not the manifest ──
    /// Registry URL to publish to (npm registry, PyPI repository-url, NuGet
    /// source, ...).
    #[serde(skip_serializing_if = "Option::is_none")]
    pub registry: Option<String>,
    /// Env var name holding the auth token (read at publish time; never stored).
    #[serde(skip_serializing_if = "Option::is_none")]
    pub token_env: Option<String>,
    /// Registry package name override (else the emitter's derived value).
    #[serde(skip_serializing_if = "Option::is_none")]
    pub package_name: Option<String>,
    /// Keys the schema does not declare, carried through the merge verbatim.
    #[serde(flatten)]
    pub extra: JsonObject,
}

impl PublishTarget {
    /// Whether any field — declared or unknown — is set.
    ///
    /// This is the TS `Object.entries(layer)` loop's "did this layer contribute
    /// anything" test, which is what makes `mergePublishTargets({}, {})` return
    /// `undefined` rather than `{}`.
    pub fn is_empty(&self) -> bool {
        self.author.is_none()
            && self.license.is_none()
            && self.repository.is_none()
            && self.homepage.is_none()
            && self.version.is_none()
            && self.registry.is_none()
            && self.token_env.is_none()
            && self.package_name.is_none()
            && self.extra.is_empty()
    }
}

/// Layer publish targets left-to-right (global first, per-language last); a
/// later layer's defined field wins, an absent field is skipped. Returns `None`
/// when no layer contributes anything (so callers can skip identity threading).
///
/// Port of `mergePublishTargets(...layers)`. Rust has no variadics, so the
/// layers arrive as a slice; `None` is the TS `undefined` layer. Note that an
/// EMPTY layer contributes nothing and therefore does not force a `Some` result
/// — `merge_publish_targets(&[Some(&Default::default())])` is `None`.
pub fn merge_publish_targets(layers: &[Option<&PublishTarget>]) -> Option<PublishTarget> {
    let mut out: Option<PublishTarget> = None;
    for layer in layers.iter().copied().flatten() {
        macro_rules! carry {
            ($($field:ident),+ $(,)?) => {$(
                if let Some(v) = layer.$field.as_ref() {
                    out.get_or_insert_with(PublishTarget::default).$field = Some(v.clone());
                }
            )+};
        }
        carry!(
            author,
            license,
            repository,
            homepage,
            version,
            registry,
            token_env,
            package_name,
        );
        for (key, value) in &layer.extra {
            out.get_or_insert_with(PublishTarget::default)
                .extra
                .insert(key.clone(), value.clone());
        }
    }
    out
}

/// Spec-external resource grouping (Stainless-style beta/admin namespacing).
#[derive(Debug, Clone, Default, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SdkGrouping {
    /// Resource-level mount rules, e.g. `{ "assistants": "beta/assistants" }`.
    ///
    /// An ORDERED object, not a map: the converter scans it longest-prefix-first
    /// with a strict `>`, so on a segment-length tie the first entry sticks.
    /// Re-sorting these keys silently changes which rule applies.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub mount_rules: Option<JsonObject>,
    /// Per-operation overrides keyed by `"METHOD /path"`. A pure lookup table,
    /// so a sorted map is fine (see the divergence note on the module).
    #[serde(skip_serializing_if = "Option::is_none")]
    pub operation_hints: Option<BTreeMap<String, OperationHint>>,
}

/// One language section of an `sdk.json`: the emitter's options plus optional
/// `output` (dir), `behavior` (a per-language override deep-merged over the
/// global `behavior`) and `publish`. Every remaining key is that emitter's own
/// option (`packageName`, `modulePath`, `namespace`, ...).
#[derive(Debug, Clone, Default, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LanguageSection {
    /// Output directory for this language's generated SDK.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub output: Option<String>,
    /// Per-language behavior override (deep-merged over the global `behavior`).
    ///
    /// `DeepPartial<SdkBehavior>` in TS; an opaque `Value` here, matching
    /// `xyd_opensdk_core::behavior`, which merges behavior blocks as raw JSON.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub behavior: Option<Value>,
    /// Per-language publish target (layered over the global `publish`).
    #[serde(skip_serializing_if = "Option::is_none")]
    pub publish: Option<PublishTarget>,
    /// Everything else — this emitter's options (the TS index signature).
    #[serde(flatten)]
    pub options: JsonObject,
}

/// `SdkJson`'s declared keys. Every OTHER top-level key falls under the TS index
/// signature `[language: string]: LanguageSection | unknown`.
pub const SDK_JSON_DECLARED_KEYS: &[&str] = &[
    "$schema", "version", "api", "spec", "sdk", "behavior", "sdkName", "grouping", "publish",
];

/// The declarative `sdk.json`: global runtime `behavior` + per-language
/// sections. Language keys accept aliases (`typescript`, `csharp`, ...) — alias
/// resolution belongs to the CLI (`resolve_language`), not to the schema.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SdkJson {
    #[serde(rename = "$schema", skip_serializing_if = "Option::is_none", default)]
    pub schema: Option<String>,
    /// Config schema version. Required, mirroring the JSON Schema's
    /// `required: ["version"]` (the TS declares it non-optional too).
    pub version: ConfigVersion,
    /// The API this SDK is generated FROM — a registry ref
    /// (`apis/<ns>/<api>@<ver>`) or a path to the OpenAPI spec / pre-parsed
    /// OpenSDK IR, relative to this file. Supersedes the legacy [`Self::spec`].
    #[serde(skip_serializing_if = "Option::is_none", default)]
    pub api: Option<String>,
    /// Deprecated: renamed to [`Self::api`]. Still read as a fallback.
    #[serde(skip_serializing_if = "Option::is_none", default)]
    pub spec: Option<String>,
    /// This SDK's OWN registry identity (`sdks/<ns>/<sdk>@<ver>`) —
    /// informational.
    #[serde(skip_serializing_if = "Option::is_none", default)]
    pub sdk: Option<String>,
    /// Global runtime behavior (deep-merged over `default_behavior()`).
    #[serde(skip_serializing_if = "Option::is_none", default)]
    pub behavior: Option<Value>,
    /// Default SDK name passed to the converter.
    #[serde(skip_serializing_if = "Option::is_none", default)]
    pub sdk_name: Option<String>,
    /// Spec-external grouping.
    #[serde(skip_serializing_if = "Option::is_none", default)]
    pub grouping: Option<SdkGrouping>,
    /// Global publish target (a language section's `publish` layers over it).
    #[serde(skip_serializing_if = "Option::is_none", default)]
    pub publish: Option<PublishTarget>,
    /// Every non-declared top-level key, in file order — the index signature's
    /// raw contents. Read it through [`Self::sections`] /
    /// [`Self::non_section_values`].
    #[serde(flatten)]
    pub rest: JsonObject,
}

impl SdkJson {
    /// The language sections: non-declared keys whose value FITS
    /// [`LanguageSection`], in file order.
    ///
    /// Keys are returned verbatim (`typescript`, `csharp`, `rust-cli`, ...);
    /// mapping them to canonical emitter ids is the CLI's job.
    pub fn sections(&self) -> Vec<(String, LanguageSection)> {
        self.rest
            .iter()
            .filter(|(_, v)| v.is_object())
            .filter_map(|(k, v)| {
                serde_json::from_value::<LanguageSection>(v.clone())
                    .ok()
                    .map(|s| (k.clone(), s))
            })
            .collect()
    }

    /// The `unknown` arm of the index signature: every non-declared key that is
    /// NOT a language section, in file order.
    pub fn non_section_values(&self) -> JsonObject {
        let sections: Vec<String> = self.sections().into_iter().map(|(k, _)| k).collect();
        self.rest
            .iter()
            .filter(|(k, _)| !sections.contains(k))
            .map(|(k, v)| (k.clone(), v.clone()))
            .collect()
    }
}

// ── chain.json — the multi-source/multi-target pipeline (a Speakeasy
// workflow.yaml analog) driven by `opensdk run`. Unlike sdk.json (one API → N
// language sections), a chain declares many named SOURCES (specs, optionally
// merged + overlaid) and many named TARGETS, each binding a source + a language
// + output + publish. ────────────────────────────────────────────────────────

/// One spec/overlay input: a file path or URL.
#[derive(Debug, Clone, Default, PartialEq, Serialize, Deserialize)]
pub struct ChainInput {
    pub location: String,
}

/// A named source: one or more OpenAPI `inputs` (merged when >1) with optional
/// OpenAPI `overlays` applied in order, producing a processed spec at `output`
/// (or a temp file). Operates on the RAW doc so `$ref`s survive into the
/// converter.
#[derive(Debug, Clone, Default, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ChainSource {
    /// Spec inputs; a single input passes through, multiple are merged.
    pub inputs: Vec<ChainInput>,
    /// OpenAPI Overlay 1.0.0 documents, applied in order after merge.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub overlays: Option<Vec<ChainInput>>,
    /// Where to write the processed spec (json/yaml by extension); a temp file
    /// if omitted.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub output: Option<String>,
}

/// A named target: generate (and optionally publish) one SDK from a source.
/// Reuses the sdk.json per-language knobs so a target is effectively one
/// `opensdk generate --lang <target> --spec <source>` + `opensdk publish`.
#[derive(Debug, Clone, Default, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ChainTarget {
    /// Emitter language or alias (typescript, go, csharp, ...) — or a CLI output
    /// target (`go-cli`, `rust-cli`).
    pub target: String,
    /// Name of the `sources` entry this target generates from.
    pub source: String,
    /// SDK output directory (default `./sdk/<target-name>`).
    #[serde(skip_serializing_if = "Option::is_none")]
    pub output: Option<String>,
    /// SDK name passed to the converter.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub sdk_name: Option<String>,
    /// Behavior override, deep-merged over the chain's global `behavior`.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub behavior: Option<Value>,
    /// Spec-external grouping (mountRules/operationHints).
    #[serde(skip_serializing_if = "Option::is_none")]
    pub grouping: Option<SdkGrouping>,
    /// Emitter options for this language (packageName, modulePath, namespace,
    /// ...).
    #[serde(skip_serializing_if = "Option::is_none")]
    pub options: Option<JsonObject>,
    /// Publish target, layered over the chain's global `publish`.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub publish: Option<PublishTarget>,
    /// Emit the SDK's own test suite (default true).
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tests: Option<bool>,
}

/// The declarative `chain.json`: named `sources` → named `targets`, driven by
/// `opensdk run`. `behavior`/`publish` are global defaults merged into each
/// target.
///
/// `sources` and `targets` keep file order (they are [`JsonObject`]-backed via
/// [`Map`]) because `run_chain` processes them in declaration order.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ChainJson {
    #[serde(rename = "$schema", skip_serializing_if = "Option::is_none", default)]
    pub schema: Option<String>,
    /// Config schema version.
    pub version: ConfigVersion,
    /// Global behavior default (deep-merged under each target's `behavior`).
    #[serde(skip_serializing_if = "Option::is_none", default)]
    pub behavior: Option<Value>,
    /// Global publish default (layered under each target's `publish`).
    #[serde(skip_serializing_if = "Option::is_none", default)]
    pub publish: Option<PublishTarget>,
    /// Named sources, each producing one processed spec.
    #[serde(default)]
    pub sources: Map<String, Value>,
    /// Named targets, each = source + language + output + publish.
    #[serde(default)]
    pub targets: Map<String, Value>,
}

impl ChainJson {
    /// The sources, typed, in file order. An entry that does not fit
    /// [`ChainSource`] is skipped.
    pub fn sources(&self) -> Vec<(String, ChainSource)> {
        typed_entries(&self.sources)
    }

    /// The targets, typed, in file order. An entry that does not fit
    /// [`ChainTarget`] is skipped.
    pub fn targets(&self) -> Vec<(String, ChainTarget)> {
        typed_entries(&self.targets)
    }
}

fn typed_entries<T: for<'de> Deserialize<'de>>(map: &Map<String, Value>) -> Vec<(String, T)> {
    map.iter()
        .filter_map(|(k, v)| {
            serde_json::from_value::<T>(v.clone())
                .ok()
                .map(|t| (k.clone(), t))
        })
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    fn pt(v: Value) -> PublishTarget {
        serde_json::from_value(v).unwrap()
    }

    #[test]
    fn merge_layers_left_to_right_and_later_defined_fields_win() {
        let a = pt(
            json!({ "author": "Acme", "license": "MIT", "repository": "https://github.com/acme/x" }),
        );
        let b = pt(json!({ "license": "Apache-2.0", "registry": "https://npm.acme.dev" }));
        let got = merge_publish_targets(&[Some(&a), Some(&b)]).unwrap();
        assert_eq!(got.author.as_deref(), Some("Acme"));
        assert_eq!(got.license.as_deref(), Some("Apache-2.0"));
        assert_eq!(got.repository.as_deref(), Some("https://github.com/acme/x"));
        assert_eq!(got.registry.as_deref(), Some("https://npm.acme.dev"));
    }

    #[test]
    fn absent_layers_and_absent_fields_never_clobber() {
        let a = pt(json!({ "author": "Acme" }));
        assert_eq!(
            merge_publish_targets(&[None, Some(&a), None])
                .unwrap()
                .author
                .as_deref(),
            Some("Acme")
        );
        let base = pt(json!({ "author": "Acme", "license": "MIT" }));
        let empty = PublishTarget::default();
        assert_eq!(
            merge_publish_targets(&[Some(&base), Some(&empty)])
                .unwrap()
                .license
                .as_deref(),
            Some("MIT")
        );
    }

    #[test]
    fn nothing_contributing_yields_none() {
        assert!(merge_publish_targets(&[]).is_none());
        assert!(merge_publish_targets(&[None, None]).is_none());
        // An EMPTY layer is not a contribution — this is the `{}` case that
        // makes callers able to skip identity threading entirely.
        let empty = PublishTarget::default();
        assert!(merge_publish_targets(&[Some(&empty), Some(&empty)]).is_none());
    }

    #[test]
    fn unknown_keys_survive_the_merge_like_object_entries() {
        let a = pt(json!({ "author": "Acme", "futureField": "kept" }));
        let b = pt(json!({ "anotherUnknown": 42, "license": "MIT" }));
        let got = merge_publish_targets(&[Some(&a), Some(&b)]).unwrap();
        assert_eq!(got.extra["futureField"], json!("kept"));
        assert_eq!(got.extra["anotherUnknown"], json!(42));
        // …and an unknown-only layer still counts as a contribution.
        let only_unknown = pt(json!({ "futureField": "x" }));
        assert!(merge_publish_targets(&[Some(&only_unknown)]).is_some());
    }

    #[test]
    fn empty_string_is_a_real_override_not_a_fallthrough() {
        let a = pt(json!({ "packageName": "acme" }));
        let b = pt(json!({ "packageName": "" }));
        assert_eq!(
            merge_publish_targets(&[Some(&a), Some(&b)])
                .unwrap()
                .package_name
                .as_deref(),
            Some("")
        );
    }

    #[test]
    fn mount_rules_keep_file_order_but_hints_are_a_lookup() {
        let g: SdkGrouping = serde_json::from_value(json!({
            "mountRules": { "zulu": "z", "alpha": "a", "mike": "m" },
            "operationHints": { "POST /threads/runs": { "mountOn": "beta/threads", "action": "new-and-run" } }
        }))
        .unwrap();
        let order: Vec<&str> = g
            .mount_rules
            .as_ref()
            .unwrap()
            .keys()
            .map(String::as_str)
            .collect();
        assert_eq!(order, ["zulu", "alpha", "mike"], "mountRules must not sort");
        let hint = &g.operation_hints.as_ref().unwrap()["POST /threads/runs"];
        assert_eq!(hint.mount_on.as_deref(), Some("beta/threads"));
        assert_eq!(hint.action.as_deref(), Some("new-and-run"));
    }

    #[test]
    fn sections_split_declared_keys_from_the_index_signature() {
        let doc: SdkJson = serde_json::from_value(json!({
            "version": 1,
            "sdkName": "acme",
            "publish": { "author": "Acme" },
            "typescript": { "packageName": "acme", "output": "./out/ts" },
            "comment": "not a section",
            "tags": ["a"],
        }))
        .unwrap();
        assert_eq!(doc.sdk_name.as_deref(), Some("acme"));
        // Declared keys never leak into the index-signature bag…
        assert!(!doc.rest.contains_key("version"));
        assert!(!doc.rest.contains_key("publish"));
        let sections = doc.sections();
        assert_eq!(sections.len(), 1);
        assert_eq!(sections[0].0, "typescript");
        assert_eq!(sections[0].1.output.as_deref(), Some("./out/ts"));
        // …and the section's own declared fields are typed out of its options.
        assert_eq!(sections[0].1.options["packageName"], json!("acme"));
        assert!(!sections[0].1.options.contains_key("output"));
        let others = doc.non_section_values();
        assert_eq!(others.keys().collect::<Vec<_>>(), ["comment", "tags"]);
    }

    #[test]
    fn a_non_declared_object_that_does_not_fit_a_section_is_not_a_section() {
        // `output` is typed `string`; an object that violates it is the
        // `unknown` arm of `LanguageSection | unknown`, not a broken section.
        let doc: SdkJson =
            serde_json::from_value(json!({ "version": 1, "weird": { "output": 3 } })).unwrap();
        assert!(doc.sections().is_empty());
        assert_eq!(
            doc.non_section_values().keys().collect::<Vec<_>>(),
            ["weird"]
        );
    }

    #[test]
    fn version_accepts_a_number_or_a_string_and_round_trips() {
        for raw in [json!({ "version": 1 }), json!({ "version": "2" })] {
            let doc: SdkJson = serde_json::from_value(raw.clone()).unwrap();
            assert_eq!(
                serde_json::to_value(&doc).unwrap()["version"],
                raw["version"]
            );
        }
    }

    #[test]
    fn chain_entries_keep_file_order() {
        let doc: ChainJson = serde_json::from_value(json!({
            "version": 1,
            "sources": { "zulu": { "inputs": [{ "location": "z.yaml" }] }, "alpha": { "inputs": [] } },
            "targets": { "t2": { "target": "go", "source": "zulu" }, "t1": { "target": "node", "source": "alpha" } }
        }))
        .unwrap();
        let src: Vec<String> = doc.sources().into_iter().map(|(k, _)| k).collect();
        assert_eq!(src, ["zulu", "alpha"]);
        let tgt: Vec<(String, String)> = doc
            .targets()
            .into_iter()
            .map(|(k, t)| (k, t.target))
            .collect();
        assert_eq!(
            tgt,
            [
                ("t2".to_string(), "go".to_string()),
                ("t1".to_string(), "node".to_string())
            ]
        );
    }

    #[test]
    fn unknown_keys_on_a_chain_target_are_dropped_not_rejected() {
        // ChainTarget has no index signature — a TS consumer cannot reach the
        // key either. What matters is that it does not fail to parse.
        let t: ChainTarget =
            serde_json::from_value(json!({ "target": "go", "source": "s", "future": 1 })).unwrap();
        assert_eq!(t.target, "go");
        assert_eq!(serde_json::to_value(&t).unwrap().get("future"), None);
    }
}
