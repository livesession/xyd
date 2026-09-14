//! Shared leaf for the OpenSDK Rust emitters.
//!
//! Three things every emitter needs and nine crates used to duplicate:
//!
//! - [`behavior`] — the canonical `SdkBehavior` defaults and the two deep-merge
//!   flavours. Was copy-pasted into 9 crates; the 8 non-CLI copies were proven
//!   byte-equal (in declaration order, which `preserve_order` makes observable).
//! - [`header`] — the machine-ownership header and its per-extension comment
//!   table, previously five slightly different local gates.
//! - [`emitter`] — the data-only emitter descriptor plus the docs-capability
//!   return types A2 needs a shared home for.
//!
//! DELIBERATELY NOT HERE, each for a measured reason (see the A1 spec):
//!
//! - `plan.rs` / `example_plan.rs`. They look like a copy-paste family and are
//!   not: six `plan_operation` signatures over four different `types`
//!   representations, one lifetime-parameterised return, and 126–275 differing
//!   lines out of 206–425 in `example_plan`. Unifying them would force five
//!   crates to change HOW THEY READ THE IR — a rewrite, on exactly the code
//!   paths that produce every byte-exact golden. Revisit after A2 ships the
//!   Rust-side docs goldens that would protect it.
//! - A typed shared IR. Five emitters read `&serde_json::Value` directly, and
//!   three different map orderings are already baked into three sets of
//!   goldens; any single shared map type moves bytes.
//! - node's and python's `behavior.rs`, which are supersets carrying
//!   `error_class_names` over incompatible input types (`&ir::Spec` vs
//!   `&Value`). Blocked on the IR decision, deferred whole so the node/python
//!   slice stays one reviewable unit.
//! - java's and dotnet's ownership markers: `.java`/`.cs` are not in the
//!   comment table, and both bake their marker inside file assembly, where it
//!   is artifact content rather than a wrapper.

pub mod behavior;
pub mod emitter;
pub mod example;
pub mod header;
