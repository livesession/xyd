import { OpenAPIV3 } from "openapi-types";
import Oas from "oas";
// @ts-ignore
import { Operation } from 'oas/operation'; // TODO: fix ts
import oasToSnippet from "@readme/oas-to-snippet";
import OpenAPISampler from "openapi-sampler";
import type { JSONSchema7 } from "json-schema";

import { ExampleGroup, Example } from "@xyd-js/uniform";
import { SUPPORTED_CONTENT_TYPES } from "./const";

// TODO: option with another languages
export function oapExamples(
    oas: Oas,
    operation: Operation
): ExampleGroup[] {
    const exampleGroups = [
        ...reqBodyExmaples(operation, oas),
        ...resBodyExmaples(operation, oas),
    ]

    return exampleGroups
}

function reqBodyExmaples(operation: Operation, oas: Oas) {
    const exampleGroups: ExampleGroup[] = []

    if (operation.schema.requestBody) {
        const body = operation?.schema?.requestBody as OpenAPIV3.RequestBodyObject

        const findSupportedContent = Object.keys(body.content).find(key => SUPPORTED_CONTENT_TYPES[key])
        if (!findSupportedContent) {
            return exampleGroups
        }

        const content = body.content[findSupportedContent]
        let schema = content?.schema as JSONSchema7
        if (!schema) {
            return exampleGroups
        }
        schema = fixAllOfBug(schema)

        if (!schema) {
            return exampleGroups
        }

        let requestData
        // Check for examples in the request body content
        if (content.examples) {
            const requestExample = content.examples["request"]
            if (requestExample && "value" in requestExample) {
                requestData = requestExample.value
            }
        }

        // If no example found, generate sample data from schema
        if (!requestData) {
            requestData = OpenAPISampler.sample(schema)
        }

        // TODO: snippet languages options
        const { code } = oasToSnippet(oas, operation, {
            body: requestData
        }, null, "shell");

        const examples: Example[] = []

        examples.push({
            codeblock: {
                tabs: [{
                    title: "bash",
                    language: "bash",
                    code: code || "",
                }]
            }
        })

        if (examples.length > 0) {
            exampleGroups.push({
                description: "Example request",
                examples
            })
        }
    }

    return exampleGroups
}

function resBodyExmaples(operation: Operation, oas: Oas) {
    const exampleGroups: ExampleGroup[] = []

    if (operation.schema.responses) {
        const responses = operation.schema.responses as OpenAPIV3.ResponsesObject

        const examples: Example[] = []

        Object.entries(responses).forEach(([status, r]) => {
            const response = r as OpenAPIV3.ResponseObject
            if (!response.content) {
                return
            }

            const findSupportedContent = Object.keys(response.content).find(key => SUPPORTED_CONTENT_TYPES[key])
            if (!findSupportedContent) {
                return
            }

            const content = response.content[findSupportedContent]
            const schema = content?.schema as JSONSchema7

            if (!schema) {
                return
            }

            let responseData
            // Check for examples in the response content
            if (content.examples) {
                const responseExample = content.examples["response"]
                if (responseExample && "value" in responseExample) {
                    responseData = responseExample.value
                }
            }

            // If no example found, generate sample data from schema
            if (!responseData) {
                responseData = OpenAPISampler.sample(schema)
            }

            examples.push({
                codeblock: {
                    title: status,
                    tabs: [{
                        title: "json",
                        language: "json",
                        code: JSON.stringify(responseData, null, 2) || "",
                    }]
                }
            })
        })

        if (examples.length > 0) {
            exampleGroups.push({
                description: "Example response",
                examples
            })
        }
    }

    return exampleGroups
}

/**
 * fixAllOfBug fixes below case:
 * 
 * ```yaml
 * allOf:
 *   - $ref: '#/components/schemas/SomeSchema'
 *   - type: object
 *     required:
 *     properties:
 * ```
 * 
 */
function fixAllOfBug(schema: JSONSchema7) {
    const modifiedSchema = { ...schema }

    if (schema?.allOf) {
        schema.allOf.forEach((prop, i) => {
            const propObj = prop as object

            if ("properties" in propObj && !propObj["properties"]) {
                delete modifiedSchema.allOf?.[i]
            }
        })
    }

    return modifiedSchema
}