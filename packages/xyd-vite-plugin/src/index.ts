import * as fs from "node:fs";
import * as path from "node:path";

import type { Plugin, ResolvedConfig } from "vite";

import { createLogger, XydError } from "./log";
import { normalizeBase, normalizeOptions, XydOptions } from "./options";
import { mergeDocsBuild } from "./merge";
import { resolveCli } from "./resolveCli";
import { runDocsBuild } from "./runBuild";
import { DocsDevHandle, pickFreePort, spawnDocsDev, XYD_DEV_INTERNAL_PREFIXES } from "./devServer";

export type { XydOptions } from "./options";
export { normalizeBase, normalizeOptions } from "./options";
export { mergeDocsBuild, planMerge, executeMerge } from "./merge";
export { resolveCli } from "./resolveCli";
export { runDocsBuild } from "./runBuild";
export { spawnDocsDev, pickFreePort, XYD_DEV_INTERNAL_PREFIXES } from "./devServer";
export { createLogger, XydError } from "./log";

const SETTINGS_FILES = ["docs.json", "docs.ts", "docs.tsx"];

interface State {
    docsRoot: string;
    clientOutDir?: string;
    isRR: boolean;
    merged: boolean;
    exitMergeScheduled?: boolean;
}

/**
 * Module-level, keyed by absolute docsRoot: React Router 7 loads the Vite config
 * twice in one process (client build + SSR build), producing TWO plugin instances
 * that must share the client outDir and the merged-once guard.
 */
const states = new Map<string, State>();

/**
 * Dev port per docsRoot — frameworks may run the SAME plugin instance through
 * SEVERAL vite configs (Nuxt: client + server dev servers), each invoking the
 * `config` hook. The proxy target injected on every pass and the spawned dev
 * server must agree on one port.
 */
const devPorts = new Map<string, number>();

/**
 * Vite plugin for embedding xyd docs into a host app (plain Vite or Vite +
 * React Router):
 *
 * - `vite build`: runs `xyd build` for the docs project in a child process and
 *   merges its static output (`.xyd/build/client/`) into the host client outDir.
 * - `vite dev`: spawns `xyd dev` on an internal port and proxies the mount path
 *   (+ xyd's /_xyd + /_bun internals, incl. the livereload websocket) — app and
 *   docs share one URL/port.
 *
 * The mount path comes from `base` (passed to xyd via XYD_BASENAME) or the docs'
 * own `advanced.basename` — the docs side wins when both are set (must match).
 */
