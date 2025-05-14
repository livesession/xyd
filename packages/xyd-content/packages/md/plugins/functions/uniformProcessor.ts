import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { VFile } from 'vfile';

import { Metadata, Settings } from '@xyd-js/core';
import { sourcesToUniform, type TypeDocReferenceContext } from '@xyd-js/sources/ts';
import { reactDocgenToUniform } from '@xyd-js/sources/react';
import { gqlSchemaToReferences } from "@xyd-js/gql"
import { oapSchemaToReferences, deferencedOpenAPI } from "@xyd-js/openapi"

import { downloadContent, LineRange, parseImportPath, Region, resolvePathAlias } from './utils';
import uniform from '@xyd-js/uniform';
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
): Promise<any[] | null> {
    // Parse the import path to extract file path
    const { filePath, regions, lineRanges } = parseImportPath(value);

    // Resolve path aliases and get the base directory
    let resolvedFilePath = resolvePathAlias(filePath, settings, process.cwd());

    if (resolvedFilePath.startsWith("~/")) {
        resolvedFilePath = path.join(process.cwd(), resolvedFilePath.slice(2));
    }

    // Process the uniform file
    const references = await processUniformFile(resolvedFilePath, regions, lineRanges, file, resolveFrom);

    if (!references) {
        return null
    }

    const plugins = globalThis.__xydUserUniformVitePlugins || []
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
        if (!isSupportedProgrammingSource(filePath)) {
            // TODO: openapi + graphql
            throw new Error(`Unsupported file type: ${filePath}`);
        }
        
        let ext = extension(filePath);

        const matter = file.data?.matter as Metadata
        if (matter?.openapi) {
            ext = "openapi"
        }

        if (isLocalPath(filePath)) {
            const baseDir = resolveFrom || (file.dirname || process.cwd());
            const resolvedFilePath = path.resolve(baseDir, filePath);

            switch (ext) {
                case 'ts': {
                    const packageDir = findClosestPackageJsonDir(
                        baseDir,
                        filePath,
                    );

                    if (packageDir) {
                        // Extract the relative file path from the package directory
                        const relativeFilePath = path.relative(packageDir, resolvedFilePath);
                        const absoluteFilePath = path.join(packageDir, relativeFilePath);

                        try {
                            // return []
                            // Process the content using sourcesToUniform
                            const references = await sourcesToUniform(
                                packageDir,
                                [packageDir]
                            ) || []

                            // TODO: in the future via xyd-source? some issues with 
                            return references.filter(ref => {
                                const ctx = ref?.context as TypeDocReferenceContext

                                return ctx?.fileFullPath === relativeFilePath
                            })
                        } finally {
                            // Clean up the temporary directory when done
                            // cleanupTempFolder(tempDir);
                        }
                    } else {
                        console.error("package.json not found", filePath)
                    }
                }

                case 'tsx': {
                    const code = fs.readFileSync(resolvedFilePath, 'utf8');
                    const references = reactDocgenToUniform(
                        code,
                        filePath
                    );

                    return references;
                }

                case 'graphql': {
                    const references = await gqlSchemaToReferences(resolvedFilePath, {
                        regions: regions.map(region => region.name)
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

        }

        throw new Error("current implementation does not support remote files")

        // For remote files, download the content
        const content = await downloadContent(
            filePath,
            file,
            resolveFrom,
        );

        // Fallback to creating temporary folder structure if no package.json found
        const tempDir = await createTempFolderStructure(content);

        try {
            // Get the path to the package directory
            const tempPackageDir = path.join(tempDir, 'packages', 'package');

            // Process the content using sourcesToUniform
            const references = await sourcesToUniform(
                tempDir,
                [tempPackageDir]
            );

            return references || null;
        } finally {
            // Clean up the temporary directory when done
            cleanupTempFolder(tempDir);
        }

    } catch (error) {
        console.error(`Error processing uniform file: ${filePath}`, error);
        return null;
    }
}


/**
 * Creates a temporary folder structure with package.json, tsconfig.json, and src/index.ts
 * @param content The content to be placed in src/index.ts
 * @returns The path to the temporary directory
 */
async function createTempFolderStructure(content: string): Promise<string> {
    // Create a temporary directory
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'xyd-uniform-'));

    // Create the package directory
    const packageDir = path.join(tempDir, 'packages', 'package');
    fs.mkdirSync(packageDir, { recursive: true });

    // Create the src directory
    const srcDir = path.join(packageDir, 'src');
    fs.mkdirSync(srcDir, { recursive: true });

    // Create package.json
    const packageJson = {
        "name": "@xyd-sources-examples/package-a",
        "main": "dist/index.js"
    };
    fs.writeFileSync(
        path.join(packageDir, 'package.json'),
        JSON.stringify(packageJson, null, 2)
    );

    // Create tsconfig.json
    const tsconfigJson = {
        "compilerOptions": {
            "outDir": "./dist"
        }
    };
    fs.writeFileSync(
        path.join(packageDir, 'tsconfig.json'),
        JSON.stringify(tsconfigJson, null, 2)
    );

    // Create src/index.ts with the provided content
    fs.writeFileSync(path.join(srcDir, 'index.ts'), content);

    return tempDir;
}

/**
 * Cleans up the temporary folder structure
 * @param tempDir The path to the temporary directory
 */
function cleanupTempFolder(tempDir: string): void {
    try {
        // Recursively delete the temporary directory
        fs.rmSync(tempDir, { recursive: true, force: true });
    } catch (error) {
        console.error(`Error cleaning up temporary directory: ${tempDir}`, error);
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

/**
 * Check if a path is a local file path (not a URL)
 * @param filePath The path to check
 * @returns True if the path is local
 */
function isLocalPath(filePath: string): boolean {
    return !filePath.startsWith('http://') && !filePath.startsWith('https://');
}
