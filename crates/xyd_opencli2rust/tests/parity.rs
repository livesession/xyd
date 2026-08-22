//! Tier-1 golden parity: opencli2rust(input.json) === the committed output/ tree,
//! byte-exact per file. Inline harness (this worktree lacks xyd_parity — see the
//! standalone Cargo.toml note). The env-gated cargo/e2e smokes are out of scope.

use std::collections::BTreeMap;
use std::path::{Path, PathBuf};

use serde_json::Value;
use xyd_opencli2rust::{flatten, opencli2rust};

fn fixtures_dir() -> PathBuf {
    // crate manifest dir → ../../packages/xyd-opencli2rust/__fixtures__
    Path::new(env!("CARGO_MANIFEST_DIR")).join("../../packages/xyd-opencli2rust/__fixtures__")
}

fn list_tree(dir: &Path, base: &Path, out: &mut BTreeMap<String, String>) {
    if !dir.exists() {
        return;
    }
    for entry in std::fs::read_dir(dir).unwrap() {
        let entry = entry.unwrap();
        let p = entry.path();
        if p.is_dir() {
            list_tree(&p, base, out);
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
    let generated = flatten(&opencli2rust(&spec, None));

    let out_dir = case.join("output");
    let mut expected: BTreeMap<String, String> = BTreeMap::new();
    list_tree(&out_dir, &out_dir, &mut expected);

    // Same set of paths.
    let gen_keys: Vec<&String> = generated.keys().collect();
    let exp_keys: Vec<&String> = expected.keys().collect();
    assert_eq!(gen_keys, exp_keys, "{name}: file set differs");

    // Byte-exact content per file (report the first divergence with context).
    for (rel, content) in &generated {
        let want = &expected[rel];
        if content != want {
            let first = content
                .lines()
                .zip(want.lines())
                .enumerate()
                .find(|(_, (a, b))| a != b);
            panic!(
                "{name}/{rel}: content differs (gen {} bytes, want {} bytes){}",
                content.len(),
                want.len(),
                match first {
                    Some((i, (a, b))) =>
                        format!("\n  line {}:\n    gen:  {a:?}\n    want: {b:?}", i + 1),
                    None => String::new(),
                }
            );
        }
    }
}

#[test]
fn basic() {
    run_case("1.basic");
}
#[test]
fn crud() {
    run_case("2.crud");
}
#[test]
fn nested() {
    run_case("3.nested");
}
#[test]
fn body_flatten() {
    run_case("4.body-flatten");
}
#[test]
fn local_tool() {
    run_case("6.local-tool");
}
#[test]
fn mixed() {
    run_case("7.mixed");
}
