//! The C-S1 gate: for every committed fixture in
//! `packages/xyd-content/__fixtures__/mdx-parity`, run `xyd_mdx::compile_mdx`
//! and check it against the JS-owned oracle.
//!
//! Gate rule (C-S1 + C-S2 stage-1):
//!
//! - `prose`: Rust must return `full`, and its compiled function-body, rendered
//!   through the COMMITTED JS harness (Oracle B), must byte-match
//!   `rendered.html`. The ONE documented exception is a page that needs KaTeX (a
//!   JS rehype step): it returns `fallback` with reason `math` and is tracked as
//!   a gap, not a failure.
//! - `directive` (C-S2 stage-1 + 1b): whatever Rust returns `full` MUST render
//!   byte-equal to `rendered.html` (a `full` that renders wrong is a FAILURE —
//!   this is what keeps the coverage honest / un-riggable). Stage-1b ports the
//!   `steps`/`tabs`/`code-group` special handlers and recursive `:::`-in-`:::`
//!   nesting, so all 7 directive fixtures now compile `full`. Any directive
//!   still outside the port (e.g. `table`, step `[…]`/`{…}` parameters) returns
//!   `fallback` and is tracked as deferred, not a failure. A floor assertion
//!   pins the directives that MUST stay `full`.
//! - `async` (C-S3 + C-S4b): the `@include` / `@changelog` fixtures compile
//!   `full` and MUST render byte-equal to `rendered.html`. C-S4b adds the native
//!   composer emit: `async-component-atlas` (`component: atlas`, no source) now
//!   compiles `full` to `$jsx(Atlas, {references: []})`. The `@uniform`/
//!   `openapi`-resolved composer fixture (`async-frontmatter-uniform`) stays
//!   `fallback` — its full-refs serializer (resolved references + composed
//!   description React trees + highlighted examples) is the deferred C-S4b tail.
//!   Whatever comes back `full` MUST render byte-equal (a wrong `full` is a
//!   FAILURE). A floor assertion pins the async fixtures that MUST stay `full`.
//!
//! Oracle A (compiled JS) is intentionally NOT gated: swc codegen differs
//! cosmetically from astring, but the rendered DOM is identical.

/// Directive fixtures the C-S2 port (stage-1 generic + stage-1b special handlers
/// & nesting) MUST compile `full` + render at parity. A regression to `fallback`
/// here fails the gate.
const DIRECTIVE_FULL_FLOOR: [&str; 7] = [
    "directive-callout",
    "directive-code-group",
    "directive-details",
    "directive-nested",
    "directive-steps",
    "directive-subtitle-badge",
    "directive-tabs",
];

/// Async fixtures that MUST compile `full` + render at parity: the C-S3
/// `@`-function ports (`async-changelog`, `async-include`) plus the C-S4b native
/// meta-component emit (`async-component-atlas` = `component: atlas`, no source
/// -> `<Atlas references={[]} />`). The `@uniform`/`openapi`-resolved composer
/// fixture (`async-frontmatter-uniform`) stays `fallback` (C-S4b full-refs port
/// deferred — see the module doc).
const ASYNC_FULL_FLOOR: [&str; 3] =
    ["async-changelog", "async-component-atlas", "async-include"];

use std::fs;
use std::io::Write;
use std::path::{Path, PathBuf};
use std::process::Command;

fn repo_root() -> PathBuf {
    let mut p = PathBuf::from(env!("CARGO_MANIFEST_DIR")); // crates/xyd_mdx
    p.pop(); // crates
    p.pop(); // repo root
    p
}

fn fixtures_dir() -> PathBuf {
    repo_root().join("packages/xyd-content/__fixtures__/mdx-parity")
}

fn render_mjs() -> PathBuf {
    fixtures_dir().join("_harness/render.mjs")
}

fn render_helper() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("tests/harness/render_one.mjs")
}

