import {GraphQLEnumType} from "graphql";

import type {DefinitionProperty, Reference} from "@xyd-js/uniform";
import {uniformify} from "../utils";

// gqlEnumToUniformRef is a helper function to convert a GraphQL enum type into a 'uniform' reference.
export function gqlEnumToUniformRef(gqlType: GraphQLEnumType): Reference {
    const props: DefinitionProperty[] = gqlType.getValues().map(value => ({
        name: value.name,
        type: "string",
        description: value.description || "",
    }))

    return uniformify(
        gqlType,
        [
            {
                title: "Valid values",
                properties: props
            }
        ],
        [],
    )
}