//! Tier-1 byte-golden parity: generate_go(input.json) vs the committed
//! output/ tree, per file. Self-contained (no shared harness — worktree base
//! predates crates/). Reports per-file match; the emitted subset must be
//! byte-exact, and the un-emitted runtime files are listed as gaps.

use std::path::Path;

fn fixtures_dir() -> std::path::PathBuf {
    // worktree/crates/xyd_opensdk_go/tests -> worktree root
    Path::new(env!("CARGO_MANIFEST_DIR")).join("../../packages/xyd-opensdk-go/__fixtures__")
}

fn run(name: &str) -> (usize, usize, Vec<String>) {
    let case = fixtures_dir().join(name);
    let ir: serde_json::Value =
        serde_json::from_str(&std::fs::read_to_string(case.join("input.json")).unwrap()).unwrap();
    let emitted = xyd_opensdk_go::generate_go(&ir);

    let mut matched = 0usize;
    let mut diffs: Vec<String> = Vec::new();
    for (rel, content) in &emitted {
        let golden_path = case.join("output").join(rel);
        match std::fs::read_to_string(&golden_path) {
            Ok(golden) if &golden == content => matched += 1,
            Ok(golden) => {
                let at = first_diff(content, &golden);
                diffs.push(format!("{name}/{rel}: DIFFERS {at}"));
            }
            Err(_) => diffs.push(format!("{name}/{rel}: not in golden tree")),
        }
    }
    (matched, emitted.len(), diffs)
}

fn first_diff(a: &str, b: &str) -> String {
    for (i, (ca, cb)) in a.chars().zip(b.chars()).enumerate() {
        if ca != cb {
            let ctx_a: String = a.chars().skip(i.saturating_sub(20)).take(50).collect();
            let ctx_b: String = b.chars().skip(i.saturating_sub(20)).take(50).collect();
            return format!("@char {i}\n    rust:   {ctx_a:?}\n    golden: {ctx_b:?}");
        }
    }
    format!("(prefix matches; len rust={} golden={})", a.len(), b.len())
}

#[test]
fn emitted_files_match_golden() {
    let mut total_matched = 0;
    let mut total_emitted = 0;
    let mut all_diffs: Vec<String> = Vec::new();
    for name in ["1.basic", "2.wire", "3.unions", "9.x-open-sdk"] {
        if !fixtures_dir().join(name).join("input.json").exists() {
            continue;
        }
        let (m, t, d) = run(name);
        eprintln!("{name}: {m}/{t} emitted files byte-exact");
        total_matched += m;
        total_emitted += t;
        all_diffs.extend(d);
    }
    eprintln!("\nTOTAL: {total_matched}/{total_emitted} emitted files byte-exact");
    if !all_diffs.is_empty() {
        eprintln!("DIVERGENCES:");
        for d in &all_diffs {
            eprintln!("  {d}");
        }
    }
    assert!(
        all_diffs.is_empty(),
        "{} emitted file(s) diverge from golden",
        all_diffs.len()
    );
}
