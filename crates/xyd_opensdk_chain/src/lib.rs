//! Rust port of the **source-processing half** of `@xyd-js/opensdk-chain`.
//!
//! Ported (`src/chain.ts` + `src/sources.ts`):
//!
//! | TS                  | Rust                                        |
//! |---------------------|---------------------------------------------|
//! | `detectChain`       | [`detect_chain`]                            |
//! | `resolveChain`      | [`resolve_chain`]                           |
//! | `readRawDoc`        | [`read_raw_doc`] / [`read_raw_doc_with`]    |
//! | `serializeDoc`      | [`serialize_doc`]                           |
//! | `mergeOpenApiDocs`  | [`merge_openapi_docs`]                      |
//! | `applyOverlay`      | [`apply_overlay`]                           |
//! | `processSource`     | [`process_source`] / [`process_source_with`]|
//!
//! **NOT ported: `runChain`'s target loop** (`src/run.ts`). It only orchestrates —
//! it takes the injected `generate` / `publishTarget` closures, resolves each
//! target's output dir, and merges `behavior`/`publish` defaults. Those injections
//! are the emitters, which are not in scope here; the loop belongs in the CLI crate
//! next to the emitter registry, exactly like the TS keeps it out of the converter
//! packages. Everything `runChain` needs from this module (`resolve_chain` +
//! `process_source`) is public.
//!
//! # Fidelity notes
//!
//! * **Key order is observable.** Merged docs and serialised specs are byte-compared
//!   against JS goldens, so `serde_json`'s `preserve_order` feature is mandatory (it
//!   is enforced through the workspace dependency).
//! * **Numbers.** [`serialize_doc`] reimplements `JSON.stringify`'s number formatting
//!   (`1.0` → `1`, `1e21` → `1e+21`, `-0` → `0`); see [`jsnum`]. Deep equality treats
//!   numbers by `f64` value, because JS has no int/float distinction and
//!   `mergeOpenApiDocs` dedupes components with `===`.
//! * **JSONPath.** The TS drives jsonpath-plus, which is *not* RFC 9535. This port
//!   uses `serde_json_path` behind a pre-flight allowlist that rejects every construct
//!   the two engines are known to disagree on. See [`jsonpath`] and
//!   `tests/jsonpath_sweep.rs`.
//! * **Remote inputs.** `readRawDoc` fetches `http(s)` locations with `fetch`. This
//!   crate stays dependency-light and takes an injected fetcher instead
//!   ([`read_raw_doc_with`]); [`read_raw_doc`] errors on a URL.

mod chain;
mod error;
pub mod jsnum;
pub mod jsonpath;
mod overlay;
mod sources;
mod yaml;

pub use chain::{detect_chain, resolve_chain};
pub use error::{Error, Result};
pub use overlay::apply_overlay;
pub use sources::{
    merge_openapi_docs, process_source, process_source_with, read_raw_doc, read_raw_doc_with,
    serialize_doc, ChainInput, ChainSource, Fetcher,
};
