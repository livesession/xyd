import * as TypeDoc from 'typedoc';
import {ReflectionKind} from 'typedoc';

import {
    CommonDefinitionVariantMeta,
    DEFINED_DEFINITION_PROPERTY_TYPE,
    Definition, DefinitionProperty,
    DefinitionVariant,
    Reference,
    TypeDocReferenceContext
} from "@xyd-js/uniform";

// TODO: in the future translation system
const TXT = {
    Props: "Props",

    Component: "Component",
}

// Map of primitive types that can be merged
const PRIMITIVE_TYPES = new Set(['string', 'number', 'boolean']);

export function uniformToMiniUniform(
    rootSymbolName: string,
    references: Reference<TypeDocReferenceContext>[],
): Reference[] {
    const output: Reference[] = []

    let refBySymbolId: { [symbolId: string]: Reference } = {}

    // First pass: collect all references by symbolId
    for (const reference of references) {
        const ctx = reference.context

        if (ctx?.symbolId) {
            if (reference.context?.meta?.some(m => m.name === "internal" && m.value === "true")) {
                continue // Skip internal references
            }

            // Create a clean copy of the reference without circular references
            const cleanRef = {
                ...reference,
                definitions: reference.definitions.map(def => ({
                    ...def,
                    properties: def.properties?.map(prop => {
                        const cleanProp = {
                            ...prop,
                            properties: prop.properties || []
                        };

                        if (prop.rootProperty) {
                            cleanProp.rootProperty = {
                                name: prop.rootProperty.name,
                                description: prop.rootProperty.description,
                                type: prop.rootProperty.type,
                                properties: prop.rootProperty.properties || [],
                                symbolDef: prop.rootProperty.symbolDef
                            };
                        }

                        return cleanProp;
                    }) || []
                }))
            };

            refBySymbolId[ctx.symbolId] = cleanRef
        }
    }

    // Second pass: process root references
    for (const reference of references) {
        const ctx = reference.context

        if (ctx?.symbolName !== rootSymbolName) {
            continue
        }

        const miniRef: Reference = {
            ...reference,
            title: ctx?.symbolName || reference.title,
            canonical: miniCanonical(reference.canonical),
            context: {
                ...ctx,
                group: miniGroup(ctx?.group || []),
            },
            definitions: [],
        }

        for (const def of reference.definitions) {
            const miniDef: Definition = {
                ...def,
                title: TXT.Props,
                properties: [],
            }

            definitionMiniPropsPassThrough(
                refBySymbolId,
                def.properties || [],
                miniDef,
            )

            miniRef.definitions.push(miniDef)
        }

        output.push(miniRef)
    }

    return output
}

function shortMergedType(property: DefinitionProperty): DefinitionProperty | null {
    // Only handle union types
    if (property.type !== DEFINED_DEFINITION_PROPERTY_TYPE.UNION || !property.properties?.length) {
        return null;
    }

    // Process nested properties first
    const processedProperties = property.properties.map(prop => {
        // If this property is also a union, try to simplify it
        if (prop.type === DEFINED_DEFINITION_PROPERTY_TYPE.UNION) {
            const shortType = shortMergedType(prop);
            if (shortType) {
                return shortType;
            }
        }

        // check one level of prop.properties e.g {type: "Example": properties: [{name: "a", type: "string"}, {name: "b", type: "number"}]}
        if (prop.properties?.length) {
            const childMerged = shortMergedType({
                name: "",
                description: "",
                type: DEFINED_DEFINITION_PROPERTY_TYPE.UNION,
                properties: prop.properties
            })

            if (childMerged) {
                return childMerged
            }
        }

        return prop;
    });

    // Check if all properties are either string literals or primitive types
    const hasOnlySimpleTypes = processedProperties.every(prop => {
        // Check for string literals (type starts and ends with quotes)
        if (prop.type.startsWith('"') && prop.type.endsWith('"')) {
            return true;
        }
        // Check for primitive types
        return PRIMITIVE_TYPES.has(prop.type);
    });

    if (!hasOnlySimpleTypes) {
        return null;
    }

    // Create merged type string
    const types = processedProperties.map(prop => prop.type);
    const mergedType = types.join(' | ');

    // Return simplified property
    return {
        ...property,
        type: mergedType,
        properties: []
    };
}

