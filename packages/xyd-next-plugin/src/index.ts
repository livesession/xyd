import * as fs from "node:fs";
import * as path from "node:path";

import {
    createLogger,
    mergeDocsBuild,
    normalizeBase,
    normalizeOptions,
    pickFreePort,
    resolveCli,
    runDocsBuild,
    spawnDocsDev,
    XydError,
    XYD_DEV_INTERNAL_PREFIXES,
    type XydOptions,
} from "@xyd-js/vite-plugin";

/**
 * Next.js integration for xyd docs, mirroring @xyd-js/vite-plugin:
 *
 * - `next build`: runs `xyd build` for the docs project and merges the static
 *   output into `public/` (docs pages under public/<base>, hashed assets under
 *   public/assets — Next serves public/ at the site root). Extensionless docs
 *   URLs are handled by afterFiles rewrites (`/docs/x` → `/docs/x.html`), which
 *   `next start` and Vercel honor at runtime.
 * - `next dev`: spawns `xyd dev` (bun engine) on an internal port and proxies
 *   the mount + xyd's /_xyd + /_bun internals via rewrites to that origin —
 *   app and docs on ONE URL/port. (Next's rewrite proxy is HTTP-only, so the
 *   docs livereload websocket degrades gracefully — pages still work.)
 *
 * Usage (next.config.mjs):
 *   import { withXyd } from "@xyd-js/next-plugin";
 *   export default withXyd({ docsRoot: "./docs", base: "/docs" })(nextConfig);
 */

export type XydNextOptions = Omit<XydOptions, "outDir">;

const PHASE_BUILD = "phase-production-build";
const PHASE_DEV = "phase-development-server";

/** Tracks generated files inside public/ so a rebuild can clean them first. */
const MANIFEST = ".xyd-docs-manifest.json";

interface DevState {
    port: number;
    spawned: boolean;
}
// keyed by absolute docsRoot — next.config can be evaluated more than once per process
const devStates = new Map<string, DevState>();
// next build evaluates the config multiple times — build the docs once per process
const buildsDone = new Set<string>();

export function withXyd(userOptions: XydNextOptions) {
    const options = normalizeOptions(userOptions as XydOptions);
    const log = createLogger(options.verbose);

    return (nextConfig: any = {}) => {
        return async (phase: string, phaseCtx: any) => {
            const resolved =
                typeof nextConfig === "function" ? await nextConfig(phase, phaseCtx) : { ...nextConfig };

            if (!options.enabled) return resolved;

            const root = process.cwd();
            const absDocsRoot = path.resolve(root, options.docsRoot);
            const base = options.base ?? readSettingsBasename(absDocsRoot);
            if (!base) {
                throw new XydError(
                    `no mount path for the docs — set \`base\` (e.g. base: "/docs") in withXyd(), or advanced.basename in ${absDocsRoot}/docs.json`
                );
            }

            let ourRewrites: any[];
            if (phase === PHASE_DEV && options.dev) {
                const port = await ensureDocsDev(absDocsRoot, base, options, log);
                const target = `http://localhost:${port}`;
                ourRewrites = [
                    { source: base, destination: `${target}${base}` },
                    { source: `${base}/:path*`, destination: `${target}${base}/:path*` },
                    ...XYD_DEV_INTERNAL_PREFIXES.flatMap((p) => [
                        { source: p, destination: `${target}${p}` },
                        { source: `${p}/:path*`, destination: `${target}${p}/:path*` },
                    ]),
                ];
            } else {
                // build + start + everything else: extensionless docs URLs → the
                // merged flat .html files in public/ (afterFiles = public wins for
                // real files like /docs/public/logo.svg)
                ourRewrites = [
                    { source: base, destination: `${base}/index.html` },
                    { source: `${base}/:path*`, destination: `${base}/:path*.html` },
                ];
            }

            if (phase === PHASE_BUILD && !buildsDone.has(absDocsRoot)) {
                buildsDone.add(absDocsRoot);
                await buildAndMergeIntoPublic(root, absDocsRoot, base, options, log);
            }

            const userRewrites = resolved.rewrites;
            resolved.rewrites = async () => composeRewrites(userRewrites, ourRewrites);
            return resolved;
        };
    };
}

