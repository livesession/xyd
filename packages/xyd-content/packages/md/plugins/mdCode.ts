import {visit} from "unist-util-visit";
import { parseImportPath } from "./functions/utils";

/**
 * This plugin injects the code meta into the code node's data
 * so that it can be used in the code block component
 */
export function remarkInjectCodeMeta() {
    return (tree: any) => {
        console.time('plugin:remarkInjectCodeMeta');
        visit(tree, 'code', (node) => {
            const { filePath, regions, lineRanges } = parseImportPath(node.lang || "") || {}
            node.lang = filePath
            node.data = node.data || {}
            node.data.regions = regions
            node.data.lineRanges = lineRanges

            node.data.hProperties = {
                ...(node.data.hProperties || {}),
                regions: JSON.stringify(node.data.regions),
                lineRanges: JSON.stringify(node.data.lineRanges)
            }

            if (node.meta) {
                node.data.hProperties = {
                    ...(node.data.hProperties || {}),
                    meta: node.meta,
                };
            }
        });
        console.timeEnd('plugin:remarkInjectCodeMeta');
    };
}
