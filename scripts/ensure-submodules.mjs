#!/usr/bin/env node
// Preflight: the Rust-side submodules must be checked out.
//
// Two repos are consumed here as pinned submodules, and both are path-dependencies
// of the Rust build rather than optional extras:
//
//   xwrite  — the content engine (frontmatter/highlight/math/mdx + the vendored
//             markdown/mdxjs forks).
//   opensdk — the SDK/CLI toolchain (the converters, the seven emitters, the
//             breaking-change differ, and the shared spec loader `oas_doc`,
//             which crates/xyd_openapi depends on).
//
// A missing checkout doesn't degrade gracefully: cargo cannot even load the
// workspace, and `napi build` buries the one actionable line under a wall of
// cargo output. Fail early and legibly instead.
//
//   strict (default): exit 1 with instructions.
//   --soft:           try to init them, and never fail the caller.
//
// Both are reported in ONE message. Fixing them one error at a time is the kind
// of paper cut that makes a first clone feel broken.
import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// A sentinel is a file that exists ONLY in a populated checkout — an
// uninitialized submodule is an empty directory, so testing the directory
// itself would pass while the build still fails.
const SUBMODULES = [
    {
        name: "xwrite",
        sentinel: path.join(REPO, "xwrite", "crates", "xwrite_mdx", "Cargo.toml"),
        what: "the content engine (frontmatter/highlight/math/mdx)",
        url: "github.com/livesession/xwrite",
    },
    {
        name: "apitoolchain",
        sentinel: path.join(REPO, "apitoolchain", "crates", "xyd_uniform", "Cargo.toml"),
        what: "the API toolchain (uniform/openapi/gql/mcp/opencli crates + their npm shims)",
        url: "github.com/livesession/apitoolchain",
    },
    {
        name: "opensdk",
        sentinel: path.join(REPO, "opensdk", "crates", "oas_doc", "Cargo.toml"),
        what: "the SDK/CLI toolchain (converters, emitters, the shared spec loader)",
        url: "github.com/livesession/opensdk",
    },
];

const soft = process.argv.includes("--soft");
const missing = SUBMODULES.filter((s) => !existsSync(s.sentinel));

if (missing.length === 0) process.exit(0);

if (soft) {
    // Best effort: this runs from `prepare`, which also fires in offline and
    // container contexts where failing would break unrelated flows. Each is
    // initialized independently so one unreachable remote can't block the other.
    if (existsSync(path.join(REPO, ".git"))) {
        for (const s of missing) {
            spawnSync("git", ["submodule", "update", "--init", s.name], {
                cwd: REPO,
                stdio: "inherit",
            });
        }
    }
    const stillMissing = SUBMODULES.filter((s) => !existsSync(s.sentinel));
    if (stillMissing.length > 0) {
        console.warn(
            `\n  ⚠ Not initialized: ${stillMissing.map((s) => s.name).join(", ")}. Rust builds will fail.\n` +
                `    Run: git submodule update --init ${stillMissing.map((s) => s.name).join(" ")}\n`,
        );
    }
    process.exit(0);
}

console.error(
    `\n${missing.length === 1 ? "A submodule is" : `${missing.length} submodules are`} not initialized:\n\n` +
        missing
            .map((s) => `  ${s.name}  (missing ${path.relative(REPO, s.sentinel)})\n      ${s.what} — ${s.url}`)
            .join("\n") +
        `\n\n  git submodule update --init ${missing.map((s) => s.name).join(" ")}\n`,
);
process.exit(1);