/// Render a compiled function-body string through the committed JS harness.
fn node_render(name: &str, code: &str) -> Result<String, String> {
    let dir = std::env::temp_dir().join("xyd_mdx_parity");
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    let file = dir.join(format!("{name}.compiled.js"));
    let mut f = fs::File::create(&file).map_err(|e| e.to_string())?;
    f.write_all(code.as_bytes()).map_err(|e| e.to_string())?;

    let output = Command::new("node")
        .arg(render_helper())
        .arg(render_mjs())
        .arg(&file)
        .output()
        .map_err(|e| format!("spawn node: {e}"))?;
    if !output.status.success() {
        return Err(format!(
            "node render failed: {}",
            String::from_utf8_lossy(&output.stderr)
        ));
    }
    Ok(String::from_utf8_lossy(&output.stdout).to_string())
}

fn read(path: &Path) -> String {
    fs::read_to_string(path).unwrap_or_default()
}

fn capability_of(meta_json: &str) -> String {
    serde_json::from_str::<serde_json::Value>(meta_json)
        .ok()
        .and_then(|v| v.get("capability")?.as_str().map(str::to_string))
        .unwrap_or_default()
}

fn trim_trailing_newlines(s: &str) -> &str {
    s.trim_end_matches(['\n', '\r'])
}

/// First byte index where two strings differ, with a small context window.
fn first_diff(a: &str, b: &str) -> String {
    let ab = a.as_bytes();
    let bb = b.as_bytes();
    let mut i = 0;
    while i < ab.len() && i < bb.len() && ab[i] == bb[i] {
        i += 1;
    }
    let lo = i.saturating_sub(40);
    let a_ctx = &a[lo..(i + 60).min(a.len())];
    let b_ctx = &b[lo..(i + 60).min(b.len())];
    format!("  @{i}\n  golden: …{a_ctx:?}\n  rust  : …{b_ctx:?}")
}