export default function xyd(userOptions: XydOptions): Plugin {
    const options = normalizeOptions(userOptions);
    const log = createLogger(options.verbose);
    let config: ResolvedConfig;
    let state: State | undefined;
    let devPort: number | undefined;
    let devBase: string | undefined;
    let devHandle: DocsDevHandle | undefined;
    let disableDocsLiveReload = false;

    const isDevMode = () => options.enabled && options.dev;

    return {
        name: "xyd",
        // closeBundle must run AFTER react-router's own hooks (prerender etc.)
        enforce: "post",

        /** dev: inject the proxy entries BEFORE the server exists (vite's proxy
         *  config is static) — the target port is picked here, the child spawns
         *  in configureServer. */
        async config(userConfig, env) {
            if (env.command !== "serve" || (env as any).isPreview || !isDevMode()) return;

            const absDocsRoot = path.resolve(userConfig.root ? path.resolve(userConfig.root) : process.cwd(), options.docsRoot);
            devBase = options.base ?? readSettingsBasename(absDocsRoot);
            if (!devBase) {
                throw new XydError(
                    `dev mode needs the docs mount path — set the plugin's \`base\` option (e.g. base: "/docs")\n` +
                    `  or \`advanced.basename\` in ${absDocsRoot}/docs.json`
                );
            }
            devPort = devPorts.get(absDocsRoot);
            if (devPort === undefined) {
                devPort = await pickFreePort();
                devPorts.set(absDocsRoot, devPort);
            }

            const target = `http://localhost:${devPort}`;
            const proxy: Record<string, any> = {
                [devBase]: { target },
            };
            for (const prefix of XYD_DEV_INTERNAL_PREFIXES) {
                // ws: true — /_xyd/livereload is a websocket
                proxy[prefix] = { target, ws: true };
            }
            return { server: { proxy } };
        },

        /** dev: spawn `xyd dev` + gate proxied requests until it answers. */
        configureServer(server) {
            if (!isDevMode() || devPort === undefined || !devBase) return;

            const ensureSpawned = (): DocsDevHandle => {
                if (!devHandle) {
                    const absDocsRoot = path.resolve(config.root, options.docsRoot);
                    const cli = resolveCli(options.command, config.root);
                    log.info(`docs dev (${cli.source}): ${cli.argv.join(" ")} dev on :${devPort} → proxied at ${devBase}`);
                    const spawnOptions = disableDocsLiveReload
                        ? { ...options, env: { ...options.env, XYD_LIVERELOAD: "0" } }
                        : options;
                    devHandle = spawnDocsDev(cli.argv, absDocsRoot, devPort!, devBase!, spawnOptions, log);
                }
                return devHandle;
            };

            // Spawn timing: a LISTENING dev server (vite dev / astro dev / react-router
            // dev) gets an eager spawn so the docs are warm. A middlewareMode server
            // (httpServer === null) spawns lazily on the first proxied request —
            // frameworks also create TRANSIENT middlewareMode servers internally
            // (astro build's config/content server) that must not fork a docs dev.
            if (server.httpServer) {
                ensureSpawned();
                server.httpServer.once("close", () => devHandle?.stop());
            }

            // Hold proxied requests until the docs dev server is ready (cold starts
            // install the docs workspace) — registered here (pre-internal), so it
            // runs before vite's proxy middleware and the proxy never ECONNREFUSEDs.
            const gated = (url: string) =>
                url === devBase || url.startsWith(devBase + "/") ||
                XYD_DEV_INTERNAL_PREFIXES.some((p) => url.startsWith(p));
            server.middlewares.use((req, res, next) => {
                if (!req.url || !gated(req.url)) return next();
                ensureSpawned().ready.then(
                    () => next(),
                    (err) => {
                        res.statusCode = 502;
                        res.setHeader("content-type", "text/plain");
                        res.end(String(err?.message || err));
                    }
                );
            });
        },

        configResolved(resolved) {
            if (!options.enabled) return;
            config = resolved;
            if (resolved.command !== "build") {
                // dev: validate the docs project early, skip the build-state machinery
                const absDocsRoot = path.resolve(resolved.root, options.docsRoot);
                assertDocsProject(absDocsRoot);
                preValidateBasename(absDocsRoot, options.base);

                // Nuxt's layered dev proxy crashes (write EPIPE → restart loop) on
                // proxied websocket upgrades — under nuxt the spawned docs dev is
                // told not to inject the livereload client at all (XYD_LIVERELOAD=0),
                // so no upgrade is ever attempted. Docs live-reload degrades
                // gracefully; pages and styles still proxy fine.
                disableDocsLiveReload ||= resolved.plugins.some(
                    (p) => typeof p?.name === "string" && p.name.startsWith("nuxt:")
                );
                if (disableDocsLiveReload) {
                    log.debug("ws-hostile host detected (nuxt) — docs livereload disabled");
                }
                return;
            }

            const absDocsRoot = path.resolve(resolved.root, options.docsRoot);
            assertDocsProject(absDocsRoot);
            preValidateBasename(absDocsRoot, options.base);

            state = states.get(absDocsRoot);
            if (!state) {
                state = { docsRoot: absDocsRoot, isRR: false, merged: false };
                states.set(absDocsRoot, state);
            }
            state.isRR ||= resolved.plugins.some((p) => typeof p?.name === "string" && p.name.startsWith("react-router"));
            if (!resolved.build.ssr) {
                state.clientOutDir = path.resolve(resolved.root, resolved.build.outDir);
            }
        },

        async closeBundle() {
            if (!options.enabled || !state || config.command !== "build") return;

            // SSR-ness, robust across the classic config and the Vite 6+ environments API
            const environment = (this as any).environment;
            const isSSR = environment?.config
                ? environment.config.consumer !== "client"
                : !!config.build.ssr;

            // The client outDir must come from the CLIENT environment: under the
            // environments API (React Router 8 / Vite 8) the whole build runs in ONE
            // config whose root-level build.outDir is the default ("dist") — only
            // environments carry the real per-target outDirs. The client env's
            // closeBundle always fires before the ssr env's, so the value is set
            // by the time a later merge needs it.
            if (!isSSR) {
                const outDir = environment?.config?.build?.outDir ?? config.build.outDir;
                state.clientOutDir = path.resolve(config.root, outDir);
            }

            // When to merge:
            // - plain Vite (single client build): right after the client build.
            // - React Router: the client build is followed by an SSR build whose late
            //   hooks (prerender) still write into the client outDir — merge only on
            //   the FINAL (SSR) build.
            if (state.isRR ? !isSSR : isSSR) return;

            // outDir mode (adapter frameworks — SvelteKit adapter-static, Nuxt):
            // the final dir is assembled by the framework INSIDE the same build
            // lifecycle, and closeBundle hooks run in parallel across plugins —
            // a long await here deadlocks against the adapter (observed with
            // SvelteKit on Vite 8: its writeBundle and our closeBundle stall each
            // other). Defer the whole docs-build+merge to process beforeExit,
            // AFTER the entire vite lifecycle has drained.
            if (options.outDir) {
                scheduleExitMerge();
                return;
            }
            await mergeFlow();
        },
    };

    function scheduleExitMerge(): void {
        if (!state || state.exitMergeScheduled) return;
        state.exitMergeScheduled = true;
        log.debug(`outDir mode — docs build + merge deferred to end of process (after the adapter)`);
        process.once("beforeExit", () => {
            // async work keeps the process alive; a failure must fail the build
            mergeFlow().catch((err) => {
                console.error(String(err?.message || err));
                process.exitCode = 1;
            });
        });
    }

    async function mergeFlow(): Promise<void> {
        if (!state) return;
        if (state.merged) {
            log.debug("docs already merged in this process — skipping");
            return;
        }

        // The docs build runs FIRST — it takes long enough that a framework
        // adapter racing us in a parallel closeBundle has finished by the time
        // the merge target is resolved below.
        const cli = resolveCli(options.command, config.root);
        log.info(`building docs (${cli.source}): ${cli.argv.join(" ")} build   [cwd ${state.docsRoot}]`);
        const startedAt = Date.now();
        await runDocsBuild(cli.argv, state.docsRoot, options, log);

        // outDir option: by beforeExit the adapter has assembled its final dir —
        // a missing dir now is a real misconfiguration.
        if (options.outDir) {
            const overridden = path.resolve(config.root, options.outDir);
            if (!fs.existsSync(overridden)) {
                throw new XydError(
                    `outDir "${options.outDir}" does not exist after the build (${overridden}) — did the framework's adapter run?`
                );
            }
            state.clientOutDir = overridden;
        }
        if (!state.clientOutDir) {
            throw new XydError(`client outDir was never resolved — the client build did not run?`);
        }

        const docsClientDir = path.join(state.docsRoot, ".xyd", "build", "client");
        const summary = mergeDocsBuild(docsClientDir, state.clientOutDir, {
            base: options.base,
            sitemap: options.sitemap,
            robots: options.robots,
        });
        state.merged = true;

        const secs = ((Date.now() - startedAt) / 1000).toFixed(1);
        for (const note of summary.notes) log.info(note);
        log.info(
            `merged docs into ${path.relative(config.root, state.clientOutDir) || "."} — ` +
            `mount ${summary.mount}, ${summary.pages} pages, ${summary.assets} assets` +
            (summary.skippedIdentical ? ` (+${summary.skippedIdentical} identical skipped)` : "") +
            `, ${secs}s`
        );
    }
}

