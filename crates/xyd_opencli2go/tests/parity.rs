//! Tier-1 golden parity: opencli2go(input.json) === the committed output/ tree,
//! byte-exact per file, for the 4 golden fixtures. Mirrors the JS testFixture
//! (packages/xyd-opencli2go/__tests__/utils.ts): same file-set + byte content.
//! (Self-contained — no xyd_parity dep, since this worktree predates crates/.)

use serde_json::Value;
use std::collections::BTreeMap;
use std::path::{Path, PathBuf};

use xyd_opencli2go::opencli2go;

fn fixtures_dir() -> PathBuf {
    // crates/xyd_opencli2go -> ../../packages/xyd-opencli2go/__fixtures__
    Path::new(env!("CARGO_MANIFEST_DIR")).join("../../packages/xyd-opencli2go/__fixtures__")
}

fn list_golden(dir: &Path, base: &Path, out: &mut BTreeMap<String, String>) {
    if !dir.exists() {
        return;
    }
    for entry in std::fs::read_dir(dir).unwrap() {
        let entry = entry.unwrap();
        let p = entry.path();
        if p.is_dir() {
            list_golden(&p, base, out);
        } else {
            let rel = p
                .strip_prefix(base)
                .unwrap()
                .to_string_lossy()
                .replace('\\', "/");
            out.insert(rel, std::fs::read_to_string(&p).unwrap());
        }
    }
}

fn run_case(name: &str) {
    let case = fixtures_dir().join(name);
    let spec: Value =
        serde_json::from_str(&std::fs::read_to_string(case.join("input.json")).unwrap()).unwrap();
    let files = opencli2go(&spec, None);

    let out_dir = case.join("output");
    let mut expected: BTreeMap<String, String> = BTreeMap::new();
    list_golden(&out_dir, &out_dir, &mut expected);

    let got_keys: Vec<&String> = files.keys().collect();
    let exp_keys: Vec<&String> = expected.keys().collect();
    assert_eq!(
        got_keys, exp_keys,
        "{name}: file set mismatch\n  got:      {got_keys:?}\n  expected: {exp_keys:?}"
    );

    for (rel, content) in &files {
        let want = expected.get(rel).unwrap();
        if content != want {
            // Show the first differing line for a readable failure.
            let first = content
                .lines()
                .zip(want.lines())
                .enumerate()
                .find(|(_, (a, b))| a != b);
            panic!(
                "{name}: byte mismatch in {rel}\n  first diff at line {:?}",
                first.map(|(i, (a, b))| format!(
                    "{}\n    got:      {a:?}\n    expected: {b:?}",
                    i + 1
                ))
            );
        }
    }
}

macro_rules! c {
    ($t:ident, $n:literal) => {
        #[test]
        fn $t() {
            run_case($n);
        }
    };
}

c!(basic, "1.basic");
c!(crud, "2.crud");
c!(nested, "3.nested");
c!(body_flatten, "4.body-flatten");
