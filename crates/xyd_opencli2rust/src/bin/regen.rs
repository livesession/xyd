//! `regen` — Rust-native regeneration driver for a generated CLI crate.
//!
//! Reads `<crateDir>/regen.toml`, runs `opencli2rust` on `<crateDir>/<opencli>`,
//! writes the result through the regen-safe `xyd_opensdk_framework::write_project`
//! lifecycle (`.sdk/sdk.lock` / `.sdkignore` / optional 3-way merge), then
//! `cargo fmt`s the crate — opencli2rust emits UNFORMATTED Rust while the committed
//! tree is rustfmt-clean, so the fmt normalizes the just-written source (the lock
//! records the PRISTINE unformatted hash, exactly as the old TS pipeline did).
//!
//! This owns the Rust-codegen pipeline end-to-end: the generator and the module/impl
//! layout config live in Rust (regen.toml + this bin). `specs/xyd-cli` now only
//! compiles the TypeSpec surface into `dist/opencli.json`.
//!
//! Usage: `regen <crateDir> [--spec <path>] [--no-fmt]`  (crateDir and `--spec`
//! path both resolved relative to CWD; absolute paths pass through).
//!
//! `--spec <path>` copies that OpenCLI doc into the crate's own
//! `<crateDir>/<opencli-from-regen.toml>` (e.g. `crates/xyd_cli/opencli.json`)
//! BEFORE reading + generating, so the self-sufficient crate can pull in a freshly
//! compiled spec (e.g. `specs/xyd-cli/dist/opencli.json`). Without it, regen runs
//! from the committed crate spec unchanged.

use std::path::PathBuf;
use std::process::{exit, Command};

use serde::Deserialize;
use serde_json::Value;

use xyd_opencli2rust::{opencli2rust, Options, WriteMode as GenWriteMode};
use xyd_opensdk_framework::{write_project, FileEntry, FileMap, WriteMode, WriteProjectOptions};

/// The `<crateDir>/regen.toml` schema — the single home of the generator +
/// module/impl config (Rust-owned; the crate is self-sufficient).
#[derive(Deserialize)]
struct RegenConfig {
    /// Generator name recorded in `.sdk/sdk.lock` (e.g. "opencli2rust").
    generator: Option<String>,
    /// OpenCLI doc path, relative to the crate dir. Default: "opencli.json".
    opencli: Option<String>,
    /// Cargo crate name (also the `cargo fmt -p <crate>` target).
    #[serde(rename = "crate")]
    crate_name: Option<String>,
    /// Binary name for the generated CLI.
    bin: Option<String>,
    /// Generated command-tree module: `src/<module>/**`.
    module: Option<String>,
    /// Hand-owned impl module: `src/<impl>/**`.
    #[serde(rename = "impl")]
    impl_module: Option<String>,
    /// Skip the `cargo fmt` step when false. Default: true.
    fmt: Option<bool>,
}

fn die(msg: impl AsRef<str>) -> ! {
    eprintln!("regen: {}", msg.as_ref());
    exit(1);
}

