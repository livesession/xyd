import type {
    GraphQLField,
    GraphQLFieldMap,
    GraphQLInputField,
    GraphQLInputFieldMap,
    GraphQLInputObjectType,
    GraphQLUnionType,
    GraphQLObjectType,
    GraphQLNamedType,
    GraphQLInterfaceType,
} from "graphql";
import {
    isIntrospectionType,
    isSpecifiedScalarType
} from "graphql";

import type {DefinitionProperty, DefinitionPropertyMeta} from "@xyd-js/uniform";

import {gqlUnionToUniformDefinitionProperties} from "./gql-union";
import {NestedGraphqlType} from "../types";
import {Context} from "./context";

// TODO: better processedTypes without set through all functions?

// gqlFieldToUniformDefinitionProperty converts GraphQL fields (field or input field) into xyd 'uniform' definition property
export function gqlFieldToUniformDefinitionProperty(
    ctx: Context,
    fieldName: string,
    field: GraphQLField<any, any> | GraphQLInputField,
): DefinitionProperty {
    const fieldConverter = new GQLFieldConverter()

    return fieldConverter.convert(ctx, fieldName, field);
}

// TODO: !!! `processedTypes` is SINGLETON !!! PASS FROM FIRST CHAIN CUZ IT MAY SOME ISSUES IF CALLED IN PARALLEL !!! + RESET !!!
export class GQLFieldConverter {
    constructor() {
    }

    public convert(
        ctx: Context,
        fieldName: string,
        field: GraphQLField<any, any> | GraphQLInputField,
        parent?: NestedGraphqlType,
    ): DefinitionProperty {
        if (parent && ctx.options?.flat) {
            return {
                name: fieldName,
                type: field.type.toJSON(),
                context: {
                    graphqlName: fieldName,
                    graphqlTypeFlat: field.type.toJSON(),
                    graphqlTypeShort: getGraphqlTypeShort(field),
                },
                description: field.description || "",
                properties: [],
                meta: this.fieldMeta(field)
            }
        }
        let properties
        let graphqlTypeFlat: GraphQLNamedType | null = null

        // if 'ofType' types (non-null values e.g '!<type>')
        if ("ofType" in field.type) {
            switch (field.type.constructor.name) {
                case "GraphQLList": {
                    switch (field.type.ofType.constructor.name) {
                        case "GraphQLObjectType": {
                            const objectType = field.type.ofType as GraphQLObjectType

                            properties = this.nestedProperties(ctx, objectType)
                            graphqlTypeFlat = objectType

                            break
                        }

                        case "GraphQLInputObjectType": {
                            const inputObjectType = field.type.ofType as GraphQLInputObjectType

                            properties = this.nestedProperties(ctx, inputObjectType)
                            graphqlTypeFlat = inputObjectType

                            break
                        }

                        case "GraphQLScalarType": {
                            properties = this.definitionPropsFromNestedObj(ctx, field) || []
                            graphqlTypeFlat = field.type.ofType as GraphQLNamedType

                            break
                        }

                        case "GraphQLUnionType": {
                            const unionType = field.type.ofType as GraphQLUnionType

                            properties = gqlUnionToUniformDefinitionProperties(ctx, unionType)
                            graphqlTypeFlat = unionType

                            break
                        }

                        case "GraphQLNonNull": {
                            properties = this.definitionPropsFromNestedObj(ctx, field) || []
                            if ("ofType" in field.type.ofType) {
                                graphqlTypeFlat = field.type.ofType.ofType as GraphQLNamedType
                            }

                            break
                        }

                        case "GraphQLInterfaceType": {
                            const interfaceType = field.type.ofType as GraphQLInterfaceType

                            properties = this.nestedProperties(ctx, interfaceType)
                            graphqlTypeFlat = interfaceType

                            break
                        }
                        default: {
                            console.error("unsupported ofType list", field.type.ofType.constructor.name)
                            break
                        }
                    }

                    break
                }

                case "GraphQLNonNull": {
                    properties = this.definitionPropsFromNestedObj(ctx, field) || []
                    graphqlTypeFlat = field.type.ofType as GraphQLNamedType

                    break
                }

                default: {
                    console.error("unsupported ofType", field.type.constructor.name)
                    break
                }
            }
        }
        // if regular object type
        else if (field.type.constructor.name === "GraphQLObjectType") {
            const objectType = field.type as GraphQLObjectType

            properties = this.nestedProperties(ctx, objectType)
            graphqlTypeFlat = field.type
        } else if (field.type.constructor.name === "GraphQLInputObjectType") {
            const objectType = field.type as GraphQLInputObjectType

            properties = this.nestedProperties(ctx, objectType)
            graphqlTypeFlat = field.type
        } else if (field.type.constructor.name === "GraphQLScalarType") {
            graphqlTypeFlat = field.type
        } else if (field.type.constructor.name === "GraphQLUnionType") {
            const unionType = field.type as GraphQLUnionType
            graphqlTypeFlat = unionType
        }

        const builtInType = graphqlTypeFlat ? (isSpecifiedScalarType(graphqlTypeFlat) ||
            isIntrospectionType(graphqlTypeFlat)
        ) : undefined

        let graphqlTypeShort = ""

        switch (graphqlTypeFlat?.constructor?.name) {
            case "GraphQLList": {
                if ("ofType" in graphqlTypeFlat) {
                    graphqlTypeFlat = graphqlTypeFlat.ofType as GraphQLNamedType
                }
            }
        }

        switch (graphqlTypeFlat?.constructor?.name) {
            case "GraphQLObjectType": {
                graphqlTypeShort = "object"
                break
            }
            case "GraphQLInputObjectType": {
                graphqlTypeShort = "input"
                break
            }
            case "GraphQLScalarType": {
                graphqlTypeShort = "scalar"
                break
            }
            case "GraphQLUnionType": {
                graphqlTypeShort = "union"
                const unionType = graphqlTypeFlat as GraphQLUnionType

                properties = gqlUnionToUniformDefinitionProperties(ctx, unionType)

                break
            }
        }

        const resp: DefinitionProperty = {
            name: fieldName,
            type: field.type.toJSON(),
            context: {
                graphqlBuiltInType: builtInType,
                graphqlName: fieldName,
                graphqlTypeFlat: graphqlTypeFlat && graphqlTypeFlat.toJSON(),
                graphqlTypeShort,
            },
            description: field.description || "",
            properties,
            meta: this.fieldMeta(field)
        }

        if (graphqlTypeFlat) {
            const nestedType = graphqlTypeFlat as NestedGraphqlType
            nestedType.__definitionProperties = resp.properties
        }

        if (parent) {
            parent.__definitionProperties = resp.properties
        }

        return resp
    }

