//! Rust port of `@xyd-js/opensdk-core`'s `src/config.ts` + `src/spec.ts`.
//!
//! Two small, boring, load-bearing modules:
//!
//! - [`config`] — the declarative `sdk.json` / `chain.json` schema
//!   (`SdkJson`, `LanguageSection`, `PublishTarget`, `SdkGrouping`,
//!   `OperationHint`, `ChainJson`, `ChainSource`, `ChainTarget`, `ChainInput`)
//!   plus [`merge_publish_targets`], the only function `config.ts` contains.
//! - [`spec`] — [`load_opensdk_spec`] (the FILE half; see that module's docs on
//!   the deliberately unported URL half), [`find_type`], and a re-export of the
//!   already-ported `walk_methods`.
//!
//! ## What gates this port
//!
//! `tests/oracle.rs` runs every fixture under `__fixtures__/` and compares
//! against `output.json` goldens produced by the REAL TypeScript
//! (`packages/xyd-opensdk-core/__tests__/rust-oracle.test.ts` with
//! `O2S_BUILD_DOCS=1`). The goldens live here, in the crate, because the
//! TypeScript package they were captured from is slated for deletion.
//!
//! The goldens are the oracle: if Rust and a golden disagree, the Rust is wrong.
//! Never regenerate one to make a Rust test pass.

pub mod config;
pub mod spec;

pub use config::{
    merge_publish_targets, ChainInput, ChainJson, ChainSource, ChainTarget, ConfigVersion,
    JsonObject, LanguageSection, OperationHint, PublishTarget, SdkGrouping, SdkJson,
    SDK_JSON_DECLARED_KEYS,
};
pub use spec::{
    find_type, load_opensdk_spec, load_opensdk_spec_result, parse_opensdk_spec, walk_methods,
    LoadOpensdkSpecOptions, LoadSpecError,
};
