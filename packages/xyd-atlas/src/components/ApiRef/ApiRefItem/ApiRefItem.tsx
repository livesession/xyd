import React, { createContext, useContext, useState, useCallback, useEffect } from "react";

import {
    Definition,
    DefinitionVariant,
    Meta,
    OpenAPIReferenceContext,
    Reference,
    ReferenceCategory
} from "@xyd-js/uniform";
import { Heading, Code, Badge, Text } from "@xyd-js/components/writer";

import {
    ApiRefProperties,
    ApiRefSamples
} from "@/components/ApiRef";
import * as cn from "@/components/ApiRef/ApiRefItem/ApiRefItem.styles";
import { useVariantToggles, type VariantToggleConfig } from "@/components/Atlas/AtlasContext";

export interface ApiRefItemProps {
    reference: Reference
    kind?: "secondary"
}

// TODO: context with current referene?
export function ApiRefItem({
    kind,
    reference
}: ApiRefItemProps) {
    const hasExamples = reference.examples?.groups?.length || false

    let header: React.ReactNode | null = <$IntroHeader reference={reference} />
    let examples: React.ReactNode | null = <ApiRefSamples examples={reference.examples} />

    if (kind === "secondary") {
        header = null
        examples = null
    }

    return <atlas-apiref-item
        data-has-examples={hasExamples ? "true" : undefined}
        className={cn.ApiRefItemHost}
    >
        <atlas-apiref-item-showcase className={cn.ApiRefItemGrid}>
            <div>
                {header}
                <$Definitions
                    kind={kind}
                    reference={reference}
                />
            </div>

            {examples}
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
                matchSubtitle={ctx.path}
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
    setVariant: () => {
    },
    variantToggles: [],
    selectedValues: {},
    setSelectedValue: () => {
    },
    variants: [],
});

