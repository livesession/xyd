//! Do all six languages agree on what request an operation should make?
//!
//! Each emitter crate carries its own `-2.complex.openai/<op>/recorded.json`,
//! written by RECORDING that language's real SDK. They were produced
//! independently, per language, by the deleted TypeScript harness — so their
//! agreement is a fact about the toolchain, not something the file format
//! enforces.
//!
//! Measured: the `request` halves are **byte-identical across all six**; only
//! `call` differs, which is just that language's method-chain naming
//! (`admin.organization.adminApiKeys.create` vs `...admin_api_keys...`).
//!
//! Why pin it. `request_diff.rs` proves the compiled GO SDK really sends its
//! recorded request. On its own that is a statement about Go. Combined with
//! this test it becomes a statement about the shared contract: the request Go
//! demonstrably makes is the same one every other language's fixtures claim.
//! That is what makes the other five languages' offline binding guards
//! meaningful without building five more SDKs.
//!
//! It also catches the realistic accident — someone re-blesses ONE language's
//! fixtures, silently moving the contract out from under the other five.
//!
//! Cheap and offline: reads committed JSON, spawns nothing, needs no toolchain.

use std::collections::BTreeMap;
use std::path::{Path, PathBuf};

use serde_json::Value;

/// Sibling crates are ONE `..` away — `CARGO_MANIFEST_DIR` is already
/// `crates/xyd_opensdk_e2e`, not the repo root.
fn corpus(lang: &str) -> PathBuf {
    Path::new(env!("CARGO_MANIFEST_DIR")).join(format!(
        "../xyd_opensdk_{lang}/__fixtures__/-2.complex.openai"
    ))
}

/// Go spells the resource `admin-api-keys`, python/ruby spell it
/// `admin_api_keys` — the slug follows each language's own naming. Normalizing
/// the separator is what lets all 242 line up instead of the 174 a raw name
/// comparison finds.
fn slug_key(name: &str) -> String {
    name.replace('-', "_")
}

fn load(lang: &str) -> BTreeMap<String, Value> {
    let dir = corpus(lang);
    let mut out = BTreeMap::new();
    let entries = std::fs::read_dir(&dir)
        .unwrap_or_else(|e| panic!("read corpus {} for {lang}: {e}", dir.display()));
    for e in entries.flatten() {
        let f = e.path().join("recorded.json");
        if !f.exists() {
            continue;
        }
        let v: Value = serde_json::from_str(&std::fs::read_to_string(&f).expect("read recorded"))
            .unwrap_or_else(|e| panic!("parse {}: {e}", f.display()));
        let name = e.file_name().to_string_lossy().to_string();
        out.insert(slug_key(&name), v);
    }
    out
}

/// Rust is absent on purpose: `xyd_opensdk_rust` has a 239-case corpus and no
/// `recorded.json` at all — it was never recorded by the TypeScript harness.
const LANGS: &[&str] = &["go", "node", "python", "ruby", "java", "dotnet"];

#[test]
fn every_language_records_the_same_request() {
    let go = load("go");
    assert!(
        go.len() >= 238,
        "go corpus shrank to {} — the comparison floor below would pass vacuously",
        go.len()
    );

    for lang in LANGS.iter().filter(|l| **l != "go") {
        let other = load(lang);
        let mut compared = 0usize;
        let mut mismatches = Vec::new();

        for (slug, a) in &go {
            let Some(b) = other.get(slug) else { continue };
            compared += 1;
            if a.get("request") != b.get("request") {
                mismatches.push(slug.clone());
            }
        }

        // The floor is the load-bearing half of this test. Without it a slug
        // convention change on either side makes `compared` collapse to 0 and
        // the mismatch assert passes having checked nothing.
        assert_eq!(
            compared,
            go.len(),
            "only {compared} of {} go operations found a {lang} counterpart — \
             slug normalization is stale, so this comparison is not covering the corpus",
            go.len()
        );
        assert!(
            mismatches.is_empty(),
            "{} operation(s) where {lang} records a different request than go \
             (the contract is supposed to be language-neutral): {:?}",
            mismatches.len(),
            &mismatches[..mismatches.len().min(10)]
        );
    }
}

/// The flip side: `call` SHOULD differ, because it is the language's own
/// method-chain naming. Asserting that keeps the test above honest — if some
/// future normalization accidentally compared `call` too, or if the corpora
/// were copied wholesale between languages rather than recorded independently,
/// this fails and says so.
#[test]
fn call_names_are_language_specific() {
    let go = load("go");
    // dotnet is excluded, not forgotten: it shares 136 of 242 `call` names with
    // go outright, because both render `Admin.Organization.Certificates.Create`
    // in the same PascalCase. That overlap is correct, so the zero-overlap
    // assertion below does not apply to it.
    for lang in ["node", "python", "ruby", "java"] {
        let other = load(lang);
        let shared = go
            .iter()
            .filter_map(|(slug, a)| other.get(slug).map(|b| (a, b)))
            .filter(|(a, b)| a.get("call") == b.get("call"))
            .count();
        assert_eq!(
            shared, 0,
            "{lang} shares {shared} `call` name(s) with go — these corpora are \
             supposed to be recorded per language, not copied"
        );
    }
}
