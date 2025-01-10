import {GraphQLArgument} from "graphql/type/definition";
import {GraphQLInputObjectType} from "graphql/type";
import {DefinitionProperty} from "@xyd-js/uniform";

import {fieldIntoDefinitionProperty} from "./fields";

// argumentsIntoDefinitionProperty converts GraphQL arguments into xyd 'uniform' definition properties
export function argumentsIntoDefinitionProperty(
    args: readonly GraphQLArgument[]
): DefinitionProperty[] {
    const resp: DefinitionProperty[] = []

    args.forEach(arg => {
        if (arg.type.constructor.name === "GraphQLInputObjectType") {
            const inputObjectType = arg.type as GraphQLInputObjectType

            const inputFields = inputObjectType.getFields?.()

            const nestedProps: DefinitionProperty[] = []
            const nestedDefinitionProperty: DefinitionProperty = {
                name: arg.name,
                type: arg.type.toJSON(),
                description: arg.description || "",
                properties: nestedProps,
            }

            for (const [name, inputField] of Object.entries(inputFields)) {
                const prop = fieldIntoDefinitionProperty(
                    name,
                    inputField,
                )

                if (prop) {
                    nestedProps.push(prop)
                }
            }

            resp.push(nestedDefinitionProperty)
        } else {
            const prop: DefinitionProperty = {
                name: arg.name,
                type: arg.type.toJSON(),
                description: arg.description || "",
                properties: [],
            }

            resp.push(prop)
        }
    })

    return resp
}