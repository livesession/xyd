import * as path from 'node:path';
import * as fs from 'node:fs';
import * as os from 'node:os';
import { VFile } from 'vfile';

import { Metadata, Settings } from '@xyd-js/core';
import { sourcesToUniform, sourcesToUniformV2, type TypeDocReferenceContext } from '@xyd-js/sources/ts';
import { reactDocgenToUniform, uniformToReactUniform } from '@xyd-js/sources/react';
import { gqlSchemaToReferences } from "@xyd-js/gql"
import { oapSchemaToReferences, deferencedOpenAPI, uniformPluginXDocsSidebar } from "@xyd-js/openapi"

import { downloadContent, LineRange, parseImportPath, Region, resolvePathAlias } from './utils';
import uniform, { Reference, ReferenceContext } from '@xyd-js/uniform';
// TODO: rewrite to async

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
    const references = await processUniformFile(resolvedFilePath, regions, lineRanges, file, resolveFrom);

    if (!references) {
        return null
    }

    const plugins = globalThis.__xydUserUniformVitePlugins || []
    const matter = file.data?.matter as Metadata
    if (matter?.openapi) {
        plugins.push(uniformPluginXDocsSidebar)
    }

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
    resolveFrom?: string
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
                const schema = await deferencedOpenAPI(resolvedFilePath);
                const references = oapSchemaToReferences(schema, {
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