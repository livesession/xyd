// Hand-owned (protected by .sdkignore): embed the JS-on-Bun render engine into
// the Rust `xyd` binary — Design B / S4, "single self-contained binary".
//
// When the build-time env `XYD_ENGINE_PATH` points at the TARGET-MATCHED
// `bun --compile` engine (`packages/xyd-cli/dist/xyd-<os>-<arch>`), this script
// stages its bytes into `OUT_DIR/engine.bin` and emits `cfg(xyd_has_embedded_engine)`
// so `src/custom/engine.rs` can `include_bytes!` + self-extract it. When
// `XYD_ENGINE_PATH` is UNSET, it embeds NOTHING — plain `cargo build` for local
// development stays fast (no 233 MB blob baked in), and `engine.rs` falls back to
// the runtime `XYD_ENGINE_PATH` override / the clear "not embedded" error.
//
// `include_bytes!` can only bake whatever the path literally points at (there is
// no cross-compile of the embedded blob), so a wrong-arch engine would silently
// produce a broken binary. We therefore guard the path's triple against the
// target we're compiling for and `panic!` loudly on mismatch — mirroring
// `packages/xyd-cli/scripts/compile.ts`'s cross-target FATAL check.

use std::env;
use std::fs;
use std::path::Path;

fn main() {
    // `xyd_has_embedded_engine` is set conditionally below; declare it so the
    // 1.80+ unexpected-cfg lint doesn't warn when it is absent (dev builds).
    println!("cargo::rustc-check-cfg=cfg(xyd_has_embedded_engine)");
    // Re-run whenever the embed source is set / unset / repointed.
    println!("cargo:rerun-if-env-changed=XYD_ENGINE_PATH");

    let engine_path = match env::var("XYD_ENGINE_PATH") {
        Ok(p) if !p.is_empty() => p,
        // No embed → fast dev build. engine.rs handles the not-embedded case.
        _ => return,
    };

    // (a) Triple guard — the embedded bytes ARE whatever the path points at, so a
    // wrong-target engine baked into this binary would be unrunnable on the host
    // it targets. Require the filename to end with the <os>-<arch> triple we're
    // building for (macos→darwin, aarch64→arm64, x86_64→x64).
    let target_os = env::var("CARGO_CFG_TARGET_OS").unwrap_or_default();
    let target_arch = env::var("CARGO_CFG_TARGET_ARCH").unwrap_or_default();
    let want_os = match target_os.as_str() {
        "macos" => "darwin",
        other => other,
    };
    let want_arch = match target_arch.as_str() {
        "aarch64" => "arm64",
        "x86_64" => "x64",
        other => other,
    };
    let want_triple = format!("{want_os}-{want_arch}");
    let file_name = Path::new(&engine_path)
        .file_name()
        .and_then(|s| s.to_str())
        .unwrap_or_default();
    if !file_name.ends_with(&want_triple) {
        panic!(
            "XYD_ENGINE_PATH triple mismatch: building for `{want_triple}` \
             (CARGO_CFG_TARGET_OS={target_os}, CARGO_CFG_TARGET_ARCH={target_arch}) \
             but XYD_ENGINE_PATH points at `{file_name}`. Embedding a wrong-target \
             engine would produce a broken binary — point XYD_ENGINE_PATH at the \
             `…-{want_triple}` engine. (Mirrors compile.ts's cross-target FATAL.)"
        );
    }

    // (b) Stage the engine bytes into OUT_DIR for include_bytes!.
    let out_dir = env::var("OUT_DIR").expect("OUT_DIR is set by cargo");
    let dest = Path::new(&out_dir).join("engine.bin");
    fs::copy(&engine_path, &dest).unwrap_or_else(|e| {
        panic!(
            "failed to stage XYD_ENGINE_PATH (`{engine_path}`) → `{}`: {e}",
            dest.display()
        )
    });
    // Re-run if the engine binary itself changes.
    println!("cargo:rerun-if-changed={engine_path}");

    // (c) Tell engine.rs an embedded engine is available.
    println!("cargo:rustc-cfg=xyd_has_embedded_engine");
}
