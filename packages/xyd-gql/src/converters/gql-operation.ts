import {GraphQLFieldMap, OperationTypeNode} from "graphql";
import {Definition, Example, Reference, ReferenceType,} from "@xyd-js/uniform";

import {type GQLSchemaToReferencesOptions, GQLOperation} from "../types";
import {gqlArgToUniformDefinitionProperty} from "./gql-arg";
import {gqlFieldToUniformDefinitionProperty} from "./gql-field";
import {simpleGraphqlExample} from "./gql-sample";
import {uniformify} from "../gql-core";
import {Context} from "../context";

// gqlOperationToUniformRef is a helper function to create a list of xyd reference for a GraphQL operation (query or mutation).
export function gqlOperationToUniformRef(
    operationType: ReferenceType.GRAPHQL_MUTATION | ReferenceType.GRAPHQL_QUERY,
    fieldsMap: GraphQLFieldMap<any, any>,
    options?: GQLSchemaToReferencesOptions,
) {
    const references: Reference[] = []

    for (const [operationName, operationField] of Object.entries(fieldsMap)) {
        const definitions: Definition[] = []
        let flatReturn = false
        let flat = false
        let argFlat = false

        if (options?.flat) {
            flatReturn = true
            flat = true
            argFlat = true
        }

        const args = gqlArgToUniformDefinitionProperty(new Context(
            new Set(),
            options,
            {
                flat,
                argFlat,
            }
        ), operationField.args)


        const returns = gqlFieldToUniformDefinitionProperty(new Context(
            new Set(),
            options,
            {
                flatReturn
            }
        ), operationField)
        let returnProperties = returns.properties || []
        if (options?.flat) {
            returnProperties = [returns]
        }

        definitions.push({
            title: "Arguments",
            properties: args,
        })
        definitions.push({
            title: "Returns",
            properties: returnProperties,
        })

        const exampleQuery = simpleGraphqlExample(
            operationType,
            operationName,
            args,
            returnProperties
        )

        let exampleQueryTitle = ""

        switch (operationType) {
            case ReferenceType.GRAPHQL_QUERY: {
                exampleQueryTitle = `Query reference`;
                break;
            }
            case ReferenceType.GRAPHQL_MUTATION: {
                exampleQueryTitle = `Mutation reference`;
                break;
            }
            default: {
                console.error(`Invalid operation type: ${operationType}`);
            }
        }

        const examples: Example[] = [
            {
                codeblock: {
                    tabs: [
                        {
                            title: exampleQueryTitle,
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

        const operation = new GQLOperation(operationField)
        switch (operationType) {
            case ReferenceType.GRAPHQL_QUERY: {
                operation.__operationType = OperationTypeNode.QUERY;
                break;
            }
            case ReferenceType.GRAPHQL_MUTATION: {
                operation.__operationType = OperationTypeNode.MUTATION;
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