import {GraphQLArgument} from "graphql/type/definition";
import {GraphQLInputObjectType} from "graphql/type";

import {DefinitionProperty} from "@xyd-js/uniform";

import {gqlInputToUniformDefinitionProperty} from "./gql-input";

// gqlArgToUniformDefinitionProperty converts GraphQL arguments into xyd 'uniform' definition properties
export function gqlArgToUniformDefinitionProperty(
    args: readonly GraphQLArgument[]
): DefinitionProperty[] {
    const resp: DefinitionProperty[] = []

    args.forEach(arg => {
        let obj: GraphQLInputObjectType | null = null

        switch (arg.type.constructor.name) {
            case "GraphQLNonNull": {
                if ("ofType" in arg.type) {
                    const ofType = arg.type?.ofType

                    if (ofType?.constructor.name === "GraphQLInputObjectType") {
                        obj = ofType as GraphQLInputObjectType
                    }
                }
                break
            }

            case "GraphQLInputObjectType" : {
                obj = arg.type as GraphQLInputObjectType

                break
            }

            default: {
            }
        }

        if (!obj) {
            console.error("unsupported argument type", arg.type.constructor.name)
            return
        }

        resp.push(gqlInputToUniformDefinitionProperty(
            arg.name,
            arg.description || "",
            obj
        ))
    })

    return resp
}

