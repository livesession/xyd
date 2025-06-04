import fs from "node:fs";

import {buildSchema, print} from "graphql";
import {mergeTypeDefs} from '@graphql-tools/merge';

import type {Reference} from "@xyd-js/uniform"
import {ReferenceType} from "@xyd-js/uniform";

import type {GQLSchemaToReferencesOptions, OpenDocsSortConfig} from "./types";
import {DEFAULT_SORT_ORDER} from "./types";
import {graphqlTypesToUniformReferences} from "./converters/gql-types";
import {graphqlQueriesToUniformReferences} from "./converters/gql-query";
import {graphqlMutationsToUniformReferences} from "./converters/gql-mutation";
import {openDocsExtensionsToOptions} from "./opendocs";

// TODO: support multi graphql files
// TODO: !!! CIRCULAR_DEPENDENCY !!!
// TODO: sort by tag??
// TODO: support subscriptions
export async function gqlSchemaToReferences(
    schemaLocation: string | string[],
    options?: GQLSchemaToReferencesOptions
): Promise<Reference[]> {
    // 1. Convert schemaLocation to array
    const schemaLocations = Array.isArray(schemaLocation) ? schemaLocation : [schemaLocation];

    // 2. Read all schema contents
    const schemaContents = schemaLocations.map(location => {
        if (fs.existsSync(location)) {
            return fs.readFileSync(location, 'utf-8');
        }
        return location;
    });

    // 3. Merge all schema contents
    const mergedTypeDefs = mergeTypeDefs(schemaContents);
    const schemaString = print(mergedTypeDefs);

    // 4. Build the schema
    const schema = buildSchema(schemaString, {
        assumeValid: true
    });

    if (!options) {
        options = {}
    }

    if (!options.hasOwnProperty('flat')) {
        options.flat = true; // Default flat is true

    }
    options = {
        ...options,
        ...openDocsExtensionsToOptions(schema)
    }

    // 5. Generate uniform references from the schema
    const references = [
        // types
        ...graphqlTypesToUniformReferences(schema, options),

        // queries
        ...graphqlQueriesToUniformReferences(schema, options),

        // mutations
        ...graphqlMutationsToUniformReferences(schema, options),

        // subscriptions TODO: finish
    ]

    // Sort references using provided sort config or defaults
    const sortConfig = options.sort ?? DEFAULT_SORT_ORDER;
    references.sort((a, b) => {
        const aType = a.type?.toString() ?? '';
        const bType = b.type?.toString() ?? '';
        const aOrder = getTypeOrder(aType, sortConfig);
        const bOrder = getTypeOrder(bType, sortConfig);
        return aOrder - bOrder;
    });

    return references
}

function getTypeOrder(type: string, sortConfig: OpenDocsSortConfig): number {
    switch (type) {
        case ReferenceType.GRAPHQL_QUERY:
            return sortConfig.queries ?? DEFAULT_SORT_ORDER.queries!;
        case ReferenceType.GRAPHQL_MUTATION:
            return sortConfig.mutations ?? DEFAULT_SORT_ORDER.mutations!;
        case ReferenceType.GRAPHQL_SUBSCRIPTION:
            return sortConfig.subscriptions ?? DEFAULT_SORT_ORDER.subscriptions!;
        case ReferenceType.GRAPHQL_INTERFACE:
            return sortConfig.interfaces ?? DEFAULT_SORT_ORDER.interfaces!;
        case ReferenceType.GRAPHQL_OBJECT:
            return sortConfig.objects ?? DEFAULT_SORT_ORDER.objects!;
        case ReferenceType.GRAPHQL_INPUT:
            return sortConfig.inputObjects ?? DEFAULT_SORT_ORDER.inputObjects!;
        case ReferenceType.GRAPHQL_UNION:
            return sortConfig.unions ?? DEFAULT_SORT_ORDER.unions!;
        case ReferenceType.GRAPHQL_ENUM:
            return sortConfig.enums ?? DEFAULT_SORT_ORDER.enums!;
        case ReferenceType.GRAPHQL_SCALAR:
            return sortConfig.scalars ?? DEFAULT_SORT_ORDER.scalars!;
        default:
            return Number.MAX_SAFE_INTEGER;
    }
}

