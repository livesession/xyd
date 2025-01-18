import {GraphQLObjectType} from "graphql";

import type {DefinitionProperty} from "@xyd-js/uniform";

import {gqlFieldToUniformDefinitionProperty} from "./gql-field";

// gqlObjectToUniformRef is a helper function to convert a GraphQL object type into a 'uniform' reference.
export function gqlObjectToUniformRef(gqlType: GraphQLObjectType) {
    const props: DefinitionProperty[] = []

    for (const [name, field] of Object.entries(gqlType.getFields())) {
        const prop = gqlFieldToUniformDefinitionProperty(name, field)

        props.push(prop)
    }

    return {
        title: gqlType.name,
        description: gqlType.description || "",
        canonical: `object-${gqlType.name}`, // TODO: better solution
        context: {
            graphqlName: gqlType.name,
            graphqlTypeShort: "object" // TODO: better solution
        },
        definitions: [
            {
                title: "Fields",
                properties: props
            }
        ],
        examples: {
            groups: []
        }
    }
}