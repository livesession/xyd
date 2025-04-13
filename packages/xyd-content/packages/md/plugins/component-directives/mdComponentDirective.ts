import { Plugin, unified } from "unified";
import remarkParse from "remark-parse";
import remarkMdx from "remark-mdx";
import { visit } from "unist-util-visit";
import { VFile } from "vfile";
import { Node as UnistNode } from "unist";
import { highlight } from "codehike/code"

import { Settings } from "@xyd-js/core";


import { FunctionName } from "../functions/types";
import { MarkdownComponentDirectiveMap } from "./types";
import { functionMatch, parseFunctionCall } from "../functions/utils";
import { processUniformFunctionCall } from "../functions/uniformProcessor";

import { getComponentName } from "./utils";

// TODO: in the future custom component: `this.registerComponent(MyComponent, "my-component")` ? but core should move to `symbolx`?
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

// TODO: BETTER SETTINGS MANAGEMENT FOR MD 

export function mdComponentDirective(settings?: Settings): Plugin {
    return function() {
        return  async (tree: UnistNode, file: VFile) => {
            const promises: Promise<void>[] = [];
    
            visit(tree, 'containerDirective', recreateComponent(file, promises, settings));
    
            await Promise.all(promises);
        }
    }
}

function recreateComponent(
    file: VFile,
    promises: Promise<void>[],
    settings?: Settings
) {
    return function (node: any) {
        if (!supportedDirectives[node.name]) {
            return;
        }

        const attributes: any[] = [];

        const componentName = getComponentName(node.name, supportedDirectives);

        const isNavLike = navComponents[node.name];
        const isTableLike = tableComponents[node.name];
        const isStepsLike = stepsComponents[node.name];
        const isCodeLike = codeComponents[node.name];

        if (isNavLike) {
            mdNav(node);
            return;
        }

        if (isStepsLike) {
            mdSteps(node);
            return;
        }

        if (isTableLike) {
            mdTable(node);
            return;
        }

        if (isCodeLike) {
            mdCode(node, promises, settings);
            return
        }

        if (node.attributes) {
            componentProps(
                node,
                attributes,
                promises,
                file
            );
        }

        // recreate component from markdown directive
        const jsxNode = {
            type: 'mdxJsxFlowElement',
            name: componentName,
            attributes: attributes,
            children: node.children
        };

        Object.assign(node, jsxNode);
    }
}

function mdNav(node: any) {
    const componentName = getComponentName(node.name, supportedDirectives);

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
                        const tabValue = link.url.replace('tab=', ''); // TODO: NOT ONLY 'tab'
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

function mdSteps(node: any) {
    const componentName = getComponentName(node.name, supportedDirectives);

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

// TODO: support tsx tables like: [<>`Promise<Reference[]>`</>] ?
function mdTable(node: any) {
    const componentName = getComponentName(node.name, supportedDirectives);
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

// TODO: server side highlight?
function mdCode(node: any, promises: Promise<any>[], settings?: Settings) {
    const componentName = getComponentName(node.name, supportedDirectives);

    const description = node.attributes?.title || '';
    const codeblocks: any[] = [];

    function rewriteNode() {
        // Add metadata to the node
        node.data = {
            hName: componentName,
            hProperties: {
                description,
                codeblocks: JSON.stringify(codeblocks),
            },
        };

        node.children = [];
    }

    for (const child of node.children) {
        if (child.type === 'code') {

            const meta = child.meta || '';
            const value = child.value || '';
            const lang = child.lang || '';

            const promise = (async () => {
                const highlighted = await highlight({
                    value: value,
                    lang,
                    meta: meta || lang || ""
                }, settings?.theme?.markdown?.syntaxHighlight || "github-dark") // TODO: theme

                codeblocks.push({ value, lang, meta, highlighted: highlighted });
                rewriteNode()
            })()

            promises.push(promise)
        }
    }

    return
}


function componentProps(
    node: any,
    attributes: any[],
    promises: Promise<void>[],
    file: VFile
) {

    const jsxProps = []

    for (let [key, value] of Object.entries(node.attributes)) {
        const stringNonJsxProp = isStringNonJsxProp(value as string)

        if (stringNonJsxProp) {
            if (functionMatch(value as string, FunctionName.Uniform)) {
                const promise = mdUniformAttribute(key, value as string, attributes, file);

                if (promise) {
                    promises.push(promise)
                }

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

    if (jsxProps.length > 0) {
        attributes.push(...complexJSXPropsPollyfill(jsxProps))
    }
}

// parses structure like: <Atlas references={@uniform("index.ts")} />
function mdUniformAttribute(
    attrKey: string,   // like `references`
    attrValue: string, // like `@uniform("index.ts")`
    attributes: any,
    file: VFile
) {

    const result = parseFunctionCall({
        children: [
            {
                type: "text",
                value: attrValue
            }
        ]
    }, FunctionName.Uniform);

    if (!result) {
        return
    };

    const importPath = result[1];

    const promise = (async () => {
        try {
            // Process the uniform function call
            const references = await processUniformFunctionCall(
                importPath,
                file,
                ""
            );

            if (references && references.length > 0) {
                attributes.push({
                    type: 'mdxJsxAttribute',
                    name: attrKey,
                    value: JSON.stringify(references, null, 2)
                });
            }
        } catch (error) {
            console.error(`Error processing uniform function call: ${importPath}`, error);
            // Keep the node as is if there's an error
        }
    })();

    return promise
}

// TODO: FIND BETTER SOLUTION TO CONVERT MORE COMPLEX JSX PROPS?

//jsxProps = ["key=value", "key2=value2"]
function complexJSXPropsPollyfill(jsxProps: string[]) {
    const attributes = [];

    const mdxString = `<Fragment ${jsxProps.join(" ")}></Fragment>`

    const ast = unified()
        .use(remarkParse)
        .use(remarkMdx)
        .parse(mdxString);

    // Check if the first child is an MDX JSX element with attributes
    if (ast &&
        ast.children[0] &&
        'type' in ast.children[0] &&
        ast.children[0].type === 'mdxJsxFlowElement' &&
        'attributes' in ast.children[0] &&
        ast.children[0].attributes) {
        for (const attr of ast.children[0].attributes) {
            // TODO: support markdown also e.g Hello `World` - currently it mus be: Hello <code>World</code>

            attributes.push(attr);
        }
    }

    return attributes
}

// TODO: better matching
function isStringNonJsxProp(value: string): boolean {
    return typeof value === "string" && !value.startsWith("<");
}