#[test]
fn mdx_parity_gate() {
    let base = fixtures_dir();
    assert!(base.is_dir(), "fixtures dir missing: {}", base.display());

    let mut dirs: Vec<PathBuf> = fs::read_dir(&base)
        .unwrap()
        .filter_map(|e| e.ok().map(|e| e.path()))
        .filter(|p| p.is_dir() && p.join("meta.json").is_file())
        .collect();
    dirs.sort();

    let mut prose_total = 0usize;
    let mut prose_full_match = 0usize;
    let mut prose_gap: Vec<String> = Vec::new(); // documented (math) fallbacks
    let mut failures: Vec<String> = Vec::new();
    let mut directive_total = 0usize;
    let mut directive_full: Vec<String> = Vec::new(); // rendered at parity
    let mut directive_deferred: Vec<String> = Vec::new(); // returned fallback
    let mut async_total = 0usize;
    let mut async_full: Vec<String> = Vec::new(); // `@`-function pages at parity
    let mut async_deferred: Vec<String> = Vec::new(); // composer-backed → fallback

    for dir in &dirs {
        let name = dir.file_name().unwrap().to_string_lossy().to_string();
        let meta = read(&dir.join("meta.json"));
        let capability = capability_of(&meta);
        let source = read(&dir.join("input.mdx"));
        let settings = {
            let s = read(&dir.join("settings.json"));
            if s.trim().is_empty() {
                "{}".to_string()
            } else {
                s
            }
        };

        // C-S3: `@include` / `@changelog` resolve relative to the page dir — for
        // these fixtures that is the fixture directory itself.
        let base_dir = dir.to_string_lossy().to_string();
        let out = xyd_mdx::compile_mdx(&source, &settings, &base_dir);

        match capability.as_str() {
            "prose" => {
                prose_total += 1;
                if out.capability == xyd_mdx::CAP_FULL {
                    let golden = read(&dir.join("rendered.html"));
                    match node_render(&name, &out.compiled) {
                        Ok(rendered) => {
                            let g = trim_trailing_newlines(&golden);
                            let r = trim_trailing_newlines(&rendered);
                            if g == r {
                                prose_full_match += 1;
                                println!("PASS  {name}  (full, rendered-HTML parity)");
                            } else {
                                failures.push(format!(
                                    "MISS  {name}  (full but rendered HTML differs)\n{}",
                                    first_diff(g, r)
                                ));
                            }
                        }
                        Err(e) => failures.push(format!("ERROR {name}  render failed: {e}")),
                    }
                } else if out.reason.as_deref() == Some("math") {
                    // Documented C-S1 gap: KaTeX is a JS rehype step.
                    prose_gap.push(name.clone());
                    println!("GAP   {name}  (fallback, reason=math — KaTeX is JS-only)");
                } else {
                    failures.push(format!(
                        "MISS  {name}  (prose fell back unexpectedly, reason={:?})",
                        out.reason
                    ));
                }
            }
            "directive" => {
                directive_total += 1;
                if out.capability == xyd_mdx::CAP_FULL {
                    let golden = read(&dir.join("rendered.html"));
                    match node_render(&name, &out.compiled) {
                        Ok(rendered) => {
                            let g = trim_trailing_newlines(&golden);
                            let r = trim_trailing_newlines(&rendered);
                            if g == r {
                                directive_full.push(name.clone());
                                println!("PASS  {name}  (directive full, rendered-HTML parity)");
                            } else {
                                failures.push(format!(
                                    "MISS  {name}  (directive full but rendered HTML differs)\n{}",
                                    first_diff(g, r)
                                ));
                            }
                        }
                        Err(e) => failures.push(format!("ERROR {name}  render failed: {e}")),
                    }
                } else {
                    directive_deferred.push(format!("{name} (reason={:?})", out.reason));
                    println!(
                        "DEFER {name}  (directive -> fallback, reason={:?})",
                        out.reason
                    );
                }
            }
            "async" => {
                async_total += 1;
                // C-S3: `@include` / `@changelog` fixtures must be `full` at
                // rendered-HTML parity; composer-backed async fixtures stay
                // `fallback`. Whatever comes back `full` MUST render byte-equal
                // (a wrong `full` is a FAILURE — keeps coverage honest).
                if out.capability == xyd_mdx::CAP_FULL {
                    let golden = read(&dir.join("rendered.html"));
                    match node_render(&name, &out.compiled) {
                        Ok(rendered) => {
                            let g = trim_trailing_newlines(&golden);
                            let r = trim_trailing_newlines(&rendered);
                            if g == r {
                                async_full.push(name.clone());
                                println!("PASS  {name}  (async full, rendered-HTML parity)");
                            } else {
                                failures.push(format!(
                                    "MISS  {name}  (async full but rendered HTML differs)\n{}",
                                    first_diff(g, r)
                                ));
                            }
                        }
                        Err(e) => failures.push(format!("ERROR {name}  render failed: {e}")),
                    }
                } else {
                    async_deferred.push(format!("{name} (reason={:?})", out.reason));
                    println!("DEFER {name}  (async -> fallback, reason={:?})", out.reason);
                }
            }
            other => failures.push(format!("MISS  {name}  unknown capability tag {other:?}")),
        }
    }

    println!("\n=== MDX parity summary (C-S1 prose + C-S2 stage-1 directive) ===");
    println!("prose: {prose_full_match}/{prose_total} at rendered-HTML parity (Oracle B)",);
    if !prose_gap.is_empty() {
        println!("prose documented gaps (fallback): {}", prose_gap.join(", "));
    }
    println!(
        "directive: {}/{} at rendered-HTML parity (full: [{}])",
        directive_full.len(),
        directive_total,
        directive_full.join(", ")
    );
    if !directive_deferred.is_empty() {
        println!(
            "directive deferred -> fallback: {}",
            directive_deferred.join(", ")
        );
    }
    println!(
        "async: {}/{} at rendered-HTML parity (full: [{}])",
        async_full.len(),
        async_total,
        async_full.join(", ")
    );
    if !async_deferred.is_empty() {
        println!("async deferred -> fallback: {}", async_deferred.join(", "));
    }

    // Floor: the generic directives MUST stay `full` + at parity (no silent
    // regression to fallback).
    for name in DIRECTIVE_FULL_FLOOR {
        if !directive_full.iter().any(|n| n == name) {
            failures.push(format!(
                "MISS  {name}  (expected generic directive at `full` parity, but it was not)"
            ));
        }
    }

    // Floor: the C-S3 `@`-function fixtures MUST stay `full` + at parity.
    for name in ASYNC_FULL_FLOOR {
        if !async_full.iter().any(|n| n == name) {
            failures.push(format!(
                "MISS  {name}  (expected async `@`-function fixture at `full` parity, but it was not)"
            ));
        }
    }

    assert!(
        failures.is_empty(),
        "\n{} gate failure(s):\n{}",
        failures.len(),
        failures.join("\n")
    );
}
