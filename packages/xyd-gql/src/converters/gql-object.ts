import {GraphQLObjectType} from "graphql";

import {Definition, DefinitionProperty} from "@xyd-js/uniform";

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

    for (const [name, field] of Object.entries(gqlType.getFields())) {
        if (field?.args?.length) {
            const args = gqlArgToUniformDefinitionProperty(ctx, field.args)

            definitions.push({
                title: "Arguments",
                properties: args,
                meta: [
                    {
                        name: "type",
                        value: "arguments",
                    },
                    {
                        name: "graphqlName",
                        value: name,
                    }
                ]
            })
        }
    }

    for (const [name, field] of Object.entries(gqlType.getFields())) {
        const prop = gqlFieldToUniformDefinitionProperty(ctx, field)

        graphqlFields.push(prop)
    }

    definitions.push({
        title: "Fields",
        properties: graphqlFields
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