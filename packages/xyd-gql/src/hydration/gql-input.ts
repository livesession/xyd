import {GraphQLInputObjectType} from "graphql/type";

import {DefinitionProperty, Reference} from "@xyd-js/uniform";

import {gqlFieldToUniformDefinitionProperty} from "./gql-field";

// gqlInputToUniformRef is a helper function to convert a GraphQL input object type into a 'uniform' reference.
export function gqlInputToUniformRef(gqlType: GraphQLInputObjectType): Reference {
    const prop = gqlInputToUniformDefinitionProperty(
        gqlType.name,
        gqlType.description || "",
        gqlType
    )

    return {
        title: gqlType.name,
        description: gqlType.description || "",
        canonical: `inputs/${gqlType.name}`, // TODO: better solution
        context: {
            graphqlName: gqlType.name,
            graphqlTypeShort: "input" // TODO: better solution
        },
        definitions: [
            {
                title: "Fields",
                properties: prop.properties || []
            }
        ],
        examples: {
            groups: []
        }
    } as Reference
}

// gqlInputToUniformDefinitionProperty is a helper function to convert a GraphQL input object into a xyd definition property.
export function gqlInputToUniformDefinitionProperty(
    name: string,
    description: string,
    obj: GraphQLInputObjectType
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
            name,
            inputField,
        )

        if (prop) {
            nestedProps.push(prop)
        }
    }

    return nestedDefinitionProperty
}