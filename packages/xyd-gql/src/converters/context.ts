import {GQLSchemaToReferencesOptions, NestedGraphqlType} from "../types";

export class Context {
    constructor(
        public processedTypes: Set<NestedGraphqlType> = new Set(),
        public options?: GQLSchemaToReferencesOptions,
    ) {
    }
}

