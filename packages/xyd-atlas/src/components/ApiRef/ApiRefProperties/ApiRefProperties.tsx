import React, {useState} from "react";
import {DEFINED_DEFINITION_PROPERTY_TYPE, DefinitionProperty, DefinitionPropertyMeta} from "@xyd-js/uniform";

import * as cn from "./ApiRefProperties.styles";
import {useBaseMatch} from "@/components/Atlas/AtlasContext";

export interface ApiRefPropertiesProps {
    properties: DefinitionProperty[]
}

export function ApiRefProperties({properties}: ApiRefPropertiesProps) {
    return <ul className={cn.ApiRefPropertiesUlHost}>
        {
            properties?.map((property, i) => {
                const propName = property.name
                const propValue = property.type
                const propertyProperties = propProperties(property)

                return <li className={cn.ApiRefPropertiesLiHost} key={i}>
                    {
                        propName || propValue ?
                            <dl className={cn.ApiRefPropertiesDlHost}>
                                <PropName property={property} meta={property.meta || []}/>
                                <PropType
                                    property={property}
                                />
                                <PropMetaList
                                    metas={property.meta || []}
                                />
                            </dl> : null
                    }

                    <div className={cn.ApiRefPropertiesDescriptionHost}>
                        <>
                            {property.description}
                        </>
                    </div>

                    {
                        propertyProperties?.length > 0 ?
                            <SubProperties
                                parent={property}
                                properties={propertyProperties}
                            /> : null
                    }
                </li>
            })
        }
    </ul>
}


interface PropNameProps {
    property: DefinitionProperty
    meta: DefinitionPropertyMeta[]
    parentChoiceType?: boolean
}

function PropName(props: PropNameProps) {
    const value = props.property.name

    if (!value) {
        return null
    }

    return <atlas-apiref-propname>
        <dd>
            <code
                data-parent-choice-type={props.parentChoiceType ? "true" : undefined}
                className={cn.ApiRefPropertiesPropNameCodeHost}
            >{value}</code>
        </dd>
    </atlas-apiref-propname>
}

interface PropTypeProps {
    property: DefinitionProperty
}

function PropType({property}: PropTypeProps) {
    const href = useSymbolLink(property)

    const symbol = resolvePropertySymbol(property).join(" ")

    let propSymbol: string | React.ReactNode = symbol

    if (!propSymbol) {
        return null
    }

    if (href) {
        propSymbol = <a className={cn.ApiRefPropertiesPropTypeCodeLink} href={href}>{propSymbol}</a>
    }

    return <atlas-apiref-proptype>
        <dd>
            <code className={cn.ApiRefPropertiesPropTypeCodeHost}>
                {propSymbol}
            </code>
        </dd>
    </atlas-apiref-proptype>
}

export interface PropMetaProps extends DefinitionPropertyMeta {
    href?: string
}

function PropMeta(props: PropMetaProps) {
    let valueText = props.value

    switch (props.name) {
        case "required":
            valueText = "Required"
            break
        case "deprecated":
            valueText = "Deprecated"
            break
        case "defaults":
            valueText = `Defaults: ${props.value}`
            break
        case "nullable":
            return null
        case "enum-type":
            return null
        case "hasArguments":
            return null
    }

    return <atlas-apiref-propmeta data-name={props.name} data-value={props.value}>
        <dd>
            <code>
                {
                    props.href
                        ? <a href={props.href}>{valueText}</a>
                        : valueText
                }
            </code>
        </dd>
    </atlas-apiref-propmeta>
}

export interface PropMetaListProps {
    metas: PropMetaProps[]
}

function PropMetaList({metas}: PropMetaListProps) {
    const order = {deprecated: 0, required: 1, defaults: 2};

    const sortedMetas = [...metas].sort((a, b) => {
        return (order[a.name as keyof typeof order] ?? 3) - (order[b.name as keyof typeof order] ?? 3);
    });

    return <>
        {
            sortedMetas.map((meta, i) => (
                <PropMeta
                    key={i}
                    {...meta}
                />
            ))
        }
    </>
}

interface SubPropertiesProps {
    parent: DefinitionProperty

    properties: DefinitionProperty[]
}

