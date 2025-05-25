import {
    GraphQLArgument,
    GraphQLEnumType,
    GraphQLEnumValue,
    GraphQLInputObjectType,
    GraphQLInterfaceType,
    GraphQLObjectType,
    GraphQLScalarType,
    GraphQLUnionType,
    GraphQLField
} from "graphql";
import GithubSlugger from 'github-slugger';

import {Definition, ExampleGroup, Reference, ReferenceCategory, ReferenceType} from "@xyd-js/uniform";

import {GraphqlOperation} from "./types";

type GraphqlUniformReferenceType =
    | GraphQLScalarType
    | GraphQLObjectType
    | GraphQLInterfaceType
    | GraphQLUnionType
    | GraphQLEnumType
    | GraphQLInputObjectType
    | GraphqlOperation

export function uniformify(
    gqlType: GraphqlUniformReferenceType,
    definitions: Definition[],
    examples: ExampleGroup[]
): Reference {
    let canonicalPrefix = ""
    let graphqlTypeShort = ""
    let refType: ReferenceType | undefined = undefined

    if (gqlType instanceof GraphQLScalarType) {
        canonicalPrefix = "scalars"
        graphqlTypeShort = "scalar"
        refType = ReferenceType.GRAPHQL_SCALAR
    } else if (gqlType instanceof GraphQLObjectType) {
        canonicalPrefix = "objects"
        graphqlTypeShort = "object"
        refType = ReferenceType.GRAPHQL_OBJECT
    } else if (gqlType instanceof GraphQLInterfaceType) {
        canonicalPrefix = "interfaces"
        graphqlTypeShort = "interface"
        refType = ReferenceType.GRAPHQL_INTERFACE
    } else if (gqlType instanceof GraphQLUnionType) {
        canonicalPrefix = "unions"
        graphqlTypeShort = "union"
        refType = ReferenceType.GRAPHQL_UNION
    } else if (gqlType instanceof GraphQLEnumType) {
        canonicalPrefix = "enums"
        graphqlTypeShort = "enum"
        refType = ReferenceType.GRAPHQL_ENUM
    } else if (gqlType instanceof GraphQLInputObjectType) {
        canonicalPrefix = "inputs"
        graphqlTypeShort = "input"
        refType = ReferenceType.GRAPHQL_INPUT
    } else if (gqlType instanceof GraphqlOperation) {
        switch (gqlType._operationType) {
            case "query": {
                canonicalPrefix = "queries"
                graphqlTypeShort = "query"
                refType = ReferenceType.GRAPHQL_QUERY
                break;
            }
            case "mutation": {
                canonicalPrefix = "mutations"
                graphqlTypeShort = "mutation"
                refType = ReferenceType.GRAPHQL_MUTATION
                break;
            }
        }
    }

    const slugger = new GithubSlugger();
    const slug = slugger.slug(gqlType.name);

    return {
        title: gqlType.name,
        description: gqlType.description || "",
        canonical: `${canonicalPrefix}/${slug}`,

        category: ReferenceCategory.GRAPHQL,
        type: refType,

        context: {
            graphqlTypeShort: graphqlTypeShort,
            graphqlName: gqlType.name,
            group: gqlASTNodeTypeToUniformGroup(gqlType),
        },

        examples: {
            groups: examples || [],
        },

        definitions,
    }
}

/**
 * Helper function to filter fields based on region patterns
 * @param fields - The fields to filter
 * @param prefix - The prefix for the region key (e.g., "Query" or "Mutation")
 * @param regions - The regions to filter by
 * @returns Filtered fields object
 */
export function filterFieldsByRegions<T>(
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

type GraphqlASTNodeType =
    | GraphQLScalarType
    | GraphQLObjectType
    | GraphQLField<any, any>
    | GraphQLArgument
    | GraphQLInterfaceType
    | GraphQLUnionType
    | GraphQLEnumType
    | GraphQLEnumValue
    | GraphQLInputObjectType

function gqlASTNodeTypeToUniformGroup(
    astNodeType: GraphqlASTNodeType
): string[] {
    let groups: string[] = []

    if (!astNodeType.astNode?.directives) {
        return groups
    }

    for (const directive of astNodeType.astNode.directives) {
        switch (directive.name.value) {
            // TODO IN THE FUTURE !!! OPEN DOCS SPEC !!!
            case "opendocs": {
                const groupArg = directive.arguments?.find(arg => arg.name.value === 'group')
                if (groupArg?.value.kind === 'ListValue') {
                    groups = groupArg.value.values
                        .filter(v => v.kind === 'StringValue')
                        .map(v => (v as any).value)
                }
                break
            }
        }
    }

    if (!groups?.length) {
        if (astNodeType instanceof GraphQLObjectType) {
            groups = [
                "Objects"
            ]
        } else if (astNodeType instanceof GraphQLInterfaceType) {
            groups = [
                "Interfaces"
            ]
        } else if (astNodeType instanceof GraphQLUnionType) {
            groups = [
                "Unions"
            ]
        } else if (astNodeType instanceof GraphQLEnumType) {
            groups = [
                "Enums"
            ]
        } else if (astNodeType instanceof GraphQLInputObjectType) {
            groups = [
                "Inputs"
            ]
        } else if (astNodeType instanceof GraphQLScalarType) {
            groups = [
                "Scalars"
            ]
        } else if (astNodeType instanceof GraphqlOperation) {
            switch (astNodeType._operationType) {
                case "query": {
                    groups = [
                        "Queries"
                    ]
                    break;
                }
                case "mutation": {
                    groups = [
                        "Mutations"
                    ]
                    break;
                }
            }
        }
    }

    return groups
}