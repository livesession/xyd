import path from "path";
import {promises as fs} from "fs";

import React, {useContext} from "react";
import {redirect, UNSAFE_DataRouterStateContext} from "react-router";
import remarkFrontmatter from "remark-frontmatter";
import remarkMdxFrontmatter from "remark-mdx-frontmatter";
import remarkGfm from "remark-gfm";
import {parse} from "codehike";
import {visit} from "unist-util-visit";
import {recmaCodeHike, remarkCodeHike} from "codehike/mdx";
import {compile as mdxCompile} from "@mdx-js/mdx";

import {PageFrontMatter} from "@xyd/core";
import {renderoll} from "@xyd/foo/renderoll";
import {
    AtlasLazy
} from "@xyd/atlas";
import getContentComponents from "@xyd/components/content";
import {mapSettingsToProps} from "@xyd/framework/hydration";
import {Framework} from "@xyd/framework/react";
import type {FwSidebarGroupProps} from "@xyd/framework/react";

import Theme from "virtual:xyd-theme" // TODO: for some reasons this cannot be hydrated by react-router
import settings from 'virtual:xyd-settings';

import "virtual:xyd-theme/index.css"
import "virtual:xyd-theme-override/index.css"

const contentComponents = getContentComponents()
const ComponentContent = contentComponents.Content

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

// TODO: map every file and merge them or load via client-side ?
async function compileBySlug(slug: string) {
    // TODO: cwd ?
    let filePath = path.join(process.cwd(), `${slug}.md`)

    try {
        await fs.access(filePath)
    } catch (_) {
        filePath = path.join(process.cwd(), `${slug}.mdx`)

        await fs.access(filePath)
    }

    const content = await fs.readFile(filePath, "utf-8");

    return await compile(content)
}

async function compile(content: string): Promise<string> {
    const compiled = await mdxCompile(content, {
        remarkPlugins: [
            normalizeCustomHeadings,
            [remarkCodeHike, codeHikeOptions],
            remarkFrontmatter,
            remarkMdxFrontmatter,
            remarkGfm
        ],
        rehypePlugins: [],
        recmaPlugins: [
            [recmaCodeHike, codeHikeOptions]
        ],
        outputFormat: 'function-body',
        development: false,
    });

    return String(compiled)
}