function SubProperties({parent, properties}: SubPropertiesProps) {
    const [expanded, setExpanded] = useState(false)

    // Get the actual properties to display
    let foundProperties = properties || []

    const choiceType = isChoiceType(parent)
    const noChildProps = foundProperties.every(prop => !(prop.properties?.length ?? 0))
    if (choiceType && noChildProps) {
        return null
    }

    const hasArguments = parent.meta?.some(m => m.name === 'hasArguments' && m.value === 'true')

    return <>
        {foundProperties?.length ? <PropToggle
            choiceType={choiceType}
            isArgument={hasArguments}
            onClick={() => setExpanded(!expanded)}
            isExpanded={expanded}
        /> : null}

        <div
            className={`${cn.ApiRefPropertiesSubPropsHost} ${expanded && cn.ApiRefPropertiesSubPropsHostExpanded}`}
        >
            <div className={cn.ApiRefPropertiesSubPropsBox}>
                <ul role="list" className={cn.ApiRefPropertiesSubPropsUl}>
                    {
                        foundProperties?.map((prop, i) => {
                            const propName = prop.name
                            const propValue = prop.type
                            const properties = propProperties(prop)

                            return <li className={cn.ApiRefPropertiesSubPropsLi} key={i}>
                                {
                                    propName || propValue ?
                                        <dl className={cn.ApiRefPropertiesDlHost}>
                                            <PropName
                                                property={prop}
                                                meta={prop.meta || []}
                                                parentChoiceType={choiceType || !!hasArguments}
                                            />
                                            <PropType
                                                property={prop}
                                            />
                                            <PropMetaList
                                                metas={prop.meta || []}
                                            />
                                        </dl> : null
                                }
                                <div className={cn.ApiRefPropertiesDescriptionHost}>
                                    <>
                                        {prop.description}
                                    </>
                                </div>
                                {
                                    properties?.length ?
                                        <SubProperties
                                            parent={prop}
                                            properties={properties}
                                        /> : null
                                }
                            </li>
                        })
                    }
                </ul>
            </div>
        </div>
    </>
}


interface PropsToggleProps {
    isExpanded: boolean
    choiceType: boolean
    isArgument?: boolean
    onClick: () => void
}

function PropToggle(
    props: PropsToggleProps
) {
    let text = props.isExpanded ? 'Hide properties' : 'Show properties'

    if (props.choiceType) {
        text = props.isExpanded ? 'Hide possible types' : 'Show possible types'
    } else if (props.isArgument) {
        text = props.isExpanded ? 'Hide possible arguments' : 'Show possible arguments'
    }

    return (
        <button
            aria-expanded={props.isExpanded}
            aria-controls="chat/object-usage_table"
            onClick={props.onClick}
            className={cn.ApiRefPropertiesPropToggleHost}
        >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="1em"
                height="1em"
                fill="currentColor"
                viewBox="0 0 24 24"
            >
                <path
                    fillRule="evenodd"
                    d={
                        props.isExpanded
                            ? "M12 8a1 1 0 0 1 .707.293l7 7a1 1 0 0 1-1.414 1.414L12 10.414l-6.293 6.293a1 1 0 0 1-1.414-1.414l7-7A1 1 0 0 1 12 8Z"
                            : "M4.293 8.293a1 1 0 0 1 1.414 0L12 14.586l6.293-6.293a1 1 0 1 1 1.414 1.414l-7 7a1 1 0 0 1-1.414 0l-7-7a1 1 0 0 1 0-1.414Z"
                    }
                    clipRule="evenodd"
                />
            </svg>
            <span className={cn.ApiRefPropertiesPropToggleLink}>
                {text}
            </span>
        </button>
    )
}

function isChoiceType(property: DefinitionProperty) {
    if (property.ofProperty) {
        return isChoiceType(property.ofProperty)
    }

    return [
        DEFINED_DEFINITION_PROPERTY_TYPE.UNION,
        DEFINED_DEFINITION_PROPERTY_TYPE.XOR,
        DEFINED_DEFINITION_PROPERTY_TYPE.ENUM,
    ].includes(property.type as DEFINED_DEFINITION_PROPERTY_TYPE)
}

function useSymbolLink(property: DefinitionProperty) {
    const baseMatch = useBaseMatch()

    if (!property?.symbolDef?.canonical?.length) {
        return ""
    }

    let symbolLink = property.symbolDef.canonical

    if (!Array.isArray(symbolLink)) { // TODO: support array of canonicals
        if (!symbolLink.startsWith("/")) {
            symbolLink = "/" + symbolLink
        }

        return `${baseMatch}${symbolLink}`;
    } else {
        console.warn("Multiple canonical links found for property", property.name, property.symbolDef.canonical)
    }

    return ""
}

