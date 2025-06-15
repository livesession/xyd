import {OpenAPIV3} from "openapi-types";
import Oas from "oas";
// @ts-ignore
import {Operation} from 'oas/operation'; // TODO: fix ts
import oasToSnippet from "@readme/oas-to-snippet";
import OpenAPISampler from "openapi-sampler";
import type {JSONSchema7} from "json-schema";

import {ExampleGroup, Example, CodeBlockTab} from "@xyd-js/uniform";

import {BUILT_IN_PROPERTIES} from "../const";

// TODO: custom snippet languages options
const SUPPORTED_LANGUAGES = ["shell", "javascript", "python", "go"]

// TODO: option with another languages
export function oapExamples(
    oas: Oas,
    operation: Operation,
    visitedExamples?: Map<JSONSchema7 | JSONSchema7[], any>
): ExampleGroup[] {
    const exampleGroups = [
        ...reqExamples(operation, oas, visitedExamples),
        ...resBodyExmaples(operation, oas, visitedExamples),
    ]

    return exampleGroups
}

function langFallback(lang: string): string {
    const langLower = lang.toLowerCase()

    switch (langLower) {
        case "curl": {
            return "shell";
        }
    }

    return langLower;
}
function reqExamples(operation: Operation, oas: Oas, vistedExamples?: Map<JSONSchema7 | JSONSchema7[], any>): ExampleGroup[] {
    const exampleGroups: ExampleGroup[] = []
    const examples: Example[] = []
    const tabs: CodeBlockTab[] = []

    // Handle x-codeSamples if present
    if (operation.schema['x-codeSamples']) {
        const codeSamples = operation.schema['x-codeSamples'] as Array<{ lang: string; source: string }>
        const codeSampleTabs: CodeBlockTab[] = codeSamples.map(sample => ({
            title: sample.lang,
            language: langFallback(sample.lang),
            code: sample.source
        }))

        if (codeSampleTabs.length > 0) {
            examples.push({
                codeblock: {
                    tabs: codeSampleTabs
                }
            })

            exampleGroups.push({
                description: "Example request",
                examples
            })

            return exampleGroups
        }
    }

    // Create a single object with all parameters grouped by their location
    const paramData = operation.schema.parameters
        ? (operation.schema.parameters as OpenAPIV3.ParameterObject[]).reduce((acc, param) => {
            const location = param.in || 'query'
            if (!acc[location]) {
                acc[location] = {}
            }

            let value = param.example
            if (!value && param.schema) {
                value = OpenAPISampler.sample(sanitizeSchema(param.schema as JSONSchema7))
            }
            if (value !== undefined) {
                acc[location][param.name] = value
            }
            return acc
        }, {} as Record<string, Record<string, any>>)
        : {}

    // Get request body data if it exists
    let bodyData = {}
    if (operation.schema.requestBody) {
        const body = operation.schema.requestBody as OpenAPIV3.RequestBodyObject
        const contentTypes = Object.keys(body.content)

        if (contentTypes.length > 0) {
            const contentType = contentTypes[contentTypes.length - 1]
            const content = body.content[contentType]
            let schema = content?.schema as JSONSchema7

            if (schema) {
                schema = fixAllOfBug(schema)
                schema = sanitizeSchema(schema)

                let requestData
                if (content.examples) {
                    const requestExample = content.examples["request"]
                    if (requestExample && "value" in requestExample) {
                        requestData = requestExample.value
                    }
                }

                if (!requestData) {
                    requestData = OpenAPISampler.sample(schema)
                }

                if (contentType === 'application/x-www-form-urlencoded') {
                    bodyData = {formData: requestData}
                } else {
                    bodyData = {body: requestData}
                }
            }
        }
    }

    // Check if we have parameters or request body
    const hasRequestBody = operation.schema.requestBody !== undefined
    const hasParameters = Object.keys(paramData).length > 0

    // Generate examples if we have either parameters or request body, or if we have neither
    if (hasParameters || hasRequestBody || (!hasRequestBody && !hasParameters)) {
        SUPPORTED_LANGUAGES.forEach(lang => {
            // operation.api.components = undefined // TODO: uncomment if issues with cirular references
            // operation.api.paths = undefined // TODO: uncomment if issues with cirular references
            const {code} = oasToSnippet(oas, operation, {
                ...paramData,
                ...bodyData
            }, null, lang)

            tabs.push({
                title: lang,
                language: lang,
                code: code || ""
            })
        })

        if (tabs.length > 0) {
            examples.push({
                codeblock: {
                    tabs
                }
            })
        }

        if (examples.length > 0) {
            exampleGroups.push({
                description: "Example request",
                examples
            })
        }
    }

    return exampleGroups
}

