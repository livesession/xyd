#!/usr/bin/env node
// Preflight: the `xwrite` submodule must be checked out.
//
// The content engine (frontmatter/highlight/math/mdx + the vendored
// markdown/mdxjs forks) lives in github.com/livesession/xwrite and is consumed
// here as a pinned submodule. crates/xyd_cli and packages/xyd-native both
// path-depend on it, so a missing checkout doesn't degrade gracefully — cargo
// cannot even load the workspace, and `napi build` buries the one actionable
// line under a wall of cargo output. Fail early and legibly instead.
//
//   strict (default): exit 1 with instructions.
//   --soft:           try to init it, and never fail the caller.
import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SENTINEL = path.join(REPO, "xwrite", "crates", "xwrite_mdx", "Cargo.toml");
const soft = process.argv.includes("--soft");

if (existsSync(SENTINEL)) process.exit(0);

if (soft) {
    // Best effort: this runs from `prepare`, which also fires in offline and
    // container contexts where failing would break unrelated flows.
    if (existsSync(path.join(REPO, ".git"))) {
        spawnSync("git", ["submodule", "update", "--init", "xwrite"], {
            cwd: REPO,
            stdio: "inherit",
        });
    }
    if (!existsSync(SENTINEL)) {
        console.warn(
            "\n  ⚠ The xwrite submodule is not initialized. Rust builds will fail.\n" +
                "    Run: git submodule update --init xwrite\n",
        );
    }
    process.exit(0);
}

console.error(
    `\nxwrite submodule is not initialized (missing ${path.relative(REPO, SENTINEL)}).\n\n` +
        `  git submodule update --init xwrite\n\n` +
        `The content engine (frontmatter/highlight/math/mdx) lives in\n` +
        `github.com/livesession/xwrite and is vendored here as a pinned submodule.\n`,
);
process.exit(1);
