import {
    GraphQLInputObjectType,
    GraphQLObjectType,
    GraphQLEnumType,
    isSpecifiedScalarType,
    isIntrospectionType
} from "graphql";
import {OperationTypeNode} from "graphql/language/ast";

import {getDocumentLoaders, loadSchema} from "@graphql-markdown/graphql";
import {GraphQLScalarType} from "@graphql-markdown/types";

import type {Reference} from "@xyd-js/uniform"
import {ReferenceType} from "@xyd-js/uniform"
import {gqlInputToUniformRef} from "./hydration/gql-input";
import {gqlEnumToUniformRef, gqlScalarToUniformRef} from "./hydration/gql-types";
import {gqlObjectToUniformRef} from "./hydration/gql-object";
import {gqlOperationsToUniformRef} from "./utils";

// TODO: support multi graphql files
// TODO: !!! CIRCULAR_DEPENDENCY !!!
// TODO: sort by tag??

export async function gqlSchemaToReferences(
    schemaLocation: string
): Promise<Reference[]> {
    const loadersList = {
        ["GraphQLFileLoader"]: "@graphql-tools/graphql-file-loader",
    }
    const loaders = await getDocumentLoaders(loadersList);

    // @ts-ignore TODO: but ts works in @graphql-markdown/core
    const schema = await loadSchema(schemaLocation as string, loaders);

    const references: Reference[] = []

    const queries = schema.getRootType(OperationTypeNode.QUERY)
    const queryFields = queries?.getFields?.()

    if (queryFields) {
        references.push(...gqlOperationsToUniformRef(
            ReferenceType.GRAPHQL_QUERY,
            queryFields
        ))
    }

    const mutations = schema.getRootType(OperationTypeNode.MUTATION)
    const mutationFields = mutations?.getFields?.()

    if (mutationFields) {
        references.push(...gqlOperationsToUniformRef(
            ReferenceType.GRAPHQL_MUTATION,
            mutationFields
        ))
    }

    const typeMap = schema.getTypeMap();

    for (const gqlType of Object.values(typeMap)) {
        const builtInType = isSpecifiedScalarType(gqlType) ||
            isIntrospectionType(gqlType) ||
            gqlType.name === "Mutation"

        if (builtInType) {
            continue;
        }

        switch (gqlType.constructor.name) {
            case 'GraphQLObjectType': {
                const type = gqlType as GraphQLObjectType;

                references.push(gqlObjectToUniformRef(type))

                break
            }

            case 'GraphQLInputObjectType': {
                const type = gqlType as GraphQLInputObjectType;

                references.push(gqlInputToUniformRef(type))
                break
            }

            case 'GraphQLEnumType': {
                const type = gqlType as GraphQLEnumType;

                references.push(gqlEnumToUniformRef(type))

                break
            }

            case 'GraphQLScalarType': {
                const type = gqlType as GraphQLScalarType

                references.push(gqlScalarToUniformRef(type))

                break
            }

            default: {
                console.debug(`Unsupported type: ${gqlType.constructor.name}`)
            }
        }
    }

    return references
}
