import { spawn } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import * as readline from "node:readline";

import { Logger, XydError } from "./log";
import { ResolvedXydOptions } from "./options";

/**
 * Spawn `<cli> build` with cwd = the docs project root (the xyd CLI resolves
 * everything — settings, content, .xyd output — from process.cwd(); there is no
 * directory argument).
 */
export async function runDocsBuild(
    argv: string[],
    docsRoot: string,
    options: ResolvedXydOptions,
    log: Logger
): Promise<void> {
    const env: NodeJS.ProcessEnv = { ...process.env, ...options.env, NODE_ENV: "production" };
    if (options.nodeOptions !== false && !env.NODE_OPTIONS) {
        // docs builds are memory-heavy (two full Vite builds)
        env.NODE_OPTIONS = options.nodeOptions;
    }
    // The mount path flows into the docs build via XYD_BASENAME, so the docs
    // settings don't have to duplicate it — a docs-side `advanced.basename`
    // still wins inside xyd (and a mismatch fails validation here).
    if (options.base && !env.XYD_BASENAME) {
        env.XYD_BASENAME = options.base;
    }

    const startedAt = Date.now();
    const tail: string[] = [];

    await new Promise<void>((resolve, reject) => {
        const child = spawn(argv[0], [...argv.slice(1), "build"], {
            cwd: docsRoot,
            env,
            stdio: ["ignore", "pipe", "pipe"],
        });

        const onLine = (line: string) => {
            if (options.silent) {
                tail.push(line);
                if (tail.length > 200) tail.shift();
            } else {
                log.child(line);
            }
        };
        readline.createInterface({ input: child.stdout! }).on("line", onLine);
        readline.createInterface({ input: child.stderr! }).on("line", onLine);

        let timedOut = false;
        let killTimer: ReturnType<typeof setTimeout> | undefined;
        let timeoutTimer: ReturnType<typeof setTimeout> | undefined;
        if (options.timeoutMs > 0) {
            timeoutTimer = setTimeout(() => {
                timedOut = true;
                child.kill("SIGTERM");
                killTimer = setTimeout(() => child.kill("SIGKILL"), 5000);
            }, options.timeoutMs);
        }

        child.on("error", (err) => reject(new XydError(`failed to spawn the docs build (${argv.join(" ")}): ${err.message}`)));
        child.on("close", (code) => {
            if (timeoutTimer) clearTimeout(timeoutTimer);
            if (killTimer) clearTimeout(killTimer);
            if (timedOut) {
                return reject(new XydError(`docs build timed out after ${options.timeoutMs}ms`));
            }
            if (code !== 0) {
                if (options.silent && tail.length) {
                    for (const line of tail) log.child(line);
                }
                return reject(new XydError(`docs build exited with code ${code} — see the [xyd] │ output above`));
            }
            resolve();
        });
    });

    validateDocsOutput(path.join(docsRoot, ".xyd", "build", "client"), startedAt);
}

function hasHtml(dir: string, depth = 0): boolean {
    if (depth > 6) return false;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (entry.isFile() && entry.name.endsWith(".html")) return true;
        if (entry.isDirectory() && hasHtml(path.join(dir, entry.name), depth + 1)) return true;
    }
    return false;
}

/**
 * The docs builder can swallow Vite build failures and still exit 0 (its build
 * pipeline logs "Build failed" without rethrowing), so a zero exit code is not
 * proof of success — validate the output structurally.
 */
export function validateDocsOutput(clientDir: string, sinceMs: number): void {
    const fail = (why: string) => {
        throw new XydError(
            `docs build output at ${clientDir} looks broken (${why}).\n` +
            `  Note: some xyd versions exit 0 even when the underlying build fails — check the [xyd] │ output above for errors.`
        );
    };
    if (!fs.existsSync(clientDir)) fail("directory missing");
    const entries = fs.readdirSync(clientDir);
    if (!entries.length) fail("directory empty");
    const newest = Math.max(...entries.map((e) => fs.statSync(path.join(clientDir, e)).mtimeMs));
    if (newest < sinceMs - 5000) fail("output predates this build — stale result from a previous run");
    const assetsDir = path.join(clientDir, "assets");
    if (!fs.existsSync(assetsDir) || !fs.readdirSync(assetsDir).length) fail("no assets/ output");
    if (!hasHtml(clientDir)) fail("no prerendered .html pages");
}
