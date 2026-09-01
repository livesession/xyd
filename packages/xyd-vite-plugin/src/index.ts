import * as fs from "node:fs";
import * as path from "node:path";

import type { Plugin, ResolvedConfig } from "vite";

import { createLogger, XydError } from "./log";
import { normalizeBase, normalizeOptions, XydOptions } from "./options";
import { mergeDocsBuild } from "./merge";
import { resolveCli } from "./resolveCli";
import { runDocsBuild } from "./runBuild";

export type { XydOptions } from "./options";
export { mergeDocsBuild, planMerge, executeMerge } from "./merge";
export { resolveCli } from "./resolveCli";

const SETTINGS_FILES = ["docs.json", "docs.ts", "docs.tsx"];

interface State {
    docsRoot: string;
    clientOutDir?: string;
    isRR: boolean;
    merged: boolean;
}

/**
 * Module-level, keyed by absolute docsRoot: React Router 7 loads the Vite config
 * twice in one process (client build + SSR build), producing TWO plugin instances
 * that must share the client outDir and the merged-once guard.
 */
const states = new Map<string, State>();

/**
 * Build-only Vite plugin: during `vite build` (plain Vite or Vite + React Router 7),
 * runs `xyd build` for a docs project in a child process and merges its static
 * output (`.xyd/build/client/`) into the host app's client outDir.
 *
 * The docs project MUST set `advanced.basename` (e.g. "/docs") — that's the mount
 * path, baked into every prerendered docs link.
 */
export default function xyd(userOptions: XydOptions): Plugin {
    const options = normalizeOptions(userOptions);
    const log = createLogger(options.verbose);
    let config: ResolvedConfig;
    let state: State | undefined;

    return {
        name: "xyd",
        apply: "build",
        // closeBundle must run AFTER react-router's own hooks (prerender etc.)
        enforce: "post",

        configResolved(resolved) {
            if (!options.enabled) return;
            config = resolved;

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
            if (!options.enabled || !state) return;

            // SSR-ness, robust across the classic config and the Vite 6/7 environments API
            const environment = (this as any).environment;
            const isSSR = environment?.config
                ? environment.config.consumer !== "client"
                : !!config.build.ssr;

            if (state.merged) {
                log.debug("docs already merged in this process — skipping");
                return;
            }
            // Plain Vite: merge right after the client build. React Router: the client
            // build is followed by an SSR build whose late hooks (prerender) still write
            // into the client outDir — merge only on the FINAL (SSR) build.
            if (state.isRR ? !isSSR : isSSR) return;
            if (!state.clientOutDir) {
                throw new XydError(`client outDir was never resolved — the client build did not run?`);
            }

            const cli = resolveCli(options.command, config.root);
            log.info(`building docs (${cli.source}): ${cli.argv.join(" ")} build   [cwd ${state.docsRoot}]`);
            const startedAt = Date.now();
            await runDocsBuild(cli.argv, state.docsRoot, options, log);

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
        },
    };
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
        throw new XydError(
            `${settingsPath} has no \`advanced.basename\` — required to mount the docs under a subpath of your app.\n` +
            `  Add:  "advanced": { "basename": "/docs" }`
        );
    }
    if (base && normalizeBase(String(basename)) !== base) {
        throw new XydError(
            `\`base: "${base}"\` does not match \`advanced.basename: "${basename}"\` in ${settingsPath}.\n` +
            `  They must be equal — the basename is baked into every prerendered docs link.`
        );
    }
}
