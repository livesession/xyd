// overFields iterates over fields of object or input object types
import {
    GraphQLField,
    GraphQLFieldMap,
    GraphQLInputField,
    GraphQLInputFieldMap,
    GraphQLInputObjectType
} from "graphql/type";
import {GraphQLObjectType} from "graphql";
import {DefinitionProperty} from "@xyd/uniform";

// fieldIntoDefinitionProperty converts GraphQL fields (field or input field) into xyd 'uniform' definition property
export function fieldIntoDefinitionProperty(
    fieldName: string,
    field: GraphQLField<any, any> | GraphQLInputField,
): DefinitionProperty {
    let properties;

    // if 'ofType' types (non-null values e.g '!<type>')
    if ("ofType" in field.type) {
        switch (field.type.constructor.name) {
            case "GraphQLList": {
                switch (field.type.ofType.constructor.name) {
                    case "GraphQLObjectType": {
                        const objectType = field.type.ofType as GraphQLObjectType

                        properties = nestedProperties(objectType)

                        break
                    }

                    case "GraphQLInputObjectType": {
                        const inputObjectType = field.type.ofType as GraphQLInputObjectType

                        properties = nestedProperties(inputObjectType)

                        break
                    }

                    case "GraphQLScalarType" : {
                        properties = definitionPropsFromNestedObj(field) || []

                        break
                    }

                    case "GraphQLNonNull": {
                        properties = definitionPropsFromNestedObj(field) || []

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
    }

    // if input object type
    else if (field.type.constructor.name === "GraphQLInputObjectType") {
        const objectType = field.type as GraphQLInputObjectType

        properties = nestedProperties(objectType)
    }

    return {
        name: fieldName,
        type: field.type.toJSON(),
        description: field.description || "",
        properties,
    }
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
        const prop = fieldIntoDefinitionProperty(
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

