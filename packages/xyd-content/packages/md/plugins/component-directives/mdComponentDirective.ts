import { Plugin, unified } from "unified";
import remarkParse from "remark-parse";
import remarkMdx from "remark-mdx";
import { visit } from "unist-util-visit";
import { Node as UnistNode } from "unist";
import { FunctionName } from "../functions/types";
import { detectLanguage, downloadContent, fetchFileContent, parseFunctionCall, parseImportPath, processContent, readLocalFile } from "../functions/utils";
import { VFile } from "vfile";
import { cleanupTempFolder } from "../functions/mdFunctionUniform";
import { sourcesToUniform } from "@xyd-js/sources";
import path from "node:path";
import { createTempFolderStructure } from "../functions/mdFunctionUniform";
import { isProgrammingSource } from "../functions/mdFunctionUniform";

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

    nav: "UnderlineNav",

    atlas: true
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

const navComponents: MarkdownComponentDirectiveMap = {
    nav: "UnderlineNav",
}

const parseMarkdown = (content: string) => {
    const ast = unified()
        .use(remarkParse)
        .use(remarkMdx)
        .parse(content);
    return ast.children;
};

export const mdComponentDirective: Plugin = () => {
    return async (tree: UnistNode, file: VFile) => {

        const promises: Promise<void>[] = [];

        visit(tree, 'containerDirective', (node: any) => {
            if (!supportedDirectives[node.name]) {
                return;
            }

            const componentName = getComponentName(node.name);

            const isTable = tableComponents[node.name];
            const isSteps = stepsComponents[node.name];
            const isNav = navComponents[node.name];
            const attributes = [];

            if (isNav) {
                // Parse the nav directive content to extract tabs and their content
                const tabItems: any[] = [];
                const tabContents: any[] = [];

                // Process each child node
                node.children.forEach((child: any) => {
                    // Check if this is a list (ordered or unordered)
                    if (child.type === 'list') {
                        // Process each list item
                        child.children.forEach((listItem: any) => {
                            if (listItem.type === 'listItem') {
                                // The first child of a list item should be a paragraph with a link
                                const paragraph = listItem.children[0];
                                if (paragraph && paragraph.type === 'paragraph') {
                                    const link = paragraph.children[0];

                                    if (!link || link.type !== 'link' || !link.url) {
                                        return;
                                    }

                                    // Extract tab value and label
                                    const tabValue = link.url.replace('tab=', '');
                                    const tabLabel = link.children[0].value;

                                    // Create tab item
                                    tabItems.push({
                                        type: 'mdxJsxFlowElement',
                                        name: `${componentName}.Item`,
                                        attributes: [
                                            {
                                                type: 'mdxJsxAttribute',
                                                name: 'value',
                                                value: tabValue
                                            },
                                            {
                                                type: 'mdxJsxAttribute',
                                                name: 'href',
                                                value: `#${tabValue}`
                                            }
                                        ],
                                        children: [{
                                            type: 'text',
                                            value: tabLabel
                                        }]
                                    });

                                    // Get the content for this tab (everything after the paragraph)
                                    const tabContent = listItem.children.slice(1);

                                    // Create tab content
                                    tabContents.push({
                                        type: 'mdxJsxFlowElement',
                                        name: `${componentName}.Content`,
                                        attributes: [{
                                            type: 'mdxJsxAttribute',
                                            name: 'value',
                                            value: tabValue
                                        }],
                                        children: tabContent
                                    });
                                }
                            }
                        });
                    }
                });

                // Create the UnderlineNav component with tabs and content
                const jsxNode = {
                    type: 'mdxJsxFlowElement',
                    name: componentName,
                    attributes: [
                        // We don't need to provide value or onChange for uncontrolled mode
                    ],
                    children: [...tabItems, ...tabContents]
                };

                Object.assign(node, jsxNode);
                return;
            }

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
                        // TODO: IN THE FUTURE FUNCTION MATCHING
                        if (value.startsWith(FunctionName.Uniform)) {
                            const result = parseFunctionCall({
                                children: [
                                    {
                                        type: "text",
                                        value: value
                                    }
                                ]
                            }, FunctionName.Uniform);

                            if (!result) {
                                continue
                            };

                            const importPath = result[1];

                            // Parse the import path to extract file path, regions, and line ranges
                            const { filePath, regions, lineRanges } = parseImportPath(importPath);

                            const promise = (async () => {
                                try {
                                    const content = await downloadContent(
                                        filePath,
                                        file,
                                        "",
                                    )
                
                                    if (isProgrammingSource(filePath)) {
                                        // Create temporary folder structure
                                        const tempDir = await createTempFolderStructure(content);
                                        
                                        try {
                                            // Get the path to the package directory
                                            const packageDir = path.join(tempDir, 'packages', 'package');
                                            
                                            // Process the content using sourcesToUniform
                                            const references = await sourcesToUniform(
                                                tempDir,
                                                [packageDir]
                                            );

                                            if (references && references.length > 0) {
                                                attributes.push({
                                                    type: 'mdxJsxAttribute',
                                                    name: key,
                                                    value: JSON.stringify(references, null, 2)
                                                });
                                            }

                                        } finally {
                                            // Clean up the temporary directory when done
                                            cleanupTempFolder(tempDir);
                                        }
                                    } else {
                                        // TODO: openapi + graphql
                                        throw new Error(`Unsupported file type: ${filePath}`);
                                    }
                
                                } catch (error) {
                                    console.error(`Error processing uniform file: ${filePath}`, error);
                                    // Keep the node as is if there's an error
                                }
                            })();

                            promises.push(promise)
                            continue;
                        }

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

        await Promise.all(promises);
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