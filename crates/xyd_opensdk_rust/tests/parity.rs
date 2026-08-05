//! Tier-1 byte-golden parity for the EMITTED (generated-code) files. This
//! emitter is PARTIAL by design (vendored runtime + tests deferred), so we
//! byte-compare only the files generate_rust emits against the golden tree
//! and count coverage — NO faked full-tree match.

use serde_json::Value;
use std::path::{Path, PathBuf};
use xyd_opensdk_rust::generate_rust;

fn fixtures() -> PathBuf {
    Path::new(env!("CARGO_MANIFEST_DIR")).join("../../packages/xyd-opensdk-rust/__fixtures__")
}

fn check(name: &str) -> (usize, usize) {
    let dir = fixtures().join(name);
    let ir: Value =
        serde_json::from_str(&std::fs::read_to_string(dir.join("input.json")).unwrap()).unwrap();
    let files = generate_rust(&ir);
    let out = dir.join("output");
    let mut ok = 0usize;
    for (rel, content) in &files {
        let golden_path = out.join(rel);
        let golden = std::fs::read_to_string(&golden_path)
            .unwrap_or_else(|_| panic!("{name}: golden missing for emitted file {rel}"));
        assert_eq!(content, &golden, "{name}: byte mismatch in {rel}");
        ok += 1;
    }
    (ok, files.len())
}

macro_rules! case {
    ($t:ident, $n:literal) => {
        #[test]
        fn $t() {
            let (ok, total) = check($n);
            assert_eq!(
                ok, total,
                "{}: {}/{} emitted files byte-exact",
                $n, ok, total
            );
            eprintln!("{}: {}/{} emitted files byte-exact", $n, ok, total);
        }
    };
}

case!(basic, "1.basic");
case!(wire, "2.wire");
case!(unions, "3.unions");
