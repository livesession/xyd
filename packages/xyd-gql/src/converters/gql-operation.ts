import {GraphQLFieldMap} from "graphql/type";
import {
    Reference,
    ReferenceType,
    Definition,
    Example,
} from "@xyd-js/uniform";

import {GraphqlOperation} from "../types";
import {gqlArgToUniformDefinitionProperty} from "./gql-arg";
import {gqlFieldToUniformDefinitionProperty} from "./gql-field";
import {simpleGraphqlExample} from "./gql-sample";
import {uniformify} from "../utils";

// gqlOperationToUniformRef is a helper function to create a list of xyd reference for a GraphQL operation (query or mutation).
export function gqlOperationToUniformRef(
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

        const operation = new GraphqlOperation(operationField)
        switch (operationType) {
            case ReferenceType.GRAPHQL_QUERY: {
                operation.__operationType = "query";
                break;
            }
            case ReferenceType.GRAPHQL_MUTATION: {
                operation.__operationType = "mutation";
                break;
            }
            default: {
                console.error(`Invalid operation type: ${operationType}`);
            }
        }

        references.push(uniformify(
            operation,
            definitions,
            [exampleGroup]
        ))
    }

    return references
}