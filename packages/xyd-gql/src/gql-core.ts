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
import {openDocsToGroup} from "./opendocs";

type GraphqlUniformReferenceType =
    | GraphQLScalarType
    | GraphQLObjectType
    | GraphQLInterfaceType
    | GraphQLUnionType
    | GraphQLEnumType
    | GraphQLInputObjectType
    | GQLOperation
    | GraphQLField<any, any> | GraphQLInputField | GraphQLArgument

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
        }
    } else {
        const info = gqlFieldTypeInfo(gqlType)
        if (info?.typeFlat && !isBuiltInType(info?.typeFlat)) { // TODO: in the future options + check if defined in schema
            if (info?.typeFlat) {
                return uniformify(info.typeFlat, definitions, examples)
            }
        }
    }

    const slugger = new GithubSlugger();
    const slug = slugger.slug(gqlType.name);
    let canonical = ""
    if (canonicalPrefix) {
        canonical = `${canonicalPrefix}/${slug}`;
    }
    return {
        title: gqlType.name,
        description: gqlType.description || "",
        canonical,

        category: ReferenceCategory.GRAPHQL,
        type: refType,

        context: {
            graphqlTypeShort: graphqlTypeShort,
            graphqlName: gqlType.name,
            group: openDocsToGroup(gqlType),
        },

        examples: {
            groups: examples || [],
        },

        definitions,
    }
}

export function propsUniformify(
    field: GraphQLField<any, any> | GraphQLInputField | GraphQLArgument,
    properties?: DefinitionProperty[],
    meta?: DefinitionPropertyMeta[]
): DefinitionProperty {
    const fieldInfo = gqlFieldTypeInfo(field);
    const objRef = uniformify(field, [], []);

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
    const objRef = uniformify(obj, [], []);
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