import path from "path";
import {promises as fs} from "fs";
import React, {} from "react";
import {redirect} from "react-router";
import remarkFrontmatter from "remark-frontmatter";
import remarkMdxFrontmatter from "remark-mdx-frontmatter";
import remarkGfm from "remark-gfm";
import {parse} from "codehike";
import {visit} from "unist-util-visit";
import {recmaCodeHike, remarkCodeHike} from "codehike/mdx";
import {compile as mdxCompile} from "@mdx-js/mdx";

import {MetadataMap} from "@xyd-js/core";
import {ReactContent} from "@xyd-js/components/content";
import {mapSettingsToProps} from "@xyd-js/framework/hydration";
import {Framework, type FwSidebarGroupProps, FwLink} from "@xyd-js/framework/react";
import {Atlas} from "@xyd-js/atlas";
import type {IBreadcrumb, INavLinks} from "@xyd-js/ui";

import Theme from "virtual:xyd-theme" // TODO: for some reasons this cannot be hydrated by react-router
import settings from 'virtual:xyd-settings';

import "virtual:xyd-theme/index.css"
import "virtual:xyd-theme-override/index.css"

interface loaderData {
    sidebarGroups: FwSidebarGroupProps[]
    breadcrumbs: IBreadcrumb[],
    navlinks?: INavLinks,
    toc: MetadataMap
    slug: string
    code: string
}

const reactContent = new ReactContent(settings, {
    Link: FwLink
})
const contentComponents = reactContent.components()

// since unist does not support heading level > 6, we need to normalize them
function normalizeCustomHeadings() {
    return (tree: any) => {
        visit(tree, 'paragraph', (node, index, parent) => {
            if (!node.children[0].value) {
                return
            }
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
    components: {},
    // syntaxHighlighting: { // TODO: !!! FROM SETTINGS !!! wait for rr7 rsc ??
    //     theme: "github-dark",
    // },
};

const compiledBySlug = {}

// TODO: map every file and merge them or load via client-side ?
async function compileBySlug(slug: string) {
    if (compiledBySlug[slug]) {
        return compiledBySlug[slug]
    }
    console.time("api-reference compileBySlug")
    // TODO: cwd ?
    let filePath = path.join(process.cwd(), `${slug}.md`)

    try {
        await fs.access(filePath)
    } catch (_) {
        filePath = path.join(process.cwd(), `${slug}.mdx`)

        await fs.access(filePath)
    }

    console.time("api-reference readFile")
    const content = await fs.readFile(filePath, "utf-8");
    console.timeEnd("api-reference readFile")

    console.time("api-reference compile")
    const resp = await compile(content)
    console.timeEnd("api-reference compile")

    console.timeEnd("api-reference compileBySlug")
    compiledBySlug[slug] = resp
    return resp
}

async function compile(content: string): Promise<string> {
    const compiled = await mdxCompile(content, {
        remarkPlugins: [
            normalizeCustomHeadings,
            [
                remarkCodeHike,
                codeHikeOptions
            ],
            remarkFrontmatter,
            remarkMdxFrontmatter,
            remarkGfm
        ],
        rehypePlugins: [],
        recmaPlugins: [
            [
                recmaCodeHike,
                codeHikeOptions
            ]
        ],
        outputFormat: 'function-body',
        development: false,
    });

    return String(compiled)
}

interface loaderData {
    sidebarGroups: FwSidebarGroupProps[]
    toc: MetadataMap
    slug: string
    code: string
}

function getPathname(url: string) {
    const parsedUrl = new URL(url);
    return parsedUrl.pathname.replace(/^\//, '');
}

// TODO: fix any
function findFirstUrl(items: any): string {
    const queue = [...items];

    while (queue.length > 0) {
        const item = queue.shift();

        if (item.href) {
            return item.href;
        }

        if (item.items) {
            queue.push(...item.items);
        }
    }

    return "";
}

interface data {
    groups: FwSidebarGroupProps[],
    breadcrumbs: IBreadcrumb[]
    navlinks?: INavLinks
}

const mapSettingsToPropsMap: { [key: string]: data } = {}

// TODO: fix any
export async function loader({request}: { request: any }) {
    console.time("api-reference loader")
    const slug = getPathname(request.url);

    let code = "";
    let error: any;

    try {
        code = await compileBySlug(slug);
    } catch (e) {
        error = e;
    }
    let data: data

    if (!mapSettingsToPropsMap[slug]) {
        data = await mapSettingsToProps(
            settings,
            slug
        );
        mapSettingsToPropsMap[slug] = data
    } else {
        data = mapSettingsToPropsMap[slug]
    }

    const {groups: sidebarGroups, breadcrumbs, navlinks} = data;

    if (error) {
        if (sidebarGroups && error.code === "ENOENT") {
            const firstItem = findFirstUrl(sidebarGroups?.[0]?.items);

            if (firstItem) {
                return redirect(firstItem);
            }
        }

        console.error(error);
    }

    console.timeEnd("api-reference loader")
    return {
        sidebarGroups,
        breadcrumbs,
        navlinks,
        slug,
        code,
    } as loaderData;
}

function mdxExport(code: string) {
    const scope = {
        Fragment: React.Fragment,
        jsxs: React.createElement,
        jsx: React.createElement,
        jsxDEV: React.createElement,
    }
    const fn = new Function(...Object.keys(scope), code)
    return fn(scope)
}

function MemoMDXComponent(codeComponent: any) {
    return React.useMemo(
        () => codeComponent ? codeComponent : null,
        [codeComponent]
    )
}

// // TODO: move to content?
function mdxContent(code: string) {
    const content = mdxExport(code) // TODO: fix any
    if (!mdxExport) {
        return {}
    }

    return {
        component: content?.default,
    }
}

// TODO: in the future more smoother loader - first fast server render then move to ideal position of client and then replace and 3 items at start
export default function APIReferenceSourcePage({loaderData}: { loaderData: loaderData }) {
    const content = mdxContent(loaderData.code)
    const serverComponent = content ? parse(content.component, {
        components: contentComponents
    }) : null

    const memoizedServerComponent = MemoMDXComponent(serverComponent)

    return <Framework
        settings={settings}
        sidebarGroups={loaderData.sidebarGroups || []}
        breadcrumbs={loaderData.breadcrumbs || []}
        navlinks={loaderData.navlinks}
    >
        <Theme>
            <Atlas
                kind="secondary"
                references={memoizedServerComponent?.references[0]}
            />
        </Theme>
    </Framework>
}