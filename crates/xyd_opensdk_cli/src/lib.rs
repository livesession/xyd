//! Rust port of `@xyd-js/opensdk-cli` — the `opensdk` binary.
//!
//! | TypeScript                  | Rust                                        |
//! |-----------------------------|---------------------------------------------|
//! | `src/cli/index.ts`          | [`command`] (clap tree + dispatch)          |
//! | `src/cli/parse.ts`          | [`parse`]                                   |
//! | `src/cli/generate.ts`       | [`generate`]                                |
//! | `src/cli/cli-targets.ts`    | [`cli_targets`]                             |
//! | `src/cli/diff.ts`           | [`diff`]                                    |
//! | `src/cli/publish.ts` + 7 × `publish<Lang>` | [`publish`]                  |
//! | `src/cli/run.ts` + chain target loop | [`run`]                            |
//! | `src/cli/init.ts`           | [`init`]                                    |
//! | `src/cli/xsdk.ts` + `embedXSdk` | [`xsdk`]                                |
//! | `src/cli/grouping.ts`       | [`grouping`]                                |
//! | `src/cli/config/**`         | [`config`]                                  |
//! | `registerBuiltinEmitters`   | [`registry`]                                |
//! | `src/cli/write-report.ts`   | [`write_report`]                            |
//! | `@xyd-js/opensdk-framework` `src/exec.ts` | [`exec`]                      |
//!
//! Everything else is DEPENDED ON, not re-implemented: the write lifecycle
//! (`xyd_opensdk_framework`), the breaking-change classifier
//! (`xyd_opensdk_diff`), the config schema (`xyd_opensdk_config`), the chain
//! source engine (`xyd_opensdk_chain`), the converters and the seven emitters.
//!
//! # Deliberately dropped
//!
//! `opensdk.config.{ts,js,mjs}` — a JavaScript plugin bundle that can register a
//! custom `Emitter`. A Rust binary cannot evaluate JS. It is not ignored: see
//! [`config`] for the error that points at `opensdk init --format json`.

pub mod cli_targets;
pub mod command;
pub mod config;
pub mod diff;
pub mod error;
pub mod exec;
pub mod generate;
pub mod grouping;
pub mod init;
pub mod parse;
pub mod paths;
pub mod publish;
pub mod registry;
pub mod run;
pub mod write_report;
pub mod xsdk;

pub use error::{Error, Result};
