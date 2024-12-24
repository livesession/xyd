import path from "path";
import {promises as fs} from "fs";

import React, {useContext, createContext} from "react";
import {redirect, UNSAFE_DataRouterStateContext} from "react-router";
import remarkFrontmatter from "remark-frontmatter";
import remarkMdxFrontmatter from "remark-mdx-frontmatter";
import remarkGfm from "remark-gfm";
import {parse} from "codehike";
import {visit} from "unist-util-visit";
import {recmaCodeHike, remarkCodeHike} from "codehike/mdx";
import {compile as mdxCompile} from "@mdx-js/mdx";

import {PageFrontMatter} from "@xyd/core";
import {FwSidebarGroupProps} from "@xyd/framework";
import {
    Atlas,
    AtlasLazy
} from "@xyd/atlas";
import {mapSettingsToProps} from "@xyd/framework/hydration";
import {renderoll} from "@xyd/foo/renderoll";
// import {lazyReferences} from "@xyd/uniform/content"
import "@xyd/atlas/index.css"
import "@xyd/foo/index.css"

// @ts-ignore  // TODO: types
// import Theme from "virtual:xyd-theme" // TODO: for some reasons this cannot be hydrated by react-router
import Theme from "@xyd/theme-gusto"

// @ts-ignore // TODO: tyoes
import settings from 'virtual:xyd-settings';

import './styles.css'

import {
    Callout,
    Details,
    GuideCard,
    Steps,
    Tabs,
    Table,

    IconSessionReplay,
    IconMetrics,
    IconFunnels,
    IconCode,
} from "@xyd/components/writer"
import {
    getComponents,
} from "@xyd/ui";
import {Simulate} from "react-dom/test-utils";
import load = Simulate.load;

const components = {
    ...getComponents(),
    Callout,
    Details,
    GuideCard,
    Steps,
    Tabs,
    Table,

    IconSessionReplay,
    IconMetrics,
    IconFunnels,
    IconCode,

    // TODO: refactor
    Content({children}) {
        return <div style={{
            display: "flex",
            flexDirection: "column",
            gap: "24px"
        }}>
            {children}
        </div>
    },

    // TODO: refactor
    Subtitle({children}) {
        return <div style={{
            marginTop: "-18px",
            fontSize: "18px",
            color: "#7051d4",
            fontWeight: 300
        }}>
            {children}
        </div>
    }
}

const ComponentContent = components.Content

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
    // const mdOptions = mdxOptions({
    //     minDepth: 2 // TODO: configurable?
    // })

    const compiled = await mdxCompile(content, {
        remarkPlugins: [
            normalizeCustomHeadings,
            [remarkCodeHike, codeHikeOptions],
            remarkFrontmatter,
            remarkMdxFrontmatter,
            remarkGfm
            // ...mdOptions.remarkPlugins
        ],
        rehypePlugins: [
            // ...mdOptions.rehypePlugins
        ],
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

// TODO: fix anty
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
            const firstItem = sidebarGroups?.[0]?.items?.[0]

            if (firstItem) {
                return redirect(firstItem.href)
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

        switch (routeId) {
            case "xyd-plugin-zero/openapi":
                // @ts-ignore
                mod = await import("virtual:xyd-plugin-zero/openapi");
                urlPrefix = "/docs/api/rest" // TODO: dynamic urlPreifx
                break;
            case "xyd-plugin-zero/graphql":
                // @ts-ignore
                mod = await import("virtual:xyd-plugin-zero/graphql");
                urlPrefix = "/docs/api/graphql" // TODO: dynamic urlPreifx
                break;
            default:
                throw new Error("invalid route id");
        }

        const {data} = mod.default

        if (!Array.isArray(data)) {
            console.warn(`mod.default is not an array, current type is: ${typeof mod.default}`)

            return
        }

        // TODO: in the future custom position
        const mdxComponents: any[] = []
        const prevRefs = []
        const nextRefs = []

        let pos = 0;

        for (const chunk of data) {
            if (chunk.slug === slug) {
                pos = 1
                continue
            }

            const references = pos === 0 ? prevRefs : nextRefs

            const code = await compile(chunk.content) // TODO: do we need real path?
            const mdx = mdxExport(code)
            const Content = mdx.default
            const content = Content ? parse(Content, {
                components
            }) : null

            // TODO: support non-fererence pages
            if (content.references) {
                references.push(...(content?.references || []) as [])
            } else {
                mdxComponents.push(content)
            }
        }

        return [
            ({onLoaded}) => <>
                <ComponentContent>
                    {mdxComponents}
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
        components
    }) : null

    const memoizedServerComponent = MemoMDXComponent(serverComponent)

    const serverAtlasOrMDX = memoizedServerComponent?.references ?
        <Atlas references={memoizedServerComponent?.references || []}/> :
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

    // TODO: dynamic theme
    // TODO: check theme props - is theme compatible with xyd?
    return <Theme
        settings={settings}
        sidebarGroups={loaderData.sidebarGroups}
        themeSettings={{
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
}