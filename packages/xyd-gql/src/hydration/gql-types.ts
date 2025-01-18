import {GraphQLEnumType} from "graphql";

import {GraphQLScalarType} from "@graphql-markdown/types";

import type {DefinitionProperty, Reference} from "@xyd-js/uniform";

// gqlEnumToUniformRef is a helper function to convert a GraphQL enum type into a 'uniform' reference.
export function gqlEnumToUniformRef(gqlType: GraphQLEnumType): Reference {
    const props: DefinitionProperty[] = gqlType.getValues().map(value => ({
        name: value.name,
        type: "string",
        description: value.description || "",
    }))

    return {
        title: gqlType.name,
        description: gqlType.description || "",
        canonical: `enum-${gqlType.name}`, // TODO: better solution
        context: {
            graphqlName: gqlType.name,
            graphqlTypeShort: "enum" // TODO: better solution
        },
        definitions: [
            {
                title: "Valid values",
                properties: props
            }
        ],
        examples: {
            groups: []
        }
    } as Reference
}

// gqlScalarToUniformRef is a helper function to convert a GraphQL scalar type into a 'uniform' reference.
export function gqlScalarToUniformRef(gqlType: GraphQLScalarType): Reference {
    return {
        title: gqlType.name,
        description: gqlType.description || "",
        canonical: `scalar-${gqlType.name}`, // TODO: better solution
        context: {
            graphqlName: gqlType.name,
            graphqlTypeShort: "scalar" // TODO: better solution
        },
        definitions: [],
        examples: {
            groups: []
        }
    } as Reference
}