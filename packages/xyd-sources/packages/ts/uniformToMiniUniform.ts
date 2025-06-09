import {
    DEFINED_DEFINITION_PROPERTY_TYPE,
    Definition, DefinitionProperty,
    Reference,
    TypeDocReferenceContext
} from "@xyd-js/uniform";

// TODO: in the future translation system
const TXT = {
    Properties: "Properties",
}

// TODO: primite types for different langauges
// Map of primitive types that can be merged
const PRIMITIVE_TYPES = new Set(['string', 'number', 'boolean']);

type RefsBySymbolId = { [symbolId: string]: Reference };

// TODO: name it eager and move to uniform plugins
/**
 * `uniformToMiniUniform` converts a list of references into a mini uniform format.
 */
export function uniformToMiniUniform(
    rootSymbolName: string,
    references: Reference<TypeDocReferenceContext>[],
): Reference[] {
    const output: Reference[] = []
    const refBySymbolId: RefsBySymbolId = {}

    // 1. collect all references by symbolId
    for (const reference of references) {
        const ctx = reference.context

        if (ctx?.symbolId) {
            if (reference.context?.meta?.some(m => m.name === "internal" && m.value === "true")) {
                continue // Skip internal references
            }

            // TODO: check if still has issues with circular references
            refBySymbolId[ctx.symbolId] = JSON.parse(JSON.stringify(reference)); // Deep clone to avoid circular references
        }
    }

    // 2. process references by rootSymbolName
    for (const reference of references) {
        const ctx = reference.context

        if (ctx?.symbolName !== rootSymbolName) {
            continue
        }

        const miniRef: Reference = {
            ...reference,
            title: ctx?.symbolName || reference.title,
            canonical: "",
            context: ctx,
            definitions: [],
        }

        for (const def of reference.definitions) {
            const miniDef: Definition = {
                ...def,
                title: TXT.Properties,
                properties: [],
                symbolDef: {
                    ...def.symbolDef || {},
                    canonical: "", // TODO: support canonical in the future
                }
            }

            const defProperties = def?.rootProperty ? [def.rootProperty] : def.properties || []

            definitionMiniPropsPassThrough(
                refBySymbolId,
                defProperties,
                miniDef,
            )

            miniRef.definitions.push(miniDef)
        }

        output.push(miniRef)
    }

    return output
}

/**
 * `definitionMiniPropsPassThrough` processes the properties of a definition and resolves them into a mini definition.
 */
function definitionMiniPropsPassThrough(
    refBySymbolId: RefsBySymbolId,
    defProperties: DefinitionProperty[],
    miniDef: Definition,
    options?: {
        paramProps?: boolean,
    }
) {
    for (let property of defProperties) {
        property = {
            ...property,
            symbolDef: {
                ...property.symbolDef || {},
                canonical: "", // TODO: support canonical in the future
            }
        }

        // 1. resolve the property and all its nested properties
        const resolvedProperty = resolveProperty(refBySymbolId, property, options)

        miniDef.properties.push({
            ...resolvedProperty,
            symbolDef: {
                ...resolvedProperty.symbolDef || {},
                canonical: "", // TODO: support canonical in the future
            }
        })
    }
}

/**
 * `resolveProperty` recursively resolves a property and its nested properties.
 */
