import { GraphQLArgument, GraphQLInputObjectType } from "graphql";

import { DefinitionProperty, DefinitionPropertyMeta } from "@xyd-js/uniform";

import { gqlInputToUniformDefinitionProperty } from "./gql-input";
import {NestedGraphqlType} from "../types";
import {Context} from "./context";

// gqlArgToUniformDefinitionProperty converts GraphQL arguments into xyd 'uniform' definition properties
export function gqlArgToUniformDefinitionProperty(
    ctx: Context,
    args: readonly GraphQLArgument[],
): DefinitionProperty[] {
    const resp: DefinitionProperty[] = []

    args.forEach(arg => {
        let type = arg.type;
        const meta: DefinitionPropertyMeta[] = [];

        // Handle non-null types
        if (type.constructor.name === "GraphQLNonNull" && "ofType" in type) {
            meta.push({
                name: "required",
                value: "true"
            });
            type = type.ofType;
        }

        // Handle list types
        if (type.constructor.name === "GraphQLList" && "ofType" in type) {
            type = type.ofType;

            if (type.constructor.name === "GraphQLNonNull" && "ofType" in type) {
                type = type.ofType;
            }
        }

        // TODO: something similar to uniformPropsify but for properties?
        switch (type.constructor.name) {
            case "GraphQLInputObjectType": {
                resp.push(gqlInputToUniformDefinitionProperty(
                    ctx,
                    arg.name,
                    arg.description || "",
                    type as GraphQLInputObjectType,
                ));
                break;
            }
            case "GraphQLScalarType": {
                resp.push({
                    name: arg.name,
                    type: arg.type.toJSON(),
                    description: arg.description || "",
                    context: {
                        graphqlName: arg.name,
                        graphqlTypeFlat: type.toJSON(),
                        graphqlTypeShort: "scalar"
                    },
                    meta
                });
                break;
            }
            case "GraphQLEnumType": {
                resp.push({
                    name: arg.name,
                    type: arg.type.toJSON(),
                    description: arg.description || "",
                    context: {
                        graphqlName: arg.name,
                        graphqlTypeFlat: type.toJSON(),
                        graphqlTypeShort: "enum"
                    },
                    meta
                });
                break;
            }
            default: {
                console.error("unsupported argument type", type.constructor.name);
            }
        }
    });

    return resp;
}

