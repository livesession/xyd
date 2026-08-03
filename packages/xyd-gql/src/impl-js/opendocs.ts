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
    ConstValueNode,
    StringValueNode,
} from "graphql";

import {GQLOperation, GQLSchemaToReferencesOptions, SortItem} from "./types";
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
                        } else if (arg.name.value === 'sort' && arg.value.kind === 'ListValue') {
                            const sortItems: SortItem[] = [];
                            for (const item of arg.value.values) {
                                if (item.kind === 'ObjectValue') {
                                    const sortItem: SortItem = {};
                                    for (const field of item.fields) {
                                        if (field.name.value === 'node' && field.value.kind === 'StringValue') {
                                            sortItem.node = field.value.value;
                                        } else if (field.name.value === 'group' && field.value.kind === 'ListValue') {
                                            sortItem.group = field.value.values
                                                .filter((v): v is StringValueNode => v.kind === 'StringValue')
                                                .map(v => v.value);
                                        } else if (field.name.value === 'stack' && field.value.kind === 'IntValue') {
                                            sortItem.stack = parseInt(field.value.value);
                                        }
                                    }
                                    sortItems.push(sortItem);
                                }
                            }
                            if (!options.sort) {
                                options.sort = {};
                            }
                            options.sort.sort = sortItems;
                        } else if (arg.name.value === 'sortStack' && arg.value.kind === 'ListValue') {
                            const sortStacks: string[][] = [];
                            for (const item of arg.value.values) {
                                if (item.kind === 'ListValue') {
                                    const stack = item.values
                                        .filter((v): v is StringValueNode => v.kind === 'StringValue')
                                        .map(v => v.value);
                                    sortStacks.push(stack);
                                }
                            }
                            if (!options.sort) {
                                options.sort = {};
                            }
                            options.sort.sortStack = sortStacks;
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
    | GQLOperation
    | GraphQLScalarType
    | GraphQLObjectType
    | GraphQLField<any, any>
    | GraphQLArgument
    | GraphQLInterfaceType
    | GraphQLUnionType
    | GraphQLEnumType
    | GraphQLEnumValue
    | GraphQLInputObjectType

export function openDocsToGroup(
    ctx: Context | undefined,
    odGqlNode: OpenDocsGQLNode,
): string[] {
    let groups: string[] = []

    const metadata = (ctx?.schema as any).__metadata;

    if (metadata?.rootGroups) {
        groups = [...metadata.rootGroups];
    }

    let directiveGroups = false

    // Check schema metadata for field-specific groups (for operations)
    if (ctx?.schema && 'name' in odGqlNode) {
        const metadata = (ctx.schema as any).__metadata;
        if (metadata?.fields) {
            if ("_operationType" in odGqlNode) {
                let fieldKey = ""

                switch (odGqlNode._operationType) {
                    case "query": {
                        fieldKey = `Query.${odGqlNode.name}`;
                        break;
                    }
                    case "mutation": {
                        fieldKey = `Mutation.${odGqlNode.name}`;
                        break;
                    }
                    case "subscription": {
                        fieldKey = `Subscription.${odGqlNode.name}`;
                        break;
                    }
                }

                const fieldMetadata = metadata.fields.get(fieldKey);
                if (fieldMetadata?.groups) {
                    directiveGroups = true
                    groups.push(...fieldMetadata.groups);
                }
            }
        }
    }

    // If no groups from metadata, try getting groups from the node itself
    if (!directiveGroups && odGqlNode.astNode?.directives) {
        for (const directive of odGqlNode.astNode.directives) {
            switch (directive.name.value) {
                case OPEN_DOCS_DIRECTIVE_NAME: {
                    const groupArg = directive.arguments?.find((arg: {
                        name: { value: string }
                    }) => arg.name.value === 'group')
                    if (groupArg?.value.kind === 'ListValue') {
                        directiveGroups = true
                        groups.push(...groupArg.value.values
                            .filter((v: ConstValueNode): v is StringValueNode => v.kind === 'StringValue')
                            .map(v => v.value)
                        )
                    }
                    break
                }
            }
        }
    }

    // If still no groups, use default based on type
    if (!directiveGroups) {
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
                case "subscription": {
                    groups.push("Subscriptions")
                    break;
                }
            }
        }
    }

    return groups
}

export function openDocsCanonical(
    ctx: Context,
    gqlType: GraphqlUniformReferenceType,
) {
    let path = ""

    // Get parent path if this is a field
    if ('astNode' in gqlType && gqlType.astNode?.kind === 'FieldDefinition' && ctx?.schema) {
        // Check schema metadata for field-specific path
        const metadata = (ctx.schema as any).__metadata;
        if (metadata?.fields && 'name' in gqlType) {
            if ("_operationType" in gqlType) {
                let fieldKey = ""

                switch (gqlType._operationType) {
                    case "query": {
                        fieldKey = `Query.${gqlType.name}`;
                        break;
                    }
                    case "mutation": {
                        fieldKey = `Mutation.${gqlType.name}`;
                        break;
                    }
                    case "subscription": {
                        fieldKey = `Subscription.${gqlType.name}`;
                        break;
                    }
                }
                const fieldMetadata = metadata.fields.get(fieldKey);


                if (fieldMetadata?.path) {
                    path = fieldMetadata.path;
                }
            }
        }
    }

    // Extract path from @doc directive if present
    if (!path && gqlType.astNode?.directives) {
        for (const directive of gqlType.astNode.directives) {
            if (directive.name.value === OPEN_DOCS_DIRECTIVE_NAME) {
                const pathArg = directive.arguments?.find(arg => arg.name.value === 'path')
                if (pathArg?.value.kind === 'StringValue') {
                    path = pathArg.value.value
                }
            }
        }
    }

    return path
}
