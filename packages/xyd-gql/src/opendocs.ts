import {
    GraphQLSchema,
    GraphQLArgument,
    GraphQLEnumType,
    GraphQLEnumValue,
    GraphQLField,
    GraphQLInputObjectType,
    GraphQLInterfaceType,
    GraphQLObjectType,
    GraphQLScalarType,
    GraphQLUnionType,
    GraphQLNamedType,
    ConstValueNode,
    StringValueNode,
    FieldDefinitionNode,
    ObjectTypeDefinitionNode,
    InterfaceTypeDefinitionNode,
    TypeExtensionNode,
    ObjectTypeExtensionNode,
    Kind
} from "graphql";

import {GQLOperation, GQLSchemaToReferencesOptions, OpenDocsSortConfig} from "./types";
import {GraphqlUniformReferenceType} from "./gql-core";
import {Context} from "./context";

export const OPEN_DOCS_SCHEMA_DIRECTIVE_NAME = "docs";
export const OPEN_DOCS_DIRECTIVE_NAME = "doc";

export function openDocsExtensionsToOptions(
    schema: GraphQLSchema,
) {
    const options: GQLSchemaToReferencesOptions = {}

    // Check for @docs directive in schema extensions
    for (const extension of schema.extensionASTNodes || []) {
        if (extension.kind === 'SchemaExtension') {
            for (const directive of extension.directives || []) {
                if (directive.name.value === OPEN_DOCS_SCHEMA_DIRECTIVE_NAME) {
                    for (const arg of directive.arguments || []) {
                        if (arg.name.value === 'flattenTypes' && arg.value.kind === 'BooleanValue') {
                            if (arg.value.value === true) {
                                options.flat = true
                            } else if (arg.value.value === false) {
                                options.flat = false
                            }
                        } else if (arg.name.value === 'sort' && arg.value.kind === 'ObjectValue') {
                            const sortConfig: OpenDocsSortConfig = {};
                            for (const field of arg.value.fields) {
                                if (field.value.kind === 'IntValue') {
                                    sortConfig[field.name.value as keyof OpenDocsSortConfig] = parseInt(field.value.value);
                                }
                            }
                            options.sort = sortConfig;
                        } else if (arg.name.value === 'route' && arg.value.kind === 'StringValue') {
                            options.route = arg.value.value;
                        }
                    }
                }
            }
        }
    }

    return options;
}

type OpenDocsGQLNode =
    | GraphQLScalarType
    | GraphQLObjectType
    | GraphQLField<any, any>
    | GraphQLArgument
    | GraphQLInterfaceType
    | GraphQLUnionType
    | GraphQLEnumType
    | GraphQLEnumValue
    | GraphQLInputObjectType

function isObjectTypeExtension(node: any): node is ObjectTypeExtensionNode {
    return node.kind === Kind.OBJECT_TYPE_EXTENSION
}

function findFieldExtension(
    schema: GraphQLSchema,
    typeName: string,
    fieldName: string
): ObjectTypeExtensionNode | undefined {
    // Look through all type extensions
    for (const extension of schema.extensionASTNodes || []) {
        // Type guard to check if this is an object type extension
        if ('fields' in extension && 'name' in extension && extension.kind === Kind.OBJECT_TYPE_EXTENSION) {
            if (extension.name.value === typeName) {
                // Check if this extension contains our field
                const field = extension.fields?.find((f: FieldDefinitionNode) => f.name.value === fieldName)
                if (field) {
                    return extension as ObjectTypeExtensionNode
                }
            }
        }
    }
    return undefined
}

