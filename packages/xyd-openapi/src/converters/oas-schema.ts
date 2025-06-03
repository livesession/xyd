import path from "node:path";

import { OpenAPIV3 } from "openapi-types";
import Oas from "oas";

import type { Reference, OpenAPIReferenceContext, ReferenceContext } from "@xyd-js/uniform";

import { SUPPORTED_HTTP_METHODS } from "../const";
import { oapPathToReference } from "./oas-paths";
import { oapExamples } from "./oas-examples";
import { uniformOasOptions } from "../types";
import { schemaComponentsToUniformReferences } from "./oas-componentSchemas";
import {httpMethodToUniformMethod} from "../utils";

// TODO: support one-of
// TODO: support $ref - currently we use $refParser.dereference that converts $ref into objects
// TODO: better method check system - currently we need to manually check that in few methods

// oapSchemaToReferences converts an OpenAPI schema to a list of uniform References
export function oapSchemaToReferences(
    schema: OpenAPIV3.Document,
    options?: uniformOasOptions
): Reference[] {
    const references: Reference[] = [];
    const oas = new Oas(schema as any);

    const server = schema.servers?.[0]?.url || ""

    Object.entries(schema.paths).forEach(([endpointPath, oapPath]) => {
        SUPPORTED_HTTP_METHODS.forEach((eachMethod) => {
            const httpMethod = eachMethod.toLowerCase() as OpenAPIV3.HttpMethods

            const found = httpMethodToUniformMethod(httpMethod)
            if (!found) {
                console.warn(`Unsupported method: ${httpMethod} for path: ${endpointPath}`)
                return
            }

            // Check if this method/path combination should be included based on regions
            if (options?.regions && options.regions.length > 0) {
                const regionKey = `${eachMethod.toUpperCase()} ${endpointPath}`
                    if (!options.regions.some(region => region === regionKey)) {
                    return
                }
            }

            const reference = oapPathToReference(
                schema,
                httpMethod,
                endpointPath,
                oapPath as OpenAPIV3.PathItemObject
            )

            if (reference) {
                const ctx = reference.context as OpenAPIReferenceContext
                ctx.path = endpointPath
                ctx.fullPath = path.join(server, endpointPath)

                const operation = oas.operation(endpointPath, httpMethod);
                reference.examples.groups = oapExamples(oas, operation)

                const scopes: string[] = []
                const oapMethod = oapPath?.[httpMethod] as OpenAPIV3.OperationObject
                if (oapMethod?.security) {
                    for (const security of oapMethod.security) {
                        for (const securityKey of Object.keys(security)) {
                            const securityScheme = schema?.components?.securitySchemes?.[securityKey]

                            // TODO: support other scope-like security schemes
                            if (securityScheme && "type" in securityScheme && securityScheme.type === "oauth2") {
                                const methodScopes = security[securityKey]
                                if (Array.isArray(methodScopes)) {
                                    scopes.push(...methodScopes)
                                }
                            }
                        }
                    }
                }

                ctx.scopes = scopes

                references.push(reference)
            }
        })
    })

    const schemas = schemaComponentsToUniformReferences(
        schema,
        options
    )
    references.push(...schemas)

    const tags = oas.getTags()
    sortReferencesByTags(references, tags)

    // TODO: in the future better API
    // @ts-ignore
    references.__internal_options = () => options

    return references
}

function sortReferencesByTags(references: Reference[], tags: string[]) {
    return references.sort((prev, next) => {
        const aTags = prev.context?.group || []
        const bTags = next.context?.group || []

        // Find the first tag that exists in both arrays
        for (const tag of tags) {
            const aIndex = aTags.indexOf(tag)
            const bIndex = bTags.indexOf(tag)

            if (aIndex !== -1 && bIndex !== -1) {
                return aIndex - bIndex
            }
            if (aIndex !== -1) return -1
            if (bIndex !== -1) return 1
        }

        // If no matching tags found, sort by first tag
        return (aTags[0] || '').localeCompare(bTags[0] || '')
    })
}
