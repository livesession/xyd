// TODO: move to utils or somewhere else
import React from "react";
import {parse} from "codehike";
import {visit} from "unist-util-visit";
import {recmaCodeHike, remarkCodeHike} from "codehike/mdx";
import {compile as mdxCompile} from "@mdx-js/mdx";

import {Reference} from "@xyd-js/uniform";
import {
    compile as compileMarkdown,
    referenceAST
} from "@xyd-js/uniform/markdown";

import todoAppUniform from "./todo-app.uniform.json";
import {MDXReference} from "../../utils/mdx.ts";

// since unist does not support heading level > 6, we need to normalize them
function normalizeCustomHeadings() {
    return (tree: any) => {
        visit(tree, 'paragraph', (node, index, parent) => {
            const match = node.children[0] && node.children[0].value.match(/^(#+)\s+(.*)/);
            if (match) {
                const level = match[1].length;
                const text = match[2];
                if (level > 6) {
                    // Create a new heading node with depth 6
                    const headingNode = {
                        type: 'heading',
                        depth: level,
                        children: [{type: 'text', value: text}]
                    };
                    // Replace the paragraph node with the new heading node
                    //@ts-ignore
                    parent.children[index] = headingNode;
                }
            }
        });
    };
}

const codeHikeOptions = {
    lineNumbers: true,
    showCopyButton: true,
    autoImport: true,
    components: {code: "Code"},
    // syntaxHighlighting: { // TODO: !!! FROM SETTINGS !!! wait for rr7 rsc ??
    //     theme: "github-dark",
    // },
};

async function compile(content: string): Promise<string> {
    const compiled = await mdxCompile(content, {
        remarkPlugins: [normalizeCustomHeadings, [remarkCodeHike, codeHikeOptions]],
        recmaPlugins: [
            [recmaCodeHike, codeHikeOptions]
        ],
        outputFormat: 'function-body',
        development: false,
    });

    return String(compiled)
}

// TODO: move below to content?
function getMDXComponent(code: string) {
    const mdxExport = getMDXExport(code)
    return mdxExport.default
}

function getMDXExport(code: string) {
    const scope = {
        Fragment: React.Fragment,
        jsxs: React.createElement,
        jsx: React.createElement,
        jsxDEV: React.createElement,
    }
    const fn = new Function(...Object.keys(scope), code)
    return fn(scope)
}

export async function uniformToReferences(): Promise<MDXReference<Reference[]> | []> {
    let content: string = ""

    for (const ref of todoAppUniform as Reference[]) {
        const ast = referenceAST(ref)
        const md = compileMarkdown(ast)

        content += md + "\n"
    }

    const compiled = await compile(content)
    const contentCode = getMDXComponent(compiled)

    const parsedContent = contentCode ? parse(contentCode) : null

    if (parsedContent) {
        return parsedContent.references
    }

    return []
}