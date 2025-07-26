import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";

import {
    buildSchema,
    DirectiveNode,
    print,
    visit,
    parse,
    ObjectTypeExtensionNode,
    GraphQLSchema,
    StringValueNode
} from "graphql";
import {mergeTypeDefs} from '@graphql-tools/merge';

import type {Reference} from "@xyd-js/uniform"
import {ReferenceType} from "@xyd-js/uniform";

import type {
    GQLSchemaToReferencesOptions,
    OpenDocsSortConfig,
    FieldMetadata,
    GQLSchemaMetadata,
    SortItem
} from "./types";
import {DEFAULT_SORT_ORDER} from "./types";
import {graphqlTypesToUniformReferences} from "./converters/gql-types";
import {graphqlQueriesToUniformReferences} from "./converters/gql-query";
import {graphqlMutationsToUniformReferences} from "./converters/gql-mutation";
import {graphqlSubscriptionsToUniformReferences} from "./converters/gql-subscription";
import {OPEN_DOCS_DIRECTIVE_NAME, OPEN_DOCS_SCHEMA_DIRECTIVE_NAME, openDocsExtensionsToOptions} from "./opendocs";
import openDocsSchemaRaw from './opendocs.graphql'

// TODO: support multi graphql files
// TODO: sort by tag??
export async function gqlSchemaToReferences(
    schemaLocation: string | string[],
    options?: GQLSchemaToReferencesOptions
): Promise<Reference[]> {
    // 1. Convert schemaLocation to array
    const schemaLocations = Array.isArray(schemaLocation) ? schemaLocation : [schemaLocation];

    // Add opendocs.graphql to schema locations (first)
    schemaLocations.unshift(openDocsSchemaRaw);

    // 2. Read all schema contents
    const schemaContents = await Promise.all(schemaLocations.map(async location => {
        if (location.startsWith('http://') || location.startsWith('https://')) {
            const response = await fetch(location);
            if (!response.ok) {
                throw new Error(`Failed to fetch schema from URL: ${location}`);
            }
            return response.text();
        }
        if (fs.existsSync(location)) {
            return fs.readFileSync(location, 'utf-8');
        }
        return location;
    }));

    // 3. Merge all schema contents
    const mergedTypeDefs = mergeTypeDefs(schemaContents);
    const schemaString = print(mergedTypeDefs);

    // 4. Build the schema
    const schema = buildSchema(schemaString, {
        assumeValid: true
    });
    if (schemaContents.length > 2) {
        console.warn(`Warning: More than 2 schema files provided - no all featues will be supported!`);
    }
    
    docDirectiveChain(schemaContents[1], schema);
    // TODO: fix schemaContents[1]

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

        // subscriptions
        ...graphqlSubscriptionsToUniformReferences(schema, options),
    ]

    // Sort references using provided sort config or defaults
    const sortConfig = options.sort ?? {sort: DEFAULT_SORT_ORDER};
    references.sort((a, b) => {
        const aOrder = getSortOrder(a, sortConfig);
        const bOrder = getSortOrder(b, sortConfig);
        return aOrder - bOrder;
    });

    if (options.route) {
        // TODO: types or better solution!!!
        // @ts-ignore
        references.__UNSAFE_route = () => options.route
    }
    return references
}

function getSortOrder(reference: Reference, sortConfig: OpenDocsSortConfig): number {
    const sortItems = sortConfig.sort ?? DEFAULT_SORT_ORDER;
    const sortStacks = sortConfig.sortStack ?? [];
    const referenceGroups = getReferenceGroups(reference);

    // First, find which primary group this reference belongs to
    for (let groupIndex = 0; groupIndex < sortItems.length; groupIndex++) {
        const sortItem = sortItems[groupIndex];

        // Check if this reference matches the primary group
        if (matchesPrimaryGroup(reference, sortItem)) {
            // Determine which stack to use (default to 0 if not specified)
            const stackIndex = sortItem.stack !== undefined ? sortItem.stack : 0;

            // Calculate position within this group using the stack
            const positionInGroup = calculatePositionInGroup(reference, stackIndex, sortStacks);

            const result = (groupIndex * 1000) + positionInGroup;
            
            // Return order: groupIndex * 1000 + positionInGroup
            // This ensures all items in group 0 come before all items in group 1, etc.
            return result;
        }
    }

    return Number.MAX_SAFE_INTEGER;
}

