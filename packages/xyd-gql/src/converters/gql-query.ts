import type {GraphQLSchema} from "graphql";
import {OperationTypeNode} from "graphql";

import {Reference, ReferenceType} from "@xyd-js/uniform";

import type {GQLSchemaToReferencesOptions} from "../types";
import {filterFieldsByRegions} from "../utils";
import {gqlOperationToUniformRef} from "./gql-operation";

export function graphqlQueriesToUniformReferences(
    schema: GraphQLSchema,
    options?: GQLSchemaToReferencesOptions,
): Reference[] {
    const references: Reference[] = []

    const queries = schema.getRootType(OperationTypeNode.QUERY)
    const queryFields = queries?.getFields?.()

    if (queryFields) {
        // Filter query fields based on regions if provided
        const filteredQueryFields = filterFieldsByRegions(
            queryFields,
            "query",
            options?.regions
        );

        references.push(...gqlOperationToUniformRef(
            ReferenceType.GRAPHQL_QUERY,
            filteredQueryFields,
            options
        ))
    }

    return references;
}