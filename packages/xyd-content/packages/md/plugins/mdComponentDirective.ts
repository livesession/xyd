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


const supportedDirectives: { [key: string]: boolean } = {
    Details: true,
    details: true,

    Callout: true,
    callout: true,

    Table: true,
    table: true,

    Subtitle: true,
    subtitle: true,

    Steps: true,
    steps: true,

    GuideCard: true,
    "guide-card": true,
}

const tableComponents: { [key: string]: boolean } = {
    Table: true,
    table: true
}

const stepsComponents: { [key: string]: boolean } = {
    Steps: true,
    steps: true
}

const parseMarkdown = (content: string) => {
    const ast = unified()
        .use(remarkParse)
        .use(remarkMdx)
        .parse(content);
    return ast.children;
};

export const remarkDirectiveWithMarkdown: Plugin = () => {
    return (tree: UnistNode) => {
        visit(tree, 'containerDirective', (node: any) => {
            if (!supportedDirectives[node.name]) {
                return;
            }

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
                            name: 'Steps.Item',
                            attributes: [],
                            children: item.children
                        };
                    }).flat();
                }).flat();

                const jsxNode = {
                    type: 'mdxJsxFlowElement',
                    name: 'Steps',
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
                    name: 'Table',
                    attributes: [],
                    children: [
                        {
                            type: 'mdxJsxFlowElement',
                            name: 'Table.Head',
                            attributes: [],
                            children: [
                                {
                                    type: 'mdxJsxFlowElement',
                                    name: 'Table.Tr',
                                    attributes: [],
                                    children: header.map((cell: string) => ({
                                        type: 'mdxJsxFlowElement',
                                        name: 'Table.Th',
                                        attributes: [],
                                        children: parseMarkdown(cell)
                                    }))
                                }
                            ]
                        },
                        // TODO: Table.Cell ?
                        ...rows.map((row: string[]) => ({
                            type: 'mdxJsxFlowElement',
                            name: 'Table.Tr',
                            attributes: [],
                            children: row.map((cell: string) => ({
                                type: 'mdxJsxFlowElement',
                                name: 'Table.Td',
                                attributes: [],
                                children: parseMarkdown(cell)
                            }))
                        }))
                    ]
                };

                Object.assign(node, jsxNode);
                return;
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
                name: toPascalCase(node.name),
                attributes: attributes,
                children: node.children
            };

            Object.assign(node, jsxNode);
        });
    }
}