function resBodyExmaples(operation: Operation, oas: Oas, vistedExamples?: Map<JSONSchema7 | JSONSchema7[], any>): ExampleGroup[] {
    const exampleGroups: ExampleGroup[] = []

    if (operation.schema.responses) {
        const responses = operation.schema.responses as OpenAPIV3.ResponsesObject

        const examples: Example[] = []

        Object.entries(responses).forEach(([status, r]) => {
            const response = r as OpenAPIV3.ResponseObject
            if (!response.content) {
                return
            }

            const contentTypes = Object.keys(response.content)
            if (contentTypes.length === 0) {
                return
            }

            const tabs: CodeBlockTab[] = []

            for (const contentType of contentTypes) {
                const content = response.content[contentType]
                const schema = content?.schema as JSONSchema7

                if (!schema) {
                    continue
                }

                let responseData
                // Check for examples in the response content
                if (content.examples) {
                    const responseExample = content.examples["response"]
                    if (responseExample && "value" in responseExample) {
                        responseData = responseExample.value
                    } else {
                        const namedExamples: Example[] = []
                        const exampleNames = Object.keys(content.examples)

                        exampleNames.forEach((exampleName) => {
                            const data = content?.examples?.[exampleName]

                            if (!data || !("value" in data) || typeof data.value != "object") {
                                return
                            }

                            namedExamples.push({
                                description: "",
                                codeblock: {
                                    title: exampleName,
                                    tabs: [
                                        {
                                            title: "application/json", // TODO: support multiple types
                                            language: "json",
                                            code: JSON.stringify(data.value, null, 2) || "",
                                        }
                                    ]
                                }
                            })
                        })

                        if (namedExamples.length === 1) {
                            const firstCodeblock = namedExamples[0].codeblock

                            tabs.push(
                                ...firstCodeblock.tabs.map(tab => ({
                                    ...tab,
                                    title: contentType
                                }))
                            )
                        } else {
                            exampleGroups.push({
                                description: "",
                                examples: namedExamples
                            })
                        }

                        continue
                    }
                } else if (content.example) {
                    responseData = content.example
                }

                // If no example found, generate sample data from schema
                if (!responseData) {
                    responseData = OpenAPISampler.sample(sanitizeSchema(schema))
                }

                let extension = "text"
                switch (contentType) {
                    case "application/json":
                    case "application/problem+json":
                    case "application/vnd.api+json": {
                        extension = "json"
                        break
                    }
                    case "application/xml":
                    case "text/xml":
                    case "application/problem+xml": {
                        extension = "xml"
                        break
                    }
                }

                tabs.push({
                    title: contentType,
                    language: extension,
                    code: JSON.stringify(responseData, null, 2) || "",
                })
            }

            if (tabs.length > 0) {
                examples.push({
                    codeblock: {
                        title: status,
                        tabs
                    }
                })
            }
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
    const modifiedSchema = {...schema}

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


function sanitizeSchema(
    schema: any,
    vistedExamples: Map<JSONSchema7 | JSONSchema7[], any> = new Map(),
    parent?: any
): any {
    if (vistedExamples.has(schema)) {
        const cached = vistedExamples.get(schema);

        if (typeof cached === 'object') {
            return JSON.parse(JSON.stringify(cached)); // Return a deep copy of the cached schema
        }

        return cached
    }

    if (parent) {
        vistedExamples.set(schema, parent);
    }

    if (!schema || typeof schema !== 'object') {
        vistedExamples.set(schema, schema);
        return schema;
    }

    if (Array.isArray(schema)) {
        const v = schema.map(item => sanitizeSchema(item, vistedExamples));
        vistedExamples.set(schema, v);
        return v;
    }

    const cleaned: any = {};
    for (const [key, value] of Object.entries(schema)) {
        if (key === "__UNSAFE_refPath") {
            continue;
        }
        if (!BUILT_IN_PROPERTIES[key]) {
            cleaned[key] = sanitizeSchema(value, vistedExamples, cleaned);
        }
    }
    vistedExamples.set(schema, cleaned);
    return cleaned;
}
