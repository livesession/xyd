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

export function uniformToReactUniform(
    references: Reference<TypeDocReferenceContext>[],
    projectJson: TypeDoc.JSONOutput.ProjectReflection // TODO: in the future unimap
): Reference[] {
    const output: Reference[] = []

    let refBySymbolId: { [symbolId: string]: Reference } = {}

    for (const reference of references) {
        const ctx = reference.context

        if (ctx?.symbolId) {
            refBySymbolId[ctx.symbolId] = reference
        }
    }

    // TODO: in the future `unimap`
    for (const reference of references) {
        const ctx = reference.context

        if (ctx?.category !== "Component") {
            continue
        }

        const reactRef: Reference = {
            ...reference,
            title: ctx?.symbolName || reference.title,
            canonical: reactCanonical(reference.canonical),
            context: {
                ...ctx,
                group: reactGroup(ctx?.group || []),
            },
            definitions: [],
        }

        for (const def of reference.definitions) {
            if (!def.meta) {
                continue
            }

            let isParamDefinition = false
            for (let meta of def.meta) {
                if (meta.name === "type" && meta.value === "parameters") {
                    isParamDefinition = true
                    break
                }
            }

            if (!isParamDefinition) {
                continue
            }

            const reactDef: Definition = {
                ...def,
                title: TXT.Props,
                properties: [],
            }

            definitionReactPropsPassThrough(
                refBySymbolId,
                def.properties || [],
                reactDef,
            )

            reactRef.definitions.push(reactDef)
        }

        output.push(reactRef)
    }

    return output
}

function definitionReactPropsPassThrough(
    refBySymbolId: { [symbolId: string]: Reference },
    defProperties: DefinitionProperty[],
    reactDef: Definition,
    options?: {
        paramProps?: boolean, // TODO: in the future
    }
)  {
    for (const property of defProperties) {
        if (property.type === DEFINED_DEFINITION_PROPERTY_TYPE.UNION && !property?.symbolDef?.id) {
            definitionReactPropsPassThrough(
                refBySymbolId,
                property.properties || [],
                reactDef,
                {
                    paramProps: true,
                }
            )
            continue
        }

        const symbolId = property.symbolDef?.id
        if (typeof symbolId != "string") {
            if (options?.paramProps) {
                reactDef.properties.push(property)
                continue
            }
            console.error(`symbolId is not a string: ${symbolId}`)
            continue
        }

        // TODO: handle not symbol types
        if (!symbolId) {
            if (property.type === "param" && property.properties?.length) {
                reactDef.properties = property.properties
            }
            continue
        }


        const refSymbol = refBySymbolId[symbolId]
        if (!refSymbol) {
            console.error(`Reference for symbol ${symbolId} not found`)
            continue
        }
        const refSymbolCtx = refSymbol.context as TypeDocReferenceContext

        const isPropsVariant = refSymbolCtx.symbolKind === ReflectionKind.TypeAlias // TODO: in the future more symbol kinds?

        // TODO: in the future mainref or multiple refs?
        const symbolRefMainRef = refSymbol.definitions?.[0]
        if (!symbolRefMainRef) {
            console.error(`Reference for symbol ${symbolId} has no main ref`)
            continue
        }

        // TODO: suppot `&` and combined like `&` and `|`
        for (const i in symbolRefMainRef.properties) {
            let propIndex = parseInt(i)
            if (options?.paramProps && reactDef.properties.length) {
                propIndex += reactDef.properties.length
            }

            const symbolProp = symbolRefMainRef.properties[i]

            const unionProp = symbolProp?.symbolDef?.id

            if (unionProp && unionProp.length && isPropsVariant) {
                for (const symbolId of unionProp) {
                    const unionPropRef = refBySymbolId[symbolId]
                    if (!unionPropRef) {
                        console.error(`unionProp: Reference for symbol ${symbolId} not found`)
                        continue
                    }

                    const unionPropRefCtx = unionPropRef.context as TypeDocReferenceContext

                    const meta: CommonDefinitionVariantMeta[] = [
                        {
                            name: "symbolName",
                            value: unionPropRefCtx?.symbolName || "",
                        }
                    ]

                    const variant: DefinitionVariant = {
                        title: unionPropRefCtx?.symbolName,
                        properties: [],
                        meta,
                    }

                    // TODO: handle multiple definitions
                    const unionPropDefs = unionPropRef.definitions?.[0]
                    if (unionPropDefs && unionPropDefs.properties) {
                        variant.properties = unionPropDefs.properties
                    }
                    if (unionPropRef.definitions.length > 1) {
                        console.error(`unionProp: Reference for symbol ${symbolId} has multiple definitions`)
                    }

                    if (!reactDef.variants) {
                        reactDef.variants = []
                    }
                    reactDef.variants.push(variant)
                }
            } else {
                const symbolId = property.symbolDef?.id
                if (!symbolId) {
                    console.error(`non-union property ${property.name} has no symbolId`)
                    continue
                }

                if (typeof symbolId != "string") {
                    console.error(`symbolId is not a string: ${symbolId}`)
                    continue
                }

                const symbolRef = refBySymbolId[symbolId]
                if (!symbolRef) {
                    console.error(`symbolRef: Reference for symbol ${symbolId} not found`)
                    continue
                }

                const firstDef = symbolRef.definitions?.[0]
                if (!firstDef) {
                    console.error(`symbolRef: Reference for symbol ${symbolId} has no main ref`)
                    continue
                }
                if (firstDef.properties.length > 1) {
                    console.warn(`symbolRef: Reference for symbol ${symbolId} has multiple properties`)
                }

                reactDef.properties[propIndex] = firstDef.properties[i]

                if (unionProp && typeof unionProp === "string") {
                    const unionPropRef = refBySymbolId[unionProp]
                    if (!unionPropRef) {
                        console.error(`unionProp: Reference for symbol ${symbolId} not found`)
                        continue
                    }

                    const joinPropTypes: string[] = []
                    // TODO: in the future by meta not by `[0]`
                    if (unionPropRef?.definitions?.[0]?.properties?.length) {
                        // TODO: configurable - join types or nested properties
                        for (const prop of unionPropRef.definitions[0].properties) {
                            if (prop.type) {
                                joinPropTypes.push(prop.type)
                            }
                        }
                    }

                    if (joinPropTypes.length) {
                        reactDef.properties[propIndex].type = joinPropTypes.join(" | ")
                    }
                }
            }
        }
    }
}

function reactCanonical(canonical: string): string {
    const parts = canonical.split("/")
    for (const i in parts) {
        const part = parts[i]
        if (part === "functions") {
            parts[i] = "components"
        }
    }

    return parts.join("/")
}

function reactGroup(group: string[]): string[] {
    for (const i in group) {
        const part = group[i].toLowerCase()
        if (part === "functions") {
            group[i] = TXT.Component
        }
    }

    return group
}
