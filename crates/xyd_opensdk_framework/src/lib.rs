//! Regen-safe project write lifecycle + 3-way line merge — a faithful Rust port
//! of `@xyd-js/opensdk-framework`'s `writeProject`/`materializeProject`
//! (`packages/xyd-opensdk-framework/src/write.ts`) and `@xyd-js/opensdk-merge`'s
//! `merge3`/`isProbablyBinary` (`packages/xyd-opensdk-merge/src/index.ts`).
//!
//! This crate makes the `.sdk/sdk.lock` + `.sdkignore` + 3-way-merge regen
//! lifecycle RUST-OWNED and reusable by the Rust codegen backends (opencli2rust
//! today; opencli2go / opensdk later). It is byte-for-byte compatible with the TS
//! pipeline that produced the committed generated trees:
//!
//! - sha256(hex) over UTF-8 content; deterministic sorted processing order;
//! - `.sdk/sdk.lock` == `JSON.stringify({schemaVersion,generator,files}, null, 2) + "\n"`
//!   (2-space pretty, trailing newline, keys sorted, hashing the PRISTINE
//!   generated content — NOT any post-fmt bytes);
//! - `.sdkignore` gitignore semantics identical to `isSdkIgnored`;
//! - per-file writeMode (`overwrite` / `skipIfExists` / `mergeJson`), guarded
//!   stale-prune, and the opt-in `{ merge: true }` 3-way path.

pub mod merge;
pub mod write;

pub use merge::{
    has_conflict_markers, is_probably_binary, merge3, normalize_newlines, Merge3Labels,
    Merge3Options, Merge3Result,
};
pub use write::{
    deep_merge_json, is_sdk_ignored, materialize_project, parse_sdk_ignore, sha256_hex,
    write_project, FileEntry, FileMap, ProjectManifest, WriteMode, WriteProjectOptions,
    WriteProjectResult, MANIFEST_SCHEMA_VERSION, SDK_BASE_DIR, SDK_IGNORE_FILENAME,
    SDK_LOCK_FILENAME,
};