    // TODO: fix any + another more safety solution?
    // definitionPropsFromNestedObj converts graphql nested obj into xyd 'uniform' definition properties
    private definitionPropsFromNestedObj(ctx: Context, obj: any): DefinitionProperty[] | null {
        if (!obj) {
            return null
        }
        if (obj.getFields) {
            return this.nestedProperties(ctx, obj)
        }

        if (obj.ofType) {
            return this.definitionPropsFromNestedObj(ctx, obj.ofType)
        }

        if (obj.type) {
            return this.definitionPropsFromNestedObj(ctx, obj.type)
        }

        return null
    }

    // deepFieldMap iterates over GraphQL field (field or input fields) maps
    private deepFieldMap(
        ctx: Context,
        fieldsMap: GraphQLFieldMap<any, any> | GraphQLInputFieldMap,
        parent: NestedGraphqlType
    ): DefinitionProperty[] {
        const properties: DefinitionProperty[] = []

        for (const [name, field] of Object.entries(fieldsMap)) {
            const prop = this.convert(
                ctx,
                name,
                field,
                parent
            )

            if (prop) {
                properties.push(prop)
            }
        }

        return properties
    }

    // nestedProperties get fields from object or input object types and iterates over them
    private nestedProperties(ctx: Context, objectType: NestedGraphqlType) {
        // if (ctx?.options?.flat) {
        //     return []
        // }

        // Check if we've already processed this type to prevent circular dependencies
        if (ctx.processedTypes.has(objectType)) {
            if (objectType?.__definitionProperties) {
                return objectType.__definitionProperties || []
            }

            return [] // Return empt array for already processed types to break the cycle
        }

        // Mark this type as being processed
        ctx.processedTypes.add(objectType)

        const nestedFields = objectType?.getFields?.()
        const result = this.deepFieldMap(ctx, nestedFields, objectType)

        return result
    }

