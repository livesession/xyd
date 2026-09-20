//! Has the vendored parity harness drifted from the canonical one?
//!
//! `parity_kit` (in the `opensdk` submodule) carries a byte-identical copy of
//! `xyd_uniform/src/canon.rs` (in the `apitoolchain` submodule) so the SDK/CLI
//! toolchain's test tier can compare JSON the way xyd does WITHOUT depending on
//! `xyd_uniform`, which is the docs data model and does not belong to it.
//!
//! The duplication is deliberate; undetected drift is not.
//!
//! WHY IT LIVES IN XYD, in a crate that owns neither file: it needs BOTH trees
//! on disk, and xyd is the only place that has both. It used to sit in
//! `xyd_parity`, next to the original — but `xyd_parity` and `xyd_uniform` moved
//! to `apitoolchain`, which reaches opensdk as a pinned GIT dependency rather
//! than a checkout (two path-deps on the same crate make cargo refuse to write a
//! lockfile at all). There is therefore no opensdk directory over there to read.
//! Hosting it here keeps it meaningful and keeps drift unmergeable in xyd CI;
//! reaching across both submodule boundaries is the whole point.

use std::path::{Path, PathBuf};

/// `<repo>` — CARGO_MANIFEST_DIR is crates/xyd_core_rs, so TWO `..` reach the root.
fn repo() -> PathBuf {
    Path::new(env!("CARGO_MANIFEST_DIR")).join("../..")
}

#[test]
fn the_vendored_canon_has_not_drifted() {
    let root = repo();
    let original = root.join("apitoolchain/crates/xyd_uniform/src/canon.rs");
    let vendored = root.join("opensdk/crates/parity_kit/src/canon.rs");

    // Deliberately NOT skip-if-absent. Both submodules are hard requirements of
    // this repo's build (packages/xyd-native path-deps into both), so a missing
    // file here is either an uninitialized checkout or real drift — never a
    // legitimate reason to pass quietly. Name the fix for both cases.
    let read = |p: &Path, hint: &str| {
        std::fs::read_to_string(p).unwrap_or_else(|e| {
            panic!(
                "cannot read {} : {e}\n  git submodule update --init {hint}",
                p.display()
            )
        })
    };
    let a = read(&original, "apitoolchain");
    let b = read(&vendored, "opensdk");

    assert!(
        a.len() > 1000,
        "canon.rs is {} bytes — too small to be the real comparator; this test \
         would compare two stubs and pass",
        a.len()
    );
    assert_eq!(
        a,
        b,
        "parity_kit/src/canon.rs has drifted from xyd_uniform/src/canon.rs. \
         It is a deliberate byte-identical vendor: re-copy it rather than \
         editing one side.\n  cp {} {}",
        original.display(),
        vendored.display()
    );
}