function handleUnionTypes(
    refBySymbolId: { [symbolId: string]: Reference },
    symbolIds: string[],
    typeString: string | undefined,
    visited: Set<string>,
    options?: {
        depth?: number,
    }
): DefinitionProperty[] {
    const properties: DefinitionProperty[] = [];

    // If we have symbolDef.id array, process those first
    if (symbolIds.length > 0) {
        for (const symbolId of symbolIds) {
            if (typeof symbolId === 'string') {
                // Skip if we've already visited this type
                if (visited.has(symbolId)) {
                    continue;
                }
                visited.add(symbolId);

                const refSymbol = refBySymbolId[symbolId];
                if (refSymbol?.definitions?.[0]) {
                    const refSymbolCtx = refSymbol.context as TypeDocReferenceContext;
                    const unionProperty: DefinitionProperty = {
                        name: refSymbolCtx?.symbolName || '',
                        type: refSymbolCtx?.symbolName || '',
                        description: '',
                        properties: [],
                    };

                    if (refSymbol.definitions[0].properties) {
                        for (const prop of refSymbol.definitions[0].properties) {
                            const resolvedProp = resolveProperty(refBySymbolId, prop, {
                                ...options,
                                depth: (options?.depth || 0) + 1,
                                visited: new Set(visited)
                            });
                            if (resolvedProp.properties) {
                                unionProperty.properties = unionProperty.properties || [];
                                unionProperty.properties.push(resolvedProp);
                            }
                        }
                    }

                    properties.push(unionProperty);
                }
            }
        }
    }

    // Then process any remaining types from the type string
    if (typeString && typeString.includes("|")) {
        const types = typeString.split("|").map(t => t.trim());
        for (const type of types) {
            // Skip if we already processed this type from symbolDef
            if (properties.some(p => p.type === type)) {
                continue;
            }

            // Try to find a symbol for this type
            const matchingSymbol = Object.values(refBySymbolId).find(
                ref => (ref.context as TypeDocReferenceContext)?.symbolName === type
            );

            if (matchingSymbol?.definitions?.[0]) {
                const refSymbolCtx = matchingSymbol.context as TypeDocReferenceContext;
                const unionProperty: DefinitionProperty = {
                    name: refSymbolCtx?.symbolName || type,
                    type: refSymbolCtx?.symbolName || type,
                    description: '',
                    properties: [],
                };

                if (matchingSymbol.definitions[0].properties) {
                    for (const prop of matchingSymbol.definitions[0].properties) {
                        const resolvedProp = resolveProperty(refBySymbolId, prop, {
                            ...options,
                            depth: (options?.depth || 0) + 1,
                            visited: new Set(visited)
                        });
                        if (resolvedProp.properties) {
                            unionProperty.properties = unionProperty.properties || [];
                            unionProperty.properties.push(resolvedProp);
                        }
                    }
                }

                properties.push(unionProperty);
            } else {
                // If no symbol found, add as simple type
                properties.push({
                    name: type,
                    type: type,
                    description: '',
                    properties: []
                });
            }
        }
    }

    return properties;
}

