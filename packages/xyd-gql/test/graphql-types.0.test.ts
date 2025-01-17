import path from "path";

import {beforeEach, describe, expect, it} from 'vitest'

import {gqlSchemaToReferences} from "../src";

describe('graphql-types', async () => {
    beforeEach(() => {
    })

    it('0.basic', async () => {
        const schemaLocation = path.join(process.cwd(), "./examples/graphql-types/graphql-types.0.basic.graphqls")

        const references = await gqlSchemaToReferences(schemaLocation)

        const equal = [
            {
                "canonical": "Date",
                "description": "This is a custom scalar type for Date.",
                "context": {
                    "graphqlName": "Date",
                    "graphqlType": "scalar"
                },
                "definitions": [],
                "examples": {
                    "groups": []
                },
                "title": "Date"
            },
            {
                "canonical": "Role",
                "description": "This is a custom enum type for Role.",
                "context": {
                    "graphqlName": "Role",
                    "graphqlType": "enum"
                },
                "definitions": [
                    {
                        "properties": [
                            {
                                "description": "",
                                "name": "ADMIN",
                                "type": "string"
                            },
                            {
                                "description": "",
                                "name": "OWNER",
                                "type": "string"
                            }
                        ],
                        "title": "Valid values"
                    }
                ],
                "examples": {
                    "groups": []
                },
                "title": "Role"
            },
            {
                "title": "BookInput",
                "description": "This is a custom input type for Book.",
                "canonical": "BookInput",
                "context": {
                    "graphqlName": "BookInput",
                    "graphqlType": "input"
                },
                "definitions": [
                    {
                        "title": "Fields",
                        "properties": [
                            {
                                "name": "title",
                                "type": "String!",
                                "description": "",
                                "properties": []
                            },
                            {
                                "name": "author",
                                "type": "String!",
                                "description": "",
                                "properties": []
                            }
                        ]
                    }
                ],
                "examples": {
                    "groups": []
                }
            },
            {
                "title": "Book",
                "description": "This is a custom type for Book.",
                "canonical": "Book",
                "context": {
                    "graphqlName": "Book",
                    "graphqlType": "object"
                },
                "definitions": [
                    {
                        "title": "Fields",
                        "properties": [
                            {
                                "name": "title",
                                "type": "String!",
                                "description": "",
                                "properties": []
                            },
                            {
                                "name": "author",
                                "type": "String!",
                                "description": "",
                                "properties": []
                            }
                        ]
                    }
                ],
                "examples": {
                    "groups": []
                }
            }
        ]

        expect(references).toEqual(equal)
    })
})