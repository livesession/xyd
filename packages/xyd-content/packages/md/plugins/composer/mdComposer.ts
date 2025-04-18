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
        const promises: Promise<any>[] = []
        const varQueue: Record<string, any> = {}

        // The current queue can contain either HighlightedCode objects or arrays
        let currentQueue: (HighlightedCode | any[])[] = []
        let currentVarName: string = ""

        visit(tree, "outputVars", (node: any) => {
            currentVarName = node.name
            varQueue[currentVarName] = []
            currentQueue = varQueue[currentVarName]

            throughNodes(node)
        })

        visit(tree, 'containerDirective', (node: any) => {
            // TODO: in the future more generic? (code-group name), maybe like node.codeGroup = true?
            if (node.name !== "code-group") {
                return
            }

            console.log(58585585, node)

            const group = [node.attributes.title]
            currentQueue.push(group)

            for (const child of node.children) {
                if (child.type !== 'code') {
                    continue
                }

                highlightCode(child, group)
            }
        });

        async function highlightCode(node: any, group?: any[]) {
            const highlighted = await highlight({
                value: node.value,
                lang: node.lang,
                meta: node.meta,
            }, settings?.theme?.markdown?.syntaxHighlight || "github-dark")

            if (group) {
                // Add the highlighted code to the current group
                group.push(highlighted)

                return
            }

            // Add the highlighted code directly to the queue
            currentQueue.push(highlighted)
        }

        function nodeCode(node: any) {
            promises.push(highlightCode(node))
        }

        function nodeList(node: any) {
            for (const item of node.children) {
                if (item.type != "listItem") {
                    continue
                }

                throughNodes(item)
            }
        }

        function throughNodes(node: any) {
            for (const child of node.children) {
                switch (child.type) {
                    case "code": {
                        nodeCode(child)
                        break
                    }
                    case "list": {
                        nodeList(child)
                        break
                    }
                }
            }
        }

        await Promise.all(promises)

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
