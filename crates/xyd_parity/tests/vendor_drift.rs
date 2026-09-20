//! Has the vendored parity harness drifted from this one?
//!
//! `parity_kit` carries a byte-identical copy of `xyd_uniform/src/canon.rs`
//! so the SDK/CLI toolchain's test tier can compare JSON the way xyd does
//! WITHOUT depending on `xyd_uniform` — which is xyd's docs data model, and does
//! not follow the toolchain to the `opensdk` repo.
//!
//! The duplication is deliberate; undetected drift is not. This check lives on
//! the XYD side on purpose: `parity_kit` now lives in opensdk, where there
//! is no `xyd_uniform` to compare against, so a drift test hosted over there
//! would have to be deleted or neutered the moment it mattered. Here it stays
//! meaningful, and it makes drift unmergeable in xyd CI — reaching across the
//! submodule boundary is the whole point.

use std::path::{Path, PathBuf};

fn crates_dir() -> PathBuf {
    // CARGO_MANIFEST_DIR is crates/xyd_parity — ONE `..` reaches crates/.
    Path::new(env!("CARGO_MANIFEST_DIR")).join("..")
}

/// `<repo>/opensdk` — the submodule the vendored copy now lives in.
fn opensdk_dir() -> PathBuf {
    // TWO `..` reach the repo root from crates/xyd_parity.
    Path::new(env!("CARGO_MANIFEST_DIR")).join("../../opensdk")
}

/// `parity_kit::canon` is a byte-identical vendored copy of
/// `xyd_uniform::canon`. Duplication is the deliberate choice (see that crate's
/// docs), but undetected DRIFT is not — the two must stay identical so the
/// toolchain's parity tier keeps comparing JSON the way xyd does.
#[test]
fn the_vendored_canon_has_not_drifted() {
    let dir = crates_dir();
    let opensdk = opensdk_dir();
    let original = dir.join("xyd_uniform/src/canon.rs");
    let vendored = opensdk.join("crates/parity_kit/src/canon.rs");

    let a = std::fs::read_to_string(&original).expect("read xyd_uniform canon");
    // Deliberately NOT a skip-if-absent. An uninitialized submodule can't reach
    // this code at all — crates/xyd_openapi path-deps opensdk/crates/oas_doc,
    // so cargo fails to load the workspace long before any test runs. What a skip
    // WOULD cover is a checked-out submodule that lacks the file, and that is
    // drift, not a setup problem. Fail, and name the fix for either case.
    let b = std::fs::read_to_string(&vendored).unwrap_or_else(|e| {
        panic!(
            "cannot read the vendored canon at {}: {e}\n  \
             git submodule update --init opensdk",
            vendored.display()
        )
    });
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
