import {OpenAPIV3} from "openapi-types";
import Oas from "oas";
// @ts-ignore
import {Operation} from 'oas/operation'; // TODO: fix ts
import oasToSnippet from "@readme/oas-to-snippet";
import * as OpenAPISampler from "openapi-sampler";
import type {JSONSchema7} from "json-schema";

import {ExampleGroup, Example} from "@xyd/uniform";

// TODO: option with another languages
// TODO: uniform plugins
// TODO: fs uniform plugins
export function oapExamples(
    oas: Oas,
    operation: Operation
): ExampleGroup[] {
    const exampleGroups: ExampleGroup[] = []

    if (operation.schema.requestBody) {
        const body = operation.schema.requestBody as OpenAPIV3.RequestBodyObject
        const schema = fixAllOfBug(
            body.content["application/json"].schema as JSONSchema7
        )

        if (!schema) {
            return exampleGroups
        }

        const fakeData = OpenAPISampler.sample(schema)

        // TODO: snippet languages options
        const {code} = oasToSnippet(oas, operation, {
            body: fakeData
        }, null, "shell");

        const examples: Example[] = []

        examples.push({
            codeblock: {
                tabs: [{
                    title: "curl",
                    language: "bash",
                    code: code || "",
                }]
            }
        })

        exampleGroups.push({
            description: "Example request",
            examples
        })
    }

    if (operation.schema.responses) {
        const responses = operation.schema.responses as OpenAPIV3.ResponsesObject

        const examples: Example[] = []

        Object.entries(responses).forEach(([status, r]) => {
            const response = r as OpenAPIV3.ResponseObject
            const schema = response?.content?.["application/json"].schema as JSONSchema7

            if (!schema) {
                return
            }

            const fakeData = OpenAPISampler.sample(schema)

            examples.push({
                codeblock: {
                    title: status,
                    tabs: [{
                        title: "json",
                        language: "json",
                        code: JSON.stringify(fakeData, null, 2) || "",
                    }]
                }
            })
        })

        exampleGroups.push({
            description: "Response",
            examples
        })
    }

    return exampleGroups
}

/*
fixAllOfBug fixes below case:

```yaml
  allOf:
    - $ref: '#/components/schemas/SomeSchema'
    - type: object
      required:
      properties:
```
*/
function fixAllOfBug(schema: JSONSchema7) {
    const modifiedSchema = {...schema}

    if (schema.allOf) {
        schema.allOf.forEach((prop, i) => {
            const propObj = prop as object

            if ("properties" in propObj && !propObj["properties"]) {
                delete modifiedSchema.allOf?.[i]
            }
        })
    }

    return modifiedSchema
}