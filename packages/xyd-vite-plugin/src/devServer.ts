import { ChildProcess, spawn } from "node:child_process";
import * as net from "node:net";
import * as readline from "node:readline";

import { Logger, XydError } from "./log";
import { ResolvedXydOptions } from "./options";

/**
 * Dev-mode integration: spawn `xyd dev` for the docs project on an internal
 * port and let the vite dev server proxy it — app and docs share one origin.
 *
 * The spawned dev defaults to xyd's BUN engine (XYD_BUN=1 — a no-op for the
 * native binary, an opt-in for the JS CLI): its URL surface is subpath-clean —
 * pages under the basename plus the /_xyd/* (css/js + livereload websocket)
 * and /_bun/* internals — so a prefix proxy covers everything. The vite-engine
 * dev server serves unprefixed /@vite//@fs module URLs that would collide with
 * the host's own, which is why it is not the default.
 */

/** xyd dev endpoints that live OUTSIDE the basename (safe, host-unused prefixes). */
export const XYD_DEV_INTERNAL_PREFIXES = ["/_xyd", "/_bun"];

export function pickFreePort(): Promise<number> {
    return new Promise((resolve, reject) => {
        const srv = net.createServer();
        srv.listen(0, () => {
            const port = (srv.address() as net.AddressInfo).port;
            srv.close(() => resolve(port));
        });
        srv.on("error", reject);
    });
}

export interface DocsDevHandle {
    /** resolves when the docs dev server answers HTTP (any status) */
    ready: Promise<void>;
    stop(): void;
}

export function spawnDocsDev(
    argv: string[],
    docsRoot: string,
    port: number,
    base: string,
    options: ResolvedXydOptions,
    log: Logger
): DocsDevHandle {
    const env: NodeJS.ProcessEnv = {
        ...process.env,
        ...options.env,
        XYD_PORT: String(port),
        XYD_BASENAME: base,
    };
    // bun engine by default (see module doc); an explicit env wins
    if (env.XYD_BUN === undefined) env.XYD_BUN = "1";

    const child: ChildProcess = spawn(argv[0], [...argv.slice(1), "dev"], {
        cwd: docsRoot,
        env,
        stdio: ["ignore", "pipe", "pipe"],
    });
    const onLine = (line: string) => log.child(line);
    readline.createInterface({ input: child.stdout! }).on("line", onLine);
    readline.createInterface({ input: child.stderr! }).on("line", onLine);

    let exited = false;
    let exitCode: number | null = null;
    child.on("close", (code) => {
        exited = true;
        exitCode = code;
    });
    child.on("error", (err) => {
        exited = true;
        log.warn(`failed to spawn the docs dev server (${argv.join(" ")}): ${err.message}`);
    });

    // Readiness: ANY http response (even a 404) means the server is up. Budget is
    // generous — a cold start installs the docs workspace (.xyd/host) first.
    const budgetMs = 5 * 60 * 1000;
    const ready = (async () => {
        const started = Date.now();
        while (Date.now() - started < budgetMs) {
            if (exited) {
                throw new XydError(`the docs dev server exited (code ${exitCode}) before becoming ready — see the [xyd] │ output above`);
            }
            try {
                await fetch(`http://localhost:${port}${base}`, { redirect: "manual" });
                return;
            } catch {
                /* not up yet */
            }
            await new Promise((r) => setTimeout(r, 500));
        }
        throw new XydError(`the docs dev server did not answer on :${port} within ${budgetMs / 1000}s`);
    })();
    ready.catch(() => { /* surfaced via the gate middleware; avoid unhandled rejection */ });

    const stop = () => {
        if (!exited) child.kill("SIGTERM");
    };
    // Lifecycle safety net. Interactive Ctrl-C already reaches the child (same
    // process group), and a graceful vite shutdown triggers the httpServer close
    // handler — but a bare SIGTERM/SIGINT to the vite process runs NO exit
    // handlers, orphaning the docs dev server. Kill the child, then re-raise the
    // signal's default when nobody else handles it (vite's own handlers, when
    // present, proceed normally).
    process.once("exit", stop);
    for (const sig of ["SIGTERM", "SIGINT"] as const) {
        process.once(sig, () => {
            stop();
            if (process.listenerCount(sig) === 0) {
                process.kill(process.pid, sig);
            }
        });
    }

    return { ready, stop };
}
