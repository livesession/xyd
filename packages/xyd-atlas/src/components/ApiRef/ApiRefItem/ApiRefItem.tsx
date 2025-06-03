import React, { createContext, useContext, useState, useCallback, useEffect } from "react";

import {
    Definition,
    DefinitionVariant,
    Meta,
    OpenAPIReferenceContext,
    Reference,
    ReferenceCategory
} from "@xyd-js/uniform";
import { Heading, Code } from "@xyd-js/components/writer";

import {
    ApiRefProperties,
    ApiRefSamples
} from "@/components/ApiRef";
import * as cn from "@/components/ApiRef/ApiRefItem/ApiRefItem.styles";
import { useVariantToggles, type VariantToggleConfig } from "@/components/Atlas/AtlasContext";

export interface ApiRefItemProps {
    reference: Reference
}

// TODO: context with current referene?
export function ApiRefItem({ reference }: ApiRefItemProps) {
    return <atlas-apiref-item className={cn.ApiRefItemHost}>
        <atlas-apiref-item-showcase className={cn.ApiRefItemGrid}>
            <div>
                <$IntroHeader reference={reference} />
                <$Definitions reference={reference} />
            </div>

            {reference.examples && <ApiRefSamples examples={reference.examples} />}
        </atlas-apiref-item-showcase>
    </atlas-apiref-item>
}

function $IntroHeader({ reference }: ApiRefItemProps) {
    let topNavbar;

    switch (reference?.category) {
        case ReferenceCategory.REST: {
            const ctx = reference.context as OpenAPIReferenceContext

            if (!ctx || !ctx.method || !ctx.fullPath) {
                break;
            }

            // TODO: finish subitlte from ref
            topNavbar = <$Navbar
                label={ctx.method}
                subtitle={`${ctx.fullPath}`}
            />
            break;
        }
    }
    return <>
        <$Title title={reference.title} />

        {topNavbar}

        {reference.description}
    </>
}

function $Authorization({ reference }: ApiRefItemProps) {
    if (!reference.context) {
        return null;
    }

    const context = reference.context as OpenAPIReferenceContext;

    if (!context.scopes || !context.scopes.length) {
        return null;
    }

    return <div>
        <div className={cn.ApiRefItemDefinitionsItem}>
            <div part="header">
                <$Subtitle title="Scopes" />
            </div>

            <$DefinitionBody definition={{
                title: "",
                properties: [],
                description: <>
                    Required scopes: {context.scopes.map(s => <Code>{s}</Code>)}
                </>
            }}
            />
        </div>
    </div>
}

const VariantContext = createContext<{
    setVariant: (variant: DefinitionVariant) => void,
    variant?: DefinitionVariant,
    variantToggles: VariantToggleConfig[],
    selectedValues: Record<string, string>,
    setSelectedValue: (key: string, value: string) => void,
    variants: DefinitionVariant[],
}>({
    variant: undefined,
    setVariant: () => { },
    variantToggles: [],
    selectedValues: {},
    setSelectedValue: () => { },
    variants: [],
});

function $Definitions({ reference }: ApiRefItemProps) {
    let argDefinition: Definition | undefined
    let definitions = reference?.definitions || []

    if (reference?.category === ReferenceCategory.GRAPHQL) {
        const gqlDefinitions: Definition[] = []

        // First find the arguments definition
        reference?.definitions?.forEach(definition => {
            const foundArgs = definition?.meta?.find(meta => {
                return meta.name === "type" && meta.value === "arguments"
            })

            if (foundArgs) {
                argDefinition = definition
            } else {
                gqlDefinitions.push(definition)
            }
        })

        // Process each definition to merge argument properties
        definitions = gqlDefinitions.map(definition => {
            if (!definition.properties?.length) return definition

            // For each property in the definition
            const updatedProperties = definition.properties.map(prop => {
                // Find matching variant in argDefinition by symbolName
                const matchingVariant = argDefinition?.variants?.find(variant => {
                    const symbolMeta = variant.meta?.find(m => m.name === 'symbolName')
                    return symbolMeta?.value === prop.name
                })

                if (matchingVariant) {
                    // Add meta flag to indicate this property has arguments, but only if it doesn't already have it
                    const meta = prop.meta || []
                    if (!meta.some(m => m.name === 'hasArguments')) {
                        meta.push({
                            name: 'hasArguments', // TODO: better solution in the future
                            value: 'true'
                        })
                    }

                    // Merge properties from the matching variant
                    return {
                        ...prop,
                        meta,
                        properties: matchingVariant.properties || []
                    }
                }

                return prop
            })

            return {
                ...definition,
                properties: updatedProperties
            }
        })
    }

    return <atlas-apiref-definitions className={cn.ApiRefItemDefinitionsHost}>
        <$Authorization reference={reference} />

        {definitions?.map((definition, i) => {
            return <$VariantsProvider key={i} definition={definition}>
                <div>
                    {
                        definition?.title ? <div key={i} className={cn.ApiRefItemDefinitionsItem}>
                            <div part="header">
                                <$Subtitle title={definition.title} />
                                <div part="controls">
                                    <$VariantSelects />
                                </div>
                            </div>

                            <$DefinitionBody definition={definition} />
                        </div> : null
                    }
                </div>
            </$VariantsProvider>
        })}
    </atlas-apiref-definitions>
}

