import { visit } from "unist-util-visit";
import { highlight } from "codehike/code"

import { Settings } from "@xyd-js/core";

export function mdServerHighlight(settings?: Settings) { 
    return function () {
        return async (tree: any) => {
            const promises: Promise<any>[] = []

            visit(tree, 'element', (node) => {
                if (node.tagName === 'pre') {
                    const code = node.children[0].children[0].value
                    const lang = node.children?.[0]?.properties?.className?.[0]?.replace("language-", "")

                    const promise = (async () => {
                        const highlighted = await highlight({
                            value: code,
                            lang: lang,
                            meta: lang || ""
                        }, settings?.theme?.markdown?.syntaxHighlight || "github-dark")

                        node.properties = {
                            ...node.properties,
                            highlighted: JSON.stringify(highlighted), // TODO: HOW TO PASS REAL OBJECT?
                        };
                    })()

                    promises.push(promise)
                }
            });

            await Promise.all(promises)
        };
    }
}
