import {
    GraphQLInputObjectType,
    GraphQLObjectType,
    GraphQLEnumType,
    isSpecifiedScalarType,
    isIntrospectionType
} from "graphql";
import { OperationTypeNode } from "graphql/language/ast";
import matter from 'gray-matter'

import { getDocumentLoaders, loadSchema } from "@graphql-markdown/graphql";
import { GraphQLScalarType } from "@graphql-markdown/types";

import type { Reference } from "@xyd-js/uniform"
import { ReferenceType } from "@xyd-js/uniform"
import { gqlInputToUniformRef } from "./hydration/gql-input";
import { gqlEnumToUniformRef, gqlScalarToUniformRef } from "./hydration/gql-types";
import { gqlObjectToUniformRef } from "./hydration/gql-object";
import { gqlOperationsToUniformRef, groupReference } from "./utils";
import { Metadata } from "@xyd-js/core";

// TODO: support multi graphql files
// TODO: !!! CIRCULAR_DEPENDENCY !!!
// TODO: sort by tag??

// TODO: support line ranged in the future?
interface gqlSchemaToReferencesOptions {
    regions?: string[] // TODO: BETTER API - UNIFY FOR REST API / GRAPHQL ETC
}

const DEFAULT_GROUP = "Operations"

export async function gqlSchemaToReferences(
    schemaLocation: string,
    options?: gqlSchemaToReferencesOptions
): Promise<Reference[]> {
    const loadersList = {
        ["GraphQLFileLoader"]: "@graphql-tools/graphql-file-loader",
    }
    const loaders = await getDocumentLoaders(loadersList);

    // @ts-ignore TODO: but ts works in @graphql-markdown/core
    const schema = await loadSchema(schemaLocation as string, loaders);

    const references: Reference[] = []

    const queries = schema.getRootType(OperationTypeNode.QUERY)
    const queryFields = queries?.getFields?.()

    if (queryFields) {
        // Filter query fields based on regions if provided
        const filteredQueryFields = filterFieldsByRegions(
            queryFields,
            "query",
            options?.regions
        );

        references.push(...gqlOperationsToUniformRef(
            ReferenceType.GRAPHQL_QUERY,
            filteredQueryFields
        ))
    }

    const mutations = schema.getRootType(OperationTypeNode.MUTATION)
    const mutationFields = mutations?.getFields?.()

    if (mutationFields) {
        // Filter mutation fields based on regions if provided
        const filteredMutationFields = filterFieldsByRegions(
            mutationFields,
            "mutation",
            options?.regions
        );

        references.push(...gqlOperationsToUniformRef(
            ReferenceType.GRAPHQL_MUTATION,
            filteredMutationFields
        ))
    }

    const typeMap = schema.getTypeMap();

    for (const gqlType of Object.values(typeMap)) {
        const builtInType = isSpecifiedScalarType(gqlType) ||
            isIntrospectionType(gqlType) ||
            gqlType.name === "Mutation"

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
                if (!options?.regions || !options?.regions?.length ||options.regions.includes(regionKey)) {
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
            let description = ""
            if (typeof ref.description === "string") {
                description = ref.description
            } else {
                console.error("Unsupported description type", ref.title)
            }

            const metaDescription = matter(description)
            const meta = metaDescription?.data as Metadata | undefined

            let group = [DEFAULT_GROUP]
            if (meta && meta.group) {
                group = meta.group
            }

            if (ref.context) {
                ref.context.group = group
            } else {
                console.error("No context found for ref", ref.title)
            }

            references.push(groupReference(ref))
        }

    }

    return references
}


/**
 * Helper function to filter fields based on region patterns
 * @param fields - The fields to filter
 * @param prefix - The prefix for the region key (e.g., "Query" or "Mutation")
 * @param regions - The regions to filter by
 * @returns Filtered fields object
 */
function filterFieldsByRegions<T>(
    fields: Record<string, T>,
    prefix: string,
    regions?: string[]
): Record<string, T> {
    if (!regions || regions.length === 0) {
        return fields;
    }

    const filteredFields: Record<string, T> = {};
    for (const [fieldName, field] of Object.entries(fields)) {
        const regionKey = `${prefix}.${fieldName}`;
        if (regions.some(region => region === regionKey)) {
            filteredFields[fieldName] = field;
        }
    }
    return filteredFields;
}

/**
 * Helper function to check if a type should be included based on regions
 * @param typeName - The name of the type
 * @param regions - The regions to filter by
 * @returns Whether the type should be included
 */
function shouldIncludeType(typeName: string, regions?: string[]): boolean {
    if (!regions || regions.length === 0) {
        return true;
    }
    return regions.some(region => region === typeName);
}
