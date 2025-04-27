import { GraphQLFieldMap } from "graphql/type";
import {
    Reference,
    ReferenceCategory,
    ReferenceType,
    ExampleGroup,
    Definition,
    Example,
} from "@xyd-js/uniform";

import { gqlArgToUniformDefinitionProperty } from "./hydration/gql-arg";
import { gqlFieldToUniformDefinitionProperty } from "./hydration/gql-field";
import { simpleGraphqlExample } from "./samples";

// gqlOperationsToUniformRef is a helper function to create a list of xyd reference for a GraphQL query or mutation.
export function gqlOperationsToUniformRef(
    operationType: ReferenceType.GRAPHQL_MUTATION | ReferenceType.GRAPHQL_QUERY,
    fieldsMap: GraphQLFieldMap<any, any>
) {
    const references: Reference[] = []

    for (const [operationName, operationField] of Object.entries(fieldsMap)) {
        const definitions: Definition[] = []

        const args = gqlArgToUniformDefinitionProperty(operationField.args)
        const returns = gqlFieldToUniformDefinitionProperty(operationName, operationField)
        const returnProperties = returns.properties || []

        definitions.push({
            title: "Arguments",
            properties: args,
        })
        definitions.push({
            title: "Returns",
            properties: returnProperties
        })

        const exampleQuery = simpleGraphqlExample(
            operationType,
            operationName,
            args,
            returnProperties
        )
        const examples: Example[] = [
            {
                codeblock: {
                    tabs: [
                        {
                            title: "graphql",
                            language: "graphql",
                            code: exampleQuery,
                        }
                    ]
                }
            }
        ]

        const exampleGroup = {
            description: "Example request",
            examples,
        }

        let description = operationField.description || ""

        let canonical = ""

        if (operationType === ReferenceType.GRAPHQL_QUERY) {
            canonical = `queries/${operationName}`
        } else if (operationType === ReferenceType.GRAPHQL_MUTATION) {
            canonical = `mutations/${operationName}`
        } else {
            throw new Error(`Invalid operation type: ${operationType}`)
        }

        references.push(graphqlReference(
            operationType,
            operationName,
            operationName,
            canonical,
            description,
            [exampleGroup],
            definitions,
        ))
    }

    return references
}

// graphqlReference is a helper function to create a Reference object for a GraphQL query or mutation.
function graphqlReference(
    operationType: ReferenceType.GRAPHQL_QUERY | ReferenceType.GRAPHQL_MUTATION,
    operationName: string,
    title: string, // TODO: in the future custom canonical
    canonical: string, // TODO: in the future custom canonical
    description: string,
    examples: ExampleGroup[],
    definitions: Definition[],
): Reference {
    return {
        title,
        canonical,
        description,

        category: ReferenceCategory.GRAPHQL,
        type: operationType,

        examples: {
            groups: examples,
        },
        definitions,
        context: {
            graphqlTypeShort: operationType === ReferenceType.GRAPHQL_QUERY ? "query" : "mutation",
            graphqlName: operationName,
        }
    }
}