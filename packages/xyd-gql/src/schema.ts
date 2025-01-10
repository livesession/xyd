import {getDocumentLoaders, loadSchema} from "@graphql-markdown/graphql";
import {OperationTypeNode} from "graphql/language/ast";
import {Reference, ReferenceType} from "@xyd-js/uniform"

import {
    graphqlOperationReferences
} from "./utils";

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
        references.push(...graphqlOperationReferences(
            ReferenceType.GRAPHQL_QUERY,
            queryFields
        ))
    }

    const mutations = schema.getRootType(OperationTypeNode.MUTATION)
    const mutationFields = mutations?.getFields?.()

    if (mutationFields) {
        references.push(...graphqlOperationReferences(
            ReferenceType.GRAPHQL_MUTATION,
            mutationFields
        ))
    }

    return references
}