/** `advanced.basename` from a statically readable docs.json (normalized), else undefined. */
function readSettingsBasename(absDocsRoot: string): string | undefined {
    try {
        const settings = JSON.parse(fs.readFileSync(path.join(absDocsRoot, "docs.json"), "utf-8"));
        const basename = settings?.advanced?.basename;
        return basename ? normalizeBase(String(basename)) : undefined;
    } catch {
        return undefined;
    }
}

function assertDocsProject(absDocsRoot: string): void {
    if (!fs.existsSync(absDocsRoot)) {
        throw new XydError(`docsRoot does not exist: ${absDocsRoot}`);
    }
    if (!SETTINGS_FILES.some((f) => fs.existsSync(path.join(absDocsRoot, f)))) {
        throw new XydError(`docsRoot is not an xyd project (no ${SETTINGS_FILES.join("/")}): ${absDocsRoot}`);
    }
}

/**
 * Fail fast when the settings are statically readable (docs.json). docs.ts/tsx
 * can't be parsed here — the post-build output-tree validation in merge.ts covers
 * those (the output encodes the basename regardless of settings format).
 *
 * The mount path can come from EITHER side: the plugin's `base` option (passed
 * into the docs build via XYD_BASENAME) or the docs' own `advanced.basename`.
 * When both are set they must agree.
 */
export function preValidateBasename(absDocsRoot: string, base: string | undefined): void {
    const settingsPath = path.join(absDocsRoot, "docs.json");
    if (!fs.existsSync(settingsPath)) return;

    let settings: any;
    try {
        settings = JSON.parse(fs.readFileSync(settingsPath, "utf-8"));
    } catch {
        return; // malformed json — let the docs build report it properly
    }
    const basename = settings?.advanced?.basename;
    if (!basename) {
        if (base) return; // the plugin supplies the mount via XYD_BASENAME
        throw new XydError(
            `no mount path for the docs — set the plugin's \`base\` option (e.g. base: "/docs")\n` +
            `  or add to ${settingsPath}:  "advanced": { "basename": "/docs" }`
        );
    }
    if (base && normalizeBase(String(basename)) !== base) {
        throw new XydError(
            `\`base: "${base}"\` does not match \`advanced.basename: "${basename}"\` in ${settingsPath}.\n` +
            `  They must be equal — the basename is baked into every prerendered docs link.`
        );
    }
}
