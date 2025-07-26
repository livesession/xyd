import {GraphQLEnumType} from "graphql";

import type {DefinitionProperty, Reference} from "@xyd-js/uniform";
import {uniformify} from "../gql-core";
import {NestedGraphqlType} from "../types";
import {Context} from "../context";

// gqlEnumToUniformRef is a helper function to convert a GraphQL enum type into a 'uniform' reference.
export function gqlEnumToUniformRef(ctx: Context, gqlType: GraphQLEnumType): Reference {
    const props: DefinitionProperty[] = gqlType.getValues().map(value => ({
        name: value.name,
        type: "string", // TODO: other types?
        description: value.description || "",
    }))

    return uniformify(
        ctx,
        gqlType,
        [
            {
                title: "Valid values",
                properties: props
            }
        ],
        [],
    )
}