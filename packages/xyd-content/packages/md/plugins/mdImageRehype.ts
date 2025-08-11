import { visit } from "unist-util-visit";

export function mdImageRehype() {
    return (tree: any) => {
        visit(tree, 'element', (node) => {
            if (node.tagName === 'img' && node.properties) {
                // If caption or other custom props are present, keep them
                // (hProperties from remark should already be on properties)
                // No-op, but could add logic here if needed in future
            }
        });
    };
} 