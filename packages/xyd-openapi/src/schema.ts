import {OpenAPIV3} from "openapi-types";
import Oas from "oas";

import type {Reference, OpenAPIReferenceContext} from "@xyd-js/uniform";

import {SUPPORTED_HTTP_METHODS} from "./const";
import {oapPathToReference} from "./paths";
import {oapExamples} from "./examples";

// TODO: support one-of
// TODO: support $ref - currently we use $refParser.dereference that converts $ref into objects
// TODO: better method check system - currently we need to manually check that in few methods

interface oapSchemaToReferencesOptions {
    regions?: string[] // Format: 'METHOD /path' e.g. 'GET /users'
}

// oapSchemaToReferences converts an OpenAPI schema to a list of uniform References
export function oapSchemaToReferences(
    schema: OpenAPIV3.Document,
    options?: oapSchemaToReferencesOptions
): Reference[] {
    const references: Reference[] = [];
    const oas = new Oas(schema as any);

    const server = schema.servers?.[0]?.url || ""

    Object.entries(schema.paths).forEach(([path, oapPath]) => {
        SUPPORTED_HTTP_METHODS.forEach((eachMethod) => {
            const httpMethod = eachMethod.toLowerCase()

            // Skip if method is not supported
            switch (httpMethod) {
                case 'get':
                case 'put':
                case 'post':
                case 'delete':
                case 'patch':
                    break
                default:
                    console.error(`Unsupported method: ${httpMethod}`)
                    return
            }

            // Check if this method/path combination should be included based on regions
            if (options?.regions && options.regions.length > 0) {
                const regionKey = `${eachMethod.toUpperCase()} ${path}`
                if (!options.regions.some(region => region === regionKey)) {
                    return
                }
            }

            const reference = oapPathToReference(
                httpMethod,
                path,
                oapPath as OpenAPIV3.PathItemObject
            )

            if (reference) {
                const ctx = reference.context as OpenAPIReferenceContext
                ctx.path = `${encodeURIComponent(server)}${encodeURIComponent(path)}`

                const operation = oas.operation(path, httpMethod);
                reference.examples.groups = oapExamples(oas, operation)

                references.push(reference)
            }
        })
    })

    return references
}
