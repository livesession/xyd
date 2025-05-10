import path from 'node:path';

import type { Sidebar, Metadata, MetadataMap, Settings, PageURL } from "@xyd-js/core";

import type { UniformPluginArgs, UniformPlugin } from "./index";
import { CodeBlockTab, Example, ExampleGroup, Reference } from "./types";

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
): UniformPlugin<{ pageFrontMatter: MetadataMap; sidebar: Sidebar[] }> {
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

// example usage:
// const response = uniform([/* references */], {
//     plugins: [pluginNavigation({}, {
//         urlPrefix: "/docs"
//     })],
// });

// const response2 = uniform([/* uniform stream */], {
//     plugins: [openaiMeta],
// });

export function pluginOpenAIMeta() {
    return function pluginOpenAIMetaInner(ref: Reference) {
        /// TODO: !!!! BETTER !!! MORE STREAM LIKE
        // @ts-ignore
        const selector = ref.__UNSAFE_selector
        if (!selector) {
            return
        }

        const methodPath = selector["[method] [path]"]
        if (!methodPath) {
            return
        }

        const meta = methodPath["x-oaiMeta"]
        if (!meta) {
            return
        }

        if (meta.name) {
            ref.title = meta.name
        }

        if (meta.group) {
            if (ref.context) {
                ref.context.group = [meta.group]
            }
        }

        if (!ref.description) {
            ref.description = methodPath.summary || ""
        }

        if (meta.examples) {
            const groups: ExampleGroup[] = []

            if (Array.isArray(meta.examples)) {
                // Create request group
                const requestExamples: Example[] = []
                meta.examples.forEach((example: {
                    title?: string;
                    request?: string | Record<string, string>;
                    response?: string | Record<string, string>;
                }) => {
                    if (example.request) {
                        const tabs: CodeBlockTab[] = []
                        if (typeof example.request === "string") {
                            tabs.push({
                                title: "",
                                language: "json",
                                code: example.request
                            })
                        } else {
                            for (let lang of Object.keys(example.request)) {
                                const code = example.request[lang] || ""
                                const language = lang === "curl" ? "bash" : 
                                               lang === "node.js" ? "js" : lang

                                tabs.push({
                                    title: lang,
                                    language,
                                    code
                                })
                            }
                        }
                        if (tabs.length > 0) {
                            requestExamples.push({
                                description: example.title || "",
                                codeblock: { 
                                    title: example.title || "",
                                    tabs
                                 }
                            })
                        }
                    }
                })
                if (requestExamples.length > 0) {
                    groups.push({
                        description: "Example request",
                        examples: requestExamples
                    })
                }

                // Create response group
                const responseExamples: Example[] = []
                meta.examples.forEach((example: {
                    title?: string;
                    request?: string | Record<string, string>;
                    response?: string | Record<string, string>;
                }) => {
                    if (example.response) {
                        const tabs: CodeBlockTab[] = []
                        if (typeof example.response === "string") {
                            tabs.push({
                                title: "",
                                language: "json",
                                code: example.response
                            })
                        } else {
                            for (let lang of Object.keys(example.response)) {
                                const code = example.response[lang] || ""
                                const language = lang === "curl" ? "bash" : 
                                               lang === "node.js" ? "js" : lang

                                tabs.push({
                                    title: lang,
                                    language,
                                    code
                                })
                            }
                        }
                        if (tabs.length > 0) {
                            responseExamples.push({
                                description: example.title || "",
                                codeblock: { 
                                    title: example.title || "",
                                    tabs
                                 }
                            })
                        }
                    }
                })
                if (responseExamples.length > 0) {
                    groups.push({
                        description: "Example response",
                        examples: responseExamples
                    })
                }
            } else {
                if (meta.examples.request) {
                    const tabs: CodeBlockTab[] = []

                    if (typeof meta.examples.request === "string") {
                        tabs.push({
                            title: "",
                            language: "json",
                            code: meta.examples.request || "",
                        })
                    } else {
                        for (let lang of Object.keys(meta.examples.request)) {
                            const code = meta.examples.request[lang] || ""

                            switch (lang) {
                                case "curl":
                                    lang = "bash"
                                    break
                                case "node.js":
                                    lang = "js"
                                    break
                                default:
                                    break
                            }

                            tabs.push({
                                title: lang,
                                language: lang,
                                code,
                            })
                        }
                    }

                    groups.push({
                        description: "Example request",
                        examples: [
                            {
                                description: "",
                                codeblock: {
                                    tabs
                                }
                            }
                        ]
                    })
                }

                if (meta.examples.response) {
                    const tabs: CodeBlockTab[] = []
                    if (typeof meta.examples.response === "string") {
                        tabs.push({
                            title: "",
                            language: "json",
                            code: meta.examples.response || "",
                        })
                    } else {
                        for (let lang of Object.keys(meta.examples.response)) {
                            const code = meta.examples.response[lang] || ""

                            switch (lang) {
                                case "curl":
                                    lang = "bash"
                                    break
                                case "node.js":
                                    lang = "js"
                                    break
                                default:
                                    break
                            }

                            tabs.push({
                                title: lang,
                                language: lang,
                                code,
                            })
                        }
                    }

                    groups.push({
                        description: "Example response",
                        examples: [
                            {
                                description: "",
                                codeblock: {
                                    tabs
                                }
                            }
                        ]
                    })
                }
            }

            ref.examples = {
                groups
            }
        }

        if (meta.returns) {
            if (ref.definitions?.length) {
                ref.definitions[ref.definitions.length - 1] = {
                    title: ref.definitions[ref.definitions.length - 1].title,
                    description: meta.returns,
                    properties: []
                }
            } else {
                ref.definitions = [
                    {
                        title: "Response",
                        description: meta.returns,
                        properties: []
                    }
                ]
            }
        }
    }
}