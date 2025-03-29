import {Root, Heading} from "mdast";
import {MdxjsEsm} from "mdast-util-mdx";
import {Plugin} from "unified"; // TODO: use Plugin type
import {MdxJsxFlowElement, MdxJsxAttribute} from "mdast-util-mdx-jsx";

export type TocEntry = {
    depth: number,
    value: string,
    attributes: { [key: string]: string },
    children: TocEntry[]
};

export type CustomTag = {
    name: RegExp,
    depth: (name: string) => number
};

export interface RemarkMdxTocOptions {
    name?: string,
    customTags?: CustomTag[],
    minDepth?: number
}

// TODO: fix any
export const remarkMdxToc = (options: RemarkMdxTocOptions): Plugin => () => async (ast: any) => {
    const {visit} = await import("unist-util-visit");
    const {toString} = await import("mdast-util-to-string");
    const {valueToEstree} = await import('estree-util-value-to-estree')
    const {name: isIdentifierName} = await import('estree-util-is-identifier-name');

    const mdast = ast as Root;
    const name = options.name ?? "toc";
    if (!isIdentifierName(name)) {
        throw new Error(`Invalid name for an identifier: ${name}`);
    }

    const toc: TocEntry[] = [];
    const flatToc: TocEntry[] = [];
    const createEntry = (node: Heading | MdxJsxFlowElement, depth: number): TocEntry => {
        let attributes = (node.data || {}) as TocEntry['attributes'];
        if (node.type === "mdxJsxFlowElement") {
            attributes = Object.fromEntries(
                node.attributes
                    .filter(attribute => attribute.type === 'mdxJsxAttribute' && typeof attribute.value === 'string')
                    .map(attribute => [(attribute as MdxJsxAttribute).name, attribute.value])
            ) as TocEntry['attributes'];
        }
        return {
            depth,
            value: toString(node, {includeImageAlt: false}),
            attributes,
            children: []
        }
    };

    visit(mdast, ["heading", "mdxJsxFlowElement"], node => {
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

        if (depth && (options?.minDepth && options.minDepth > depth)) {
            return
        }

        const entry = createEntry(node, depth);
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
};