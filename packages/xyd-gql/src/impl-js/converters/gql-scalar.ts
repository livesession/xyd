import {GraphQLScalarType} from "@graphql-markdown/types";

import type {Reference} from "@xyd-js/uniform";

import {uniformify} from "../gql-core";
import {Context} from "../context";

// gqlScalarToUniformRef is a helper function to convert a GraphQL scalar type into a 'uniform' reference.
export function gqlScalarToUniformRef(ctx: Context, gqlType: GraphQLScalarType): Reference {
    return uniformify(
        ctx,
        gqlType,
        [],
        []
    )
}
