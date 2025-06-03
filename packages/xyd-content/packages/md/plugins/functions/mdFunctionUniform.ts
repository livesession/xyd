import { visit } from 'unist-util-visit';
import { VFile } from 'vfile';

import { Settings } from '@xyd-js/core'
import uniform, { pluginJsonView } from "@xyd-js/uniform"

import { FunctionName } from "./types";
import {
    FunctionOptions,
    parseFunctionCall,
} from './utils';

// Import the processUniformFunctionCall function
import { processUniformFunctionCall } from './uniformProcessor';

export function mdFunctionUniform(settings?: Settings) {
    return function (options: FunctionOptions = {}) {
        return async function transformer(tree: any, file: VFile) {
            // Collect promises for async operations
            const promises: Promise<void>[] = [];

            console.time('plugin:mdFunctionUniform');
            
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
                            options.resolveFrom,
                            settings,
                        );

                        if (references) {
                            node.type = 'code';
                            node.lang = 'json';
                            const jsonViewRefs = uniform(references, {
                                plugins: [pluginJsonView()]
                            })

                            // TODO: support multiple json views
                            node.value = jsonViewRefs.out.jsonViews[0]
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
            console.timeEnd('plugin:mdFunctionUniform');
        };
    }

}


