import {GraphQLInterfaceType, GraphQLField} from "graphql";

import {Definition, DefinitionProperty, Reference} from "@xyd-js/uniform";

import {gqlFieldToUniformDefinitionProperty} from "./gql-field";
import {uniformify} from "../gql-core";
import {NestedGraphqlType} from "../types";
import {Context} from "../context";

export function gqlInterfaceToUniformRef(ctx: Context, interfaceType: GraphQLInterfaceType): Reference {
    const properties = gqlInterfaceToUniformDefinitionProperties(ctx, interfaceType)

    const definitions: Definition[] = [
        {
            title: "Fields",
            properties,
        }
    ]

    return uniformify(
        interfaceType,
        definitions,
        []
    )
}

export function gqlInterfaceToUniformDefinitionProperties(ctx: Context, interfaceType: GraphQLInterfaceType): DefinitionProperty[] {
    return Object.values(interfaceType.getFields()).map((field: GraphQLField<any, any>) => {
        return gqlFieldToUniformDefinitionProperty(
            ctx,
            field,
        )
    })
} 