import {
    GraphQLArgument,
    GraphQLEnumType,
    GraphQLEnumValue,
    GraphQLInputObjectType,
    GraphQLInterfaceType,
    GraphQLObjectType,
    GraphQLScalarType,
    GraphQLUnionType,
    GraphQLField,
    GraphQLInputField,
} from "graphql";
import GithubSlugger from 'github-slugger';

import {
    Definition,
    type DefinitionPropertyMeta,
    ExampleGroup,
    Reference,
    ReferenceCategory,
    ReferenceType
} from "@xyd-js/uniform";

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

export function gqlFieldToUniformMeta(
    field: GraphQLField<any, any> | GraphQLInputField
): DefinitionPropertyMeta[] {
    const meta: DefinitionPropertyMeta[] = []

    // Check if field is required (non-null)
    if (isNonNullField(field.type) || isListOfNonNullItems(field.type)) {
        meta.push({
            name: "required",
            value: "true"
        })
    }

    // Handle directives
    if (field.astNode?.directives) {
        for (const directive of field.astNode.directives) {
            // Handle @deprecated directive
            if (directive.name.value === "deprecated") {
                let foundDeprecatedReason = false
                for (const arg of directive.arguments || []) {
                    if (arg.name.value === "reason") {
                        foundDeprecatedReason = true
                        meta.push({
                            name: "deprecated",
                            value: arg.value.kind === 'StringValue' ? arg.value.value : "true"
                        })
                    }
                }

                if (!foundDeprecatedReason) {
                    meta.push({
                        name: "deprecated",
                        value: "true"
                    })
                }
            }
        }
    }

    if ("defaultValue" in field && field.defaultValue !== undefined) {
        meta.push({
            name: "defaults",
            value: field.defaultValue
        })
    }

    return meta
}

// TODO: fix any
function isNonNullField(type: any): boolean {
    return type.constructor.name === "GraphQLNonNull"
}

// TODO: fix any
function isListOfNonNullItems(type: any): boolean {
    return "ofType" in type &&
        type.constructor.name === "GraphQLList" &&
        type.ofType.constructor.name === "GraphQLNonNull"
}