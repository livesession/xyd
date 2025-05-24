import {GraphQLScalarType} from "@graphql-markdown/types";

import type {Reference} from "@xyd-js/uniform";

import {uniformify} from "../utils";

// gqlScalarToUniformRef is a helper function to convert a GraphQL scalar type into a 'uniform' reference.
export function gqlScalarToUniformRef(gqlType: GraphQLScalarType): Reference {
    return uniformify(
        gqlType,
        [],
        []
    )
}