//! Is the SDK/CLI toolchain still self-contained?
//!
//! These crates are destined for `github.com/livesession/opensdk`, consumed
//! back as a submodule. The precondition for that move is simple to state and
//! easy to violate by accident: **no crate in the moving set may depend on a
//! crate outside it.** One `path = "../xyd_uniform"` added in a hurry turns a
//! clean relocation into a dependency that cannot follow, and the failure does
//! not surface until extraction day.
//!
//! Two crates exist ONLY because of this rule, and the test is what keeps them
//! honest:
//!
//! * `xyd_oas_doc` — `DocCtx` plus spec loading, split out of `xyd_openapi`
//!   (which stays in xyd). The deref engine is shared production code, so it
//!   moves and xyd depends on it through the submodule.
//! * `xyd_parity_kit` — a vendored copy of the parity harness, because the
//!   original depends on `xyd_uniform` (xyd's docs data model, which does not
//!   move) for a 185-line JSON comparator.
//!
//! Checked statically against `Cargo.toml` rather than `cargo metadata`: no
//! toolchain invocation, and it reads the same text a human would.

use std::path::{Path, PathBuf};

/// The extraction set. Editing this list is a deliberate act — it is the
/// contract Part B rests on, not a convenience cache.
const MOVING: &[&str] = &[
    // converters
    "xyd_openapi2opencli",
    "xyd_openapi2opensdk",
    "xyd_opencli2go",
    "xyd_opencli2opensdk",
    "xyd_opencli2rust",
    // opensdk core + upper layers
    "xyd_opensdk_chain",
    "xyd_opensdk_cli",
    "xyd_opensdk_cli_common",
    "xyd_opensdk_config",
    "xyd_opensdk_core",
    "xyd_opensdk_diff",
    "xyd_opensdk_framework",
    // the seven emitters
    "xyd_opensdk_dotnet",
    "xyd_opensdk_go",
    "xyd_opensdk_java",
    "xyd_opensdk_node",
    "xyd_opensdk_python",
    "xyd_opensdk_ruby",
    "xyd_opensdk_rust",
    // shared test harness (dev-only) + the two boundary crates
    "xyd_opensdk_e2e",
    "xyd_oas_doc",
    "xyd_parity_kit",
];

fn crates_dir() -> PathBuf {
    // CARGO_MANIFEST_DIR is crates/xyd_opensdk_core — ONE `..` reaches crates/.
    Path::new(env!("CARGO_MANIFEST_DIR")).join("..")
}

/// Every `path = "../<crate>"` a manifest declares, in any dependency section.
/// Sections are not distinguished on purpose: a dev-dependency escaping the set
/// breaks extraction exactly as hard as a real one, because the tests move too.
fn path_deps(manifest: &Path) -> Vec<String> {
    let text = std::fs::read_to_string(manifest)
        .unwrap_or_else(|e| panic!("read {}: {e}", manifest.display()));
    let mut out = Vec::new();
    for line in text.lines() {
        let line = line.trim_start();
        if line.starts_with('#') {
            continue; // a commented-out dep is not a dep
        }
        let Some(i) = line.find("path") else { continue };
        let rest = &line[i + 4..];
        let Some(j) = rest.find('"') else { continue };
        let rest = &rest[j + 1..];
        let Some(k) = rest.find('"') else { continue };
        let p = &rest[..k];
        if let Some(name) = p.strip_prefix("../") {
            if !name.contains('/') {
                out.push(name.to_string());
            }
        }
    }
    out
}

#[test]
fn the_moving_cluster_depends_on_nothing_outside_itself() {
    let dir = crates_dir();
    let mut edges = 0usize;
    let mut leaks = Vec::new();

    for c in MOVING {
        let manifest = dir.join(c).join("Cargo.toml");
        assert!(
            manifest.exists(),
            "{c} is in MOVING but has no manifest at {} — the list is stale, and \
             a stale list silently shrinks what this test covers",
            manifest.display()
        );
        for dep in path_deps(&manifest) {
            edges += 1;
            if !MOVING.contains(&dep.as_str()) {
                leaks.push(format!("  {c} -> {dep}"));
            }
        }
    }

    // The floor. Without it, a parsing change that silently matches nothing
    // leaves `leaks` empty and this test reports a green it never earned —
    // which is precisely how the by-hand version of this check fooled me.
    assert!(
        edges >= 40,
        "only {edges} intra-cluster path deps parsed across {} crates — the \
         manifest parser is broken, so an empty leak list proves nothing",
        MOVING.len()
    );

    assert!(
        leaks.is_empty(),
        "{} dependency edge(s) escape the extraction set — these crates cannot \
         move to the opensdk repo while this holds:\n{}",
        leaks.len(),
        leaks.join("\n")
    );
}

/// `xyd_parity_kit::canon` is a byte-identical vendored copy of
/// `xyd_uniform::canon`. Duplication is the deliberate choice (see that crate's
/// docs), but undetected DRIFT is not — the two must stay identical so the
/// toolchain's parity tier keeps comparing JSON the way xyd does.
#[test]
fn the_vendored_canon_has_not_drifted() {
    let dir = crates_dir();
    let original = dir.join("xyd_uniform/src/canon.rs");
    let vendored = dir.join("xyd_parity_kit/src/canon.rs");
    let a = std::fs::read_to_string(&original).expect("read xyd_uniform canon");
    let b = std::fs::read_to_string(&vendored).expect("read vendored canon");
    assert!(
        a.len() > 1000,
        "canon.rs is {} bytes — too small to be the real comparator; this test \
         would compare two stubs and pass",
        a.len()
    );
    assert_eq!(
        a,
        b,
        "xyd_parity_kit/src/canon.rs has drifted from xyd_uniform/src/canon.rs. \
         It is a deliberate byte-identical vendor: re-copy it rather than \
         editing one side.\n  cp {} {}",
        original.display(),
        vendored.display()
    );
}
