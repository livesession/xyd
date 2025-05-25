import {GraphQLObjectType} from "graphql";

import type {DefinitionProperty} from "@xyd-js/uniform";

import {gqlFieldToUniformDefinitionProperty} from "./gql-field";
import {uniformify} from "../utils";
import {NestedGraphqlType} from "../types";
import {Context} from "./context";

// gqlObjectToUniformRef is a helper function to convert a GraphQL object type into a 'uniform' reference.
export function gqlObjectToUniformRef(
    ctx: Context,
    gqlType: GraphQLObjectType
) {
    const props: DefinitionProperty[] = []

    for (const [name, field] of Object.entries(gqlType.getFields())) {
        const prop = gqlFieldToUniformDefinitionProperty(ctx, name, field)

        props.push(prop)
    }

    return uniformify(
        gqlType,
        [
            {
                title: "Fields",
                properties: props
            }
        ],
        []
    )
}

// gqlObjectToUniformDefinitionProperty is a helper function to convert a GraphQL object type into a xyd definition property.
export function gqlObjectToUniformDefinitionProperty(
    ctx: Context,
    name: string,
    description: string,
    obj: GraphQLObjectType,
) {
    const inputFields = obj.getFields?.()

    const nestedProps: DefinitionProperty[] = []
    const nestedDefinitionProperty: DefinitionProperty = {
        name: name,
        type: obj.toJSON(),
        description: description || "",
        context: {
            graphqlName: name,
            graphqlTypeShort: "object"
        },
        properties: nestedProps,
    }

    for (const [name, inputField] of Object.entries(inputFields)) {
        const prop = gqlFieldToUniformDefinitionProperty(
            ctx,
            name,
            inputField,
        )

        if (prop) {
            nestedProps.push(prop)
        }
    }

    return nestedDefinitionProperty
}