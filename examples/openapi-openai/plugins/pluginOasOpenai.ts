import { Settings } from "@xyd-js/core";
import { CodeBlockTab, Example, ExampleGroup, Reference, UniformPluginArgs } from "@xyd-js/uniform";
import type { Plugin, PluginConfig } from "@xyd-js/plugins";

export default function pluginOasOpenai(settings: Settings): PluginConfig {
    return {
        name: "oas-openai",
        uniform: [
            uniformOpenAIMeta,
        ]
    }
}

export function uniformOpenAIMeta() {
    return function pluginOpenAIMetaInner(ref: Reference) {
        /// TODO: !!!! BETTER !!! MORE STREAM LIKE
        // @ts-ignore
        const selector = ref.__UNSAFE_selector
        if (!selector || typeof selector !== "function") {
            return
        }

        const methodPath = selector("[method] [path]")
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
