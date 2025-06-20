
import { oapSchemaToReferences, deferencedOpenAPI } from "@xyd-js/openapi"
import uniform, { pluginNavigation, type OpenAPIReferenceContext, type Reference } from "@xyd-js/uniform"
import { gqlSchemaToReferences } from "@xyd-js/gql"
import { mapSettingsToProps } from "@xyd-js/framework/hydration"

import { SETTINGS } from '../routes/settings';
import type { Route } from "../+types/root";
import { uniformOpenAIMeta } from "./pluginOasOpenAPI";

const prefix = "/docs/api" // TODO: IN THE FUTURE BETTER cuz should also work without prefix

export async function action({
    request,
}: Route.ClientActionArgs) {
    const formData = await request.formData();
    const example = formData.get("example");
    let type = formData.get("type");
    const value = formData.get("value");

    let references: Reference[] = []

    if (!type) {
        const extension = example.split(".").pop()
        if (extension === "json" || extension === "yaml" || extension === "yml") {
            type = "openapi"
        } else if (extension === "graphql" || extension === "gql" || extension === "gqls" || extension === "graphqls") {
            type = "graphql"
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
        pluginNavigation(SETTINGS, {
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

    const settings = JSON.parse(JSON.stringify(SETTINGS))
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