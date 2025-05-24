import {GraphQLObjectType} from "graphql";

import type {DefinitionProperty} from "@xyd-js/uniform";

import {gqlFieldToUniformDefinitionProperty} from "./gql-field";
import {uniformify} from "../utils";

// gqlObjectToUniformRef is a helper function to convert a GraphQL object type into a 'uniform' reference.
export function gqlObjectToUniformRef(gqlType: GraphQLObjectType) {
    const props: DefinitionProperty[] = []

    for (const [name, field] of Object.entries(gqlType.getFields())) {
        const prop = gqlFieldToUniformDefinitionProperty(name, field)

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