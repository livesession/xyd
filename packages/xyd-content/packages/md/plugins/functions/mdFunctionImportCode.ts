import { visit } from 'unist-util-visit';
import { VFile } from 'vfile';

import { Settings } from '@xyd-js/core';

import { FunctionName } from "./types";
import {
    FunctionOptions,
    parseFunctionCall,
    parseImportPath,
    processContent,
    detectLanguage,
    readLocalFile,
    fetchFileContent,
    resolvePathAlias
} from './utils';

export function mdFunctionImportCode(settings?: Settings) {
    return function (options: FunctionOptions = {}) {
        return async function transformer(tree: any, file: VFile) {
            // Collect promises for async operations
            const promises: Promise<void>[] = [];

            visit(tree, 'paragraph', (node: any) => {
                // Try to parse the function call
                const result = parseFunctionCall(node, FunctionName.ImportCode);
                if (!result) return;

                const importPath = result[1];

                // Parse the import path to extract file path, regions, and line ranges
                const { filePath, regions, lineRanges } = parseImportPath(
                    resolvePathAlias(importPath, settings, process.cwd()) || importPath
                );

                // Determine if this is a local or external file
                const isExternal = filePath.startsWith('http://') || filePath.startsWith('https://');

                // Create a promise for this node
                const promise = (async () => {
                    try {
                        // Get the file content
                        let content: string;

                        if (isExternal) {
                            // Fetch external content
                            content = await fetchFileContent(filePath);
                        } else {
                            const baseDir = options.resolveFrom || (file.dirname || process.cwd());
                            content = readLocalFile(filePath, baseDir);
                        }

                        // Process the content based on regions and line ranges
                        let processedContent = processContent(content, regions, lineRanges);

                        // Detect language from file extension
                        const language = detectLanguage(filePath);

                        // Replace the paragraph with a code block
                        node.type = 'code';
                        node.lang = language;
                        node.value = processedContent;
                        node.children = undefined;

                    } catch (error) {
                        console.error(`Error importing file: ${filePath}`, error);
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
}

