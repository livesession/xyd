import path from "path";
import {promises as fs} from "fs";

import React, {lazy, useState, Suspense, memo, useContext} from "react";
import {parse} from "codehike";
import {visit} from "unist-util-visit";
import {recmaCodeHike, remarkCodeHike} from "codehike/mdx";
import {compile as mdxCompile} from "@mdx-js/mdx";
import {UNSAFE_DataRouterStateContext} from "react-router";

import {PageFrontMatter} from "@xyd/core";
import {FwSidebarGroupProps} from "@xyd/framework";
import {
    Atlas,
    AtlasLazy
} from "@xyd/atlas";
import {mapSettingsToProps} from "@xyd/framework/hydration";
// import {lazyReferences} from "@xyd/uniform/content"
import "@xyd/atlas/index.css"

// @ts-ignore  // TODO: types
// import Theme from "virtual:xyd-theme" // TODO: for some reasons this cannot be hydrated by react-router
import Theme from "@xyd/theme-gusto"

// @ts-ignore // TODO: tyoes
import settings from 'virtual:xyd-settings';

let lazyReferences: any
lazyReferences = async function() {
    return []
}
if (typeof window === "undefined") {
    const abc = await import("@xyd/uniform/content")
   lazyReferences =  abc.lazyReferences
}

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
export async function loader({request, ...rest}: { request: any }) {
    const slug = getPathname(request.url)

    const code = await compileBySlug(slug)

    const {groups: sidebarGroups} = await mapSettingsToProps(
        settings,
        slug
    )

    return {
        sidebarGroups,
        slug,
        code
    } as loaderData
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

function MDXContent(code: string) {
    return React.useMemo(
        () => code ? getMDXComponent(code) : null,
        [code]
    )
}

const LazyAtlasMDX = (id: string) => lazy(async () => {
    let mod;
    let urlPrefix;

    switch (id) {
        case "xyd-plugin-zero/openapi":
            // @ts-ignore
            mod = await import("virtual:xyd-plugin-zero/openapi");
            urlPrefix = "/rest"
            break;
        case "xyd-plugin-zero/graphql":
            // @ts-ignore
            mod = await import("virtual:xyd-plugin-zero/graphql");
            urlPrefix = "/graphql"
            break;
        default:
            throw new Error("invalid route id");
    }

    const references = []

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

    // const references = await lazyReferences(mod)

    return {
        default: ({slug, onLoaded}: { slug: string, onLoaded: () => void }) => {
            return <AtlasLazy
                references={references}
                urlPrefix={urlPrefix}
                slug={slug}
                onLoaded={onLoaded}
            />
        }
    }
});

// TODO props
function lazyAtlasMDX() {
    const routerState = useContext(UNSAFE_DataRouterStateContext)
    let id: string = ""

    routerState?.matches?.forEach(match => {
        const loader = routerState?.loaderData[match?.route?.id]

        if (loader) {
            id = match?.route?.id
        }
    })

    return memo(LazyAtlasMDX(id))
}

function Loading() {
    return <></>;
}

export default function APIReference({loaderData}: { loaderData: loaderData }) {
    const [hideOriginal, setHideOriginal] = useState(false);

    const Content = MDXContent(loaderData.code)
    const content = Content ? parse(Content) : null

    const MemoizedLazyAtlas = lazyAtlasMDX()

    function onLoad() {
        setHideOriginal(true)
    }

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

        <Atlas references={content?.references || []}/>

        {/*  TODO: check if it degrades SEO !!!*/}
        <div className={hideOriginal ? "" : "hidden"}>
            {hideOriginal ? <></> : content && <Atlas references={content?.references || []}/>}

            <Suspense fallback={<Loading/>}>
                <MemoizedLazyAtlas
                    onLoaded={onLoad}
                    slug={loaderData.slug}
                />
            </Suspense>
        </div>
    </Theme>
}