function resolveProperty(
    refBySymbolId: { [symbolId: string]: Reference },
    property: DefinitionProperty,
    options?: {
        paramProps?: boolean,
        depth?: number,
        visited?: Set<string>
    }
): DefinitionProperty {
    property = {
        ...property,
        symbolDef: {
            ...property.symbolDef || {},
            canonical: "", // TODO: support canonical in the future
        }
    }
    // Initialize depth and visited set if not provided
    const depth = options?.depth || 0;
    const visited = options?.visited || new Set<string>();

    // Prevent infinite recursion by limiting depth and tracking visited types
    if (depth > 10) {
        console.warn('Maximum recursion depth reached for property:', property.name);
        return property;
    }

    if (property?.properties?.length) {
        return property
    }

    const resolvedPropertyProps: DefinitionProperty[] = []
    const resolvedProperty: DefinitionProperty = {
        ...property,
        properties: resolvedPropertyProps,
    }

    // 1. handle array types
    if (property.type === DEFINED_DEFINITION_PROPERTY_TYPE.ARRAY) {
        if (property.ofProperty) {
            const resolvedRootProperty = resolveProperty(
                refBySymbolId,
                property.ofProperty,
                options
            )

            resolvedProperty.ofProperty = resolvedRootProperty

            return resolvedProperty
        } else {
            console.warn(`Property ${property.name} is an array but has no ofProperty defined, using type only`);
        }

        return property
    }

    // 2. handle symbolDef.id references
    const symbolId = property?.symbolDef?.id;
    if (symbolId) {
        // 3. if symbolId is a string, resolve the reference
        if (typeof symbolId === 'string') {
            if (visited.has(symbolId)) {
                return resolvedProperty;
            }
            visited.add(symbolId);

            const refSymbol = refBySymbolId[symbolId];
            const refSymbolDefinition = refSymbol?.definitions?.[0];
            const refSymbolDefinitionProps = refSymbolDefinition?.properties || [];

            if (!refSymbol) {
                console.warn(`Reference for symbol ${symbolId} not found, using type only`);
                return resolvedProperty;
            }

            // If the referenced type has properties, resolve them
            if (refSymbolDefinitionProps.length) {
                // Recursively resolve each property
                for (const prop of refSymbolDefinitionProps) {
                    const resolvedProp = resolveProperty(refBySymbolId, prop, {
                        ...options,
                        depth: depth + 1,
                        visited: new Set(visited)
                    });
                    resolvedPropertyProps.push(resolvedProp);
                }

            } else if (refSymbolDefinition.rootProperty) {
                const resolvedProp = resolveProperty(refBySymbolId, refSymbolDefinition.rootProperty, {
                    ...options,
                    depth: depth + 1,
                    visited: new Set(visited)
                });

                resolvedProperty.ofProperty = resolvedProp;
            } else {
                console.warn(`Reference for symbol ${symbolId} has no properties, using type and description only`);
            }

            if (!resolvedProperty.description) {
                resolvedProperty.description = refSymbol.description || '';
            }

            return resolvedProperty;
        }

        // TODO: in the future only symbolId as []? but currently it handles a cases when e.g: `string | Settings`
        // 4. if property is resolve union type
        const isResolveUnion = isResolveUnionRef(property)
        if (isResolveUnion) {
            resolvedProperty.type = DEFINED_DEFINITION_PROPERTY_TYPE.UNION;
            const unionProps = handleUnionTypes(
                refBySymbolId,
                property,
                options
            );

            if (unionProps.length > 1) {
                resolvedProperty.properties = unionProps;
            } else {
                resolvedProperty.ofProperty = unionProps[0];
            }

            // Try to create a short merged type
            const shortType = shortMergedType(resolvedProperty);

            if (shortType) {
                return shortType;
            }

            return resolvedProperty
        }
    }

    return property
}

/**
 * `shortMergedType` attempts to simplify a union type by merging properties into a single type string.
 */
function shortMergedType(property: DefinitionProperty): DefinitionProperty | null {
    property = {
        ...property,
        symbolDef: {
            ...property.symbolDef || {},
            canonical: "", // TODO: support canonical in the future
        }
    }
    // 1. only handle union types
    if (property.type !== DEFINED_DEFINITION_PROPERTY_TYPE.UNION) {
        return null;
    }

    const properties = property.ofProperty ? [property.ofProperty] : property.properties || [];

    // 2. process nested properties first
    const processedProperties = properties.map(prop => {
        // 3. if this property is also a union, try to simplify it
        if (prop.type === DEFINED_DEFINITION_PROPERTY_TYPE.UNION) {
            const shortType = shortMergedType(prop);
            if (shortType) {
                return shortType;
            }
        }

        // 4. check one level of prop.properties e.g {type: "Example": properties: [{name: "a", type: "string"}, {name: "b", type: "number"}]}
        const shortType = shortMergedType({
            name: "",
            description: "",
            type: DEFINED_DEFINITION_PROPERTY_TYPE.UNION,
            properties: prop.properties,
            ofProperty: prop.ofProperty,
        })

        if (shortType) {
            return shortType
        }

        return prop;
    });

    if (!processedProperties?.length) {
        return null
    }

    // 5. check if all properties are either string literals or primitive types
    const hasOnlySimpleTypes = processedProperties.every(prop => {
        // 6. check for string literals (type starts and ends with quotes)
        if (isLiteralValues(prop.type)) {
            return true
        }

        // 7. check for primitive types also
        return PRIMITIVE_TYPES.has(prop.type);
    });

    if (!hasOnlySimpleTypes) {
        return null;
    }

    // 8. create merged type string
    const types = processedProperties.map(prop => prop.type);
    const mergedType = types.join(' | ');

    return {
        ...property,
        type: mergedType,
        properties: []
    };
}

