import {GraphQLUnionType} from "graphql";

import {Definition, DefinitionProperty, Reference} from "@xyd-js/uniform";

import {gqlObjectToUniformDefinitionProperty} from "./gql-object";
import {uniformify} from "../gql-core";
import {Context} from "../context";

export function gqlUnionToUniformRef(ctx: Context, unionType: GraphQLUnionType): Reference {
    const properties = gqlUnionToUniformDefinitionProperties(ctx, unionType)

    const definitions: Definition[] = [
        {
            title: "Possible types",
            properties,
        }
    ]

    return uniformify(
        unionType,
        definitions,
        []
    )
}

export function gqlUnionToUniformDefinitionProperties(
    ctx: Context,
    unionType: GraphQLUnionType
): DefinitionProperty[] {
    return unionType.getTypes().map(type => {
        if (type.constructor.name === "GraphQLObjectType") {
            return gqlObjectToUniformDefinitionProperty(
                ctx,
                type,
            )
        }
        return []
    }).flat()
}