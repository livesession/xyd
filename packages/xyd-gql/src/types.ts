import {GraphQLField, OperationTypeNode} from "graphql";
import type {DefinitionProperty} from "@xyd-js/uniform";
import type {GraphQLInputObjectType, GraphQLInterfaceType, GraphQLObjectType} from "graphql/index";

export interface OpenDocsSortConfig {
    queries?: number;
    mutations?: number;
    subscriptions?: number;
    interfaces?: number;
    objects?: number;
    inputObjects?: number;
    unions?: number;
    enums?: number;
    scalars?: number;
}

export const DEFAULT_SORT_ORDER: OpenDocsSortConfig = {
    queries: 1,
    mutations: 2,
    objects: 3,
    interfaces: 4,
    enums: 5,
    unions: 6,
    inputObjects: 7,
    scalars: 8,
    subscriptions: 9
};

export interface GQLSchemaToReferencesOptions {
    // TODO: support line ranged in the future?
    regions?: string[] // TODO: BETTER API - UNIFY FOR REST API / GRAPHQL ETC

    flat?: boolean;
    sort?: OpenDocsSortConfig;
}

export type NestedGraphqlType = {
    __definitionProperties?: DefinitionProperty[];
} & (GraphQLObjectType | GraphQLInputObjectType | GraphQLInterfaceType)

// needed cuz GraphQLField does not have operation info?
export class GraphqlOperation implements GraphQLField<any, any> {
    public _operationType!: OperationTypeNode
    field: GraphQLField<any, any>;

    constructor(field: GraphQLField<any, any>) {
        this.field = field;
    }

    get name() {
        return this.field.name;
    }

    get description() {
        return this.field.description;
    }

    get type() {
        return this.field.type;
    }

    get args() {
        return this.field.args;
    }

    get deprecationReason() {
        return this.field.deprecationReason;
    }

    get extensions() {
        return this.field.extensions;
    }

    get astNode() {
        return this.field.astNode;
    }

    set __operationType(operationType: OperationTypeNode) {
        this._operationType = operationType;
    }
}

