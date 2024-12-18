import {visit} from "unist-util-visit";

export function remarkInjectCodeMeta() {
    return (tree: any) => {
        visit(tree, 'code', (node) => {
            if (node.meta) {
                node.data = node.data || {};
                node.data.hProperties = {
                    ...(node.data.hProperties || {}),
                    meta: node.meta,
                };
            }
        });
    };
}
