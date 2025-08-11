import path from 'node:path';

import type { Sidebar, Metadata, MetadataMap, Settings, PageURL } from "@xyd-js/core";

import type { UniformPluginArgs, UniformPlugin } from "../index";
import { CodeBlockTab, Example, ExampleGroup, Reference } from "../types";

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

type pluginNavigationOutput = {
    pageFrontMatter: MetadataMap;
    sidebar: Sidebar[];
}

export function pluginNavigation(
    settings: Settings,
    options: pluginNavigationOptions
): UniformPlugin<pluginNavigationOutput> {
    if (!options.urlPrefix) {
        throw new Error("urlPrefix is required")
    }

    return function pluginNavigationInner({
        defer,
    }: UniformPluginArgs) {
        const pageFrontMatter: MetadataMap = {}
        const groupMaps: GroupMap = {}

        defer(() => ({
            pageFrontMatter,
            sidebar: convertGroupMapsToSidebar(settings, groupMaps) as Sidebar[]
        }))

        return (ref: Reference) => {
            const dataCtx = ref.context
            const pagePath = path.join(options.urlPrefix, ref.canonical)

            let group = dataCtx?.group || []
            let title = ref.title

            if (pageFrontMatter[pagePath]) {
                console.error("(pluginNavigation): pageFrontMatter[pagePath] already exists", pagePath)
            }

            if (!group) {
                group = [options.defaultGroup || DEFAULT_GROUP_NAME]
            }

            pageFrontMatter[pagePath] = {
                title,
            }

            if (typeof group === "string") {
                // TODO: seek nested group (it's not always from 0)
                throw new Error("group as string is not supported yet")
            }

            group.reduce((groups: GroupMap, groupName: string, i: number) => {
                if (!groups[groupName]) {
                    groups[groupName] = {
                        __groups: {},
                        pages: new Set()
                    }
                }

                if (i === group.length - 1) {
                    groups[groupName].pages.add(pagePath)
                }

                return groups[groupName].__groups
            }, groupMaps)
        }
    }
}

function convertGroupMapsToSidebar(settings: Settings, groupMaps: GroupMap): Sidebar[] {
    const nav: Sidebar[] = []

    Object.keys(groupMaps).map((groupName) => {
        const current = groupMaps[groupName]

        const pages: PageURL[] = []

        current.pages.forEach((page: string) => {
            if (settings?.engine?.uniform?.store) {
                pages.push(page)
                return
            }
            pages.push({
                virtual: path.join(DEFAULT_VIRTUAL_FOLDER, page),
                page: page,
            })
        })

        if (Object.keys(current.__groups).length) {
            const subNav: Sidebar = {
                group: groupName,
                pages: convertGroupMapsToSidebar(settings, current.__groups)
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

// TODO: in the future xyd settings must be removed cuz uniform will be part of opendocs
// example usage:
// const response = uniform([/* references */], {
//     plugins: [pluginNavigation({}, {
//         urlPrefix: "/docs"
//     })],
// });
