import { XydError } from "./log";

export interface XydOptions {
    /** Path to the docs project (the dir containing docs.json / docs.ts), relative to the Vite root or absolute. Required. */
    docsRoot: string;
    /**
     * Mount path, e.g. "/docs". Passed into the docs build via XYD_BASENAME, so the
     * docs settings don't need to declare `advanced.basename` at all. When the docs
     * settings DO declare one, it wins — and must equal `base` (the basename is baked
     * into every prerendered link, so the plugin validates rather than remaps).
     */
    base?: string;
    /** Set to false to turn the plugin into a no-op (e.g. gate docs builds behind an env var). Default true. */
    enabled?: boolean;
    /**
     * Dev-mode integration: during `vite dev`, spawn `xyd dev` for the docs and
     * proxy the mount path (+ xyd's /_xyd and /_bun internals, incl. the
     * livereload websocket) into the SAME origin — app and docs on one URL/port.
     * The spawned dev defaults to xyd's bun engine (XYD_BUN=1; override via `env`)
     * whose URL surface is subpath-clean. Default true; false = build-only plugin.
     */
    dev?: boolean;
    /**
     * Full CLI argv WITHOUT the `build` subcommand, e.g. ["node", "/abs/path/to/cli.js"] or
     * ["bunx", "xyd-js@latest"]. A string is whitespace-split. Overrides auto-resolution.
     */
    command?: string | string[];
    /** Extra env for the docs build child process (merged over process.env). */
    env?: Record<string, string>;
    /**
     * NODE_OPTIONS for the child when neither process.env nor `env` provide one.
     * Docs builds are memory-heavy; default "--max-old-space-size=8192". `false` disables the default.
     */
    nodeOptions?: string | false;
    /** Policy for the docs build's root sitemap.xml. Default "skip" (its URLs currently lack the basename prefix). */
    sitemap?: "skip" | "copy";
    /** Policy for the docs build's root robots.txt. Default "skip". */
    robots?: "skip" | "copy";
    /** Kill the docs build after N ms and fail the build. Default 0 = no timeout. */
    timeoutMs?: number;
    /** Buffer the docs build output and replay the tail only on failure. Default false = stream live. */
    silent?: boolean;
    /** Plugin debug logging. */
    verbose?: boolean;
}

export interface ResolvedXydOptions {
    docsRoot: string;
    base?: string;
    enabled: boolean;
    dev: boolean;
    command?: string[];
    env: Record<string, string>;
    nodeOptions: string | false;
    sitemap: "skip" | "copy";
    robots: "skip" | "copy";
    timeoutMs: number;
    silent: boolean;
    verbose: boolean;
}

/** "/docs/" | "docs" -> "/docs"; undefined passes through. */
export function normalizeBase(base?: string): string | undefined {
    if (base === undefined) return undefined;
    const trimmed = String(base).trim().replace(/\/+$/, "");
    if (!trimmed || trimmed === "/") {
        throw new XydError(`\`base\` must be a non-root mount path like "/docs" (got ${JSON.stringify(base)})`);
    }
    return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

export function normalizeOptions(options: XydOptions): ResolvedXydOptions {
    if (!options || typeof options.docsRoot !== "string" || !options.docsRoot.trim()) {
        throw new XydError(`\`docsRoot\` is required — the path to your docs project (the dir containing docs.json)`);
    }
    return {
        docsRoot: options.docsRoot,
        base: normalizeBase(options.base),
        enabled: options.enabled !== false,
        dev: options.dev !== false,
        command: options.command === undefined
            ? undefined
            : Array.isArray(options.command) ? options.command : options.command.split(/\s+/).filter(Boolean),
        env: options.env || {},
        nodeOptions: options.nodeOptions === undefined ? "--max-old-space-size=8192" : options.nodeOptions,
        sitemap: options.sitemap || "skip",
        robots: options.robots || "skip",
        timeoutMs: options.timeoutMs || 0,
        silent: !!options.silent,
        verbose: !!options.verbose,
    };
}