function resolveProperty(
    refBySymbolId: { [symbolId: string]: Reference },
    property: DefinitionProperty,
    options?: {
        paramProps?: boolean,
        depth?: number,
        visited?: Set<string>
    }
): DefinitionProperty {
    // Initialize depth and visited set if not provided
    const depth = options?.depth || 0;
    const visited = options?.visited || new Set<string>();

    // Prevent infinite recursion by limiting depth and tracking visited types
    if (depth > 10) {
        console.warn('Maximum recursion depth reached for property:', property.name);
        return property;
    }

    const resolvedProperty: DefinitionProperty = {
        ...property,
        properties: property.properties?.map(p => ({
            ...p,
            properties: p.properties || []
        })) || []
    };

    // Handle tuple types
    if (property.type?.startsWith('[') && property.type?.endsWith(']')) {
        resolvedProperty.type = property.type;
        return resolvedProperty;
    }

    // Handle array types
    if (property.type === DEFINED_DEFINITION_PROPERTY_TYPE.ARRAY) {
        // Create a new rootProperty object to avoid circular references
        resolvedProperty.rootProperty = {
            name: property.rootProperty?.name || "",
            description: property.rootProperty?.description || "",
            type: property.rootProperty?.type || "",
            properties: property.rootProperty?.properties?.map(p => ({
                ...p,
                properties: p.properties || []
            })) || [],
            symbolDef: property.rootProperty?.symbolDef
        };

        // Handle array with union type in rootProperty
        if (property.rootProperty?.type === DEFINED_DEFINITION_PROPERTY_TYPE.UNION || 
            (property.rootProperty?.type && property.rootProperty.type.includes("|"))) {
            resolvedProperty.rootProperty.type = DEFINED_DEFINITION_PROPERTY_TYPE.UNION;
            
            // If we have symbolDef, use it to resolve the union types
            if (property.rootProperty.symbolDef?.id) {
                const symbolIds = Array.isArray(property.rootProperty.symbolDef.id) 
                    ? property.rootProperty.symbolDef.id 
                    : [property.rootProperty.symbolDef.id];
                
                resolvedProperty.rootProperty.properties = handleUnionTypes(
                    refBySymbolId,
                    symbolIds,
                    property.rootProperty.type,
                    visited,
                    options
                );
            } else {
                // If no symbolDef, try to resolve types from the type string
                const types = property.rootProperty.type.split("|").map(t => t.trim());
                resolvedProperty.rootProperty.properties = types.map(type => {
                    // Try to find a symbol for this type
                    const matchingSymbol = Object.values(refBySymbolId).find(
                        ref => (ref.context as TypeDocReferenceContext)?.symbolName === type
                    );

                    if (matchingSymbol?.definitions?.[0]) {
                        const refSymbolCtx = matchingSymbol.context as TypeDocReferenceContext;
                        return {
                            name: refSymbolCtx?.symbolName || type,
                            type: refSymbolCtx?.symbolName || type,
                            description: '',
                            properties: []
                        };
                    }

                    return {
                        name: type,
                        type: type,
                        description: '',
                        properties: []
                    };
                });
            }
            return resolvedProperty;
        }

        // If we have a rootProperty with symbolDef, resolve it
        if (property.rootProperty?.symbolDef?.id) {
            const symbolIds = Array.isArray(property.rootProperty.symbolDef.id) 
                ? property.rootProperty.symbolDef.id 
                : [property.rootProperty.symbolDef.id];

            // Always handle as union type if we have multiple symbol IDs
            if (symbolIds.length > 1) {
                resolvedProperty.rootProperty.type = DEFINED_DEFINITION_PROPERTY_TYPE.UNION;
                resolvedProperty.rootProperty.properties = handleUnionTypes(
                    refBySymbolId,
                    symbolIds,
                    property.rootProperty.type,
                    visited,
                    options
                );
            } else {
                // Single symbol ID case
                const symbolId = symbolIds[0];
                if (typeof symbolId === 'string') {
                    // Skip if we've already visited this type
                    if (visited.has(symbolId)) {
                        return resolvedProperty;
                    }
                    visited.add(symbolId);

                    const refSymbol = refBySymbolId[symbolId];
                    if (refSymbol?.definitions?.[0]) {
                        // If the referenced type has properties, resolve them
                        if (refSymbol.definitions[0].properties) {
                            // Recursively resolve each property of the array item type
                            for (const prop of refSymbol.definitions[0].properties) {
                                const resolvedProp = resolveProperty(refBySymbolId, prop, {
                                    ...options,
                                    depth: depth + 1,
                                    visited: new Set(visited)
                                });
                                if (resolvedProp.properties && resolvedProperty.rootProperty.properties) {
                                    resolvedProperty.rootProperty.properties.push(resolvedProp);
                                }
                            }
                        } else {
                            // If the referenced type has no properties, copy its type and description
                            const refSymbolCtx = refSymbol.context as TypeDocReferenceContext;
                            resolvedProperty.rootProperty.type = refSymbolCtx?.symbolName || property.rootProperty?.type || "";
                            resolvedProperty.rootProperty.description = refSymbol.description || property.rootProperty?.description || "";
                        }
                    }
                }
            }
        } else if (property.rootProperty?.type) {
            // If we only have a type string, just use it
            resolvedProperty.rootProperty.type = property.rootProperty.type;
        }
        
        return resolvedProperty;
    }

    // Handle union types (when symbolDef.id is an array or type contains "|")
    if ((property.symbolDef?.id && Array.isArray(property.symbolDef.id)) || (property.type && property.type.includes("|"))) {
        resolvedProperty.type = DEFINED_DEFINITION_PROPERTY_TYPE.UNION;
        resolvedProperty.properties = handleUnionTypes(
            refBySymbolId,
            Array.isArray(property.symbolDef?.id) ? property.symbolDef.id : [],
            property.type,
            visited,
            options
        );

        // Try to create a short merged type
        const shortType = shortMergedType(resolvedProperty);

        if (shortType) {
            return shortType;
        }
    }
    // Handle single type
    else if (property.symbolDef?.id) {
        const symbolId = property.symbolDef.id;
        if (typeof symbolId === 'string') {
            // Skip if we've already visited this type
            if (visited.has(symbolId)) {
                return resolvedProperty;
            }
            visited.add(symbolId);

            const refSymbol = refBySymbolId[symbolId];
            if (refSymbol?.definitions?.[0]) {
                // If the referenced type has properties, resolve them
                if (refSymbol.definitions[0].properties) {
                    // Recursively resolve each property
                    for (const prop of refSymbol.definitions[0].properties) {
                        const resolvedProp = resolveProperty(refBySymbolId, prop, {
                            ...options,
                            depth: depth + 1,
                            visited: new Set(visited)
                        });
                        if (resolvedProp.properties && resolvedProperty.properties) {
                            resolvedProperty.properties.push(resolvedProp);
                        }
                    }
                } else {
                    // If the referenced type has no properties, copy its type and description
                    const refSymbolCtx = refSymbol.context as TypeDocReferenceContext;
                    resolvedProperty.type = refSymbolCtx?.symbolName || property.type;
                    resolvedProperty.description = refSymbol.description || property.description;
                }
            }
        }
    }
    // Handle properties that are already defined
    else if (property.properties?.length) {
        for (const prop of property.properties) {
            const resolvedProp = resolveProperty(refBySymbolId, prop, {
                ...options,
                depth: depth + 1,
                visited: new Set(visited)
            });
            if (resolvedProp.properties && resolvedProperty.properties) {
                resolvedProperty.properties.push(resolvedProp);
            }
        }
    }

    return resolvedProperty;
}

