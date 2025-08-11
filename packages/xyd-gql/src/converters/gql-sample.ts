import {
    Kind,
    print,
    OperationTypeNode,
    ASTNode,
    ArgumentNode,
    TypeNode,
    ValueNode,
    VariableDefinitionNode,
} from 'graphql';

import {
    DefinitionProperty,
    ReferenceType
} from "@xyd-js/uniform";

const operationTypeToTypeNode = {
    [ReferenceType.GRAPHQL_QUERY]: OperationTypeNode.QUERY,
    [ReferenceType.GRAPHQL_MUTATION]: OperationTypeNode.MUTATION,
    [ReferenceType.GRAPHQL_SUBSCRIPTION]: OperationTypeNode.SUBSCRIPTION,
}

// simpleGraphqlExample is a helper function to create a simple GraphQL example query or mutation.
export function simpleGraphqlExample(
    operationType: ReferenceType.GRAPHQL_QUERY | ReferenceType.GRAPHQL_MUTATION | ReferenceType.GRAPHQL_SUBSCRIPTION,
    operationName: string,
    args: DefinitionProperty[],
    returns: DefinitionProperty[],
) {
    // Filter required arguments or take first one if no required args
    const requiredArgs = args.filter(arg => arg.meta?.some(m => m.name === 'required' && m.value === 'true'));
    const selectedArgs = requiredArgs.length > 0 ? requiredArgs : args.slice(0, 1);

    let hasArgVars = false

    const argDefaults = selectedArgs.reduce<Record<string, ArgumentNode>>((acc, arg) => {
        if (operationType != ReferenceType.GRAPHQL_QUERY) {
            return acc; // Skip for mutations, as we use variables
        }

        let defaultValue: string = ""

        const getDefaultValue = arg.meta?.find(m => m.name === 'defaults')?.value
        if (getDefaultValue && typeof getDefaultValue !== 'string') {
            defaultValue = JSON.stringify(getDefaultValue)
        }

        let sampleValue: ValueNode | undefined = undefined;

        switch (arg.context?.graphqlTypeFlat) {
            case 'String':
                sampleValue = {kind: Kind.STRING, value: defaultValue || `example-${arg.name}`};
                break;
            case 'Int':
            case 'Float':
                sampleValue = {kind: Kind.INT, value: defaultValue || '0'};
                break;
            case 'Boolean':
                sampleValue = {kind: Kind.BOOLEAN, value: defaultValue === 'true'};
                break;
        }

        // For queries, use direct values; for mutations, use variables
        if (sampleValue) {
            return {
                ...acc,
                [arg.name]: {
                    kind: Kind.ARGUMENT,
                    name: {kind: Kind.NAME, value: arg.name},
                    value: sampleValue
                }
            };
        }

        return acc;
    }, {});

    const allDefaultArgs = Object.keys(argDefaults).length === selectedArgs.length

    const argumentsList: ArgumentNode[] = selectedArgs.map(arg => {
        if (allDefaultArgs) {
            return argDefaults[arg.name]
        }

        hasArgVars = true

        return {
            kind: Kind.ARGUMENT,
            name: {kind: Kind.NAME, value: arg.name},
            value: {
                kind: Kind.VARIABLE,
                name: {kind: Kind.NAME, value: arg.name}
            }
        };
    });

    const queryAST: ASTNode = {
        kind: Kind.DOCUMENT,
        definitions: [
            {
                kind: Kind.OPERATION_DEFINITION,
                operation: operationTypeToTypeNode[operationType],
                name: hasArgVars ? {
                    kind: Kind.NAME,
                    value: operationName
                } : undefined,
                variableDefinitions: hasArgVars ? selectedArgs.map(variableDefinitions) : [],
                selectionSet: {
                    kind: Kind.SELECTION_SET,
                    selections: [
                        {
                            kind: Kind.FIELD,
                            name: {kind: Kind.NAME, value: operationName},
                            arguments: argumentsList,
                            selectionSet: {
                                kind: Kind.SELECTION_SET,
                                selections: [
                                    {kind: Kind.FIELD, name: {kind: Kind.NAME, value: `# ${operationName} fields`}}
                                ]
                            }
                        }
                    ]
                }
            }
        ]
    } as const;

    const sampleText = print(queryAST);

    return sampleText;
}

function variableDefinitions(arg: DefinitionProperty): VariableDefinitionNode {
    const hasDefault = arg.meta?.some(m => m.name === 'defaults');
    let defaultValue: string = ""

    const getDefaultValue = arg.meta?.find(m => m.name === 'defaults')?.value
    if (getDefaultValue && typeof getDefaultValue !== 'string') {
        defaultValue = JSON.stringify(getDefaultValue)
    }

    return {
        kind: Kind.VARIABLE_DEFINITION,
        variable: {
            kind: Kind.VARIABLE,
            name: {kind: Kind.NAME, value: arg.name}
        },
        type: {
            kind: Kind.NAMED_TYPE,
            name: {kind: Kind.NAME, value: arg.type}
        },
        ...(hasDefault && defaultValue ? {
            defaultValue: {
                kind: Kind.STRING,
                value: defaultValue
            }
        } : {})
    };
}