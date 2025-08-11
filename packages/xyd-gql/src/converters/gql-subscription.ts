import type {GraphQLSchema} from "graphql";
import {OperationTypeNode} from "graphql";

import {Reference, ReferenceType} from "@xyd-js/uniform";

import type {GQLSchemaToReferencesOptions} from "../types";
import {filterFieldsByRegions} from "../utils";
import {gqlOperationToUniformRef} from "./gql-operation";

export function graphqlSubscriptionsToUniformReferences(
    schema: GraphQLSchema,
    options?: GQLSchemaToReferencesOptions,
) {
    const references: Reference[] = []

    const mutations = schema.getRootType(OperationTypeNode.SUBSCRIPTION)
    const mutationFields = mutations?.getFields?.()

    if (mutationFields) {
        // Filter mutation fields based on regions if provided
        const filteredMutationFields = filterFieldsByRegions(
            mutationFields,
            "mutation",
            options?.regions
        );

        references.push(...gqlOperationToUniformRef(
            ReferenceType.GRAPHQL_SUBSCRIPTION,
            filteredMutationFields,
            schema,
            options,
        ))
    }

    return references;
}
