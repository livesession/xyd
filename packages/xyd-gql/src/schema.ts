import fs from "node:fs";

import {buildSchema} from "graphql";
import {mergeTypeDefs} from '@graphql-tools/merge';
import {print} from 'graphql';

import type {Reference} from "@xyd-js/uniform"

import type {GQLSchemaToReferencesOptions} from "./types";
import {graphqlTypesToUniformReferences} from "./converters/gql-types";
import {graphqlQueriesToUniformReferences} from "./converters/gql-query";
import {graphqlMutationsToUniformReferences} from "./converters/gql-mutation";

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

    return references
}
