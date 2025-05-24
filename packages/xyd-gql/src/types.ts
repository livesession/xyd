// TODO: support line ranged in the future?
import { GraphQLField, GraphQLArgument } from "graphql/type/definition";
import { Maybe } from "graphql/jsutils/Maybe";

export interface GQLSchemaToReferencesOptions {
    regions?: string[] // TODO: BETTER API - UNIFY FOR REST API / GRAPHQL ETC
}

export class GraphqlOperation implements GraphQLField<any, any> {
    public _operationType!: "query" | "mutation" | "subscription";
    field: GraphQLField<any, any>;

    constructor(field: GraphQLField<any, any>) {
        this.field = field;
    }

    get name() { return this.field.name; }
    get description() { return this.field.description; }
    get type() { return this.field.type; }
    get args() { return this.field.args; }
    get deprecationReason() { return this.field.deprecationReason; }
    get extensions() { return this.field.extensions; }
    get astNode() { return this.field.astNode; }

    set __operationType(operationType: "query" | "mutation" | "subscription") {
        this._operationType = operationType;
    }
}

