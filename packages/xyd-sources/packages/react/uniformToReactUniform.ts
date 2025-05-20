import * as TypeDoc from 'typedoc';

import { Definition, DefinitionVariant, Reference, ReferenceContext, TypeDocReferenceContext } from "@xyd-js/uniform";

export function uniformToReactUniform(
    references: Reference<ReferenceContext>[],
    projectJson: TypeDoc.JSONOutput.ProjectReflection
): Reference<ReferenceContext>[] {
    const output: Reference<ReferenceContext>[] = []

    let refBySymbolId: { [symbolId: string]: Reference<ReferenceContext> } = {}

    for (const reference of references) {
        let ctx = reference.context as TypeDocReferenceContext
        if (ctx?.symbolId) {
            refBySymbolId[ctx.symbolId] = reference
        }
    }

    // TODO: in the future `unimap`
    for (const reference of references) {
        let ctx = reference.context as TypeDocReferenceContext

        if (ctx?.category !== "Component") {
            continue
        }

        const reactRef: Reference<ReferenceContext> = {
            ...reference,
            definitions: [],
        }

        for (const def of reference.definitions) {
            if (!def.meta) {
                continue
            }

            let isParamDefinition = false
            for (const meta of def.meta) {
                if (meta.name === "type" && meta.value === "parameters") {
                    isParamDefinition = true
                    break
                }
            }

            if (!isParamDefinition) {
                reactRef.definitions.push(def)
                continue
            }

            const variants: DefinitionVariant[] = []
            const reactDef: Definition = {
                ...def,
                properties: [],
            }

            for (const property of def.properties) {
                const symbolId = property.typeDef?.symbolId
                // TODO: handle not symbol types
                if (!symbolId) {
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

                            const variant: DefinitionVariant = {
                                title: unionPropRefCtx?.symbolName, 
                                properties: [],
                                meta: []
                            }


                            // TODO: handle multiple definitions
                            const unionPropDefs = unionPropRef.definitions?.[0]
                            if (unionPropDefs && unionPropDefs.properties) {
                                variant.properties = unionPropDefs.properties
                            }

                            variants.push(variant)
                        }
                    } else {
                        console.warn("currently not supported non-union properties")
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