function $VariantsProvider({ definition, children }: {
    definition: Definition,
    children: React.ReactNode
}) {
    const variantToggles = useVariantToggles();
    const [selectedValues, setSelectedValues] = useState<Record<string, string>>(() => {
        const initial: Record<string, string> = {};
        variantToggles.forEach(toggle => {
            initial[toggle.key] = toggle.defaultValue;
        });
        return initial;
    });

    const setSelectedValue = useCallback((key: string, value: string) => {
        setSelectedValues(prev => ({ ...prev, [key]: value }));
    }, []);

    const variants = definition.variants || [];
    const [variant, setVariant] = useState<DefinitionVariant | undefined>(() => {
        return findMatchingVariant(variants, selectedValues);
    });

    useEffect(() => {
        const newVariant = findMatchingVariant(variants, selectedValues);
        setVariant(newVariant);
    }, [selectedValues, variants]);

    return <VariantContext.Provider value={{
        variant,
        setVariant,
        variantToggles,
        selectedValues,
        setSelectedValue,
        variants,
    }}>
        {children}
    </VariantContext.Provider>
}

function findMatchingVariant(variants: DefinitionVariant[], selectedValues: Record<string, string>): DefinitionVariant | undefined {
    return variants.find(variant => {
        return Object.entries(selectedValues).every(([key, value]) => {
            const meta = variant.meta?.find(m => m.name === key);
            return meta?.value === value;
        });
    }) || variants[0];
}

function $VariantSelects() {
    const { variantToggles, selectedValues, setSelectedValue, variants } = useContext(VariantContext);

    if (!variants?.length) return null;

    return <div className={""}>
        {variantToggles.map(toggle => {
            // Get all variants that match current selections (except the current toggle)
            const matchingVariants = variants.filter(variant => {
                return Object.entries(selectedValues).every(([key, value]) => {
                    // Skip the current toggle key since we're finding values for it
                    if (key === toggle.key) return true;

                    const meta = variant.meta?.find(m => m.name === key);
                    return meta?.value === value;
                });
            });

            // Get available values for this toggle from matching variants
            const availableValues = Array.from(new Set(
                matchingVariants.map(v => v.meta?.find(m => m.name === toggle.key)?.value).filter(Boolean)
            ));

            // If no values available, use the current value
            if (availableValues.length === 0 && selectedValues[toggle.key]) {
                availableValues.push(selectedValues[toggle.key]);
            }

            return (
                <select
                    key={toggle.key}
                    value={selectedValues[toggle.key]}
                    onChange={(e) => setSelectedValue(toggle.key, e.target.value)}
                >
                    {availableValues.map(value => (
                        <option key={value} value={value}>
                            <>
                                {value}
                            </>
                        </option>
                    ))}
                </select>
            );
        })}
    </div>
}

interface DefinitionBodyProps {
    definition: Definition
}
function $DefinitionBody(props: DefinitionBodyProps) {
    const { definition } = props;
    const { variant } = useContext(VariantContext);

    let apiRefProperties: React.ReactNode | null = null

    if (variant) {
        if (variant.properties?.length) {
            apiRefProperties = <ApiRefProperties properties={variant.properties} />
        } else if (variant.rootProperty) {
            apiRefProperties = <ApiRefProperties properties={[
                variant.rootProperty
            ]} />
        }
    } else {
        if (definition.properties?.length) {
            apiRefProperties = <ApiRefProperties properties={definition.properties} />
        } else if (definition.rootProperty) {
            apiRefProperties = <ApiRefProperties properties={[
                definition.rootProperty
            ]} />
        }
    }

    return <div part="body">
        {
            definition.description && <div>
                {definition.description}
            </div>
        }

        {apiRefProperties}
    </div>
}

function $Navbar({ label, subtitle }: { label: string, subtitle: string }) {
    return <>
        <div className={cn.ApiRefItemNavbarHost}>
            <span className={cn.ApiRefItemNavbarContainer}>
                <span className={cn.ApiRefItemNavbarLabel}>
                    {label.toUpperCase()}
                </span>
                <span>
                    {subtitle}
                </span>
            </span>
        </div>
    </>
}

function $Title({ title }: { title: string }) {
    return <>
        <Heading size={1}>
            {title}
        </Heading>
    </>
}

function $Subtitle({ title }: { title: string }) {
    return <>
        <Heading size={3}>
            {title}
        </Heading>
    </>
}

