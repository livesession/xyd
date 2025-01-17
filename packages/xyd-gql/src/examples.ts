import {jsonToGraphQLQuery, VariableType} from "json-to-graphql-query";
import {
    DefinitionProperty,
    ReferenceType
} from "@xyd-js/uniform";

// TODO: support args
// simpleGraphqlExample is a helper function to create a simple GraphQL example query or mutation.
export function simpleGraphqlExample(
    operationType: ReferenceType.GRAPHQL_QUERY | ReferenceType.GRAPHQL_MUTATION,
    operationName: string,
    args: DefinitionProperty[],
    returns: DefinitionProperty[],
) {
    let obj: any = {}


    switch (operationType) {
        case ReferenceType.GRAPHQL_QUERY: {
            const exampleReturnProps = exampleReturns(returns)

            obj = {
                query: {
                    __name: operationName,
                    [operationName]: exampleReturnProps
                }
            }

            break
        }
        case ReferenceType.GRAPHQL_MUTATION: {
            const exampleReturnProps = exampleReturns(returns)
            const vars = exampleVariables(args)
            const argumen = exampleArguments(args)

            obj = {
                mutation: {
                    __name: operationName,
                    __variables: vars,
                    [operationName]: {
                        ...exampleReturnProps,
                        __args: argumen,
                    }
                }
            }

            break;
        }
    }

    return jsonToGraphQLQuery(obj, {pretty: true});
}

// exampleReturns return an example of return GraphQL object
function exampleReturns(
    properties: DefinitionProperty[],
    obj: any = {}
) {
    properties.forEach((property) => {
        // TODO: only if required?
        obj[property.name] = true

        if (property?.properties?.length) {
            obj[property.name] = {}
            exampleReturns(property.properties, obj[property.name])
        }
    })

    return obj
}

// exampleArguments return an example of GraphQL arguments
function exampleArguments(
    properties: DefinitionProperty[],
    obj: any = {}
) {

    properties.forEach((property) => {
        obj[property.name] = new VariableType(property.name)
    })

    return obj
}

// exampleVariables return an example of GraphQL variables
function exampleVariables(
    properties: DefinitionProperty[],
    obj: any = {}
) {

    properties.forEach((property) => {
        obj[property.name] = property.type
    })

    return obj
}