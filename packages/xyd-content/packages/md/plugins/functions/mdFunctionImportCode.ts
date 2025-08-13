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
    resolvePathAlias,
    downloadContent
} from './utils';
import { injectCodeMeta } from '../utils/injectCodeMeta';
import path from 'node:path';

export function mdFunctionImportCode(settings?: Settings) {
    return function (options: FunctionOptions = {}) {
        return async function transformer(tree: any, file: VFile) {
            // Collect promises for async operations
            const promises: Promise<void>[] = [];

            console.time('plugin:mdFunctionImportCode');
            
            visit(tree, 'paragraph', (node: any) => {
                // Try to parse the function call
                const result = parseFunctionCall(node, FunctionName.ImportCode);
                if (!result) return;

                const importPath = result[0];
                const args = result[1];
                const mdAttrs = args?.__mdAttrs || {};

                // Parse the import path to extract file path, regions, and line ranges
                const { filePath, regions, lineRanges } = parseImportPath(
                    resolvePathAlias(importPath, settings, file) || importPath
                );

                // Create a promise for this node
                const promise = (async () => {
                    try {
                        // Get the file content using the improved downloadContent function
                        const content = await downloadContent(filePath, file, options.resolveFrom);

                        // Process the content based on regions and line ranges
                        let processedContent = processContent(content, regions, lineRanges);

                        // Detect language from file extension
                        const language = detectLanguage(filePath);

                        // Replace the paragraph with a code block
                        node.type = 'code';
                        node.lang = language;
                        node.value = processedContent;
                        node.children = undefined;

                        // Inject code meta and props
                        const attrsString = args?.__mdAttrs ? Object.entries(args.__mdAttrs).map(([k,v]) => `${k}="${v}"`).join(' ') : undefined;
                        const metaString = attrsString ? `[${attrsString}]` : undefined;
                        injectCodeMeta(node, metaString);
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
            console.timeEnd('plugin:mdFunctionImportCode');
        };
    }
}
