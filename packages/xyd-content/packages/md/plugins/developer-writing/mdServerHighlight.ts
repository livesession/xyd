import { visit } from "unist-util-visit";
import { highlight } from "codehike/code"

import { Settings } from "@xyd-js/core";

export function mdServerHighlight(settings?: Settings) { 
    return function () {
        return async (tree: any) => {
            console.time('plugin:mdServerHighlight');
            const promises: Promise<any>[] = []

            visit(tree, 'element', (node) => {
                if (node.tagName === 'pre') {
                    const code = node.children[0].children[0].value
                    const lang = node.children?.[0]?.properties?.className?.[0]?.replace("language-", "")
                    
                    // const regions = node.children?.[0]?.properties?.regions // TODO: in the future
                    const lineRanges = (node.children?.[0]?.properties?.lineRanges 
                        ? JSON.parse(node.children?.[0]?.properties?.lineRanges) 
                        : []) as {start?: number, end?: number}[]

                    const promise = (async () => {
                        const highlighted = await highlight({
                            value: code,
                            lang: lang,
                            meta: lang || "",
                        }, settings?.theme?.markdown?.syntaxHighlight || "github-dark")

                        if (lineRanges && lineRanges.length) {
                            highlighted.annotations = lineRanges.map((range) => ({
                                name: "mark",
                                query: "",
                                fromLineNumber: range.start || 0,
                                toLineNumber: range.end || 0,
                            }))
                        }

                        node.properties = {
                            ...node.properties,
                            highlighted: JSON.stringify(highlighted),
                        };
                    })()

                    promises.push(promise)
                }
            });

            await Promise.all(promises)
            console.timeEnd('plugin:mdServerHighlight');
        };
    }
}
