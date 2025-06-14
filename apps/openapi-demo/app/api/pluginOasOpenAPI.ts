import {OpenAPIV3} from "openapi-types";

import {
    CodeBlockTab,
    Example,
    ExampleGroup,
    Reference,
    UniformPluginArgs,
    OpenAPIReferenceContext
} from "@xyd-js/uniform";

interface NavigationGroup {
    id: string

    title: string

    beta: boolean
}

interface Group {
    id: string

    title: string

    description: string

    navigationGroup: string

    sections: GroupSection[]
}

interface GroupSection {
    type: "endpoint" | "object"

    key: string

    path: "object" | "list" | "<auto>"
}

interface ComponentMeta {
    name: string

    group: string

    example: string
}

interface oAiMeta {
    navigationGroups: NavigationGroup[]

    groups: Group[]
}

type ExtensionSchema = OpenAPIV3.Document & {
    "x-oaiMeta"?: oAiMeta
}

type NavigationGroupMap = {
    [id: string]: NavigationGroup & {
        index: number
    }
}

interface OperationExample {
    request: string | { [lang: string]: string }
    response: string | { [lang: string]: string }
}

type Examples = string | OperationExample | OperationExample[]

export function uniformOpenAIMeta({
                                      references,
                                      defer,
                                  }: UniformPluginArgs) {
    // TODO: in the future better api to get uniform specific data at beginning (e.g openapi schema)
    let schema: ExtensionSchema | undefined
    const refByOperationId: {
        [key: string]: Reference
    } = {}
    const refByComponentSchema: {
        [key: string]: Reference
    } = {}

    defer(() => {
        // @ts-ignore
        if (typeof references.__internal_options === "function") {
            // @ts-ignore
            const options = references.__internal_options()

            if (options?.regions?.length) {
                return {}
            }
        }

        const output: Reference[] = []
        if (!schema) {
            return {}
        }

        const oaiMeta = schema["x-oaiMeta"]

        if (!oaiMeta) {
            return {}
        }

        const navigationMap: NavigationGroupMap = {}

        for (let i in oaiMeta.navigationGroups || []) {
            const navGroup = oaiMeta.navigationGroups[i]

            if (!navGroup) {
                continue
            }

            navigationMap[navGroup.id] = {
                ...navGroup,
                index: parseInt(i, 10)
            }
        }

        for (const group of oaiMeta.groups) {
            const navGroup = navigationMap[group.navigationGroup]
            if (!navGroup) {
                console.warn(`No navigation group found for group: ${group.id}`)
                continue
            }

            if (!Array.isArray(group.sections)) {
                continue
            }

            for (const section of group.sections) {
                let uniformRef: Reference | undefined

                switch (section.type) {
                    case "endpoint": {
                        const operationRef = refByOperationId[section.key]
                        if (!operationRef) {
                            console.warn(`No operation found for key: ${section.key} in group ${group.id}`)
                            break
                        }

                        uniformRef = operationRef

                        break
                    }

                    case "object": {
                        const componentRef = refByComponentSchema[section.key]
                        if (!componentRef) {
                            console.warn(`No component schema found for key: ${section.key} in group ${group.id}`)
                            break
                        }

                        const component = componentRef.__UNSAFE_selector("[component]") as OpenAPIV3.SchemaObject | undefined
                        if (!component) {
                            console.warn(`No component schema found for key: ${section.key} in group ${group.id}`)
                            break
                        }

                        let componentMeta: ComponentMeta | undefined
                        if (component.allOf) {
                            let found = false
                            for (const item of component.allOf) {
                                const oAiMeta = item["x-oaiMeta"] as ComponentMeta | undefined

                                if (oAiMeta && found) {
                                    console.warn(`Multiple x-oaiMeta found in allOf for component schema: ${section.key} ingroup ${group.id}`)
                                }

                                if (oAiMeta) {
                                    found = true
                                    componentMeta = oAiMeta
                                    break
                                }
                            }

                            if (!found) {
                                console.warn(`No x-oaiMeta found in allOf for component schema: ${section.key} in group ${group.id}`)
                                break
                            }

                        } else {
                            const oAiMeta = component["x-oaiMeta"] as ComponentMeta | undefined
                            if (!oAiMeta) {
                                console.warn(`No x-oaiMeta found for component schema: ${section.key} in group ${group.id}`)
                                break
                            }

                            componentMeta = oAiMeta
                        }

                        if (!componentMeta) {
                            console.warn(`No component meta found for key: ${section.key} in group ${group.id}`)
                            break
                        }

                        componentRef.title = componentMeta.name || componentRef.title
                        uniformRef = componentRef

                        if (componentMeta.example) {
                            const exampleGroups = oasOpenAiExamples(componentMeta.example)

                            uniformRef.examples = {
                                groups: exampleGroups,
                            }
                        }

                        break
                    }

                    default: {
                        uniformRef = undefined
                        console.warn(`Unknown section type: ${section.type} in group ${group.id}`)
                        continue
                    }
                }

                if (!uniformRef) {
                    continue
                }

                if (section.path && section.path !== "<auto>") {
                    uniformRef.canonical = `${group.id}/${section.path}`
                }

                if (!uniformRef.context) {
                    uniformRef.context = {}
                }

                uniformRef.context.group = [
                    navGroup.title,
                    group.title
                ]

                output.push(uniformRef)
            }
        }

        // Clear references and set from output
        if (Array.isArray(references)) {
            references.length = 0
            references.push(...output)
        } else {
            references = output[0] || references
        }

        return {}
    })

    return function pluginOpenAIMetaInner(ref: Reference) {
        /// TODO: !!!! BETTER !!! MORE STREAM LIKE
        // @ts-ignore
        const selector = ref.__UNSAFE_selector
        const oapSchema = selector("[schema]")
        if (!oapSchema) {
            return
        }
        schema = oapSchema

        const ctx = ref.context as OpenAPIReferenceContext | undefined
        if (ctx?.componentSchema) {
            refByComponentSchema[ctx.componentSchema] = ref
        }

        if (!selector || typeof selector !== "function") {
            return
        }

        const methodPath = selector("[method] [path]") as OpenAPIV3.OperationObject | undefined
        if (!methodPath) {
            return
        }

        const oapMethod = selector("[method]")
        if (!oapMethod) {
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
            const exampleGroups = oasOpenAiExamples(meta.examples)

            ref.examples = {
                groups: exampleGroups,
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

        refByOperationId[methodPath.operationId || ""] = ref
    }
}

function oasOpenAiExamples(examples: Examples) {
    const groups: ExampleGroup[] = []

    if (examples) {
        if (Array.isArray(examples)) {
            // Create request group
            const requestExamples: Example[] = []
            examples.forEach((example: {
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
            examples.forEach((example: {
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
            if (typeof examples === "string") {
                groups.push({
                    description: "Example",
                    examples: [
                        {
                            description: "",
                            codeblock: {
                                tabs: [
                                    {
                                        title: "",
                                        language: "json",
                                        code: examples
                                    }
                                ]
                            }
                        }
                    ]
                })
            } else {
                if (examples.request) {
                    const tabs: CodeBlockTab[] = []

                    if (typeof examples.request === "string") {
                        tabs.push({
                            title: "",
                            language: "json",
                            code: examples.request || "",
                        })
                    } else {
                        for (let lang of Object.keys(examples.request)) {
                            const code = examples.request[lang] || ""

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

                if (examples.response) {
                    const tabs: CodeBlockTab[] = []
                    if (typeof examples.response === "string") {
                        tabs.push({
                            title: "",
                            language: "json",
                            code: examples.response || "",
                        })
                    } else {
                        for (let lang of Object.keys(examples.response)) {
                            const code = examples.response[lang] || ""

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
        }
    }

    return groups
}