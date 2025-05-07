import path from 'node:path';

import matter from 'gray-matter';

import type { Sidebar, Metadata, MetadataMap, Settings, PageURL } from "@xyd-js/core";

import { Reference } from "./types";

const DEFAULT_VIRTUAL_FOLDER = ".xyd/.cache/.content" // TODO: share this + .xyd/.build/.content for build

const DEFAULT_GROUP_NAME = "API Reference" // TODO: configurable

type GroupMap = {
    [key: string]: {
        __groups: GroupMap
        pages: Set<string>
    }
}

export interface pluginNavigationOptions {
    urlPrefix: string
    defaultGroup?: string
}

export function pluginNavigation(
    settings: Settings,
    options: pluginNavigationOptions
) {
    if (!options.urlPrefix) {
        throw new Error("urlPrefix is required")
    }

    return function pluginNavigationInner(defer: (defer: () => {
        pageFrontMatter: MetadataMap
        sidebar: Sidebar[]
    }) => void) {
        const pageFrontMatter: MetadataMap = {}
        const groupMaps: GroupMap = {}

        defer(() => {
            return {
                pageFrontMatter: pageFrontMatter,
                sidebar: convertGroupMapsToSidebar(groupMaps) as Sidebar[]
            }
        })

        return (ref: Reference) => {
            // TODO: pluginMatter before?
            const content = typeof ref.description === "string" ? matter(ref.description || "") : matter("")
            if (!content.data) {
                console.error("(pluginNavigation): matter data not found", ref.canonical)
                return
            }

            const data = content.data as Metadata
            const pagePath = path.join(options.urlPrefix, ref.canonical)

            if (!data.title) {
                data.title = ref.title
            }
            if (!data.group) {
                data.group = [options.defaultGroup || DEFAULT_GROUP_NAME]
            }

            if (data.title) {
                pageFrontMatter[pagePath] = {
                    title: data.title,
                }
            }

            if (typeof data?.group === "string") {
                // TODO: seek nested group (it's not always from 0)
                throw new Error("group as string is not supported yet")
            }

            data.group.reduce((groups: GroupMap, group: string, i: number) => {
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

            // back description to original without frontmatter
            ref.description = content.content
        }
    }
}

function convertGroupMapsToSidebar(groupMaps: GroupMap): Sidebar[] {
    const nav: Sidebar[] = []

    Object.keys(groupMaps).map((groupName) => {
        const current = groupMaps[groupName]

        const pages: PageURL[] = []

        current.pages.forEach((page: string) => {
            pages.push({
                virtual: path.join(DEFAULT_VIRTUAL_FOLDER, page),
                page: page,
            })
        })

        if (Object.keys(current.__groups).length) {
            const subNav: Sidebar = {
                group: groupName,
                pages: convertGroupMapsToSidebar(current.__groups)
            }

            nav.push(subNav)

            return
        }

        nav.push({
            group: groupName,
            pages,
        })
    })

    return nav
}

// example usage:
// const response = uniform([/* references */], {
//     plugins: [pluginNavigation({
//         urlPrefix: "/docs"
//     })],
// });