function matchesPrimaryGroup(reference: Reference, sortItem: SortItem): boolean {
    // Check node match first
    if (sortItem.node) {
        const context = reference.context as any;
        if (context?.graphqlTypeShort === sortItem.node) {
            return true;
        }
        // If node is specified but doesn't match, return false (don't fall through)
        return false;
    }

    // Check group match
    if (sortItem.group && sortItem.group.length > 0) {
        const referenceGroups = getReferenceGroups(reference);
        const match = sortItem.group.some(group => referenceGroups.includes(group));
        return match;
    }

    return true;
}

function calculatePositionInGroup(reference: Reference, stackIndex: number, sortStacks: string[][]): number {
    if (stackIndex < 0 || stackIndex >= sortStacks.length) {
        return 0;
    }

    const stackGroups = sortStacks[stackIndex];
    const referenceGroups = getReferenceGroups(reference);

    // Find the position of the reference's type in the stack
    for (let i = 0; i < stackGroups.length; i++) {
        const stackGroup = stackGroups[i];
        if (referenceGroups.includes(stackGroup)) {
            return i;
        }
    }

    return 999; // If not found in stack, put at the end of the group
}


function getReferenceGroups(reference: Reference): string[] {
    // Extract groups from reference context
    const context = reference.context as any;
    if (context?.group && Array.isArray(context.group)) {
        return context.group;
    }

    // Fallback: try to get groups from metadata if available
    if (reference.__UNSAFE_selector) {
        try {
            const selector = reference.__UNSAFE_selector;
            const metadata = selector("[metadata]");
            if (metadata?.groups) {
                return metadata.groups;
            }
        } catch (e) {
            // Ignore errors from selector
        }
    }

    return [];
}

function docDirectiveChain(
    rawSDL: string,
    schema: GraphQLSchema
) {
    const ast = parse(rawSDL);
    const metadata: GQLSchemaMetadata = {
        fields: new Map<string, FieldMetadata>()
    };

    // First, find root groups from @docs directive
    visit(ast, {
        SchemaExtension(node) {
            for (const directive of node.directives || []) {
                if (directive.name.value === OPEN_DOCS_SCHEMA_DIRECTIVE_NAME) {
                    const groupArg = directive.arguments?.find(arg => arg.name.value === 'group');
                    if (groupArg?.value.kind === 'ListValue') {
                        metadata.rootGroups = groupArg.value.values
                            .filter((v): v is StringValueNode => v.kind === 'StringValue')
                            .map(v => v.value);
                    }
                }
            }
        }
    });

    // Then process type extensions and fields
    visit(ast, {
        ObjectTypeExtension(node: ObjectTypeExtensionNode) {
            const validNodeTypes = ['Query', 'Mutation', 'Subscription'];
            if (!validNodeTypes.includes(node.name.value)) return;

            const typeLevelDoc = node.directives?.find(d => d.name.value === OPEN_DOCS_DIRECTIVE_NAME);
            const typeLevelDocArgs = typeLevelDoc ? extractDocArgs(typeLevelDoc) : {};

            for (const field of node.fields ?? []) {
                const fieldName = field.name.value;

                const fieldDoc = field.directives?.find(d => d.name.value === OPEN_DOCS_DIRECTIVE_NAME);
                const fieldDocArgs = fieldDoc ? extractDocArgs(fieldDoc) : {};

                // Merge paths: if both type and field have paths, join them
                let path = fieldDocArgs.path;
                if (typeLevelDocArgs.path && fieldDocArgs.path) {
                    path = `${typeLevelDocArgs.path}/${fieldDocArgs.path}`;
                } else if (typeLevelDocArgs.path) {
                    path = typeLevelDocArgs.path;
                }

                if (!fieldDocArgs.path && path) {
                    path += "/" + fieldName
                }

                // Merge groups: combine root groups with type/field groups
                const groups = fieldDocArgs.groups ?? typeLevelDocArgs.groups ?? [];

                const effectiveDoc: FieldMetadata = {
                    groups,
                    path
                };

                metadata.fields.set(`${node.name.value}.${fieldName}`, effectiveDoc);
            }
        }
    });

    // Attach metadata to schema
    (schema as any).__metadata = metadata;
}

function extractDocArgs(directive: DirectiveNode): FieldMetadata {
    const info: FieldMetadata = {};
    for (const arg of directive.arguments ?? []) {
        if (arg.name.value === 'group' && arg.value.kind === 'ListValue') {
            info.groups = arg.value.values
                .filter((v): v is StringValueNode => v.kind === 'StringValue')
                .map(v => v.value);
        } else if (arg.name.value === 'path' && arg.value.kind === 'StringValue') {
            info.path = arg.value.value;
        }
    }
    return info;
}