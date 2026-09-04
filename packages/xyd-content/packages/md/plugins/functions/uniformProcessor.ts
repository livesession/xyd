import * as path from 'node:path';
import * as fs from 'node:fs';
import * as os from 'node:os';
import { VFile } from 'vfile';

import { Metadata, Settings } from '@xyd-js/core';
import { sourcesToUniform, sourcesToUniformV2, type TypeDocReferenceContext } from '@xyd-js/sources/ts';
import { reactDocgenToUniform, uniformToReactUniform } from '@xyd-js/sources/react';
import { gqlSchemaToReferences } from "@xyd-js/gql"
import { oapSchemaToReferences, deferencedOpenAPI, uniformPluginXDocsSidebar } from "@xyd-js/openapi"
import { loadOpencliSpec, opencliToReferences } from "@xyd-js/opencli"

import { downloadContent, LineRange, parseImportPath, Region, resolvePathAlias } from './utils';
import { tsxToReactUniform } from './tsxExtractor';
import uniform, { Reference, ReferenceContext } from '@xyd-js/uniform';
// TODO: rewrite to async

// --- OpenAPI dereference cache -------------------------------------------------
// A spec that fans out into N endpoint pages was previously re-read +
// $ref-dereferenced ONCE PER PAGE (deferencedOpenAPI has no cache), making
// `xyd build <spec>` super-linear in the number of endpoints. Memoize the
// dereferenced document so it is produced exactly once per spec per build.
//
// Key: resolved path + mtime for local files (a dev-mode spec edit bumps mtime →
// cache miss → re-deref; a one-shot build sees a constant mtime → one deref), or
// the URL for remote specs (which were re-fetched per page before).
//
// Byte-identity: the cached document is SHARED and mutable. oapSchemaToReferences
// unions path-level `servers` into the top-level `schema.servers` in place, and
// each endpoint's ctx.servers is derived from it — so a shared schema would
// accumulate servers across pages. We capture the pristine top-level `servers` at
// deref time and reset it before every per-page conversion, reproducing
// fresh-deref semantics exactly.
const _openapiSchemaCache = new Map<string, Promise<{ schema: any; pristineServers: any }>>();

function _specCacheKey(resolvedFilePath: string): string {
    if (isRemotePath(resolvedFilePath)) return resolvedFilePath;
    try {
        return `${resolvedFilePath}:${fs.statSync(resolvedFilePath).mtimeMs}`;
    } catch {
        return resolvedFilePath;
    }
}

function cachedDeferencedOpenAPI(
    resolvedFilePath: string,
): Promise<{ schema: any; pristineServers: any }> {
    const key = _specCacheKey(resolvedFilePath);
    let entry = _openapiSchemaCache.get(key);
    if (!entry) {
        entry = deferencedOpenAPI(resolvedFilePath).then((schema: any) => ({
            schema,
            pristineServers: Array.isArray(schema?.servers)
                ? schema.servers.slice()
                : schema?.servers,
        }));
        // Don't cache a rejected deref — let a transient failure be retried.
        entry.catch(() => {
            if (_openapiSchemaCache.get(key) === entry) _openapiSchemaCache.delete(key);
        });
        _openapiSchemaCache.set(key, entry);
    }
    return entry;
}

/**
 * Process a uniform function call and return the references
 * 
 * @param settings The settings object
 * @param value The value containing the uniform function call
 * @param file The VFile object
 * @param resolveFrom Optional base directory to resolve relative paths from
 * @returns A promise that resolves to the references or null if processing failed
 */
export async function processUniformFunctionCall(
    value: string,
    file: VFile,
    resolveFrom?: string,
    settings?: Settings,
): Promise<Reference[] | null> {
    // Parse the import path to extract file path
    const { filePath, regions, lineRanges } = parseImportPath(value);

    // Resolve path aliases and get the base directory
    let resolvedFilePath = resolvePathAlias(filePath, settings, file);

    if (resolvedFilePath.startsWith("~/")) {
        resolvedFilePath = path.join(process.cwd(), resolvedFilePath.slice(2));
    }

    // Process the uniform file
    const references = await processUniformFile(resolvedFilePath, regions, lineRanges, file, resolveFrom, settings);

    if (!references) {
        return null
    }

    // Build a LOCAL plugin list — never mutate the shared global array.
    // Previously `plugins.push(...)` grew globalThis.__xydUserUniformVitePlugins by
    // one on every OpenAPI page, so page K applied the sidebar plugin ~K times
    // (O(N²) over the build, unbounded array growth). The sidebar plugin is
    // idempotent and its `defer` no-ops when regions are present, so applying it
    // once is byte-identical to applying it K times — and this keeps the global
    // clean for parallel worker heaps.
    const userPlugins = globalThis.__xydUserUniformVitePlugins || []
    const matter = file.data?.matter as Metadata
    const plugins = matter?.openapi
        ? [...userPlugins, uniformPluginXDocsSidebar]
        : [...userPlugins]

    const uniformRefs = uniform(references, {
        plugins: [
            ...plugins,
        ]
    })

    return uniformRefs.references
}

