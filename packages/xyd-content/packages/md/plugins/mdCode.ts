import {visit} from "unist-util-visit";

/**
 * This plugin injects the code meta into the code node's data
 * so that it can be used in the code block component
 */
export function remarkInjectCodeMeta() {
    return (tree: any) => {
        console.time('plugin:remarkInjectCodeMeta');
        visit(tree, 'code', (node) => {
            if (node.meta) {
                node.data = node.data || {};
                node.data.hProperties = {
                    ...(node.data.hProperties || {}),
                    meta: node.meta,
                };
            }
        });
        console.timeEnd('plugin:remarkInjectCodeMeta');
    };
}
