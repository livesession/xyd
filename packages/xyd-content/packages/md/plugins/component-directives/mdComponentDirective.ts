import { Plugin, unified } from "unified";
import remarkParse from "remark-parse";
import remarkMdx from "remark-mdx";
import { visit } from "unist-util-visit";
import { Node as UnistNode } from "unist";

function toPascalCase(str: string) {
    return str
        .replace(/([a-z])([A-Z])/g, "$1 $2") // Add space before capital letters
        .replace(/[^a-zA-Z0-9]/g, " ") // Replace special characters with space
        .split(" ") // Split by space
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()) // Capitalize first letter
        .join("");
}

type MarkdownComponentDirectiveMap = { [key: string]: boolean | string }

const supportedDirectives: MarkdownComponentDirectiveMap = {
    details: true,

    callout: true,

    table: true,

    subtitle: true,

    steps: true,

    "guide-card": "GuideCard",

    "code-group": "DirectiveCodeGroup",
}

const tableComponents: MarkdownComponentDirectiveMap = {
    Table: true,
    table: true
}

const stepsComponents: MarkdownComponentDirectiveMap = {
    Steps: true,
    steps: true
}

const codeComponents: MarkdownComponentDirectiveMap = {
    "code-group": "DirectiveCodeGroup",
}

const parseMarkdown = (content: string) => {
    const ast = unified()
        .use(remarkParse)
        .use(remarkMdx)
        .parse(content);
    return ast.children;
};

export const mdComponentDirective: Plugin = () => {
    return (tree: UnistNode) => {
        visit(tree, 'containerDirective', (node: any) => {
            if (!supportedDirectives[node.name]) {
                return;
            }

            const componentName = getComponentName(node.name);

            const isTable = tableComponents[node.name];
            const isSteps = stepsComponents[node.name];
            const attributes = [];

            if (isSteps) {
                const steps = node.children.map((child: any) => {
                    if (child.type !== "list") {
                        return child
                    }

                    return child.children.map((item: any) => {
                        if (item.type !== "listItem") {
                            return
                        }

                        return {
                            type: 'mdxJsxFlowElement',
                            name: `${componentName}.Item`,
                            attributes: [],
                            children: item.children
                        };
                    }).flat();
                }).flat();

                const jsxNode = {
                    type: 'mdxJsxFlowElement',
                    name: componentName,
                    attributes: [],
                    children: steps
                };

                Object.assign(node, jsxNode);
                return;
            }

            if (isTable) {
                // TODO: support tsx tables like: [<>`Promise<Reference[]>`</>] ?
                const tableData = JSON.parse(node.children[0].value);
                const [header, ...rows] = tableData;

                const jsxNode = {
                    type: 'mdxJsxFlowElement',
                    name: componentName,
                    attributes: [],
                    children: [
                        {
                            type: 'mdxJsxFlowElement',
                            name: `${componentName}.Head`,
                            attributes: [],
                            children: [
                                {
                                    type: 'mdxJsxFlowElement',
                                    name: `${componentName}.Tr`,
                                    attributes: [],
                                    children: header.map((cell: string) => ({
                                        type: 'mdxJsxFlowElement',
                                        name: `${componentName}.Th`,
                                        attributes: [],
                                        children: parseMarkdown(cell)
                                    }))
                                }
                            ]
                        },
                        // TODO: Table.Cell ?
                        ...rows.map((row: string[]) => ({
                            type: 'mdxJsxFlowElement',
                            name: `${componentName}.Tr`,
                            attributes: [],
                            children: row.map((cell: string) => ({
                                type: 'mdxJsxFlowElement',
                                name: `${componentName}.Td`,
                                attributes: [],
                                children: parseMarkdown(cell)
                            }))
                        }))
                    ]
                };

                Object.assign(node, jsxNode);
                return;
            }

            if (codeComponents[node.name]) {
                const description = node.attributes?.title || '';
                const codeblocks = [];

                for (const child of node.children) {
                    if (child.type === 'code') {
                        const meta = child.meta || '';
                        const value = child.value || '';
                        const lang = child.lang || '';

                        codeblocks.push({ value, lang, meta });
                    }
                }

                // Add metadata to the node
                node.data = {
                    hName: componentName,
                    hProperties: {
                        description,
                        codeblocks: JSON.stringify(codeblocks),
                    },
                };
    
                node.children = [];

                return
            }

            if (node.attributes) {
                const jsxProps = []

                for (let [key, value] of Object.entries(node.attributes)) {
                    if (typeof value === "string" && !value.startsWith("<")) {
                        attributes.push({
                            type: 'mdxJsxAttribute',
                            name: key,
                            value: value
                        });
                    } else {
                        jsxProps.push(`${key}={${value}}`)
                    }
                }

                const mdxString = `<Fragment ${jsxProps.join(" ")}></Fragment>`

                const ast = unified()
                    .use(remarkParse)
                    .use(remarkMdx)
                    .parse(mdxString);

                if (ast && ast.children[0] && ast.children[0].attributes) {
                    for (const attr of ast.children[0].attributes) {
                        // TODO: support markdown also e.g Hello `World` - currently it mus be: Hello <code>World</code>

                        attributes.push(attr);
                    }
                }
            }

            const jsxNode = {
                type: 'mdxJsxFlowElement',
                name: componentName,
                attributes: attributes,
                children: node.children
            };

            Object.assign(node, jsxNode);
        });
    }
}

function getComponentName(name: string) {
    let componntName = ""

    const directive = supportedDirectives[name]

    if (typeof directive === "string") {
        componntName = directive
    } else {
        componntName = toPascalCase(name)
    }

    return componntName
}