async function processUniformFile(
    filePath: string,
    regions: Region[],
    lineRanges: LineRange[],
    file: VFile,
    resolveFrom?: string,
    settings?: Settings,
): Promise<any[] | null> {
    try {
        const isRemote = isRemotePath(filePath)
        if (!isRemote && !isSupportedProgrammingSource(filePath)) {
            // TODO: openapi + graphql
            throw new Error(`Unsupported file type: ${filePath}`);
        }

        let ext = extension(filePath);

        const matter = file.data?.matter as Metadata
        if (matter?.openapi) {
            ext = "openapi"
        }
        if (matter?.graphql) {
            ext = "graphql"
        }
        if (matter?.mcp) {
            ext = "mcp"
        }
        if (matter?.cli) {
            ext = "cli"
        }


        const baseDir = resolveFrom || (file.dirname || process.cwd());
        let resolvedFilePath = path.resolve(baseDir, filePath);

        if (isRemote) {
            // TODO: cache
            resolvedFilePath = filePath
        }

        switch (ext) {
            case 'ts':
            case 'tsx': {
                const packageDir = findClosestPackageJsonDir(
                    baseDir,
                    filePath,
                );

                if (packageDir) {
                    // Extract the relative file path from the package directory
                    const relativeFilePath = path.relative(packageDir, resolvedFilePath);

                    try {
                        let references: Reference[] = []

                        switch (ext) {
                            case 'ts': {
                                const typedocRefs = await sourcesToUniformV2(
                                    packageDir,
                                    [relativeFilePath]
                                )

                                if (!typedocRefs || !typedocRefs.references) {
                                    console.error("Failed to process uniform file", filePath)
                                    break
                                }

                                references = typedocRefs.references.filter(ref => {
                                    const ctx = ref?.context as TypeDocReferenceContext

                                    const pathMatch = ctx?.fileFullPath === relativeFilePath


                                    if (regions.length > 0) {
                                        const regionMatch = regions.some(region => {
                                            return region.name === ctx?.symbolName // TODO: BETTER REGION API FOR TYPEDOC
                                        })

                                        return pathMatch && regionMatch
                                    }

                                    return pathMatch
                                })

                                break
                            }

                            case 'tsx': {
                                // In the self-contained binary, @xyd-js/sources /
                                // TypeDoc is stubbed (TypeDoc hangs in bunfs), so use
                                // the raw-`typescript` extractor instead — it renders
                                // the same Atlas Props reference without TypeDoc.
                                if ((globalThis as any).__xydCompiledBinary) {
                                    references = await tsxToReactUniform(resolvedFilePath, { regions })
                                    break
                                }

                                const resp = await sourcesToUniformV2(
                                    packageDir,
                                    [relativeFilePath]
                                )

                                if (!resp || !resp.references || !resp.projectJson) {
                                    console.error("Failed to process uniform file", filePath)
                                    return null
                                }
                                const typedocRefs = resp.references as Reference<TypeDocReferenceContext>[]

                                references = uniformToReactUniform(typedocRefs, resp.projectJson)

                                break
                            }
                        }

                        return references
                    } finally {
                    }
                } else {
                    console.error("package.json not found", filePath)
                }
            }

            case 'graphql': {
                const references = await gqlSchemaToReferences(resolvedFilePath, {
                    regions: regions.map(region => region.name),
                });

                return references;
            }

            case 'openapi': {
                const { schema, pristineServers } = await cachedDeferencedOpenAPI(resolvedFilePath);
                // Reset to the pristine top-level servers before each per-page
                // conversion — oapSchemaToReferences mutates schema.servers in
                // place, and the schema is now shared across pages (see cache note).
                if (schema) {
                    schema.servers = Array.isArray(pristineServers)
                        ? pristineServers.slice()
                        : pristineServers;
                }
                const references = oapSchemaToReferences(schema, {
                    regions: regions.map(region => region.name)
                });

                // SDK-native docs: the enrichment hook (installed by documan's
                // appInit when an openapi source enables `sdk`) attaches
                // per-language SDK types/signatures/usage samples, keeping the
                // REST view as the raw-HTTP flavor. Consumed via globalThis so
                // xyd-content never depends on the opensdk packages.
                const sdkEnrich = (globalThis as any).__xydUniformSdkEnrich;
                if (sdkEnrich) {
                    try {
                        await sdkEnrich(references, resolvedFilePath);
                    } catch { /* best-effort — REST view untouched */ }
                }

                return references;
            }

            case 'mcp': {
                // Lazy import — keeps the build-time MCP HTTP client out of the
                // hot path for projects that don't use it.
                const { mcpUrlToReferences } = await import('@xyd-js/mcp-uniform');
                // Look up auth info from settings.api.mcp so the composer's
                // re-fetch matches what the preset's initial fetch used. Without
                // this, authenticated MCP servers return 401 here, the page
                // gets empty references, and the h1 / Atlas tree never render.
                const info = findMcpAuthForSource(settings, resolvedFilePath);
                const references = await mcpUrlToReferences(resolvedFilePath, {
                    token: info?.token,
                    headers: info?.headers,
                });
                if (regions.length === 0) return references;
                // mcpPreset writes meta.mcp regions as `tool:<name>` / `resource:<uri>`
                // (see uniformResolver). The context fields they map to are bare
                // `toolName` / `resourceUri`, so strip the prefix before matching.
                const wanted = new Set(
                    regions
                        .map(r => r.name)
                        .map(name => name.replace(/^(tool|resource):/, ""))
                );
                return references.filter(ref => {
                    const ctx = ref?.context as { toolName?: string; resourceUri?: string } | undefined;
                    return (ctx?.toolName && wanted.has(ctx.toolName))
                        || (ctx?.resourceUri && wanted.has(ctx.resourceUri));
                });
            }

            case 'cli': {
                const spec = await loadOpencliSpec(resolvedFilePath);
                const references = opencliToReferences(spec, {
                    regions: regions.map(region => region.name)
                });

                return references;
            }

            default: {
                throw new Error(`Unsupported file extension: ${ext}`);
            }
        }



    } catch (error) {
        console.error(`Error processing uniform file: ${filePath}`, error);
        return null;
    }
}


