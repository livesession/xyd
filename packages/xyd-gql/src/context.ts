import {GQLSchemaToReferencesOptions, NestedGraphqlType} from "./types";

export class Context {
    constructor(
        public processedTypes: Set<NestedGraphqlType> = new Set(),
        public globalOptions?: GQLSchemaToReferencesOptions,
        public config?: {
            flatReturn?: boolean,
            flat?: boolean,
            flatArg?: boolean,
        }
    ) {
    }
}

