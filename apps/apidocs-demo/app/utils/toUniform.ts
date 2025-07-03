import { mapSettingsToProps } from "@xyd-js/framework/hydration"
import uniform, { pluginNavigation, type OpenAPIReferenceContext, type Reference } from "@xyd-js/uniform"
import { gqlSchemaToReferences } from "@xyd-js/gql"
import { deferencedOpenAPI, oapSchemaToReferences } from "@xyd-js/openapi"

import { SETTINGS } from "../settings"
import { uniformOpenAIMeta } from "../api/pluginOasOpenAPI";

export async function toUniform(
    prefix: string,
    example: string,
    type: string,
    value: string,
    currentSettings?: any
) {
    let references: Reference[] = []

    if (!type) {
        const extension = example.split(".").pop()
        if (extension === "json" || extension === "yaml" || extension === "yml") {
            type = "openapi"
        } else if (extension === "graphql" || extension === "gql" || extension === "gqls" || extension === "graphqls") {
            type = "graphql"
        } else if (example.startsWith('http://') || example.startsWith('https://')) {
            try {
                const response = await fetch(example)
                const contentType = response.headers.get('content-type')

                if (contentType?.includes('application/json') || contentType?.includes('text/json')) {
                    type = "openapi"
                } else if (contentType?.includes('text/yaml') || contentType?.includes('application/x-yaml')) {
                    type = "openapi"
                } else if (contentType?.includes('text/plain')) {
                    // For plain text, we might need to check the content itself
                    const text = await response.text()
                    if (text.trim().startsWith('{') || text.trim().startsWith('[')) {
                        type = "openapi"
                    } else if (text.includes('---') || text.includes('yaml')) {
                        type = "openapi"
                    }
                }
            } catch (error) {
                console.error('Error fetching URL:', error)
            }
        }
    }

    switch (type) {
        case "openapi": {
            const openApiSpec = await deferencedOpenAPI(example as string)
            references = await oapSchemaToReferences(openApiSpec)
            break
        }

        case "graphql": {
            references = await gqlSchemaToReferences(example as string)
        }
    }

    const uniformPlugins = [
        pluginNavigation(JSON.parse(JSON.stringify(SETTINGS)) as any, {
            urlPrefix: prefix
        }),
    ]

    if (value === "openai") {
        uniformPlugins.push(uniformOpenAIMeta)
    }

    const uniformData = await uniform(references || [], {
        plugins: uniformPlugins,
    })

    if (uniformData?.references) {
        references = uniformData.references
    }

    const settings = JSON.parse(JSON.stringify(currentSettings || SETTINGS))
    const apisidebar = settings?.navigation?.sidebar.find(sidebar => sidebar.route === prefix) || null

    if (uniformData?.out?.sidebar?.length && apisidebar?.pages) {
        apisidebar.pages[0].pages.push(...uniformData?.out?.sidebar || [])
    }

    const frontmatter = uniformData?.out?.pageFrontMatter || {}

    for (const ref of references) {
        const frontmatter = uniformData?.out?.pageFrontMatter || {}
        let canonical = ref.canonical
        canonical = canonical.startsWith("/") ? canonical : `/${canonical}`
        if (canonical.endsWith("/")) {
            canonical = canonical.slice(0, -1)
        }

        const meta = frontmatter[`${prefix}${canonical}`] || {}
        if (!meta) {
            continue
        }

        const ctx = ref.context as OpenAPIReferenceContext

        if (ctx.method && ctx.path) {
            meta.openapi = `#${ctx.method?.toUpperCase()} ${ctx.path}`
        }
    }

    const props = await mapSettingsToProps(
        settings,
        {},
        prefix + (references?.[0]?.canonical || ""),
        frontmatter
    )

    return {
        groups: props?.groups || [],
        settings,
        example,
        references,
        sidebar: uniformData?.out?.sidebar || [],
        pageFrontMatter: uniformData?.out?.pageFrontMatter || {},
        exampleType: type
    }
}