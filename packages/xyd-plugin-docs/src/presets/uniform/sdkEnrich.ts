import fs from "fs";

import { resolveApiSdkConfig, type Settings } from "@xyd-js/core";
import type { Reference } from "@xyd-js/uniform";

// ---------------------------------------------------------------------------
// SDK-native docs enrichment hook — two modes, checked in this order:
//
// 1. **x-sdk (spec mode)** — the OpenAPI document itself carries the SDK
//    artifacts as `x-sdk` extensions (embedded upstream in CI/CD via
//    `opensdk xsdk` / `embedXSdk`). Auto-detected from the spec, like
//    `x-docs` — no docs.json opt-in. A `sdk: { languages }` config, when
//    present, only NARROWS the spec's language list.
// 2. **generate mode** (`api.openapi[..].sdk`) — xyd runs the OpenSDK
//    emitters itself at build time.
//
// References for an openapi source are produced at TWO sites — the uniform
// preset at boot (sidebar/navigation) and `processUniformFunctionCall` at
// every page compile (the render path, in @xyd-js/content) — on BOTH engines,
// including bun prerender WORKERS (which skip pluginDocs entirely). Both
// sites call this hook through `globalThis.__xydUniformSdkEnrich`, installed
// by documan's appInit, so xyd-content never depends on the (heavy) opensdk
// packages: @xyd-js/opensdk-uniform loads through a LAZY dynamic import, only
// when a source enables sdk config or its spec text mentions `x-sdk`.
//
// Caches are keyed by path:mtime (URL verbatim) so spec edits invalidate
// within a session. Everything is best-effort: any failure leaves the plain
// REST reference untouched.
// ---------------------------------------------------------------------------

declare global {
    // eslint-disable-next-line no-var
    var __xydUniformSdkEnrich:
        | ((references: Reference[], sourcePath: string) => Promise<void>)
        | undefined;
}

const isUrl = (s: string) => s.startsWith("http://") || s.startsWith("https://");

function cacheKey(sourcePath: string): string {
    if (isUrl(sourcePath)) {
        return sourcePath;
    }
    try {
        return `${sourcePath}:${fs.statSync(sourcePath).mtimeMs}`;
    } catch {
        return sourcePath;
    }
}

/** x-sdk spec-mode state for one source: the raw parsed doc + its root
 * language list, or null when the spec carries no `x-sdk`. */
type XSdkInfo = { doc: unknown; languages: string[] } | null;

const xsdkInfoCache = new Map<string, Promise<XSdkInfo>>();
// key → prepared-IR promise (generate mode).
const preparedCache = new Map<string, Promise<unknown | null>>();

function cached<T>(cache: Map<string, Promise<T>>, key: string, make: () => Promise<T>): Promise<T> {
    let p = cache.get(key);
    if (!p) {
        p = make();
        cache.set(key, p);
        p.catch(() => cache.delete(key));
    }
    return p;
}

/** Detect + load a source's `x-sdk`. A cheap text sniff (no yaml parse, no
 * opensdk import) rejects the common no-x-sdk local spec first. */
function xsdkInfo(sourcePath: string): Promise<XSdkInfo> {
    return cached(xsdkInfoCache, cacheKey(sourcePath), async () => {
        if (!isUrl(sourcePath)) {
            try {
                if (!fs.readFileSync(sourcePath, "utf-8").includes("x-sdk")) return null;
            } catch {
                return null;
            }
        }
        const mod = await import("@xyd-js/opensdk-uniform");
        const doc = await mod.loadSpecSource(sourcePath);
        const xsdk = doc ? mod.getXSdk(doc) : null;
        return xsdk ? { doc, languages: xsdk.languages } : null;
    });
}

/**
 * The SDK language ids a source's docs render with, or null when the source
 * has no SDK docs at all — the preset uses this to skip the fused native path
 * per-file and to stamp `sdkLanguages` into every generated page's
 * frontmatter (the client layouts read it back; they cannot read the spec).
 */
export async function sourceSdkLanguages(settings: Settings, absSource: string): Promise<string[] | null> {
    try {
        const cfg = resolveApiSdkConfig(settings?.api?.openapi, absSource);
        const xsdk = await xsdkInfo(absSource);
        if (xsdk) {
            const langs = cfg?.languages
                ? xsdk.languages.filter((l) => (cfg.languages as string[]).includes(l))
                : xsdk.languages;
            return langs.length ? langs : null;
        }
        return cfg ? cfg.languages : null;
    } catch {
        return null;
    }
}

/**
 * Install (or clear) the global SDK enrichment hook for the loaded settings.
 * Called from documan's appInit — BEFORE the prerender-worker early-return,
 * so parallel static builds enrich identically to the main thread. Installed
 * whenever openapi sources exist: x-sdk detection is spec-driven.
 */
export function setupUniformSdkEnrichment(settings: Settings): void {
    if (!settings?.api?.openapi) {
        delete globalThis.__xydUniformSdkEnrich;
        return;
    }

    const verbose = !!process.env.XYD_VERBOSE;

    globalThis.__xydUniformSdkEnrich = async (references, sourcePath) => {
        try {
            const cfg = resolveApiSdkConfig(settings.api?.openapi, sourcePath);

            // Spec mode first: pipeline-authored x-sdk wins over generation.
            const xsdk = await xsdkInfo(sourcePath);
            if (xsdk) {
                const mod = await import("@xyd-js/opensdk-uniform");
                mod.attachSdkFromSpec(references as any, xsdk.doc as any, {
                    keepRest: true,
                    langs: cfg?.languages,
                });
                if (verbose) console.log(`[sdk] enriched ${references.length} reference(s) from x-sdk in ${sourcePath}`);
                return;
            }

            if (!cfg) {
                if (verbose) console.log(`[sdk] no sdk config/x-sdk match for ${sourcePath}`);
                return;
            }

            const mod = await import("@xyd-js/opensdk-uniform");
            const sdk = await cached(preparedCache, cacheKey(sourcePath), () => mod.prepareSdkFromSource(sourcePath));
            if (!sdk) {
                if (verbose) console.log(`[sdk] prepare failed (unsupported/mid-edit spec): ${sourcePath}`);
                return;
            }

            mod.attachSdk(references as any, sdk as any, {
                keepRest: true,
                langs: cfg.languages,
            });
            if (verbose) console.log(`[sdk] enriched ${references.length} reference(s) from ${sourcePath}`);
        } catch (err) {
            // best-effort — the plain REST reference renders untouched
            if (verbose) console.warn(`[sdk] enrichment failed for ${sourcePath}:`, err);
        }
    };
}
