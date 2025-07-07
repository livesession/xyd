import { visit } from 'unist-util-visit';
import { VFile } from 'vfile';
import { unified } from 'unified';
import remarkParse from 'remark-parse';

import { Settings } from '@xyd-js/core';

import { FunctionName } from './types';
import { FunctionOptions, parseFunctionCall, downloadContent, resolvePathAlias } from './utils';
import { includeRemarkPlugins } from '..';

export function mdFunctionInclude(settings?: Settings) {
    return function (options: FunctionOptions = {}) {
        return async function transformer(tree: any, file: VFile) {
            // Collect promises for async operations
            const promises: Promise<void>[] = [];

            console.time('plugin:mdFunctionInclude');

            visit(tree, 'paragraph', (node: any) => {
                // Try to parse the function call
                const result = parseFunctionCall(node, FunctionName.Include);
                if (!result) return;

                const importPath = result[0];

                // Resolve path aliases if settings are provided
                const resolvedPath = resolvePathAlias(importPath, settings, process.cwd()) || importPath;

                // Create a promise for this node
                const promise = (async () => {
                    try {
                        // Get the file content
                        const content = await downloadContent(resolvedPath, file, options.resolveFrom);

                        // Use a minimal set of plugins to avoid circular dependencies
                        const processor = unified()
                            .use(remarkParse)
                            .use(includeRemarkPlugins(settings));

                        const processedContent = await processor.run(processor.parse(content));
                        const parsedContent = processedContent as any;

                        // Replace the paragraph with the parsed content
                        node.type = 'root';
                        node.children = parsedContent.children;
                        node.value = undefined;

                    } catch (error) {
                        console.error(`Error including file: ${resolvedPath}`, error);
                        // Keep the node as is if there's an error
                    }
                })();

                // Add the promise to our collection
                promises.push(promise);
            });

            // Wait for all promises to resolve
            await Promise.all(promises);
            console.timeEnd('plugin:mdFunctionInclude');
        };
    };
}
