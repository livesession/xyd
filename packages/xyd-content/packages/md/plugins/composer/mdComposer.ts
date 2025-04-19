import { Plugin } from "unified";
import { visit } from "unist-util-visit";
import { Node as UnistNode } from "unist";
import { highlight } from "codehike/code";
import type { HighlightedCode, Token } from "codehike/code";

import { Settings } from "@xyd-js/core";

import { SymbolxVfile } from "../types";

type Whitespace = string;

// Define types for our examples structure
export interface ExampleCode {
    language: string;
    title?: string;
    tokens: (Token | Whitespace)[];
}

// TODO: ISSUES IF MULTIPLE OUTPUT VARS - PROBLEMS WITH ASYNC + currentQueue/currentVarName
// Main plugin function
export function mdComposer(settings?: Settings): Plugin {
    return () => async (tree: UnistNode, file: SymbolxVfile<any>) => {
        const varQueue: Record<string, any> = {}

        // Create a context object to store the current state for each variable
        const contexts: Record<string, {
            queue: (HighlightedCode | any[])[];
            promises: Promise<any>[];
        }> = {}

        visit(tree, "outputVars", (node: any) => {
            const varName = node.name
            varQueue[varName] = []
            contexts[varName] = {
                queue: varQueue[varName],
                promises: []
            }

            throughNodes(node, contexts[varName])
        })

        visit(tree, 'containerDirective', (node: any) => {
            if (node.name !== "code-group") {
                return
            }

            // Find the most recently created context
            const lastVarName = Object.keys(contexts).pop()
            if (!lastVarName) return

            const context = contexts[lastVarName]
            const group = [node.attributes.title]
            context.queue.push(group)

            if (node.data?.hName === "DirectiveCodeGroup") {
                const codeblocksJSON = node.data.hProperties.codeblocks

                if (codeblocksJSON) {
                    const codeblocks = JSON.parse(codeblocksJSON)

                    if (!codeblocks || !codeblocks.length) {
                        return
                    }

                    for (const codeblock of codeblocks) {
                        group.push(codeblock)
                    }
                }

                return
            }

            for (const child of node.children) {
                if (child.type !== 'code') {
                    continue
                }

                highlightCode(child, group, context)
            }
        });

        async function highlightCode(node: any, group?: any[], context?: typeof contexts[string]) {
            const highlighted = await highlight({
                value: node.value,
                lang: node.lang,
                meta: node.meta,
            }, settings?.theme?.markdown?.syntaxHighlight || "github-dark")

            if (group && context) {
                group.push(highlighted)
                return
            }

            if (context) {
                context.queue.push(highlighted)
            }
        }

        function nodeCode(node: any, context: typeof contexts[string]) {
            context.promises.push(highlightCode(node, undefined, context))
        }

        function nodeList(node: any, context: typeof contexts[string]) {
            for (const item of node.children) {
                if (item.type != "listItem") {
                    continue
                }

                throughNodes(item, context)
            }
        }

        function throughNodes(node: any, context: typeof contexts[string]) {
            for (const child of node.children) {
                switch (child.type) {
                    case "code": {
                        nodeCode(child, context)
                        break
                    }
                    case "list": {
                        nodeList(child, context)
                        break
                    }
                }
            }
        }

        // Wait for all promises from all contexts to resolve
        await Promise.all(Object.values(contexts).flatMap(ctx => ctx.promises))

        // Process the results to create the final output structure
        const outputVars = {}

        for (const [varName, value] of Object.entries(varQueue)) {
            outputVars[varName] = value
        }

        file.data.outputVars = {
            ...(file.data.outputVars || {}),
            ...outputVars
        }
    };
}
