import {
    GraphQLField,
    GraphQLFieldMap,
    GraphQLInputField,
    GraphQLInputFieldMap,
    GraphQLInputObjectType,
    GraphQLUnionType,
    GraphQLObjectType,
    GraphQLInterfaceType,
    GraphQLScalarType,
    GraphQLNonNull,
} from "graphql";

import type {DefinitionProperty, DefinitionPropertyMeta} from "@xyd-js/uniform";

import {NestedGraphqlType} from "../types";
import {gqlFieldTypeInfo, propsUniformify} from "../gql-core";
import {gqlUnionToUniformDefinitionProperties} from "./gql-union";
import {Context} from "../context";

// gqlFieldToUniformDefinitionProperty converts GraphQL fields (field or input field) into xyd 'uniform' definition property
export function gqlFieldToUniformDefinitionProperty(
    ctx: Context,
    field: GraphQLField<any, any> | GraphQLInputField,
): DefinitionProperty {
    return GQLFieldConverter.convert(ctx, field);
}

export class GQLFieldConverter {
    private constructor(private ctx: Context) {
    }

    public static convert(
        ctx: Context,
        field: GraphQLField<any, any> | GraphQLInputField,
    ): DefinitionProperty {
        return new GQLFieldConverter(ctx).convert(field);
    }

    private convert(
        field: GraphQLField<any, any> | GraphQLInputField,
        parent?: NestedGraphqlType,
    ): DefinitionProperty {
        if (this.ctx.globalOptions?.flat && (this.ctx.config?.flatReturn || this.ctx.config?.flat)) {
            const info = gqlFieldTypeInfo(field)
            const meta: DefinitionPropertyMeta[] = []

            const props = propsUniformify(field, [], meta)
            if (this.ctx.config?.flatReturn) {
                return {
                    ...props,
                    name: ""
                }
            }

            if (this.ctx.config?.flat) {
                return props
            }
        }

        const fieldInfo = gqlFieldTypeInfo(field)
        const graphqlTypeFlat = fieldInfo?.typeFlat

        let properties

        switch (graphqlTypeFlat?.constructor) {
            case GraphQLObjectType:
            case GraphQLInputObjectType:
            case GraphQLInterfaceType: {
                properties = this.nestedProperties(graphqlTypeFlat as NestedGraphqlType)
                break;
            }
            case GraphQLScalarType:
            case GraphQLNonNull: {
                properties = this.definitionPropsFromNestedObj(field) || []
                break;
            }
            case GraphQLUnionType: {
                properties = gqlUnionToUniformDefinitionProperties(this.ctx, graphqlTypeFlat as GraphQLUnionType)
                break;
            }
        }

        const resp = propsUniformify(
            field,
            properties,
        )

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
    private definitionPropsFromNestedObj(obj: any): DefinitionProperty[] | null {
        if (!obj) {
            return null
        }
        if (obj.getFields) {
            return this.nestedProperties(obj)
        }

        if (obj.ofType) {
            return this.definitionPropsFromNestedObj(obj.ofType)
        }

        if (obj.type) {
            return this.definitionPropsFromNestedObj(obj.type)
        }

        return null
    }

    // deepFieldMap iterates over GraphQL field (field or input fields) maps
    private deepFieldMap(
        fieldsMap: GraphQLFieldMap<any, any> | GraphQLInputFieldMap,
        parent: NestedGraphqlType
    ): DefinitionProperty[] {
        const properties: DefinitionProperty[] = []

        for (const [name, field] of Object.entries(fieldsMap)) {
            const prop = this.convert(
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
    private nestedProperties(objectType: NestedGraphqlType) {
        // Check if we've already processed this type to prevent circular dependencies
        if (this.ctx.processedTypes.has(objectType)) {
            if (objectType?.__definitionProperties) {
                return objectType.__definitionProperties || []
            }

            return [] // Return empt array for already processed types to break the cycle
        }

        // Mark this type as being processed
        this.ctx.processedTypes.add(objectType)

        const nestedFields = objectType?.getFields?.()
        const result = this.deepFieldMap(nestedFields, objectType)

        return result
    }
}

