import {Reference} from '@xyd-js/uniform';

export const exampleSourceUniform = {
    "title": "Function gqlSchemaToReferences",
    "canonical": "fn-gqlSchemaToReferences",
    "description": "Converts a GraphQL schema file to references.\n",
    "context": {
        "fileName": "index.ts",
        "fileFullPath": "src/index.ts",
        "line": 48,
        "col": 16,
        "signatureText": "export function gqlSchemaToReferences(schemaLocation: string): Promise<[\n]>;",
        "sourcecode": "export function gqlSchemaToReferences(\n    schemaLocation: string\n): Promise<[]> {\n    if (schemaLocation.endsWith(\".graphql\")) {\n        return Promise.resolve([])\n    }\n\n    return Promise.resolve([])\n}",
        "package": "@xyd-sources-examples/package-a"
    },
    "examples": {
        "groups": []
    },
    "definitions": [
        {
            "title": "Returns",
            "properties": [
                {
                    "name": "",
                    "type": "<Promise>",
                    "description": "references\n"
                }
            ]
        },
        {
            "title": "Parameters",
            "properties": [
                {
                    "name": "schemaLocation",
                    "type": "string",
                    "description": "The location of the schema file.\n"
                }
            ]
        }
    ]
} as Reference