const supportedProgrammingExtensions: Record<string, boolean> = {
    'ts': true,
    'tsx': true,
    'graphql': true,
    'yaml': true,
    'yml': true,
    'json': true,

    // TODO
    // 'py': true,
    // 'go': true,
    // TODO: AND OTHER PROGRAMMING LANGUAGES IN THE FUTEURE
}

/**
 * Check if a file is a programming source file based on its extension
 * @param filePath The path to the file
 * @returns True if the file is a programming source file
 */
function isSupportedProgrammingSource(filePath: string) {
    const ext = extension(filePath);

    if (supportedProgrammingExtensions[ext]) {
        return true;
    }

    return false;
}

function extension(filePath: string) {
    return path.extname(filePath).toLowerCase().replace('.', '');
}

/**
 * Find the closest package.json directory for a given file path
 * @param baseDir The base directory to start searching from (used as cwd for resolving relative paths)
 * @param filePath The path to the file (can be relative)
 * @returns The path to the directory containing package.json, or null if not found
 */
function findClosestPackageJsonDir(
    baseDir: string,
    filePath: string
): string | null {
    // Resolve the filePath relative to baseDir
    const resolvedFilePath = path.resolve(baseDir, filePath);
    let currentDir = path.dirname(resolvedFilePath);
    const root = path.parse(currentDir).root;

    while (currentDir !== root) {
        try {
            const files = fs.readdirSync(currentDir);
            if (files.includes('package.json')) {
                return currentDir;
            }
        } catch (error) {
            // If we can't read the directory, move up
            console.warn(`Cannot read directory ${currentDir}:`, error);
        }
        currentDir = path.dirname(currentDir);
    }

    return null;
}


function isRemotePath(filePath: string): boolean {
    return filePath.startsWith('http://') || filePath.startsWith('https://');
}

/**
 * Mirrors `findInfoForSource` in @xyd-js/plugin-docs's mcpPreset. The composer
 * re-fetches MCP refs per virtual page (one HTTP roundtrip per page) — for
 * authenticated servers it has to pass the same bearer/headers the preset's
 * initial fetch used.
 */
function findMcpAuthForSource(
    settings: Settings | undefined,
    source: string,
): { token?: string; headers?: Record<string, string> } | undefined {
    const mcp = settings?.api?.mcp;
    if (!mcp || typeof mcp === 'string') return undefined;
    if (Array.isArray(mcp)) {
        return mcp.find(m => typeof m !== 'string' && m.source === source)?.info;
    }
    if ('source' in mcp) {
        return (mcp as any).source === source ? (mcp as any).info : undefined;
    }
    for (const key of Object.keys(mcp)) {
        const entry = (mcp as any)[key];
        if (typeof entry !== 'string' && entry?.source === source) return entry.info;
    }
    return undefined;
}