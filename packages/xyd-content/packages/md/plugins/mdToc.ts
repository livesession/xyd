import { Root, Heading } from "mdast";
import { MdxjsEsm } from "mdast-util-mdx";
import { Plugin } from "unified";
import { MdxJsxFlowElement, MdxJsxAttribute } from "mdast-util-mdx-jsx";

import { mdParameters } from './utils/mdParameters';

export type TocEntry = {
    depth: number,
    id: string,
    value: string,
    attributes: { [key: string]: string },
    children: TocEntry[],
    maxTocDepth?: number
};

export type CustomTag = {
    name: RegExp,
    depth: (name: string) => number
};

export interface RemarkMdxTocOptions {
    name?: string,
    customTags?: CustomTag[],
    maxDepth?: number,
    minDepth?: number
}

// TODO: fix any
export const remarkMdxToc = (options: RemarkMdxTocOptions): Plugin => () => async (ast: any) => {
    if (!options?.minDepth) {
        options.minDepth = 2
    }

    console.time('plugin:remarkMdxToc');
    const { visit } = await import("unist-util-visit");
    const { toString } = await import("mdast-util-to-string");
    const { valueToEstree } = await import('estree-util-value-to-estree')
    const { name: isIdentifierName } = await import('estree-util-is-identifier-name');

    const mdast = ast as Root;
    const name = options.name ?? "toc";
    if (!isIdentifierName(name)) {
        throw new Error(`Invalid name for an identifier: ${name}`);
    }

    const toc: TocEntry[] = [];
    const flatToc: TocEntry[] = [];
    const nodesToRemove: number[] = [];

    const createEntry = (node: Heading | MdxJsxFlowElement, depth: number, index: number): TocEntry | null => {
        let attributes = (node.data || {}) as TocEntry['attributes'];
        if (node.type === "mdxJsxFlowElement") {
            attributes = Object.fromEntries(
                node.attributes
                    .filter(attribute => attribute.type === 'mdxJsxAttribute' && typeof attribute.value === 'string')
                    .map(attribute => [(attribute as MdxJsxAttribute).name, attribute.value])
            ) as TocEntry['attributes'];
        }

        let value = toString(node, { includeImageAlt: false });
        const { attributes: parsedAttributes, sanitizedText } = mdParameters(value);

        // Merge parsed attributes with existing ones
        attributes = { ...attributes, ...parsedAttributes };

        // Handle toc attribute
        if (attributes.toc === 'false') {
            return null; // Skip this entry
        }

        // If toc attribute is present, update the node's content to remove the [toc] part
        if (attributes.toc === 'true' && node.type === "heading") {
            // Keep the heading but remove the [toc] text and hide it
            (node as any).data = {
                ...(node as any).data,
                hProperties: {
                    ...(node as any).data?.hProperties,
                    hideHeading: true
                }
            };
            node.children = node.children.map(child => {
                if (child.type === "text") {
                    return {
                        ...child,
                        value: ""
                    };
                }
                return child;
            });
        }

        // Use toc value if provided, otherwise use clean text
        const tocValue = attributes.toc === 'true' ? sanitizedText : (attributes.toc || sanitizedText);

        return {
            depth,
            id: (node.data as any)?.hProperties?.id,
            value: tocValue,
            attributes,
            children: [],
            maxTocDepth: attributes.maxTocDepth ? parseInt(attributes.maxTocDepth) : undefined
        };
    };

    visit(mdast, ["heading", "mdxJsxFlowElement"], (node, index) => {
        // @ts-ignore
        let depth = 0;
        if (node.type === "mdxJsxFlowElement") {
            let valid = false;
            if (/^h[1-6]$/.test(node.name || "")) {
                valid = true;
                depth = parseInt(node.name!.substring(1));
            } else if (options.customTags) {
                for (const tag of options.customTags) {
                    if (tag.name.test(node.name || "")) {
                        valid = true;
                        depth = tag.depth(node.name || "");
                        break;
                    }
                }
            }

            if (!valid) {
                return;
            }
        } else if (node.type === "heading") {
            depth = node.depth;
        } else {
            return;
        }

        const entry = createEntry(node, depth, index as number);
        if (!entry) return;

        // If toc attribute is explicitly set to true or +toc is present, include it regardless of depth
        if (entry.attributes.toc === 'true' || entry.attributes["+toc"] === 'true') {
            flatToc.push(entry);
            let parent: TocEntry[] = toc;
            for (let i = flatToc.length - 1; i >= 0; --i) {
                const current = flatToc[i];
                if (current.depth < entry.depth) {
                    parent = current.children;
                    break;
                }
            }
            parent.push(entry);
            return;
        }

        // First check if this entry should be included based on parent's maxTocDepth
        let parentMaxDepth = options.maxDepth;
        for (let i = flatToc.length - 1; i >= 0; --i) {
            const parent = flatToc[i];
            if (parent.depth < entry.depth) {
                if (parent.maxTocDepth !== undefined) {
                    parentMaxDepth = parent.maxTocDepth;
                }
                break;
            }
        }

        // Now check against the effective max depth (either global or parent's maxTocDepth)
        if (depth && parentMaxDepth && depth > parentMaxDepth) {
            return;
        }

        if (depth && (options?.minDepth && depth < options.minDepth)) {
            return;
        }

        flatToc.push(entry);

        let parent: TocEntry[] = toc;
        for (let i = flatToc.length - 1; i >= 0; --i) {
            const current = flatToc[i];
            if (current.depth < entry.depth) {
                parent = current.children;
                break;
            }
        }
        parent.push(entry);
    });

    // Remove nodes marked for removal
    nodesToRemove.sort((a, b) => b - a).forEach(index => {
        mdast.children.splice(index, 1);
    });

    const tocExport: MdxjsEsm = {
        type: "mdxjsEsm",
        value: "",
        data: {
            estree: {
                type: "Program",
                sourceType: "module",
                body: [
                    {
                        type: "ExportNamedDeclaration",
                        specifiers: [],
                        attributes: [],
                        source: null,
                        declaration: {
                            type: "VariableDeclaration",
                            kind: "const",
                            declarations: [
                                {
                                    type: "VariableDeclarator",
                                    id: {
                                        type: "Identifier",
                                        name
                                    },
                                    init: valueToEstree(toc)
                                }
                            ]
                        }
                    }
                ]
            }
        }
    };
    mdast.children.unshift(tocExport);
    console.timeEnd('plugin:remarkMdxToc');
};