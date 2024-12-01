import path from "path";
import {promises as fs} from "fs";

import React from "react";
import {parse} from "codehike";
import {visit} from "unist-util-visit";
import {recmaCodeHike, remarkCodeHike} from "codehike/mdx";
import {compile as mdxCompile} from "@mdx-js/mdx";

const codeHikeOptions = {
    lineNumbers: true,
    showCopyButton: true,
    autoImport: true,
    components: {code: "Code"},
    // syntaxHighlighting: { // TODO: !!! FROM SETTINGS !!! wait for rr7 rsc ??
    //     theme: "github-dark",
    // },
};
//
// // since unist does not support heading level > 6, we need to normalize them
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

//
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

async function compileBySlug(slug: string) {
    // TODO: cwd ?
    const filePath = path.join(process.cwd(), `${slug}.md`)

    try {
        await fs.access(filePath)
    } catch (e) {
        console.error(e)
        return ""
    }

    const content = await fs.readFile(filePath, "utf-8");

    return await compile(content)
}

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

//
// function MDXContent(code: string) {
//     return React.useMemo(
//         () => code ? getMDXComponent(code) : null,
//         [code]
//     )
// }

// TODO: mod ts
async function lazyReferences(mod: any) {
    const references: any[] = []

    if (Array.isArray(mod.default)) {
        for (const chunk of mod.default) {
            try {
                const code = await compile(chunk) // TODO: do we need real path?
                const Content = getMDXComponent(code)
                const content = Content ? parse(Content) : null

                references.push(...content.references as [])
            } catch (e) {
                console.error(e)
            }
        }
    } else {
        console.warn(`mod.default is not an array, current type is: ${typeof mod.default}`)
    }

    return references
}

export {
    compileBySlug,
    lazyReferences
}
