import path from 'path';
import matter from 'gray-matter';
import {Sidebar, FrontMatter, PageFrontMatter} from "@xyd-js/core";

import {Reference} from "./types";
import uniform from "./index";

// interface UniformFrontMatter extends FrontMatter { // TODO: it's concept only
//     scopes?: string
// }

type GroupMap = {
    [key: string]: {
        __groups: GroupMap
        pages: Set<string>
    }
}

export interface pluginNavigationOptions {
    urlPrefix: string
}

export function pluginNavigation(options: pluginNavigationOptions) {
    if (!options.urlPrefix) {
        throw new Error("urlPrefix is required")
    }

    return function pluginNavigationInner(cb: (cb: () => {
        pageFrontMatter: PageFrontMatter
        sidebar: Sidebar[]
    }) => void) {
        const pageFrontMatter: PageFrontMatter = {}
        const groupMaps: GroupMap = {}

        cb(() => {
            return {
                pageFrontMatter: pageFrontMatter,
                sidebar: convertGroupMapsToNavigations(groupMaps) as Sidebar[]
            }
        })

        return (ref: Reference) => {
            const content = matter(ref.description || "") // TODO: pluginMatter before?

            if (content.data) {
                const data = content.data as FrontMatter

                const pagePath = path.join(options.urlPrefix, ref.canonical)

                if (data.title) {
                    pageFrontMatter[pagePath] = {
                        title: data.title,
                    }
                }

                if (data.group) {
                    if (typeof content?.data?.group === "string") {
                        // TODO: seek nested group (it's not always from 0)
                        throw new Error("group as string is not supported yet")
                    }

                    content.data.group.reduce((groups: GroupMap, group: string, i: number) => {
                        if (!groups[group]) {
                            groups[group] = {
                                __groups: {},
                                pages: new Set()
                            }
                        }

                        if (i === content.data.group.length - 1) {
                            groups[group].pages.add(pagePath)
                        }

                        return groups[group].__groups
                    }, groupMaps)
                }

                // back description to original without frontmatter
                ref.description = content.content
            }
        }
    }
}


function convertGroupMapsToNavigations(groupMaps: GroupMap): Sidebar[] {
    const nav: Sidebar[] = []

    Object.keys(groupMaps).map((groupName) => {
        const current = groupMaps[groupName]

        const pages: string[] | Sidebar[] = []

        current.pages.forEach((page: string) => {
            pages.push(page)
        })

        if (Object.keys(current.__groups).length) {
            const subNav: Sidebar = {
                group: groupName,
                pages: convertGroupMapsToNavigations(current.__groups)
            }

            nav.push(subNav)
        } else {
            nav.push({
                group: groupName,
                pages,
            })
        }
    })

    return nav
}

// example usage:
// const response = uniform([/* references */], {
//     plugins: [pluginNavigation({
//         urlPrefix: "/docs"
//     })],
// });


