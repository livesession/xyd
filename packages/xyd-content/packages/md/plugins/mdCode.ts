import { visit } from "unist-util-visit";
import { injectCodeMeta } from "./utils/injectCodeMeta";

/**
 * This plugin injects the code meta into the code node's data
 * so that it can be used in the code block component
 */
export function remarkInjectCodeMeta() {
    return (tree: any) => {
        console.time('plugin:remarkInjectCodeMeta');
        visit(tree, 'code', (node) => {
            injectCodeMeta(node, node.meta);
        });
        console.timeEnd('plugin:remarkInjectCodeMeta');
    };
}