fn main() {
    // args: <crateDir> [--spec <path>] [--no-fmt]
    let mut crate_dir_arg: Option<String> = None;
    let mut spec_arg: Option<String> = None;
    let mut no_fmt = false;
    let mut args = std::env::args().skip(1);
    while let Some(a) = args.next() {
        if a == "--no-fmt" {
            no_fmt = true;
        } else if a == "--spec" {
            let path = args
                .next()
                .unwrap_or_else(|| die("--spec requires a path argument"));
            spec_arg = Some(path);
        } else if crate_dir_arg.is_none() {
            crate_dir_arg = Some(a);
        } else {
            die(format!("unexpected extra argument: {a}"));
        }
    }
    let crate_dir_arg =
        crate_dir_arg.unwrap_or_else(|| die("usage: regen <crateDir> [--spec <path>] [--no-fmt]"));

    let cwd = std::env::current_dir().unwrap_or_else(|e| die(format!("cwd: {e}")));
    // `Path::join` replaces with the arg when it is absolute, so both a relative
    // (`crates/xyd_cli`) and an absolute crate dir resolve correctly.
    let crate_dir: PathBuf = cwd.join(&crate_dir_arg);

    // 1) read regen.toml (the module/impl/bin/crate/opencli/generator config).
    let cfg_path = crate_dir.join("regen.toml");
    let cfg_str = std::fs::read_to_string(&cfg_path)
        .unwrap_or_else(|e| die(format!("read {}: {e}", cfg_path.display())));
    let cfg: RegenConfig = toml::from_str(&cfg_str)
        .unwrap_or_else(|e| die(format!("parse {}: {e}", cfg_path.display())));

    // 2) read the OpenCLI doc.
    let opencli_rel = cfg
        .opencli
        .clone()
        .unwrap_or_else(|| "opencli.json".to_string());
    let spec_path = crate_dir.join(&opencli_rel);

    // 2a) `--spec <path>`: pull a freshly compiled OpenCLI doc into the crate's own
    //     committed spec BEFORE reading, so the self-sufficient crate stays in sync
    //     with `specs/xyd-cli/dist/opencli.json` (or any other source).
    if let Some(spec_arg) = &spec_arg {
        let src = cwd.join(spec_arg);
        std::fs::copy(&src, &spec_path).unwrap_or_else(|e| {
            die(format!(
                "copy --spec {} → {}: {e}",
                src.display(),
                spec_path.display()
            ))
        });
        println!("regen: --spec {} → {}", src.display(), spec_path.display());
    }

    let spec_str = std::fs::read_to_string(&spec_path)
        .unwrap_or_else(|e| die(format!("read {}: {e}", spec_path.display())));
    let spec: Value = serde_json::from_str(&spec_str)
        .unwrap_or_else(|e| die(format!("parse {}: {e}", spec_path.display())));

    // 3) generate the Rust CLI project file map.
    let files_gen = opencli2rust(
        &spec,
        Some(Options {
            module_name: cfg.module.clone(),
            impl_module: cfg.impl_module.clone(),
            bin_name: cfg.bin.clone(),
            crate_name: cfg.crate_name.clone(),
            ..Default::default()
        }),
    );

    // 4) adapt opencli2rust's 2-variant WriteMode → the framework's 3-variant one.
    let files: FileMap = files_gen
        .into_iter()
        .map(|(path, e)| {
            let write_mode = match e.write_mode {
                GenWriteMode::Overwrite => WriteMode::Overwrite,
                GenWriteMode::SkipIfExists => WriteMode::SkipIfExists,
            };
            (
                path,
                FileEntry {
                    content: e.content,
                    write_mode,
                },
            )
        })
        .collect();

    // 5) write through the regen-safe lifecycle (merge off).
    let generator = cfg
        .generator
        .clone()
        .unwrap_or_else(|| "opencli2rust".to_string());
    let result = write_project(
        &files,
        &crate_dir,
        &WriteProjectOptions {
            generator: Some(generator),
            merge: false,
        },
    )
    .unwrap_or_else(|e| die(format!("write_project: {e}")));

    // 7) summary.
    println!(
        "regen: write_project → written {}, unchanged {}, skipped {}, pruned {}, keptModified {}, conflicts {}, merged {}, mergeConflicts {}",
        result.written.len(),
        result.unchanged.len(),
        result.skipped.len(),
        result.pruned.len(),
        result.kept_modified.len(),
        result.conflicts.len(),
        result.merged.len(),
        result.merge_conflicts.len(),
    );

    // 6) cargo fmt — normalize the just-written UNFORMATTED generated source so the
    //    working tree matches the committed rustfmt-clean crate.
    let fmt_enabled = cfg.fmt.unwrap_or(true) && !no_fmt;
    if fmt_enabled {
        let Some(crate_name) = cfg.crate_name.as_deref() else {
            die("regen.toml: `crate` is required for `cargo fmt -p <crate>` (or set fmt = false)");
        };
        let status = Command::new("cargo")
            .args(["fmt", "-p", crate_name])
            .current_dir(&crate_dir)
            .status()
            .unwrap_or_else(|e| die(format!("spawn cargo fmt: {e}")));
        if !status.success() {
            die("cargo fmt failed");
        }
        println!("regen: cargo fmt -p {crate_name}");
    }
}