interface loaderData {
    sidebarGroups: FwSidebarGroupProps[]
    toc: PageFrontMatter
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

// TODO: fix any
export async function loader({request}: { request: any }) {
    const slug = getPathname(request.url)

    let code = ""
    let error: any

    try {
        code = await compileBySlug(slug)
    } catch (e) {
        error = e
    }

    const {groups: sidebarGroups} = await mapSettingsToProps(
        settings,
        slug
    )

    // TODO: dry with docs.tsx - resolver?
    if (error) {
        if (sidebarGroups && error.code === "ENOENT") {
            const firstItem = findFirstUrl(sidebarGroups?.[0]?.items)

            if (firstItem) {
                return redirect(firstItem)
            }
        }

        console.error(error)
    }

    return {
        sidebarGroups,
        slug,
        code
    } as loaderData
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

function renderollAsyncClient(routeId: string, slug: string) {
    return async () => {
        let mod;
        let urlPrefix;
        let data;

        // TODO: fix any
        function moduleData(mods: any, id: string) {
            mod = mods.default[id]
            if (!mod) {
                throw new Error(`Unknown openapi id: ${id}`)
            }
            urlPrefix = mod.urlPrefix
            data = mod.data
        }

        switch (routeId) {
            case "xyd-plugin-zero/graphql": {
                // @ts-ignore
                mod = await import("virtual:xyd-plugin-zero/graphql");
                urlPrefix = "/docs/api/graphql" // TODO: dynamic urlPreifx
                data = mod.default.data
                break;
            }
            case "xyd-plugin-zero/openapi": {
                // @ts-ignore
                mod = await import("virtual:xyd-plugin-zero/openapi");
                urlPrefix = "/docs/api/openapi" // TODO: dynamic urlPrefix
                data = mod.default.data
                break;
            }
            default: {
                if (routeId.includes("xyd-plugin-zero/openapi")) {
                    const [_, id] = routeId.split("xyd-plugin-zero/openapi-")
                    // @ts-ignore
                    const mods = await import("virtual:xyd-plugin-zero/openapi")
                    moduleData(mods, id)
                    break;
                }
                if (routeId.includes("xyd-plugin-zero/graphql")) {
                    const [_, id] = routeId.split("xyd-plugin-zero/graphql-")
                    // @ts-ignore
                    const mods = await import("virtual:xyd-plugin-zero/graphql")
                    moduleData(mods, id)
                    break;
                }

                throw new Error(`Unknown routeId: ${routeId}`);
            }
        }

        if (!Array.isArray(data)) {
            console.warn(`mod.default is not an array, current type is: ${typeof mod.default}`)

            return
        }

        // TODO: in the future custom position
        const prevRefs = []
        const nextRefs = []
        const mdxComponentsPrev: any[] = []
        const mdxComponentsNext: any[] = []

        let pos = 0;

        for (const chunk of data) {
            if (!chunk) {
                continue
            }

            if (chunk.slug === slug) {
                pos = 1
                continue
            }

            const references = pos === 0 ? prevRefs : nextRefs

            const code = await compile(chunk.content) // TODO: do we need real path?
            const mdx = mdxExport(code)
            const Content = mdx.default
            const content = Content ? parse(Content, {
                components: contentComponents
            }) : null

            // TODO: support non-fererence pages
            if (content.references) {
                references.push(...(content?.references || []) as [])
            } else {
                const mdxComponents = pos === 0 ? mdxComponentsPrev : mdxComponentsNext

                mdxComponents.push(<div data-slug={`/${chunk.slug}`}>
                    <ComponentContent>
                        {content}
                    </ComponentContent>
                </div>)
            }
        }

        return [
            ({onLoaded}) => <>
                <ComponentContent>
                    {mdxComponentsPrev}
                </ComponentContent>

                {
                    prevRefs.length ? <div>
                        <AtlasLazy
                            references={prevRefs}
                            urlPrefix={urlPrefix}
                            slug={slug}
                            onLoaded={onLoaded}
                        />
                    </div> : null
                }
            </>,

            ({onLoaded}) => <>
                <ComponentContent>
                    {mdxComponentsNext}
                </ComponentContent>

                {
                    nextRefs.length ? <div>
                        <AtlasLazy
                            references={nextRefs}
                            urlPrefix={urlPrefix}
                            slug={slug}
                            onLoaded={onLoaded}
                        />
                    </div> : null
                }
            </>
        ]
    }
}

function getRouteId() {
    const routerState = useContext(UNSAFE_DataRouterStateContext)
    let routeId: string = ""

    routerState?.matches?.forEach(match => {
        const loader = routerState?.loaderData[match?.route?.id]

        if (loader) {
            routeId = match?.route?.id
        }
    })

    return routeId
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
export default function APIReference({loaderData}: { loaderData: loaderData }) {
    const content = mdxContent(loaderData.code)
    const serverComponent = content ? parse(content.component, {
        components: contentComponents
    }) : null

    const memoizedServerComponent = MemoMDXComponent(serverComponent)

    const serverAtlasOrMDX = memoizedServerComponent?.references ?
        <AtlasLazy
            references={memoizedServerComponent?.references || []}
            slug={loaderData.slug.startsWith("/") ? loaderData.slug : `/${loaderData.slug}`}
            urlPrefix="/"
        /> :
        <ComponentContent>
            {memoizedServerComponent}
        </ComponentContent>

    const routeId = getRouteId()

    const RenderollContent = renderoll(
        renderollAsyncClient(routeId, loaderData.slug),
        {
            decorator: ({children}) => <ComponentContent>
                {children}
            </ComponentContent>
        }
    )

    return <Framework
        settings={settings}
        sidebarGroups={loaderData.sidebarGroups}
    >
        <Theme
            themeSettings={{
                hideToc: true,
                bigArticle: true,
                sidebar: {
                    clientSideRouting: true
                }
            }}
        >
            <RenderollContent>
                {serverAtlasOrMDX}
            </RenderollContent>
        </Theme>
    </Framework>
}