function propProperties(prop: DefinitionProperty): DefinitionProperty[] {
    if (prop.properties?.length) {
        return prop.properties
    }

    if (prop.ofProperty) {
        return propProperties(prop.ofProperty)
    }

    return []
}

function childPropsHasNoProps(property: DefinitionProperty) {
    return property?.properties?.every(prop => !(!!prop.properties?.length))
}

function resolvePropertySymbol(property: DefinitionProperty): string[] {
    if (property?.ofProperty) {
        switch (property.ofProperty.type) {
            case DEFINED_DEFINITION_PROPERTY_TYPE.ARRAY: {
                let ofOfSymbols: string[] = []

                if (property.type) {
                    ofOfSymbols.push(property.type)
                }

                if (property.ofProperty.ofProperty) {
                    const symbols = groupSymbol(property.ofProperty.ofProperty)

                    ofOfSymbols.push(...symbols)
                }

                const atomicDefinedSymbol = atomicDefinedPropertySymbol(property.ofProperty)
                const ofPrefix = [
                    atomicDefinedSymbol,
                    "of"
                ]

                return [
                    ...ofPrefix,
                    ...ofOfSymbols
                ]
            }
            case DEFINED_DEFINITION_PROPERTY_TYPE.UNION:
            case DEFINED_DEFINITION_PROPERTY_TYPE.ENUM:
            case DEFINED_DEFINITION_PROPERTY_TYPE.XOR: {
                if (property.ofProperty.properties?.length) {
                    const atomicDefinedSymbol = atomicDefinedPropertySymbol(property)

                    if (atomicDefinedSymbol) {
                        const unionSymbol = groupSymbol({
                            name: "",
                            description: "",
                            type: DEFINED_DEFINITION_PROPERTY_TYPE.UNION,
                            properties: property.ofProperty.properties || [],
                        })

                        return [
                            atomicDefinedSymbol,
                            "of",
                            ...unionSymbol
                        ]
                    }

                    return [
                        property.type,
                        ...groupSymbol(property.ofProperty)
                    ]
                }

                if (property.ofProperty?.ofProperty) {
                    return [property.ofProperty?.ofProperty?.type]
                }

                return []
            }
            default: {
                if (!property.ofProperty.name) {
                    const defined = atomicDefinedPropertySymbol(property)
                    const symbol = atomicPropertySymbol(property)

                    if (symbol.startsWith("$$")) {
                        return [property.ofProperty.type]
                    }

                    const chains = [
                        symbol
                    ]

                    if (defined) {
                        chains.push("of")
                    }

                    chains.push(
                        ...groupSymbol(property.ofProperty)
                    )

                    return chains
                }

                return [
                    property.ofProperty.type
                ]
            }
        }
    }

    switch (property.type) {
        case DEFINED_DEFINITION_PROPERTY_TYPE.UNION: {
            if (property.properties?.length) {
                const resp: string[] = []
                for (const prop of property.properties) {
                    let symbols = resolvePropertySymbol(prop)

                    if (prop.ofProperty && symbols.length > 1) {
                        symbols = [[
                            symbols[0],
                            ...symbols.slice(1, symbols.length),
                        ].join("")]
                    }

                    resp.push(...symbols)
                }

                return [resp.join(" or ")]
            }
        }
    }

    return [property.type]
}
function atomicDefinedPropertySymbol(property: DefinitionProperty): string {
    switch (property.type) {
        case DEFINED_DEFINITION_PROPERTY_TYPE.ARRAY: {
            return "array"
        }
        case DEFINED_DEFINITION_PROPERTY_TYPE.UNION:
        case DEFINED_DEFINITION_PROPERTY_TYPE.ENUM:
        case DEFINED_DEFINITION_PROPERTY_TYPE.XOR: {
            return ""
        }

        default: {
            return ""
        }
    }
}
function groupSymbol(property: DefinitionProperty) {
    const symbols = resolvePropertySymbol(property)
    symbols[0] = "(" + symbols[0]
    symbols[symbols.length - 1] = symbols[symbols.length - 1] + ")"

    return symbols
}
function atomicPropertySymbol(property: DefinitionProperty): string {
    const defined = atomicDefinedPropertySymbol(property)

    if (!defined) {
        return property.type
    }

    return defined
}