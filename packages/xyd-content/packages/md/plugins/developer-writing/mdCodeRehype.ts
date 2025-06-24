import { visit } from "unist-util-visit";
import { highlight } from "codehike/code"

import { Settings } from "@xyd-js/core";
import { ContentFS } from "../../../../src";
import { defaultRemarkPlugins } from "..";

export function mdCodeRehype(settings?: Settings) {
    const maxTocDepth = settings?.theme?.maxTocDepth || 2
    const remarkPlugins = [...defaultRemarkPlugins({
        maxDepth: maxTocDepth,
    }, settings)]

    const contentFs = new ContentFS(settings || {}, remarkPlugins, [])

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
                        : []) as { start?: number, end?: number }[]

                    const lineNumbers = node.children?.[0]?.properties?.lineNumbers
                    const size = node.children?.[0]?.properties?.size
                    const descriptionHead = node.children?.[0]?.properties?.descriptionHead
                    const descriptionContent = node.children?.[0]?.properties?.descriptionContent
                    const descriptionIcon = node.children?.[0]?.properties?.descriptionIcon

                    const promise = (async () => {
                        let descriptionContentCode = ""

                        if (descriptionContent) {
                            descriptionContentCode = await contentFs.compileContent(descriptionContent)
                        }

                        const highlighted = await highlight({
                            value: code,
                            lang: lang,
                            meta: lang || "",
                        }, settings?.theme?.coder?.syntaxHighlight || "github-dark")

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
                            lineNumbers,
                            size,
                            descriptionHead,
                            descriptionContent: descriptionContentCode,
                            descriptionIcon
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