async function ensureDocsDev(
    absDocsRoot: string,
    base: string,
    options: ReturnType<typeof normalizeOptions>,
    log: ReturnType<typeof createLogger>
): Promise<number> {
    let state = devStates.get(absDocsRoot);
    if (!state) {
        state = { port: await pickFreePort(), spawned: false };
        devStates.set(absDocsRoot, state);
    }
    if (!state.spawned) {
        state.spawned = true;
        const cli = resolveCli(options.command, process.cwd());
        log.info(`docs dev (${cli.source}): ${cli.argv.join(" ")} dev on :${state.port} → rewritten at ${base}`);
        // Next's rewrite proxy is HTTP-only — tell the docs dev not to inject its
        // livereload websocket client (it would just retry against a dead upgrade)
        const spawnOptions = { ...options, env: { ...options.env, XYD_LIVERELOAD: "0" } };
        spawnDocsDev(cli.argv, absDocsRoot, state.port, base, spawnOptions, log);
    }
    return state.port;
}

async function buildAndMergeIntoPublic(
    root: string,
    absDocsRoot: string,
    base: string,
    options: ReturnType<typeof normalizeOptions>,
    log: ReturnType<typeof createLogger>
): Promise<void> {
    const publicDir = path.join(root, "public");
    fs.mkdirSync(publicDir, { recursive: true });

    // clean the PREVIOUS generation first — a rebuild would otherwise conflict
    // with its own stale output (changed pages = same path, different content)
    const manifestPath = path.join(publicDir, MANIFEST);
    if (fs.existsSync(manifestPath)) {
        try {
            const prev: { files: string[] } = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
            for (const rel of prev.files || []) {
                fs.rmSync(path.join(publicDir, rel), { force: true });
            }
            pruneEmptyDirs(publicDir);
        } catch {
            /* unreadable manifest — the merge's conflict detection still protects */
        }
    }

    const cli = resolveCli(options.command, root);
    log.info(`building docs (${cli.source}): ${cli.argv.join(" ")} build   [cwd ${absDocsRoot}]`);
    const startedAt = Date.now();
    await runDocsBuild(cli.argv, absDocsRoot, options, log);

    const before = snapshotFiles(publicDir);
    const docsClientDir = path.join(absDocsRoot, ".xyd", "build", "client");
    const summary = mergeDocsBuild(docsClientDir, publicDir, {
        base,
        sitemap: options.sitemap,
        robots: options.robots,
    });

    // manifest = everything that appeared during the merge
    const generated = snapshotFiles(publicDir).filter((f) => !before.includes(f) && f !== MANIFEST);
    fs.writeFileSync(manifestPath, JSON.stringify({ files: generated }, null, 2));

    const secs = ((Date.now() - startedAt) / 1000).toFixed(1);
    for (const note of summary.notes) log.info(note);
    log.info(
        `merged docs into public/ — mount ${summary.mount}, ${summary.pages} pages, ${summary.assets} assets` +
        (summary.skippedIdentical ? ` (+${summary.skippedIdentical} identical skipped)` : "") +
        `, ${secs}s`
    );
}

/** exported for tests */
export async function composeRewrites(userRewrites: any, ours: any[]): Promise<any> {
    const user = typeof userRewrites === "function" ? await userRewrites() : userRewrites;
    if (!user) {
        return { beforeFiles: [], afterFiles: ours, fallback: [] };
    }
    if (Array.isArray(user)) {
        // plain-array rewrites are afterFiles-equivalent in Next
        return { beforeFiles: [], afterFiles: [...user, ...ours], fallback: [] };
    }
    return { ...user, afterFiles: [...(user.afterFiles || []), ...ours] };
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

function snapshotFiles(dir: string): string[] {
    const out: string[] = [];
    const walk = (d: string) => {
        for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
            const abs = path.join(d, entry.name);
            if (entry.isDirectory()) walk(abs);
            else out.push(path.relative(dir, abs).split(path.sep).join("/"));
        }
    };
    if (fs.existsSync(dir)) walk(dir);
    return out;
}

function pruneEmptyDirs(dir: string): void {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (!entry.isDirectory()) continue;
        const abs = path.join(dir, entry.name);
        pruneEmptyDirs(abs);
        if (!fs.readdirSync(abs).length) fs.rmdirSync(abs);
    }
}
