import {
    GraphQLField,
    GraphQLFieldMap,
    GraphQLInputField,
    GraphQLInputFieldMap,
    GraphQLInputObjectType
} from "graphql/type";
import {
    GraphQLObjectType,
    GraphQLNamedType,

    isIntrospectionType,
    isSpecifiedScalarType
} from "graphql";

import type {DefinitionProperty, DefinitionPropertyMeta} from "@xyd-js/uniform";

// TODO: one instance
let visitedTypes: Map<string, DefinitionProperty> = new Map()

// gqlFieldToUniformDefinitionProperty converts GraphQL fields (field or input field) into xyd 'uniform' definition property
export function gqlFieldToUniformDefinitionProperty(
    fieldName: string,
    field: GraphQLField<any, any> | GraphQLInputField,
): DefinitionProperty {
    // @ts-ignore
    if (field.__visited) {
        // @ts-ignore
        return {
            name: fieldName,
            type: field.type.toJSON(),
            context: {},
            description: field.description || "",
        }
    }
    // @ts-ignore
    field.__visited = field

    // // console.log(field.type.constructor.name, 33333, field)
    // if (visitedTypes.has(field.type.constructor.name)) {
    //     return visitedTypes.get(field.type.constructor.name)!
    // }

    let properties;
    let graphqlTypeFlat: GraphQLNamedType | null = null

    // if 'ofType' types (non-null values e.g '!<type>')
    if ("ofType" in field.type) {
        switch (field.type.constructor.name) {
            case "GraphQLList": {
                switch (field.type.ofType.constructor.name) {
                    case "GraphQLObjectType": {
                        const objectType = field.type.ofType as GraphQLObjectType

                        properties = nestedProperties(objectType)
                        graphqlTypeFlat = objectType

                        break
                    }

                    case "GraphQLInputObjectType": {
                        const inputObjectType = field.type.ofType as GraphQLInputObjectType

                        properties = nestedProperties(inputObjectType)
                        graphqlTypeFlat = inputObjectType

                        break
                    }

                    case "GraphQLScalarType": {
                        properties = definitionPropsFromNestedObj(field) || []
                        graphqlTypeFlat = field.type.ofType as GraphQLNamedType

                        break
                    }

                    case "GraphQLNonNull": {
                        properties = definitionPropsFromNestedObj(field) || []

                        if ("ofType" in field.type.ofType) {
                            graphqlTypeFlat = field.type.ofType.ofType as GraphQLNamedType
                        }

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
                properties = definitionPropsFromNestedObj(field) || []
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

        // TODO: support nested & circular references - ITS JUST A FAST SOLUTION FOR TESTING PURPOSES
        // properties = [
        //     {
        //         name: fieldName,
        //         type: "object",
        //         description: objectType.description || "",
        //     }
        // ]

        // TODO: comment if bug with circular references
        properties = nestedProperties(objectType)
    } else if (field.type.constructor.name === "GraphQLInputObjectType") {
        const objectType = field.type as GraphQLInputObjectType

        graphqlTypeFlat = field.type
        properties = nestedProperties(objectType)
    } else if (field.type.constructor.name === "GraphQLScalarType") {
        graphqlTypeFlat = field.type
    }


    switch (graphqlTypeFlat?.constructor?.name) {
        case "GraphQLList": {
            if ("ofType" in graphqlTypeFlat) {
                graphqlTypeFlat = graphqlTypeFlat.ofType as GraphQLNamedType
            }
        }
    }

    const builtInType = graphqlTypeFlat ? (isSpecifiedScalarType(graphqlTypeFlat) ||
        isIntrospectionType(graphqlTypeFlat)
    ) : undefined

    let graphqlTypeShort = ""

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
    }

    const meta: DefinitionPropertyMeta[] = []

    // Check if field is required (non-null)
    if (isNonNullField(field.type) || isListOfNonNullItems(field.type)) {
        meta.push({
            name: "required",
            value: "true"
        })
    }

    // Handle directives
    let groups: string[] = []
    if (field.astNode?.directives) {
        for (const directive of field.astNode.directives) {
            // Handle @deprecated directive
            if (directive.name.value === "deprecated") {
                meta.push({
                    name: "deprecated",
                    value: "true"
                })
            }
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
        meta,
    }

    visitedTypes.set(field.type.constructor.name, resp)

    return resp
}

// TODO: fix any + another more safety solution?
// definitionPropsFromNestedObj converts graphql nested obj into xyd 'uniform' definition properties
function definitionPropsFromNestedObj(obj: any): DefinitionProperty[] | null {
    if (!obj) {
        return null
    }
    if (obj.getFields) {
        return nestedProperties(obj)
    }

    if (obj.ofType) {
        return definitionPropsFromNestedObj(obj.ofType)
    }

    if (obj.type) {
        return definitionPropsFromNestedObj(obj.type)
    }

    return null
}

// deepFieldMap iterates over GraphQL field (field or input fields) maps
function deepFieldMap(
    fieldsMap: GraphQLFieldMap<any, any> | GraphQLInputFieldMap,
) {
    const properties: DefinitionProperty[] = []

    for (const [name, field] of Object.entries(fieldsMap)) {
        const prop = gqlFieldToUniformDefinitionProperty(
            name,
            field,
        )

        if (prop) {
            properties.push(prop)
        }
    }

    return properties
}

// nestedProperties get fields from object or input object types and iterates over them
function nestedProperties(objectType: GraphQLObjectType | GraphQLInputObjectType) {
    const nestedFields = objectType?.getFields?.()

    return deepFieldMap(nestedFields)
}

// Helper functions to check field types
function isNonNullField(type: any): boolean {
    return type.constructor.name === "GraphQLNonNull"
}

function isListOfNonNullItems(type: any): boolean {
    return "ofType" in type &&
        type.constructor.name === "GraphQLList" &&
        type.ofType.constructor.name === "GraphQLNonNull"
}

