import type {
    GraphQLEnumType,
    GraphQLInputObjectType,
    GraphQLObjectType,
    GraphQLScalarType,
    GraphQLSchema,
} from "graphql/type";
import {
    isIntrospectionType,
    isSpecifiedScalarType
} from "graphql/type";

import {Reference} from "@xyd-js/uniform";

import {gqlObjectToUniformRef} from "./gql-object";
import {gqlInputToUniformRef} from "./gql-input";
import {GQLSchemaToReferencesOptions} from "../types";
import {gqlEnumToUniformRef} from "./gql-enum";
import {gqlScalarToUniformRef} from "./gql-scalar";

// TODO: missing types like interfaces, fragments.
export function graphqlTypesToUniformReferences(schema: GraphQLSchema, options?: GQLSchemaToReferencesOptions): Reference[] {
    const references: Reference[] = []
    const typeMap = schema.getTypeMap();

    for (const gqlType of Object.values(typeMap)) {
        const builtInType = isSpecifiedScalarType(gqlType) ||
            isIntrospectionType(gqlType) ||
            gqlType.name === "Mutation" ||
            gqlType.name === "Query"

        if (builtInType) {
            continue;
        }

        let ref: Reference | null = null

        switch (gqlType.constructor.name) {
            case 'GraphQLObjectType': {
                const type = gqlType as GraphQLObjectType;
                const regionKey = `object.${type.name}`;
                if (!options?.regions || !options?.regions?.length || options.regions.includes(regionKey)) {
                    ref = gqlObjectToUniformRef(type)
                }
                break
            }

            case 'GraphQLInputObjectType': {
                const type = gqlType as GraphQLInputObjectType;
                const regionKey = `input.${type.name}`;
                if (!options?.regions || !options?.regions?.length || options.regions.includes(regionKey)) {
                    ref = gqlInputToUniformRef(type)
                }
                break
            }

            case 'GraphQLEnumType': {
                const type = gqlType as GraphQLEnumType;
                const regionKey = `enum.${type.name}`;
                if (!options?.regions || !options?.regions?.length || options.regions.includes(regionKey)) {
                    ref = gqlEnumToUniformRef(type)
                }
                break
            }

            case 'GraphQLScalarType': {
                const type = gqlType as GraphQLScalarType;
                const regionKey = `scalar.${type.name}`;
                if (!options?.regions || !options?.regions?.length || options.regions.includes(regionKey)) {
                    ref = gqlScalarToUniformRef(type)
                }
                break
            }

            default: {
                console.debug(`Unsupported type: ${gqlType.constructor.name}`)
            }
        }

        if (ref) {
            references.push(ref);
        }
    }

    return references;
}