function $Definitions({
    kind,
    reference
}: ApiRefItemProps) {
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
        definitions = gqlDefinitions
            .filter(definition => definition?.properties?.length)
            .map(definition => {
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
            if (kind === "secondary") {
                return <$DefinitionBody key={i} definition={definition} />
            }

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
    const variants = definition.variants || [];
    const variantMetas = variants.reduce((acc, variant) => {
        const allMetaNames = variant.meta?.reduce((metaAcc, meta) => ({
            ...metaAcc,
            [meta.name]: 1,
        }), {}) || {}


        return {
            ...acc,
            ...allMetaNames,
        }
    }, {});
    const variantToggles = (useVariantToggles() || []).filter(toggle => variantMetas[toggle.key])

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
    const matchingVariant = variants.find(variant => {
        const matches = Object.entries(selectedValues).every(([key, value]) => {
            if (!value) return true; // Skip empty values
            const meta = variant.meta?.find(m => m.name === key);
            return meta?.value === value;
        });
        return matches;
    });

    return matchingVariant || variants[0];
}

function $VariantSelects() {
    const { variantToggles, selectedValues, setSelectedValue, variants } = useContext(VariantContext);

    if (!variants?.length) return null;

    // Create selects based on variantToggles
    return (
        <div className={""}>
            {variantToggles.map((toggle, index) => {
                // Get all unique values for this toggle
                const availableValues = Array.from(new Set(
                    variants.map(v => {
                        const meta = v.meta?.find(m => m.name === toggle.key);
                        return meta?.value as string;
                    }).filter(Boolean)
                )).sort();

                // Get available values based on other selected values
                const filteredValues = availableValues.filter(value => {
                    // For the first toggle, show all values
                    if (index === 0) return true;

                    // For other toggles, check if there's a variant with this value and all previous selected values
                    return variants.some(variant => {
                        // First check if this variant has the value we're checking
                        const hasValue = variant.meta?.some(m => m.name === toggle.key && m.value === value);
                        if (!hasValue) return false;

                        // Then check if it matches all previous selected values
                        return variantToggles.slice(0, index).every(prevToggle => {
                            const selectedValue = selectedValues[prevToggle.key];
                            if (!selectedValue) return true; // Skip empty values

                            const meta = variant.meta?.find(m => m.name === prevToggle.key);
                            return meta?.value === selectedValue;
                        });
                    });
                });

                // If no values available, use the current value
                const displayValues = filteredValues.length > 0 ? filteredValues :
                    (selectedValues[toggle.key] ? [selectedValues[toggle.key]] : availableValues);

                return (
                    <select
                        key={toggle.key}
                        value={selectedValues[toggle.key] || ''}
                        onChange={(e) => {
                            const newValue = e.target.value;
                            setSelectedValue(toggle.key, newValue);

                            // For the first toggle (status), check if current content type is still valid
                            if (index === 0 && variantToggles.length > 1) {
                                const contentTypeKey = variantToggles[1].key;
                                const currentContentType = selectedValues[contentTypeKey];

                                if (currentContentType) {
                                    // Check if current content type is valid for new status
                                    const isValid = variants.some(variant => {
                                        const statusMeta = variant.meta?.find(m => m.name === toggle.key);
                                        const contentTypeMeta = variant.meta?.find(m => m.name === contentTypeKey);
                                        return statusMeta?.value === newValue && contentTypeMeta?.value === currentContentType;
                                    });

                                    // If not valid, reset content type
                                    if (!isValid) {
                                        setSelectedValue(contentTypeKey, '');
                                    }
                                }
                            } else if (index < variantToggles.length - 1) {
                                // For other toggles, reset all toggles after this one
                                // Only if there are toggles after this one
                                variantToggles.slice(index + 1).forEach(nextToggle => {
                                    setSelectedValue(nextToggle.key, '');
                                });
                            }
                        }}
                    >
                        {displayValues.map(value => (
                            <option key={value} value={value}>
                                {value}
                            </option>
                        ))}
                    </select>
                );
            })}
        </div>
    );
}

interface DefinitionBodyProps {
    definition: Definition
}

function $DefinitionBody(props: DefinitionBodyProps) {
    const { definition } = props;
    const { variant } = useContext(VariantContext);

    let apiRefProperties: React.ReactNode | null = null;

    if (variant) {
        if (variant.properties?.length) {
            apiRefProperties = <ApiRefProperties properties={variant.properties} />;
        } else if (variant.rootProperty) {
            apiRefProperties = <ApiRefProperties properties={[variant.rootProperty]} />;
        }
    } else {
        if (definition.properties?.length) {
            apiRefProperties = <ApiRefProperties properties={definition.properties} />;
        } else if (definition.rootProperty) {
            apiRefProperties = <ApiRefProperties properties={[definition.rootProperty]} />;
        }
    }

    const getMetaInfo = (meta: Meta[] | undefined) => {
        if (!meta?.length) return null;

        const minimum = meta.find(m => m.name === 'minimum')?.value;
        const maximum = meta.find(m => m.name === 'maximum')?.value;
        const example = meta.find(m => m.name === 'example')?.value;

        const rangeInfo: string[] = [];
        if (minimum !== undefined && maximum !== undefined) {
            rangeInfo.push(`Required range: ${minimum} <= x <= ${maximum}`);
        } else if (minimum !== undefined) {
            rangeInfo.push(`Required range: x >= ${minimum}`);
        } else if (maximum !== undefined) {
            rangeInfo.push(`Required range: x <= ${maximum}`);
        }

        const exampleInfo = example ? [`Examples:`, `"${example}"`] : [];

        return [...rangeInfo, ...exampleInfo].length > 0 ? (
            <div style={{
                marginTop: '1rem',
                marginBottom: '1rem',
                color: 'var(--color-text-secondary)',
                fontSize: '0.875rem'
            }}>
                {rangeInfo.map((info, i) => (
                    <div key={`range-${i}`}>{info}</div>
                ))}
                {exampleInfo.length > 0 && (
                    <>
                        <div>{exampleInfo[0]}</div>
                        <div>{exampleInfo[1]}</div>
                    </>
                )}
            </div>
        ) : null;
    };

    const metaInfo = variant ? getMetaInfo(variant.meta) : getMetaInfo(definition.meta);
    const description = variant ? variant.description : definition.description;
    const metaDescription = definitionMetaDescription(variant ? variant : definition);

    return <div className={cn.DefinitionBody}>
        {
            description && <div>
                {description}
            </div>
        }
        {
            metaDescription && <div>
                {metaDescription}
            </div>
        }

        {metaInfo}

        {apiRefProperties}
    </div>
}

interface NavbarProps {
    label: string
    subtitle: string
    matchSubtitle?: string
}

function $Navbar({ label, subtitle, matchSubtitle }: NavbarProps) {
    const renderSubtitle = () => {
        if (!matchSubtitle) {
            return subtitle;
        }

        const index = subtitle.indexOf(matchSubtitle);
        if (index === -1) {
            return subtitle;
        }

        const before = subtitle.substring(0, index);
        const match = subtitle.substring(index, index + matchSubtitle.length);
        const after = subtitle.substring(index + matchSubtitle.length);

        return (
            <span>
                {before}
                <Text size="inherit" as="span" weight="bold">
                    {match}
                </Text>
                {after}
            </span>
        );
    };

    return <>
        <div className={cn.ApiRefItemNavbarHost}>
            <div className={cn.ApiRefItemNavbarContainer}>
                <div className={cn.ApiRefItemNavbarLabel}>
                    {/* TODO: in the future not only for REST */}
                    <div data-active="true" data-atlas-oas-method={label.toUpperCase()}>
                        <Badge size="xs">
                            {label.toUpperCase()}
                        </Badge>
                    </div>
                </div>
                <div
                    className={cn.ApiRefItemNavbarSubtitle}
                >
                    {renderSubtitle()}
                </div>
            </div>
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

function definitionMetaDescription(definition: Definition | DefinitionVariant): string {
    if (definition.meta?.length) {
        const descriptionMeta = definition.meta.find(meta => meta.name === 'definitionDescription');
        if (descriptionMeta) {
            return descriptionMeta.value as string || "";
        }
    }

    return "";
}