//! Grammar engine — the vscode-textmate tokenizer core.
//!
//! `raw` is the serde model; `rule` (rule compilation over `OnigScanner`) and
//! `tokenizer` (`tokenizeLine2` state machine + scope/state stacks + injections)
//! land next, integrated with `crate::theme` for the packed metadata. Wired into
//! `lib.rs` once the whole core compiles + hits the H1 `.snap` parity gate.

pub mod raw;
pub mod rule;
pub mod tokenizer;
