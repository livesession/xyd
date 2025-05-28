import type {
    GraphQLEnumType,
    GraphQLInputObjectType,
    GraphQLInterfaceType,
    GraphQLObjectType,
    GraphQLScalarType,
    GraphQLSchema,
    GraphQLUnionType,
} from "graphql";
import {
    isIntrospectionType,
    isSpecifiedScalarType
} from "graphql";

import {Reference} from "@xyd-js/uniform";

import {GQLSchemaToReferencesOptions, NestedGraphqlType} from "../types";
import {gqlObjectToUniformRef} from "./gql-object";
import {gqlInputToUniformRef} from "./gql-input";
import {gqlEnumToUniformRef} from "./gql-enum";
import {gqlScalarToUniformRef} from "./gql-scalar";
import {gqlUnionToUniformRef} from "./gql-union";
import {gqlInterfaceToUniformRef} from "./gql-interface";
import {Context} from "../context";

// TODO: missing types like interfaces, fragments.
export function graphqlTypesToUniformReferences(
    schema: GraphQLSchema,
    options?: GQLSchemaToReferencesOptions,
): Reference[] {
    const references: Reference[] = []
    const typeMap = schema.getTypeMap();

    const sharedProcessedTypes = new Set<NestedGraphqlType>();

    for (const gqlType of Object.values(typeMap)) {
        const builtInType = isSpecifiedScalarType(gqlType) ||
            isIntrospectionType(gqlType) ||
            gqlType.name === "Mutation" ||
            gqlType.name === "Query"

        if (builtInType) {
            continue;
        }

        let ref: Reference | null = null

        let flat = false;
        if (options?.flat) {
            flat = true;
        }

        switch (gqlType.constructor.name) {
            case 'GraphQLObjectType': {
                const type = gqlType as GraphQLObjectType;
                const regionKey = `object.${type.name}`;
                if (!options?.regions || !options?.regions?.length || options.regions.includes(regionKey)) {

                    ref = gqlObjectToUniformRef(
                        new Context(
                            sharedProcessedTypes,
                            options,
                            {
                                flat,
                            }
                        ),
                        type
                    )
                }
                break
            }

            case 'GraphQLInputObjectType': {
                const type = gqlType as GraphQLInputObjectType;
                const regionKey = `input.${type.name}`;
                if (!options?.regions || !options?.regions?.length || options.regions.includes(regionKey)) {
                    ref = gqlInputToUniformRef(
                        new Context(
                            sharedProcessedTypes,
                            options,
                            {
                                flat
                            }
                        ),
                        type
                    )
                }
                break
            }

            case 'GraphQLEnumType': {
                const type = gqlType as GraphQLEnumType;
                const regionKey = `enum.${type.name}`;
                if (!options?.regions || !options?.regions?.length || options.regions.includes(regionKey)) {
                    ref = gqlEnumToUniformRef(
                        new Context(
                            new Set(),
                            options
                        ),
                        type
                    )
                }
                break
            }

            case 'GraphQLScalarType': {
                const type = gqlType as GraphQLScalarType;
                const regionKey = `scalar.${type.name}`;
                if (!options?.regions || !options?.regions?.length || options.regions.includes(regionKey)) {
                    ref = gqlScalarToUniformRef(
                        new Context(
                            new Set(),
                            options
                        ),
                        type
                    )
                }
                break
            }

            case 'GraphQLUnionType': {
                const type = gqlType as GraphQLUnionType;
                const regionKey = `union.${type.name}`;
                if (!options?.regions || !options?.regions?.length || options.regions.includes(regionKey)) {
                    ref = gqlUnionToUniformRef(
                        new Context(
                            sharedProcessedTypes,
                            options,
                            {
                                flat,
                                argFlat: flat || false
                            }
                        ),
                        type,
                    )
                }

                break
            }

            case 'GraphQLInterfaceType': {
                const type = gqlType as GraphQLInterfaceType;
                const regionKey = `interface.${type.name}`;
                if (!options?.regions || !options?.regions?.length || options.regions.includes(regionKey)) {
                    ref = gqlInterfaceToUniformRef(
                        new Context(
                            new Set(),
                            options,
                            {
                                flat
                            }
                        ),
                        type,
                    )
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

