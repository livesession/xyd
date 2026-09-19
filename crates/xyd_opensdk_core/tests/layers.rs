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
//!   move) for a 185-line JSON comparator. That copy's drift check lives in
//!   `xyd_parity` on the xyd side, NOT here: this file moves to opensdk, where
//!   `xyd_uniform` does not exist to compare against.
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

/// Every `path = "…"` a manifest declares, in any dependency section.
/// Sections are not distinguished on purpose: a dev-dependency escaping the set
/// breaks extraction exactly as hard as a real one, because the tests move too.
///
/// A SIBLING (`../<crate>`) is an intra-`crates/` edge and is returned by name.
/// Anything else — `../../packages/x`, `../../xwrite/crates/x` — already points
/// outside `crates/`, so it can never be satisfied from the opensdk repo. Those
/// are returned VERBATIM rather than dropped: the earlier version silently
/// skipped them, which meant the one dep shape that most obviously breaks
/// extraction was the one shape this test could not see.
fn path_deps(manifest: &Path) -> Vec<PathDep> {
    let text = std::fs::read_to_string(manifest)
        .unwrap_or_else(|e| panic!("read {}: {e}", manifest.display()));
    let mut out: Vec<PathDep> = Vec::new();
    for line in text.lines() {
        let line = line.trim_start();
        if line.starts_with('#') {
            continue; // a commented-out dep is not a dep
        }
        let Some(i) = line.find("path") else { continue };
        // `path` must be a KEY, not a suffix of one: `serde_json_path = "0.7"`
        // would otherwise parse as a path dep on "0.7".
        if i > 0 {
            let prev = line.as_bytes()[i - 1];
            if prev.is_ascii_alphanumeric() || prev == b'_' || prev == b'-' {
                continue;
            }
        }
        let rest = &line[i + 4..];
        let Some(j) = rest.find('"') else { continue };
        let rest = &rest[j + 1..];
        let Some(k) = rest.find('"') else { continue };
        let p = &rest[..k];
        // In-crate paths (`[[bin]] path = "src/bin/regen.rs"`) never leave the
        // crate, so they are irrelevant here. Only a `../` prefix reaches out.
        match p.strip_prefix("../") {
            Some(name) if !name.contains('/') => out.push(PathDep::Sibling(name.to_string())),
            Some(_) => out.push(PathDep::Escaping(p.to_string())),
            None => {}
        }
    }
    out
}

/// A manifest's `path` dependency, classified by whether it stays inside
/// `crates/` (and can therefore move) or already reaches outside it.
enum PathDep {
    /// `../<crate>` — an edge to a sibling crate.
    Sibling(String),
    /// Anything with more hops or a nested path: unsatisfiable after extraction.
    Escaping(String),
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
            match dep {
                PathDep::Sibling(name) => {
                    edges += 1;
                    if !MOVING.contains(&name.as_str()) {
                        leaks.push(format!("  {c} -> {name}"));
                    }
                }
                // Not counted toward the floor: it is not an intra-cluster edge.
                PathDep::Escaping(p) => leaks.push(format!("  {c} -> {p} (escapes crates/)")),
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