export function openDocsToGroup(
    odGqlNode: OpenDocsGQLNode,
    gqlSchema?: GraphQLSchema
): string[] {
    let groups: string[] = []
    let rootGroups: string[] = []

    // Get root level groups from schema @docs directive
    if (gqlSchema) {
        // Check schema definition
        if (gqlSchema.astNode?.directives) {
            for (const directive of gqlSchema.astNode.directives) {
                if (directive.name.value === OPEN_DOCS_SCHEMA_DIRECTIVE_NAME) {
                    const groupArg = directive.arguments?.find((arg: { name: { value: string } }) => arg.name.value === 'group')
                    if (groupArg?.value.kind === 'ListValue') {
                        rootGroups = groupArg.value.values
                            .filter((v: ConstValueNode): v is StringValueNode => v.kind === 'StringValue')
                            .map(v => v.value)
                    }
                }
            }
        }

        // Check schema extensions
        if (gqlSchema.extensionASTNodes) {
            for (const extension of gqlSchema.extensionASTNodes) {
                if (extension.kind === 'SchemaExtension') {
                    for (const directive of extension.directives || []) {
                        if (directive.name.value === OPEN_DOCS_SCHEMA_DIRECTIVE_NAME) {
                            const groupArg = directive.arguments?.find((arg: { name: { value: string } }) => arg.name.value === 'group')
                            if (groupArg?.value.kind === 'ListValue') {
                                rootGroups = groupArg.value.values
                                    .filter((v: ConstValueNode): v is StringValueNode => v.kind === 'StringValue')
                                    .map(v => v.value)
                            }
                        }
                    }
                }
            }
        }
    }

    // For fields, get groups from the specific extension that defines them
    if ('astNode' in odGqlNode && odGqlNode.astNode?.kind === 'FieldDefinition') {
        const parentType = getParentType(odGqlNode, gqlSchema)
        if (parentType?.astNode?.directives && gqlSchema) {
            // Find the specific extension that defines this field
            const fieldName = odGqlNode.name
            const typeName = parentType.name
            const extension = findFieldExtension(gqlSchema, typeName, fieldName)
            
            if (extension?.directives) {
                // Get groups from the extension
                for (const directive of extension.directives) {
                    if (directive.name.value === OPEN_DOCS_DIRECTIVE_NAME) {
                        const groupArg = directive.arguments?.find((arg: { name: { value: string } }) => arg.name.value === 'group')
                        if (groupArg?.value.kind === 'ListValue') {
                            groups = groupArg.value.values
                                .filter((v: ConstValueNode): v is StringValueNode => v.kind === 'StringValue')
                                .map(v => v.value)
                        }
                    }
                }
            }

            // If no groups on the extension, check the field itself
            if (!groups?.length) {
                const parentNode = parentType.astNode
                if (parentNode.kind === 'ObjectTypeDefinition' || parentNode.kind === 'InterfaceTypeDefinition') {
                    const fieldDef = parentNode.fields?.find((f: FieldDefinitionNode) => f.name.value === fieldName)
                    
                    if (fieldDef?.directives) {
                        for (const directive of fieldDef.directives) {
                            if (directive.name.value === OPEN_DOCS_DIRECTIVE_NAME) {
                                const groupArg = directive.arguments?.find((arg: { name: { value: string } }) => arg.name.value === 'group')
                                if (groupArg?.value.kind === 'ListValue') {
                                    groups = groupArg.value.values
                                        .filter((v: ConstValueNode): v is StringValueNode => v.kind === 'StringValue')
                                        .map(v => v.value)
                                }
                            }
                        }
                    }
                }
            }
        }
    } else {
        // For non-fields, get groups from the node itself
        if (odGqlNode.astNode?.directives) {
            for (const directive of odGqlNode.astNode.directives) {
                if (directive.name.value === OPEN_DOCS_DIRECTIVE_NAME) {
                    const groupArg = directive.arguments?.find((arg: { name: { value: string } }) => arg.name.value === 'group')
                    if (groupArg?.value.kind === 'ListValue') {
                        groups = groupArg.value.values
                            .filter((v: ConstValueNode): v is StringValueNode => v.kind === 'StringValue')
                            .map(v => v.value)
                    }
                }
            }
        }
    }

    // If still no groups, use default based on type
    if (!groups?.length) {
        if (odGqlNode instanceof GraphQLObjectType) {
            groups.push("Objects")
        } else if (odGqlNode instanceof GraphQLInterfaceType) {
            groups.push("Interfaces")
        } else if (odGqlNode instanceof GraphQLUnionType) {
            groups.push("Unions")
        } else if (odGqlNode instanceof GraphQLEnumType) {
            groups.push("Enums")
        } else if (odGqlNode instanceof GraphQLInputObjectType) {
            groups.push("Inputs")
        } else if (odGqlNode instanceof GraphQLScalarType) {
            groups.push("Scalars")
        } else if (odGqlNode instanceof GQLOperation) {
            switch (odGqlNode._operationType) {
                case "query": {
                    groups.push("Queries")
                    break;
                }
                case "mutation": {
                    groups.push("Mutations")
                    break;
                }
            }
        }
    }

    // Always include root groups if they exist
    if (rootGroups.length > 0) {
        return [...rootGroups, ...groups]
    }

    return groups
}

