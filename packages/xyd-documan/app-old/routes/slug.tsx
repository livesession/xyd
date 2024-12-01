// import path from 'path';
// import path from 'path';
// import {useLoaderData} from "@remix-run/react";
// import {parse} from "codehike";
// import {parseRoot} from "codehike/blocks"
// import {EndpointsList} from "@xyd/atlas"
import {Settings, Navigation} from "@xyd/core"
import {
    getComponents,
} from "@xyd/ui/headless";
import {
    SidebarGroupProps
} from "@xyd/ui";
import GustoTheme from "@xyd/theme-gusto";
// @ts-ignore
import settings from 'fake-settings';

export type Frontmatter = {
    title: string;
};

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

            nav?.pages?.forEach((page: any) => {
                const findThisPage = page.split("/").slice(0, level).join("/")

                const set = topLevelTabMatcher[level]

                if (set.has(findThisPage) && findThisPage === findThisSlug) {
                    match = true
                    return true
                }
            })
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
    return settings.structure?.navigation?.filter(filterNavigation(settings, slug)).map((nav: any) => {
        return {
            group: nav.group,
            items: nav.pages?.map((page: any) => {
                const title = frontmatters && frontmatters[page] && frontmatters[page].title

                if (!title) {
                    console.error("Title not found for page", page)
                }
                return {
                    title,
                    href: page?.startsWith("/") ? page : `/${page}`,
                    active: false // TODO:
                }
            }),
        } as SidebarGroupProps
    }) || []
}

type Module = {
    frontmatter: Frontmatter
    default: any
    toc: any
}

// TODO: !!! dynamic load + optimizaitons !!!
// TODO: only for one SLUG
async function getContent(): Promise<
    {
        components: { [page: string]: any },
        frontmatters: { [page: string]: Frontmatter },
        tocs: { [page: string]: any }
    }
> {
    // @ts-ignore
    const modules = import.meta.glob<{ frontmatter: Frontmatter }>(
        "/content/**/*.mdx",
        {eager: true}
    );
    const frontmatters = {} as any
    const tocs = {} as any

    const components: any = {}

    for (let filePath in modules) {
        const module: Module = modules[filePath]
        const page = filePath.replace("/content/", "").replace(".mdx", "")

        frontmatters[page] = module?.frontmatter
        tocs[page] = module?.toc
        components[page] = module?.default
    }

    return {
        components,
        frontmatters,
        tocs
    }
    // return pages["docs/get-started/changelog"] || Content
}

const {
    components,
    frontmatters,
    tocs
} = await getContent()

export function loader({params}: { params: any }) {
    const slug = params["slug"] || ""

    const props = mapNavigationToProps(
        settings,
        frontmatters,
        slug
    )

    return {
        sidebarGroups: props,
        slug,
    }
}

// TODO: vite plugin to replace with user theme

export default function Index({loaderData}: { loaderData: ReturnType<typeof loader> }) {
    const Component = components[loaderData.slug] || function () {
        return null
    }

    const toc = tocs[loaderData.slug]
    // const App = WithApp(settings, data.sidebarGroups)

    // const Content =
    // TODO: USE WITH APP FROM THERE BUT ISSUES WITH STATE (MULTIPLE RAECTS?)
    return <GustoTheme
        settings={settings}
        sidebarGroups={loaderData.sidebarGroups}
        toc={toc}
    >
        <Component components={getComponents()}/>
    </GustoTheme>
}

