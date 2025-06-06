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
    GraphQLUnionType
} from "graphql";

import {GQLOperation, GQLSchemaToReferencesOptions, OpenDocsSortConfig} from "./types";

const OPEN_DOCS_DIRECTIVE_NAME = "opendocs";
const OPEN_DOCS_DIRECTIVE_NAME_ALT = "docs";

export function openDocsExtensionsToOptions(
    schema: GraphQLSchema,
) {
    const options: GQLSchemaToReferencesOptions = {}

    // Check for @od_schema directive in schema extensions
    for (const extension of schema.extensionASTNodes || []) {
        if (extension.kind === 'SchemaExtension') {
            for (const directive of extension.directives || []) {
                if (directive.name.value === 'od_schema') {
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

export function openDocsToGroup(
    odGqlNode: OpenDocsGQLNode
): string[] {
    let groups: string[] = []

    if (!odGqlNode.astNode?.directives) {
        return groups
    }

    for (const directive of odGqlNode.astNode.directives) {
        switch (directive.name.value) {
            // TODO IN THE FUTURE !!! OPEN DOCS SPEC !!!
            case OPEN_DOCS_DIRECTIVE_NAME:
            case OPEN_DOCS_DIRECTIVE_NAME_ALT: {
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
        groups.push("Reference")

        if (odGqlNode instanceof GraphQLObjectType) {
            groups.push(
                "Objects"
            )
        } else if (odGqlNode instanceof GraphQLInterfaceType) {
            groups.push(
                "Interfaces"
            )
        } else if (odGqlNode instanceof GraphQLUnionType) {
            groups.push(
                "Unions"
            )
        } else if (odGqlNode instanceof GraphQLEnumType) {
            groups.push(
                "Enums"
            )
        } else if (odGqlNode instanceof GraphQLInputObjectType) {
            groups.push(
                "Inputs"
            )
        } else if (odGqlNode instanceof GraphQLScalarType) {
            groups.push(
                "Scalars"
            )
        } else if (odGqlNode instanceof GQLOperation) {
            switch (odGqlNode._operationType) {
                case "query": {
                    groups.push(
                        "Queries"
                    )
                    break;
                }
                case "mutation": {
                    groups.push(
                        "Mutations"
                    )
                    break;
                }
            }
        }
    }

    return groups
}
