import {GraphQLArgument, GraphQLInputObjectType} from "graphql";

import {DefinitionProperty} from "@xyd-js/uniform";

import {gqlInputToUniformDefinitionProperty} from "./gql-input";
import {Context} from "../context";
import {gqlFieldToUniformMeta, gqlFieldTypeInfo, propsUniformify} from "../gql-core";

// gqlArgToUniformDefinitionProperty converts GraphQL arguments into xyd 'uniform' definition properties
export function gqlArgToUniformDefinitionProperty(
    ctx: Context,
    args: readonly GraphQLArgument[],
): DefinitionProperty[] {
    const resp: DefinitionProperty[] = []

    args.forEach(arg => {
        const fieldInfo = gqlFieldTypeInfo(arg);
        if (!fieldInfo.typeFlat) {
            console.error("gqlArgToUniformDefinitionProperty: no typeFlat for", arg.name);
            return;
        }

        const flatType = fieldInfo.typeFlat

        if (flatType instanceof GraphQLInputObjectType) {
            const inputObj = flatType
            const meta = gqlFieldToUniformMeta(arg)
            const defProperty = gqlInputToUniformDefinitionProperty(
                ctx,
                inputObj,
            )

            resp.push({
                ...defProperty,
                type: arg.type.toJSON(),
                name: arg.name,
                description: arg.description || "",
                meta: [
                    ...defProperty.meta || [],
                    ...meta || []
                ],
            });
        } else {
            const defProperty = propsUniformify(ctx, arg)
            resp.push(defProperty)
        }
    });

    return resp;
}

