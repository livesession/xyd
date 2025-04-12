import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';

import {visit} from 'unist-util-visit';
import {VFile} from 'vfile';

import {FunctionName} from "./types";
import {
    FunctionOptions,
    parseFunctionCall,
} from './utils';

// Import the processUniformFunctionCall function
import { processUniformFunctionCall } from './uniformProcessor';

export function mdFunctionUniform(options: FunctionOptions = {}) {
    return async function transformer(tree: any, file: VFile) {
        // Collect promises for async operations
        const promises: Promise<void>[] = [];

        visit(tree, 'paragraph', (node: any) => {
            // Try to parse the function call
            const result = parseFunctionCall(node, FunctionName.Uniform);
            if (!result) return;

            const importPath = result[1];

            // Create a promise for this node
            const promise = (async () => {
                try {
                    // Process the uniform function call
                    const references = await processUniformFunctionCall(
                        importPath,
                        file,
                        options.resolveFrom
                    );
                    
                    if (references) {
                        node.type = 'code';
                        node.lang = 'json';
                        node.value = JSON.stringify(references, null, 2);
                        node.children = undefined;
                    }
                } catch (error) {
                    console.error(`Error processing uniform function call: ${importPath}`, error);
                    // Keep the node as is if there's an error
                }
            })();

            // Add the promise to our collection
            promises.push(promise);
        });

        // Wait for all promises to resolve
        await Promise.all(promises);
    };
}

/**
 * Creates a temporary folder structure with package.json, tsconfig.json, and src/index.ts
 * @param content The content to be placed in src/index.ts
 * @returns The path to the temporary directory
 */
export async function createTempFolderStructure(content: string): Promise<string> {
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
export function cleanupTempFolder(tempDir: string): void {
    try {
        // Recursively delete the temporary directory
        fs.rmSync(tempDir, { recursive: true, force: true });
    } catch (error) {
        console.error(`Error cleaning up temporary directory: ${tempDir}`, error);
    }
}

const programmingExtensions: Record<string, boolean> = {
    'ts': true,
    'js': true,
    'jsx': true,
    'tsx': true,

    // TODO
    // 'py': true,
    // 'go': true,
    // TODO: AND OTHER PROGRAMMING LANGUAGES IN THE FUTEURE

}

export function isProgrammingSource(filePath: string) {
    const extension = path.extname(filePath).toLowerCase().replace('.', '');

    if (programmingExtensions[extension]) {
        return true;
    }

    return false;
}