function definitionMiniPropsPassThrough(
    refBySymbolId: { [symbolId: string]: Reference },
    defProperties: DefinitionProperty[],
    miniDef: Definition,
    options?: {
        paramProps?: boolean,
    }
)  {
    for (const property of defProperties) {
        // If the property has properties, use them directly
        if (property.properties?.length) {
            miniDef.properties.push({
                ...property,
                properties: property.properties.map(p => ({
                    ...p,
                    properties: p.properties || []
                }))
            });
            continue;
        }

        // Handle array types with union rootProperty
        if (property.type === DEFINED_DEFINITION_PROPERTY_TYPE.ARRAY && property.rootProperty?.type?.includes("|")) {
            const resolvedProperty = resolveProperty(refBySymbolId, property, options);
            miniDef.properties.push(resolvedProperty);
            continue;
        }

        if (property.type === DEFINED_DEFINITION_PROPERTY_TYPE.UNION && !property?.symbolDef?.id) {
            definitionMiniPropsPassThrough(
                refBySymbolId,
                property.properties || [],
                miniDef,
                {
                    paramProps: true,
                }
            )
            continue
        }

        // Handle properties without symbolDef
        if (!property.symbolDef?.id) {
            if (options?.paramProps) {
                miniDef.properties.push(property)
                continue
            }
            // Skip properties without symbolDef instead of error
            continue
        }

        const symbolId = property.symbolDef.id
        if (typeof symbolId !== "string") {
            if (options?.paramProps) {
                miniDef.properties.push(property)
                continue
            }
            // Skip properties with invalid symbolId instead of error
            continue
        }

        const refSymbol = refBySymbolId[symbolId]
        if (!refSymbol) {
            console.error(`Reference for symbol ${symbolId} not found`)
            continue
        }
        const refSymbolCtx = refSymbol.context as TypeDocReferenceContext

        const symbolRefMainRef = refSymbol.definitions?.[0]
        if (!symbolRefMainRef) {
            console.error(`Reference for symbol ${symbolId} has no main ref`)
            continue
        }

        // Resolve the property and all its nested properties
        const resolvedProperty = resolveProperty(refBySymbolId, property, options)
        miniDef.properties.push(resolvedProperty)
    }
}

function miniCanonical(canonical: string): string {
    const parts = canonical.split("/")
    for (const i in parts) {
        const part = parts[i]
        if (part === "functions") {
            parts[i] = "components"
        }
    }

    return parts.join("/")
}

function miniGroup(group: string[]): string[] {
    for (const i in group) {
        const part = group[i].toLowerCase()
        if (part === "functions") {
            group[i] = TXT.Component
        }
    }

    return group
}