    private fieldMeta(field: GraphQLField<any, any> | GraphQLInputField): DefinitionPropertyMeta[] {
        const meta: DefinitionPropertyMeta[] = []

        // Check if field is required (non-null)
        if (this.isNonNullField(field.type) || this.isListOfNonNullItems(field.type)) {
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

        return meta
    }

    // Helper functions to check field types
    private isNonNullField(type: any): boolean {
        return type.constructor.name === "GraphQLNonNull"
    }

    private isListOfNonNullItems(type: any): boolean {
        return "ofType" in type &&
            type.constructor.name === "GraphQLList" &&
            type.ofType.constructor.name === "GraphQLNonNull"
    }
}

// TODO: refactor - DRY !!!!
function getGraphqlTypeShort(field: GraphQLField<any, any> | GraphQLInputField,): string {
    let graphqlTypeFlat: any

    // if 'ofType' types (non-null values e.g '!<type>')
    if ("ofType" in field.type) {
        switch (field.type.constructor.name) {
            case "GraphQLList": {
                switch (field.type.ofType.constructor.name) {
                    case "GraphQLObjectType": {
                        const objectType = field.type.ofType as GraphQLObjectType

                        graphqlTypeFlat = objectType

                        break
                    }

                    case "GraphQLInputObjectType": {
                        const inputObjectType = field.type.ofType as GraphQLInputObjectType

                        graphqlTypeFlat = inputObjectType

                        break
                    }

                    case "GraphQLScalarType": {
                        graphqlTypeFlat = field.type.ofType as GraphQLNamedType

                        break
                    }

                    case "GraphQLUnionType": {
                        const unionType = field.type.ofType as GraphQLUnionType

                        graphqlTypeFlat = unionType

                        break
                    }

                    case "GraphQLNonNull": {
                        if ("ofType" in field.type.ofType) {
                            graphqlTypeFlat = field.type.ofType.ofType as GraphQLNamedType
                        }

                        break
                    }

                    case "GraphQLInterfaceType": {
                        const interfaceType = field.type.ofType as GraphQLInterfaceType

                        graphqlTypeFlat = interfaceType

                        break
                    }
                    default: {
                        console.error("unsupported ofType list", field.type.ofType.constructor.name)
                        break
                    }
                }

                break
            }

            case "GraphQLNonNull": {
                graphqlTypeFlat = field.type.ofType as GraphQLNamedType

                break
            }

            default: {
                console.error("unsupported ofType", field.type.constructor.name)
                break
            }
        }
    }
    // if regular object type
    else if (field.type.constructor.name === "GraphQLObjectType") {
        const objectType = field.type as GraphQLObjectType

        graphqlTypeFlat = field.type
    } else if (field.type.constructor.name === "GraphQLInputObjectType") {
        const objectType = field.type as GraphQLInputObjectType

        graphqlTypeFlat = field.type
    } else if (field.type.constructor.name === "GraphQLScalarType") {
        graphqlTypeFlat = field.type
    } else if (field.type.constructor.name === "GraphQLUnionType") {
        const unionType = field.type as GraphQLUnionType
        graphqlTypeFlat = unionType
    }

    let graphqlTypeShort = ""

    switch (graphqlTypeFlat?.constructor?.name) {
        case "GraphQLList": {
            if ("ofType" in graphqlTypeFlat) {
                graphqlTypeFlat = graphqlTypeFlat.ofType as GraphQLNamedType
            }
        }
    }

    switch (graphqlTypeFlat?.constructor?.name) {
        case "GraphQLObjectType": {
            graphqlTypeShort = "object"
            break
        }
        case "GraphQLInputObjectType": {
            graphqlTypeShort = "input"
            break
        }
        case "GraphQLScalarType": {
            graphqlTypeShort = "scalar"
            break
        }
        case "GraphQLUnionType": {
            graphqlTypeShort = "union"
            const unionType = graphqlTypeFlat as GraphQLUnionType

            break
        }
    }

    return graphqlTypeShort
}