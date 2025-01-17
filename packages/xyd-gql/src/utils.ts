import {GraphQLFieldMap} from "graphql/type";
import {
    Reference,
    ReferenceCategory,
    ReferenceType,
    ExampleGroup,
    Definition,
    Example,
} from "@xyd-js/uniform";

import {argumentsIntoDefinitionProperty} from "./arguments";
import {fieldIntoDefinitionProperty} from "./fields";
import {simpleGraphqlExample} from "./examples";

// TODO: examples
// graphqlOperationReferences is a helper function to create a list of xyd reference for a GraphQL query or mutation.
export function graphqlOperationReferences(
    operationType: ReferenceType.GRAPHQL_MUTATION | ReferenceType.GRAPHQL_QUERY,
    fieldsMap: GraphQLFieldMap<any, any>
) {
    const references: Reference[] = []

    for (const [operationName, operationField] of Object.entries(fieldsMap)) {
        const definitions: Definition[] = []

        const args = argumentsIntoDefinitionProperty(operationField.args)
        const returns = fieldIntoDefinitionProperty(operationName, operationField)
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

        references.push(graphqlReference(
            operationType,
            operationName,
            operationName,
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
    title: string,
    canonical: string,
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
    }
}