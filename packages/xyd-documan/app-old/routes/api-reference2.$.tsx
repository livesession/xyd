// import path from 'path';
// import path from 'path';
import React from "react"
import {useLoaderData} from "@remix-run/react";
import {recmaCodeHike, remarkCodeHike} from "codehike/mdx";
import {parse} from "codehike";
import {compile} from "@mdx-js/mdx";
import {VFile} from "vfile";
import {EndpointsList} from "@xyd/atlas"
import {Settings, Navigation} from "@xyd/core"
import {
    SidebarGroupProps
} from "@xyd/ui";
import GustoTheme from "@xyd/theme-gusto";
// @ts-ignore
import settings from 'fake-settings';
import {promises as fs} from "fs";
import {visit} from "unist-util-visit"
// import uniform, {pluginNavigation} from "@xyd/uniform";

export type Frontmatter = {
    title: string;
};

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

// TODO: !!! BETTER ALGORITHM !!!

// filterNavigation filters navigation items based on 'tabs' configuration and current 'slug'
function filterNavigation(
    settings: Settings,
    slug: string
) {
    const topLevelTabMatcher = settings.structure?.tabs?.reduce((acc: any, tab: any) => {
        const tabLevel = tab?.url?.split("/")?.length

        if (!tabLevel) {
            return {
                ...acc
            }
        }

        if (!acc[tabLevel]) {
            return {
                ...acc,
                [tabLevel]: new Set().add(tab?.url)
            }
        }

        return {
            ...acc,
            [tabLevel]: acc[tabLevel].add(tab?.url)
        }
    }, {}) as { [level: number]: Set<string> }

    return (nav: Navigation) => {
        let match = false

        Object.keys(topLevelTabMatcher).forEach((levelStr) => {
            if (match) {
                return true
            }
            const level = parseInt(levelStr)
            const findThisSlug = slug.split("/").slice(0, level).join("/")

            function findThisPageFn(page: any) {
                if (match) {
                    return
                }

                if (typeof page === 'object') {
                    if (page.pages) {
                        page.pages.forEach(findThisPageFn)
                    }

                    return // TODO: finish
                }
                const findThisPage = page.split("/").slice(0, level).join("/")

                const set = topLevelTabMatcher[level]

                if (set.has(findThisPage) && findThisPage === findThisSlug) {
                    match = true
                    return true
                }
            }

            nav?.pages?.forEach(findThisPageFn)
        })

        return match
    }
}

// mapNavigationToProps maps @xyd/core navigation into @xyd/ui sidebar props
function mapNavigationToProps(
    settings: Settings,
    frontmatters: { [page: string]: Frontmatter },
    slug: string
): SidebarGroupProps[] {
    return settings.structure?.navigation?.filter(filterNavigation(settings, slug)).map((nav: Navigation) => {

        function mapItems(page: any) {
            if (typeof page === "object") {
                const items = page.pages?.map(mapItems)

                return {
                    title: page.group,
                    href: "",
                    active: false,
                    items,
                }
            }

            const title = frontmatters && frontmatters[page] && frontmatters[page].title

            if (!title) {
                console.error("Title not found for page", page)
            }

            // TODO: page can be object
            return {
                title,
                href: page?.startsWith("/") ? page : `/${page}`,
                active: false // TODO:
            }
        }

        return {
            group: nav.group,
            items: nav.pages?.map(mapItems),
        } as SidebarGroupProps
    }) || []
}

// type Module = {
//     frontmatter: Frontmatter
//     default: any
//     toc: any
// }

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
    // eslint-disable-next-line
    const fn = new Function(...Object.keys(scope), code)
    return fn(scope)
}

async function codeHikeComponent(
    filePath: string,
    mdxContent: string
) {
    const codeHikeOptions = {
        lineNumbers: true,
        showCopyButton: true,
        autoImport: true,
        components: {code: "Code"},
        syntaxHighlighting: {
            theme: "github-dark",
        },
    };

    const vfile = new VFile({
        path: filePath,
        value: mdxContent,
        contents: mdxContent
    });

    const compiled = await compile(vfile, {
        remarkPlugins: [normalizeCustomHeadings, [remarkCodeHike, codeHikeOptions]],
        recmaPlugins: [
            [recmaCodeHike, codeHikeOptions]
        ],
        outputFormat: 'function-body',
        development: false,
    });

    return String(compiled)
}

// type Module = {
//     frontmatter: Frontmatter
//     default: any
//     toc: any
// }

// TODO: !!! dynamic load + optimizaitons !!!
// TODO: only for one SLUG
export async function loader({params}: { params: any }) {
    const slug = params["*"] || ""

    // @ts-ignore
    const modules = import.meta.glob<{ frontmatter: Frontmatter }>(
        "/content/openapi-content/*.md",
        {eager: true}
    );

    // const setting = {
    //     ...settings,
    //     structure: {
    //         ...(settings.structure || {}),
    //         navigation: navigations
    //     }
    // }

    // const sidebarGroups = mapNavigationToProps(
    //     setting,
    //     frontmatters,
    //     "api-reference2/" + slug
    // )

    mapNavigationToProps({} as any, {} as any, slug) // TODO: finish

    const w = process.cwd()
    const filePath = w + "/openapi-content/out.md"
    const mdxContent = await fs.readFile(filePath, "utf-8");

    const code = await codeHikeComponent(
        filePath,
        mdxContent
    )

    return {
        code,
        toc: null,
        // toc, TODO:
        sidebarGroups: [],
    }
}

// TODO: vite plugin to replace with user theme

export default function Index() {
    const {code, toc, sidebarGroups} = useLoaderData<typeof loader>();

    const Component = React.useMemo(
        () => getMDXComponent(code),
        [code],
    )

    const content = parse(Component)

    // TODO: USE WITH APP FROM THERE BUT ISSUES WITH STATE (MULTIPLE RAECTS?)
    return <GustoTheme
        settings={settings}
        sidebarGroups={sidebarGroups as any} // TODO: any
        toc={toc || undefined}
    >
        <EndpointsList content={content}/>
    </GustoTheme>
}

