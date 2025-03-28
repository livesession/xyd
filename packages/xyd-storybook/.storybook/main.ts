import {join, dirname} from "path";

import React from "react";
import type {StorybookConfig} from "@storybook/react-vite";
import remarkGfm from 'remark-gfm';
import remarkDirective from 'remark-directive';
import {visit} from 'unist-util-visit';
import {unified} from 'unified';
import remarkParse from 'remark-parse';
import remarkMdx from 'remark-mdx';

/**
 * This function is used to resolve the absolute path of a package.
 * It is needed in projects that use Yarn PnP or are set up within a monorepo.
 */
function getAbsolutePath(value: string): any {
    return dirname(require.resolve(join(value, "package.json")));
}

function remarkInjectMeta() { // TODO: move to @xyd-js/content
    return (tree) => {
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

// TODO: get from @xyd-js/content/md but curently error when importing a `content` lib: Error [ERR_PACKAGE_PATH_NOT_EXPORTED]: No "exports" main defined in /Users/zdunecki/Code/livesession/xyd/node_modules/.pnpm/estree-util-build-jsx@3.0.1/node_modules/estree-walker/package.json
export function mdCodeGroup() {
    return (tree: any) => {
        visit(tree, 'containerDirective', (node) => {
            if (node.name !== 'code-group') return;

            const description = node.attributes?.title || '';
            const codeblocks = [];

            for (const child of node.children) {
                if (child.type === 'code') {
                    const meta = child.meta || '';
                    const value = child.value || '';
                    const lang = child.lang || '';

                    codeblocks.push({value, lang, meta});
                }
            }

            // Add metadata to the node
            node.data = {
                hName: 'DirectiveCodeSample',
                hProperties: {
                    description,
                    codeblocks: JSON.stringify(codeblocks),
                },
            };

            node.children = [];
        });
    };
}

const supportedComponentDirectives: { [key: string]: boolean } = {
    "table": true,
    "details": true,
    // "code-group": true, // TODO: replace in the future
}

// TODO: get from @xyd-js/content/md but curently error when importing a `content` lib: Error [ERR_PACKAGE_PATH_NOT_EXPORTED]: No "exports" main defined in /Users/zdunecki/Code/livesession/xyd/node_modules/.pnpm/estree-util-build-jsx@3.0.1/node_modules/estree-walker/package.json
function parseProps(props: string) {
    const parsedProps = JSON.parse(props);
    const transformedProps: any = {};

    for (const [key, value] of Object.entries(parsedProps)) {
        if (typeof value === 'string' && value.includes('`')) {
            const codeContent = value.match(/`([^`]+)`/);
            if (codeContent) {
                transformedProps[key] = React.createElement('code', null, codeContent[1]);
            } else {
                transformedProps[key] = value;
            }
        } else {
            transformedProps[key] = value;
        }
    }

    return transformedProps;
}


export function mdComponentDirective() {
    return (tree: any) => {
        visit(tree, 'containerDirective', (node) => {
            const directiveName = node.name as string;
            if (!supportedComponentDirectives[directiveName]) {
                return;
            }

            const codeblocks = [];

            for (const child of node.children) {
                if (child.type === 'code') {
                    const meta = child.meta || '';
                    const value = child.value || '';
                    const lang = child.lang || '';

                    codeblocks.push({value, lang, meta});
                }
            }

            const directiveProps = JSON.stringify(node.attributes);
            const transformedProps = parseProps(directiveProps);

            console.log(transformedProps, 333)
            node.data = {
                hName: 'DirectiveComponent',
                hProperties: {
                    directiveName,
                    directiveProps: JSON.stringify({}),
                    codeProps: JSON.stringify({
                        codeblocks
                    })
                },
            };

            node.children = [];
        });
    };
}

function toPascalCase(str) {
    return str
        .replace(/([a-z])([A-Z])/g, "$1 $2") // Add space before capital letters
        .replace(/[^a-zA-Z0-9]/g, " ") // Replace special characters with space
        .split(" ") // Split by space
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()) // Capitalize first letter
        .join("");
}


const supportedDirectives = {
    Details: true,
    details: true,
    TableV2: true
}

const tableComponents: { [key: string]: boolean } = {
    TableV2: true
}

/*
<TableV2>
    <TableV2.Head>
        <TableV2.Tr>
            <TableV2.Th>Type</TableV2.Th>
            <TableV2.Th>Description</TableV2.Th>
        </TableV2.Tr>
    </TableV2.Head>
    <TableV2.Tr>
        <TableV2.Td>`Promise<Reference[]>`</TableV2.Td>
        <TableV2.Td muted>The list of uniform references.</TableV2.Td>
    </TableV2.Tr>
</TableV2>
 */

const parseMarkdown = (content: string) => {
    const ast = unified()
        .use(remarkParse)
        .use(remarkMdx)
        .parse(content);
    return ast.children;
};

export function remarkDirectiveWithMarkdown() {
    return (tree) => {
        visit(tree, 'containerDirective', (node) => {
            if (!supportedDirectives[node.name]) {
                return;
            }

            const isTable = tableComponents[node.name];
            const attributes = [];

            // TODO: MORE GENERIC CUZ IT HAS IMPL DETAILS OF TABLE
            if (isTable) {
                // TODO: support tsx tables like: [<>`Promise<Reference[]>`</>] ?
                const tableData = JSON.parse(node.children[0].value);
                const [header, ...rows] = tableData;

                const jsxNode = {
                    type: 'mdxJsxFlowElement',
                    name: 'TableV2',
                    attributes: [],
                    children: [
                        {
                            type: 'mdxJsxFlowElement',
                            name: 'TableV2.Head',
                            attributes: [],
                            children: [
                                {
                                    type: 'mdxJsxFlowElement',
                                    name: 'TableV2.Tr',
                                    attributes: [],
                                    children: header.map((cell: string) => ({
                                        type: 'mdxJsxFlowElement',
                                        name: 'TableV2.Th',
                                        attributes: [],
                                        children: parseMarkdown(cell)
                                    }))
                                }
                            ]
                        },
                        ...rows.map((row: string[]) => ({
                            type: 'mdxJsxFlowElement',
                            name: 'TableV2.Tr',
                            attributes: [],
                            children: row.map((cell: string) => ({
                                type: 'mdxJsxFlowElement',
                                name: 'TableV2.Td',
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
    };
}

const config: StorybookConfig = {
    stories: ["../src/docs/**/*.mdx", "../src/docs/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
    addons: [
        getAbsolutePath("@storybook/addon-onboarding"),
        getAbsolutePath("@storybook/addon-links"),
        getAbsolutePath("@storybook/addon-essentials"),
        getAbsolutePath("@chromatic-com/storybook"),
        getAbsolutePath("@storybook/addon-interactions"),
        {
            name: '@storybook/addon-docs',
            options: {
                mdxPluginOptions: {
                    mdxCompileOptions: {
                        remarkPlugins: [
                            remarkGfm,
                            remarkDirective,
                            mdCodeGroup,
                            remarkDirectiveWithMarkdown,
                            // mdComponentDirective
                        ]
                    },
                },
            },
        },
    ],
    framework: {
        name: getAbsolutePath("@storybook/react-vite"),
        options: {},
    },
    features: {
        experimentalRSC: true,
    }
};
export default config;
