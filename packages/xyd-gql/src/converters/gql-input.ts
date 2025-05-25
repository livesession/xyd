import {GraphQLInputObjectType} from "graphql";

import {DefinitionProperty, Reference} from "@xyd-js/uniform";

import {gqlFieldToUniformDefinitionProperty} from "./gql-field";
import {uniformify} from "../utils";
import {NestedGraphqlType} from "../types";
import {Context} from "./context";

// gqlInputToUniformRef is a helper function to convert a GraphQL input object type into a 'uniform' reference.
export function gqlInputToUniformRef(ctx: Context, gqlType: GraphQLInputObjectType): Reference {
    const prop = gqlInputToUniformDefinitionProperty(
        ctx,
        gqlType.name,
        gqlType.description || "",
        gqlType,
    )

    return uniformify(
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
    name: string,
    description: string,
    obj: GraphQLInputObjectType,
) {
    const inputFields = obj.getFields?.()

    const nestedProps: DefinitionProperty[] = []
    const nestedDefinitionProperty: DefinitionProperty = {
        name: name,
        type: obj.toJSON(),
        description: description || "",
        context: {
            graphqlName: name,
            graphqlTypeShort: "input"
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