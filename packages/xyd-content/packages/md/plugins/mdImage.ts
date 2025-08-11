import { visit } from "unist-util-visit";
import { mdParameters } from "./utils/mdParameters";

/**
 * remark plugin to inject image meta/attributes (e.g. caption) into image nodes
 * Supports both attributes in alt/title and trailing {caption="..."} blocks after the image.
 */
export function mdImage() {
    return (tree: any) => {
        // helper: extract MD parameters and merge into hProperties
        function mergeProps(target: Record<string, any>, raw: string) {
            const { props, attributes } = mdParameters(raw, { htmlMd: true });
            // mdParameters returns props for text blocks, attributes for alt/title; unify
            Object.assign(target, props ?? attributes);
        }

        // Option 1: support trailing attribute blocks after images
        visit(tree, 'paragraph', (node: any) => {
            for (let idx = 0; idx < node.children.length - 1; idx++) {
                const curr = node.children[idx];
                const next = node.children[idx + 1];

                if (curr.type === 'image' && next.type === 'text') {
                    const raw = next.value.trim();
                    if (/^\{.*\}$/.test(raw)) {
                        curr.data = curr.data || {};
                        curr.data.hProperties = curr.data.hProperties || {};
                        mergeProps(curr.data.hProperties, raw);
                        // remove the attribute block text node
                        node.children.splice(idx + 1, 1);
                    }
                }
            }
        });

        // Option 2: process inline attributes in alt and title
        visit(tree, 'image', (node: any) => {
            const hProps = (node.data = node.data || {}).hProperties = node.data.hProperties || {};

            // alt: look for { ... } suffix
            if (typeof node.alt === 'string') {
                const altMatch = node.alt.match(/^(.*?)\s*(\{.*\})$/);
                if (altMatch) {
                    node.alt = altMatch[1].trim();
                    mergeProps(hProps, altMatch[2]);
                }
            }

            // title: process any attributes
            if (node.title) {
                mergeProps(hProps, node.title);
            }
        });
    };
}
