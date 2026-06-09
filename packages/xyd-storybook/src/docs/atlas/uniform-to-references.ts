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
    // The CodeHike round-trip (md → mdx → parse) turns reference fields into Block objects
    // ({children, title, _data}) which Atlas can't render directly without the Composer.
    // For Storybook we don't need code highlighting via CodeHike — Atlas reads the raw JSON
    // shape just fine, so return it as-is.
    return sanitizeDescriptions(todoAppUniform as Reference[]) as MDXReference<Reference[]>
}

// Strip frontmatter (`---\ntitle: …\n---\n\n`) from descriptions so they render as plain text.
function sanitizeDescriptions(refs: Reference[]): Reference[] {
    return refs.map((ref) => ({
        ...ref,
        description:
            typeof ref.description === "string"
                ? ref.description.replace(/^---[\s\S]*?---\n+/, "")
                : ref.description,
    }))
}

// CodeHike's parse() returns sections as Block objects: { children, title, _data, ...subsections }.
// React can't render those directly, so deeply walk the references and replace any Block-shaped
// value with its `children` (the actual ReactNode).
function isBlock(value: any): boolean {
    if (!value || typeof value !== "object") return false
    if (React.isValidElement(value)) return false
    if (Array.isArray(value)) return false
    return "children" in value && "_data" in value
}

// Walk the references tree and replace any `description` field that is a CodeHike Block
// with its rendered `children` (the actual ReactNode).
function unwrapBlock(block: any): any {
    // CodeHike heading like `!description some text` (no body) → Block.children is undefined and the
    // user text lives on Block.title. With a body paragraph the text becomes Block.children.
    if (block?.children !== undefined && block.children !== null) return block.children
    if (typeof block?.title === "string") return block.title
    return null
}

function unwrapDescriptions(value: any): any {
    if (Array.isArray(value)) return value.map(unwrapDescriptions)
    if (React.isValidElement(value)) return value
    if (value && typeof value === "object") {
        const out: any = {}
        for (const k of Object.keys(value)) {
            let v = value[k]
            if (k === "description" && isBlock(v)) {
                v = unwrapBlock(v)
            }
            out[k] = unwrapDescriptions(v)
        }
        return out
    }
    return value
}

function flattenBlocks(refs: any[]): any {
    return refs.map(unwrapDescriptions)
}