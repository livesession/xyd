import {GraphQLObjectType} from "graphql";

import {Definition, DefinitionProperty, DefinitionVariant} from "@xyd-js/uniform";

import {gqlFieldToUniformDefinitionProperty} from "./gql-field";
import {gqlObjectPropsUniformify, uniformify} from "../gql-core";
import {Context} from "../context";
import {gqlArgToUniformDefinitionProperty} from "./gql-arg";

// gqlObjectToUniformRef is a helper function to convert a GraphQL object type into a 'uniform' reference.
export function gqlObjectToUniformRef(
    ctx: Context,
    gqlType: GraphQLObjectType
) {
    const definitions: Definition[] = []
    const graphqlFields: DefinitionProperty[] = []

    const variants: DefinitionVariant[] = []

    const argumentDefinition: Definition = {
        title: "Arguments",
        properties: [],
        variants,
        meta: [
            {
                name: "type",
                value: "arguments",
            },
        ]
    }

    for (const [name, field] of Object.entries(gqlType.getFields())) {
        if (!field?.args?.length) {
         continue;
        }

        const args = gqlArgToUniformDefinitionProperty(ctx, field.args)

        variants.push({
            title: "",
            properties: args,
            meta: [
                {
                    name: "symbolName",
                    value: name,
                }
            ]
        })
    }
    definitions.push(argumentDefinition)

    for (const [name, field] of Object.entries(gqlType.getFields())) {
        const prop = gqlFieldToUniformDefinitionProperty(ctx, field)

        graphqlFields.push(prop)
    }

    definitions.push({
        title: "Fields",
        properties: graphqlFields,
        meta: [
            {
                name: "type",
                value: "fields",
            }
        ]
    })

    return uniformify(
        gqlType,
        definitions,
        []
    )
}

// gqlObjectToUniformDefinitionProperty is a helper function to convert a GraphQL object type into a xyd definition property.
export function gqlObjectToUniformDefinitionProperty(
    ctx: Context,
    obj: GraphQLObjectType,
) {
    return gqlObjectPropsUniformify(ctx, obj)
}