/**
 * @todo: in the future typedoc uniform should handle more union types like `$$union`
 *
 * `handleUnionTypes` processes union types from a definition property.
 */
function handleUnionTypes(
    refBySymbolId: { [symbolId: string]: Reference },
    property: DefinitionProperty,
    options?: {
        depth?: number,
    }
): DefinitionProperty[] {
    property = {
        ...property,
        symbolDef: {
            ...property.symbolDef || {},
            canonical: "", // TODO: support canonical in the future
        }
    }
    const symbolIds = Array.isArray(property.symbolDef?.id) ? property.symbolDef.id : [];
    const typeString = property.type

    const properties: DefinitionProperty[] = [];
    const unionTypeStringsMap: { [key: string]: boolean } = (typeString || "").split("|")
        .map(t => t.trim())
        .reduce((acc, type) => ({
            ...acc,
            [type]: true
        }), {});

    // 1. if we have symbolDef.id array, process those firsi
    if (symbolIds.length > 0) {
        for (const symbolId of symbolIds) {
            const refSymbol = refBySymbolId[symbolId];
            const refSymbolDefinition = refSymbol?.definitions?.[0];
            const ctx = refSymbol?.context as TypeDocReferenceContext;

            if (refSymbolDefinition) {
                unionTypeStringsMap[ctx.symbolName] = false

                const propProperties: DefinitionProperty[] = [];
                const prop: DefinitionProperty = {
                    name: ctx.symbolName || '',
                    type: ctx.symbolName || '',
                    description: refSymbol.description || '',
                    properties: propProperties,
                    symbolDef: {
                        id: symbolId,
                        canonical: "", // TODO: support canonical in the future
                    },
                }

                if (refSymbolDefinition.properties.length) {
                    for (const prop of refSymbolDefinition.properties) {
                        const resolvedProp = resolveProperty(
                            refBySymbolId,
                            prop,
                            options
                        )

                        propProperties.push(resolvedProp)
                    }
                } else if (refSymbolDefinition.rootProperty) {
                    const resolvedProp = resolveProperty(
                        refBySymbolId,
                        refSymbolDefinition.rootProperty,
                        options
                    )

                    const shouldMergeUnion = resolvedProp.type === DEFINED_DEFINITION_PROPERTY_TYPE.UNION &&
                        resolvedProp.ofProperty?.type &&
                        !resolvedProp.properties?.length

                    if (shouldMergeUnion) {
                        prop.ofProperty = resolvedProp.ofProperty
                    } else {
                        prop.ofProperty = resolvedProp
                    }
                }

                properties.push(prop)

                if (!prop.description) {
                    prop.description = refSymbol.description || '';
                }
            }
        }
    }

    // TODO: in the future it should be done via uniform in xyd-sources?
    // 2. then process any remaining types from the type string
    for (const type of Object.keys(unionTypeStringsMap)) {
        const ok = unionTypeStringsMap[type]
        if (!ok) {
            continue;
        }

        properties.push({
            name: type,
            type: type,
            description: '',
            properties: []
        });
    }

    return properties
}

/**
 * `isResolveUnionRef` checks if the property should be resolved as a union type.
 * It checks if the symbolDef.id is an array or if the type contains a union string to resolve, except literal values.
 *
 * @example: {symbolDef: {id: []}, type: `string | number`}
 * @example: {symbolDef: {id: ["1"]}, type: `string | Logo`}
 * @example: {symbolDef: {id: ["1", "2"]}, type: `Icon | Logo`}
 */
function isResolveUnionRef(property: DefinitionProperty): boolean {
    const symbolId = property?.symbolDef?.id

    const symbolIsArr = (Array.isArray(symbolId) && symbolId.length)
    if (symbolIsArr) {
        return true
    }

    const hasUnionString = (property.type && property.type.includes("|"))

    if (hasUnionString) {
        const literalValues = isLiteralValues(property.type)

        if (literalValues) {
            return false // If all types are literal values, do not resolve as union
        }

        return true
    }

    return false
}

/**
 * `isLiteralValues` checks if the type is a literal value like: `"opener" | "cosmo" | "picasso"`
 *
 * @example: `"opener" | "cosmo" | "picasso"` - returns true
 * @example: `string | "number` - returns false
 */
function isLiteralValues(type: string) {
    const types = type.split("|").map(t => t.trim())

    return types.every(t =>
        (t.startsWith('"') && t.endsWith('"')) ||
        (t.startsWith("'") && t.endsWith("'"))
    )
}
