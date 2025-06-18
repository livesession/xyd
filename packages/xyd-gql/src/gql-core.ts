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
    GraphQLNamedType,
    GraphQLSchema,

    isIntrospectionType,
    isSpecifiedScalarType, GraphQLNonNull,
    GraphQLList
} from "graphql";
import GithubSlugger from 'github-slugger';

import {
    Definition,
    DefinitionProperty,
    DefinitionPropertyMeta,
    ExampleGroup,
    Reference,
    ReferenceCategory,
    ReferenceType
} from "@xyd-js/uniform";

import {GQLTypeInfo, GQLOperation} from "./types";
import {gqlFieldToUniformDefinitionProperty} from "./converters/gql-field";
import {Context} from "./context";
import {openDocsCanonical, openDocsToGroup} from "./opendocs";

export type GraphqlUniformReferenceType =
    | GraphQLScalarType
    | GraphQLObjectType
    | GraphQLInterfaceType
    | GraphQLUnionType
    | GraphQLEnumType
    | GraphQLInputObjectType
    | GQLOperation
    | GraphQLField<any, any> | GraphQLInputField | GraphQLArgument

export function extractScopesFromDocDirective(
    ctx: Context,
    gqlType: GraphqlUniformReferenceType,
): string[] {
    const scopes: string[] = []

    const schema = ctx?.schema

    if (gqlType.astNode?.directives) {
        for (const directive of gqlType.astNode.directives) {
            if (directive.name.value === "doc") {
                const scopesArg = directive.arguments?.find(arg => arg.name.value === 'scopes')
                if (scopesArg?.value.kind === 'ListValue') {
                    for (const scopeValue of scopesArg.value.values) {
                        if (scopeValue.kind === 'EnumValue') {
                            // For enum values, we need to find the enum type and its value with @scope directive
                            let enumType: GraphQLEnumType | undefined

                            // First check if current type is an enum
                            if (gqlType instanceof GraphQLEnumType) {
                                enumType = gqlType
                            }
                            // If not and we have a schema, try to find the enum type
                            else if (schema) {
                                const type = schema.getType('OpenDocsScope')
                                if (type instanceof GraphQLEnumType) {
                                    enumType = type
                                }
                            }

                            if (enumType) {
                                const enumValue = enumType.getValue(scopeValue.value)
                                if (enumValue?.astNode?.directives) {
                                    for (const enumDirective of enumValue.astNode.directives) {
                                        if (enumDirective.name.value === 'scope') {
                                            const valueArg = enumDirective.arguments?.find(arg => arg.name.value === 'value')
                                            if (valueArg?.value.kind === 'StringValue') {
                                                scopes.push(valueArg.value.value)
                                            }
                                        }
                                    }
                                }
                            }
                        } else if (scopeValue.kind === 'StringValue') {
                            // Handle string literal (e.g. "user:write")
                            scopes.push(scopeValue.value)
                        }
                    }
                }
            }
        }
    }

    return scopes
}

export function uniformify(
    ctx: Context,
    gqlType: GraphqlUniformReferenceType,
    definitions: Definition[],
    examples: ExampleGroup[],
): Reference {
    let canonicalPrefix = ""
    let graphqlTypeShort = ""
    let refType: ReferenceType | undefined = undefined

    let parentType: GraphQLNamedType | undefined

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
    } else if (gqlType instanceof GQLOperation) {
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
            case "subscription": {
                canonicalPrefix = "subscriptions"
                graphqlTypeShort = "subscription"
                refType = ReferenceType.GRAPHQL_SUBSCRIPTION
                break;
            }
        }
    } else {
        const info = gqlFieldTypeInfo(gqlType)
        if (info?.typeFlat && !isBuiltInType(info?.typeFlat)) {
            if (info?.typeFlat) {
                return uniformify(ctx, info.typeFlat, definitions, examples)
            }
        }
    }

    const slugger = new GithubSlugger();
    const slug = slugger.slug(gqlType.name);
    const odCanonical = openDocsCanonical(ctx, gqlType);

    let canonical = ""
    if (odCanonical) {
        canonical = odCanonical;
    } else {
        canonical = [canonicalPrefix, slug].join("/")
    }

    const scopes = extractScopesFromDocDirective(ctx, gqlType) || []
    return {
        title: gqlType.name,
        description: gqlType.description || "",
        canonical,

        category: ReferenceCategory.GRAPHQL,
        type: refType,

        context: {
            graphqlTypeShort: graphqlTypeShort,
            graphqlName: gqlType.name,
            group: openDocsToGroup(parentType || gqlType, ctx?.schema),
            scopes
        },

        examples: {
            groups: examples || [],
        },

        definitions,
    }
}

export function propsUniformify(
    ctx: Context,
    field: GraphQLField<any, any> | GraphQLInputField | GraphQLArgument,
    properties?: DefinitionProperty[],
    meta?: DefinitionPropertyMeta[]
): DefinitionProperty {
    const fieldInfo = gqlFieldTypeInfo(field);
    const objRef = uniformify(ctx, field, [], []);

    const builtInType = fieldInfo?.typeFlat ? isBuiltInType(fieldInfo?.typeFlat) : undefined

    return {
        name: field.name,
        type: field.type.toJSON(),
        description: field.description || "",
        context: {
            graphqlName: field.name,
            graphqlTypeFlat: fieldInfo.typeFlat?.toJSON() || "",
            graphqlBuiltInType: builtInType,
        },
        properties: properties || [],
        meta: [
            ...gqlFieldToUniformMeta(field),
            ...(meta || []),
        ],
        symbolDef: {
            canonical: objRef?.canonical,
        },
    }
}

export function gqlObjectPropsUniformify(
    ctx: Context,
    obj: GraphQLInputObjectType | GraphQLObjectType,
    meta?: DefinitionPropertyMeta[]
): DefinitionProperty {
    const objRef = uniformify(ctx, obj, [], []);
    const inputFields = obj.getFields?.()
    const nestedProps: DefinitionProperty[] = []

    const nestedDefinitionProperty: DefinitionProperty = {
        name: obj.name,
        type: obj.toJSON(),
        description: obj.description || "",
        context: objRef.context,
        properties: nestedProps,
        meta: [
            ...(meta || []),
        ],
        symbolDef: {
            canonical: objRef.canonical,
        },
    }

    if (!ctx?.config?.flatArg) {
        for (const [name, inputField] of Object.entries(inputFields)) {
            const prop = gqlFieldToUniformDefinitionProperty(
                ctx,
                inputField,
            )

            if (prop) {
                nestedProps.push(prop)
            }
        }
    }

    return nestedDefinitionProperty
}

export function gqlFieldToUniformMeta(
    field: GraphQLField<any, any> | GraphQLInputField | GraphQLArgument
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

export function gqlFieldTypeInfo(
    field: GraphQLField<any, any> | GraphQLInputField
): GQLTypeInfo {
    const getTypeInfo = (type: any): GraphQLNamedType | undefined => {
        if (!type) return undefined;

        // Handle non-null types
        if (type instanceof GraphQLNonNull) {
            return getTypeInfo(type.ofType);
        }


        if (type instanceof GraphQLList) {
            return getTypeInfo(type.ofType);
        }

        // Return the actual type
        return type;
    };

    const graphqlTypeFlat = getTypeInfo(field.type);

    return {
        typeFlat: graphqlTypeFlat
    }
}

export function isBuiltInType(gqlType: GraphQLNamedType): boolean {
    return isSpecifiedScalarType(gqlType) || isIntrospectionType(gqlType)
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