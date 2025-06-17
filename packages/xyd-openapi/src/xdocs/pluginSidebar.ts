import {OpenAPIV3} from "openapi-types";

import {
    CodeBlockTab,
    Example,
    ExampleGroup,
    Reference,
    UniformPluginArgs,
    OpenAPIReferenceContext
} from "@xyd-js/uniform";

import {XDocs, XDocsSidebar, XDocsPage} from "./types";

interface NavigationGroup {
    id: string
    title: string
    beta: boolean
}

interface ComponentMeta {
    name: string

    group: string

    example: string
}

type ExtensionSchema = OpenAPIV3.Document & {
    "x-docs"?: XDocs
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

export function uniformPluginXDocsSidebar({
                                              references,
                                              defer,
                                          }: UniformPluginArgs) {
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

        const xDocs = schema["x-docs"]

        if (!xDocs?.sidebar) {
            return {}
        }

        const navigationMap: NavigationGroupMap = {}

        // Process sidebar groups
        for (let i = 0; i < xDocs.sidebar.length; i++) {
            const navGroup: XDocsSidebar = xDocs.sidebar[i]
            if (!navGroup) {
                continue
            }

            const uniqueKey = `${navGroup.group}-${i}`
            navigationMap[uniqueKey] = {
                id: navGroup.group,
                title: navGroup.group,
                beta: false,
                index: i
            }
        }

        // Process each group and its nested pages
        for (let i = 0; i < xDocs.sidebar.length; i++) {
            const group: XDocsSidebar = xDocs.sidebar[i]
            const uniqueKey = `${group.group}-${i}`
            const navGroup = navigationMap[uniqueKey]
            if (!navGroup) {
                console.warn(`No navigation group found for group: ${group.group}`)
                continue
            }

            if (!Array.isArray(group.pages)) {
                continue
            }

            // Process nested groups and pages
            processGroupPages(xDocs, group.pages, [group.group], navGroup, output)
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

    function processGroupPages(
        xDocs: XDocs,
        pages: (XDocsSidebar | XDocsPage)[],
        groupPath: string[],
        navGroup: NavigationGroup & { index: number },
        output: Reference[],
        parentPath?: string
    ) {
        for (const page of pages) {
            if ('pages' in page && Array.isArray(page.pages)) {
                // This is a nested group
                processGroupPages(xDocs, page.pages, [...groupPath, page.group], navGroup, output, page.path)
            } else if ('type' in page && 'key' in page) {
                // This is a page
                processPage(xDocs, page, groupPath, navGroup, output, parentPath)
            }
        }
    }

    function processPage(
        xDocs: XDocs,
        page: XDocsPage,
        groupPath: string[],
        navGroup: NavigationGroup & { index: number },
        output: Reference[],
        parentPath?: string
    ) {
        let uniformRef: Reference | undefined

        switch (page.type) {
            case "endpoint": {
                const operationRef = refByOperationId[page.key]
                if (!operationRef) {
                    console.warn(`No operation found for key: ${page.key} in group ${groupPath.join('/')}`)
                    return
                }
                uniformRef = operationRef
                break
            }

            case "object": {
                const componentRef = refByComponentSchema[page.key]
                if (!componentRef) {
                    console.warn(`No component schema found for key: ${page.key} in group ${groupPath.join('/')}`)
                    return
                }

                const selector = componentRef.__UNSAFE_selector
                if (!selector || typeof selector !== "function") {
                    return
                }

                const component = selector("[component]") as OpenAPIV3.SchemaObject | undefined
                if (!component) {
                    console.warn(`No component schema found for key: ${page.key} in group ${groupPath.join('/')}`)
                    return
                }

                let componentMeta: ComponentMeta | undefined
                if (component.allOf) {
                    let found = false
                    for (const item of component.allOf) {
                        const docsMeta = (item as any)["x-docs"] as ComponentMeta | undefined

                        if (docsMeta && found) {
                            console.warn(`Multiple x-docs found in allOf for component schema: ${page.key} in group ${groupPath.join('/')}`)
                        }

                        if (docsMeta) {
                            found = true
                            componentMeta = docsMeta
                            break
                        }
                    }

                    if (!found) {
                        console.warn(`No x-docs found in allOf for component schema: ${page.key} in group ${groupPath.join('/')}`)
                        return
                    }
                } else {
                    const docsMeta = (component as any)["x-docs"] as ComponentMeta | undefined
                    if (docsMeta) {
                        componentMeta = docsMeta
                    }
                }

                uniformRef = componentRef
                if (!componentMeta) {
                    break
                }

                componentRef.title = componentMeta.name || componentRef.title

                if (componentMeta.example) {
                    const exampleGroups = oasXDocsExamples(componentMeta.example)
                    uniformRef.examples = {
                        groups: exampleGroups,
                    }
                }
                break
            }

            default: {
                console.warn(`Unknown page type: ${page.type} in group ${groupPath.join('/')}`)
                return
            }
        }

        if (!uniformRef) {
            return
        }

        if (xDocs.sidebarPathStrategy === "inherit") {
            const ctx = uniformRef.context as OpenAPIReferenceContext | undefined
            let firstPart = ""
            if (parentPath) {
                firstPart = parentPath
            } else {
                firstPart = ctx?.path || ""
            }

            const canonical = joinPaths(firstPart || "", page.path)
            if (canonical) {
                uniformRef.canonical = canonical
            }
        } else if (page.path) {
            uniformRef.canonical = joinPaths(parentPath, page.path)
        } else if (parentPath) {
            uniformRef.canonical = parentPath
        }

        if (!uniformRef.context) {
            uniformRef.context = {}
        }

        uniformRef.context.group = groupPath

        output.push(uniformRef)
    }

    return function pluginXDocsSidebarInner(ref: Reference) {
        // @ts-ignore
        const selector = ref.__UNSAFE_selector
        if (!selector || typeof selector !== "function") {
            return
        }

        const oapSchema = selector("[schema]")
        if (!oapSchema) {
            return
        }
        schema = oapSchema

        const ctx = ref.context as OpenAPIReferenceContext | undefined
        if (ctx?.componentSchema) {
            refByComponentSchema[ctx.componentSchema] = ref
        }

        const methodPath = selector("[method] [path]") as OpenAPIV3.OperationObject | undefined
        if (!methodPath) {
            return
        }

        const oapMethod = selector("[method]")
        if (!oapMethod) {
            return
        }

        let id = methodPath.operationId
        if (!id) {
            id = (oapMethod?.httpMethod?.toUpperCase() + " " + oapMethod?.path || "").trim()
        }
        refByOperationId[id] = ref

        const meta = (methodPath as any)["x-docs"]
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
            const exampleGroups = oasXDocsExamples(meta.examples)
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
    }
}

function oasXDocsExamples(examples: Examples) {
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

function sanitizePath(path: string): string {
    // Remove path parameters like {userId} or :userId
    return path.replace(/\/\{[^}]+\}/g, '').replace(/\/:[^/]+/g, '')
}

function joinPaths(...paths: (string | undefined)[]): string {
    return paths
        .filter(Boolean)
        .map(path => {
            // Remove leading and trailing slashes
            path = path!.replace(/^\/+|\/+$/g, '')
            // Ensure path starts with / if it's not empty
            return path ? `/${path}` : ''
        })
        .join('')
        .replace(/\/+/g, '/') // Replace multiple slashes with single slash
        .replace(/\/\{[^}]+\}/g, '') // Remove {param} segments
        .replace(/\/:[^/]+/g, '') // Remove :param segments
}