export function openDocsCanonical(
    ctx: Context,
    gqlType: GraphqlUniformReferenceType,
) {
    let path = ""
    let parentPath = ""

    // Get parent path if this is a field
    if ('astNode' in gqlType && gqlType.astNode?.kind === 'FieldDefinition' && ctx?.schema) {
        // Find the parent type by looking at the schema's types
        for (const type of Object.values(ctx.schema.getTypeMap())) {
            if (type.astNode?.kind === 'ObjectTypeDefinition' || type.astNode?.kind === 'InterfaceTypeDefinition') {
                const fields = type.astNode.fields || []
                const fieldDef = fields.find(field => field.name.value === gqlType.name)
                if (fieldDef) {
                    // Found the parent type
                    // Get its path
                    if (type.astNode.directives) {
                        for (const directive of type.astNode.directives) {
                            if (directive.name.value === "doc") {
                                const pathArg = directive.arguments?.find((arg: {
                                    name: { value: string }
                                }) => arg.name.value === 'path')
                                if (pathArg?.value.kind === 'StringValue') {
                                    parentPath = pathArg.value.value
                                }
                            }
                        }
                    }

                    // Get field's path
                    if (fieldDef.directives) {
                        for (const directive of fieldDef.directives) {
                            if (directive.name.value === "doc") {
                                const pathArg = directive.arguments?.find((arg: {
                                    name: { value: string }
                                }) => arg.name.value === 'path')
                                if (pathArg?.value.kind === 'StringValue') {
                                    path = pathArg.value.value
                                }
                            }
                        }
                    }
                    break
                }
            }
        }
    } else {
        // For non-fields, get path from the node itself
        if (gqlType.astNode?.directives) {
            for (const directive of gqlType.astNode.directives) {
                if (directive.name.value === OPEN_DOCS_DIRECTIVE_NAME) {
                    const pathArg = directive.arguments?.find(arg => arg.name.value === 'path')
                    if (pathArg?.value.kind === 'StringValue') {
                        path = pathArg.value.value
                    }
                }
            }
        }
    }

    let canonicalParts: string[] = []
    if (parentPath) {
        canonicalParts = [parentPath, path || gqlType.name || ""]
    } else {
        canonicalParts = [path]
    }

    return canonicalParts.filter(Boolean).join("/")
}

function getParentType(
    gqlNode: OpenDocsGQLNode,
    schema?: GraphQLSchema
): GraphQLNamedType | undefined {
    if (!schema) return undefined

    // For fields, we need to find their parent type
    if ('astNode' in gqlNode && (gqlNode.astNode?.kind === 'FieldDefinition' || gqlNode.astNode?.kind === 'InputValueDefinition')) {
        // Find the parent type by looking at the schema's types
        for (const type of Object.values(schema.getTypeMap())) {
            if (type.astNode?.kind === 'ObjectTypeDefinition' || type.astNode?.kind === 'InterfaceTypeDefinition') {
                const fields = type.astNode.fields || []
                if (fields.some(field => field.name.value === gqlNode.name)) {
                    return type
                }
            }
        }
    }
    return undefined
}
