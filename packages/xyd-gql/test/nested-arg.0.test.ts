import path from "path";

import {beforeEach, describe, expect, it} from 'vitest'

import {gqlSchemaToReferences} from "../src";

describe('nested-arg', async () => {
    beforeEach(() => {
    })

    it('0.required', async () => {
        const schemaLocation = path.join(process.cwd(), "./examples/nested/nested-arg.0.required.graphqls")

        const references = await gqlSchemaToReferences(schemaLocation)

        const equal = [
            {
                "title": "addBook",
                "canonical": "addBook",
                "description": "",
                "category": "graphql",
                "type": "graphql_mutation",
                "examples": {
                    "groups": [
                        {
                            "description": "Example request",
                            "examples": [
                                {
                                    "codeblock": {
                                        "tabs": [
                                            {
                                                "title": "graphql",
                                                "language": "graphql",
                                                "code": "mutation addBook ($bookInput: BookInput) {\n    addBook (bookInput: $bookInput)\n}"
                                            }
                                        ]
                                    }
                                }
                            ]
                        }
                    ]
                },
                "definitions": [
                    {
                        "title": "Arguments",
                        "properties": [
                            {
                                "name": "bookInput",
                                "type": "BookInput",
                                "description": "",
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
                        ]
                    },
                    {
                        "title": "Returns",
                        "properties": []
                    }
                ]
            },
            {
                "title": "BookInput",
                "description": "",
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
            }
        ]

        expect(references).toEqual(equal)
    })

    it('0.not-required', async () => {
        const schemaLocation = path.join(process.cwd(), "./examples/nested/nested-arg.0.not-required.graphqls")

        const references = await gqlSchemaToReferences(schemaLocation)

        const equal = [
            {
                "title": "addBook",
                "canonical": "addBook",
                "description": "",
                "category": "graphql",
                "type": "graphql_mutation",
                "examples": {
                    "groups": [
                        {
                            "description": "Example request",
                            "examples": [
                                {
                                    "codeblock": {
                                        "tabs": [
                                            {
                                                "title": "graphql",
                                                "language": "graphql",
                                                "code": "mutation addBook ($bookInput: BookInput) {\n    addBook (bookInput: $bookInput)\n}"
                                            }
                                        ]
                                    }
                                }
                            ]
                        }
                    ]
                },
                "definitions": [
                    {
                        "title": "Arguments",
                        "properties": [
                            {
                                "name": "bookInput",
                                "type": "BookInput",
                                "description": "",
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
                        ]
                    },
                    {
                        "title": "Returns",
                        "properties": []
                    }
                ]
            },
            {
                "title": "BookInput",
                "description": "",
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
            }
        ]

        expect(references).toEqual(equal)
    })
})