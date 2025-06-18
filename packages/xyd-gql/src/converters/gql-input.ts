import {GraphQLInputObjectType} from "graphql";

import {Reference} from "@xyd-js/uniform";

import {gqlObjectPropsUniformify, uniformify} from "../gql-core";
import {Context} from "../context";

// gqlInputToUniformRef is a helper function to convert a GraphQL input object type into a 'uniform' reference.
export function gqlInputToUniformRef(ctx: Context, gqlType: GraphQLInputObjectType): Reference {
    const prop = gqlInputToUniformDefinitionProperty(
        ctx,
        gqlType,
    )

    return uniformify(
        ctx,
        gqlType,
        [
            {
                title: "Fields",
                properties: prop.properties || []
            }
        ],
        []
    )
}

// gqlInputToUniformDefinitionProperty is a helper function to convert a GraphQL input object into a xyd definition property.
export function gqlInputToUniformDefinitionProperty(
    ctx: Context,
    obj: GraphQLInputObjectType,
) {
    return gqlObjectPropsUniformify(ctx, obj)
}