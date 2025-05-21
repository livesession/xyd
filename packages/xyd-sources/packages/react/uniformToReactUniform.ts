import * as TypeDoc from 'typedoc';

import type {
    Reference,
    Definition,
    DefinitionVariant,
    DefinitionVariantTypeDocMeta,
    TypeDocReferenceContext
} from "@xyd-js/uniform";

// TODO: in the future translation system
const TITLES = {
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

            const variants: DefinitionVariant[] = []
            const reactDef: Definition = {
                ...def,
                title: TITLES.Props,
                properties: [],
            }

            for (const property of def.properties) {
                const symbolId = property.typeDef?.symbolId
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

                // TODO: in the future mainref or multiple refs?
                const symbolRefMainRef = refSymbol.definitions?.[0]
                if (!symbolRefMainRef) {
                    console.error(`Reference for symbol ${symbolId} has no main ref`)
                    continue
                }

                // TODO: suppot `&` and combined like `&` and `|`
                for (const symbolProp of symbolRefMainRef.properties) {
                    const unionProp = symbolProp?.typeDef?.union

                    if (unionProp) {
                        for (const unionPropItem of unionProp) {
                            const symbolId = unionPropItem.symbolId
                            const unionPropRef = refBySymbolId[symbolId]
                            if (!unionPropRef) {
                                console.error(`unionProp: Reference for symbol ${symbolId} not found`)
                                continue
                            }

                            const unionPropRefCtx = unionPropRef.context as TypeDocReferenceContext

                            const meta: DefinitionVariantTypeDocMeta[] = [
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

                            variants.push(variant)
                        }
                    } else {
                        const symbolId = property.typeDef?.symbolId
                        if (!symbolId) {
                            console.error(`non-union property ${property.name} has no symbolId`)
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

                        reactDef.properties = firstDef.properties
                    }
                }
            }

            reactDef.variants = variants
            reactRef.definitions.push(reactDef)
        }

        output.push(reactRef)
    }

    return output
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
            group[i] = TITLES.Component
        }
    }

    return group
}
