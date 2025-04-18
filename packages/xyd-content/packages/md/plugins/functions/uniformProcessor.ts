import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { VFile } from 'vfile';

import { Settings } from '@xyd-js/core';
import { sourcesToUniform, type TypeDocReferenceContext } from '@xyd-js/sources/ts';
import { reactDocgenToUniform } from '@xyd-js/sources/react';

import { downloadContent, parseImportPath, resolvePathAlias } from './utils';
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
    const { filePath } = parseImportPath(value);

    // Resolve path aliases and get the base directory
    const resolvedFilePath = resolvePathAlias(filePath, settings, process.cwd());

    // Process the uniform file
    return processUniformFile(resolvedFilePath, file, resolveFrom);
}

/**
 * Process a uniform file and return the references
 * This is a common function used by both mdFunctionUniform and mdComponentDirective
 * 
 * @param settings The settings object
 * @param filePath The path to the file to process
 * @param file The VFile object
 * @param resolveFrom Optional base directory to resolve relative paths from
 * @returns A promise that resolves to the references or null if processing failed
 */
async function processUniformFile(
    filePath: string,
    file: VFile,
    resolveFrom?: string
): Promise<any[] | null> {
    try {
        if (!isProgrammingSource(filePath)) {
            // TODO: openapi + graphql
            throw new Error(`Unsupported file type: ${filePath}`);
        }

        if (isLocalPath(filePath)) {
            const ext = extension(filePath);
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

const programmingExtensions: Record<string, boolean> = {
    'ts': true,
    'tsx': true,

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
function isProgrammingSource(filePath: string) {
    const ext = extension(filePath);

    if (programmingExtensions[ext]) {
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
