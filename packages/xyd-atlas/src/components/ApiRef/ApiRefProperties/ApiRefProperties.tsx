import React, { useContext, useState } from "react";
import { DEFINED_DEFINITION_PROPERTY_TYPE, DefinitionProperty, DefinitionPropertyMeta } from "@xyd-js/uniform";

import * as cn from "./ApiRefProperties.styles";
import { AtlasContext, useBaseMatch } from "@/components/Atlas/AtlasContext";
import { Badge } from "@xyd-js/components/writer";

export interface ApiRefPropertiesProps {
    properties: DefinitionProperty[]
}

// TODO: in the future configurable
const HIDE_INTERNAL = true

export function ApiRefProperties({ properties }: ApiRefPropertiesProps) {
    return <ul className={cn.ApiRefPropertiesUlHost}>
        {
            filterProperties(properties)?.map((property, i) => {
                const propName = property.name
                const propValue = property.type
                const propertyProperties = propProperties(property)
                const description = property.ofProperty?.description || property.description || ""
                const metaInfo = renderMetaInfo(property.meta)

                return <li className={cn.ApiRefPropertiesLiHost} key={i}>
                    {
                        propName || propValue ?
                            <dl className={cn.ApiRefPropertiesDlHost}>
                                <PropName property={property} meta={property.meta || []} />
                                <PropType
                                    property={property}
                                />
                                <PropMetaList
                                    metas={property.meta || []}
                                />
                            </dl> : null
                    }

                    {
                        description || metaInfo ? <div className={cn.ApiRefPropertiesDescriptionHost}>
                            <>
                                <div>
                                    {description}
                                </div>
                                <div>
                                    {renderMetaInfo(property.meta)}
                                </div>
                            </>
                        </div> : null
                    }

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

function PropType({ property }: PropTypeProps) {
    const { Link = "a" } = useContext(AtlasContext)
    const href = useSymbolLink(property)

    const symbol = resolvePropertySymbol(property)

    let propSymbol: string | React.ReactNode = symbol

    if (!propSymbol) {
        return null
    }

    if (href) {
        propSymbol = <Link className={cn.ApiRefPropertiesPropTypeCodeLink} href={href}>{propSymbol}</Link>
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
        case "minimum":
            return null
        case "maximum":
            return null
        case "example":
            return null
        case "examples":
            return null
        case "internal":
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

function PropMetaList({ metas }: PropMetaListProps) {
    const order = { deprecated: 0, required: 1, defaults: 2 };

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

function SubProperties({ parent, properties }: SubPropertiesProps) {
    const [expanded, setExpanded] = useState(false)

    // Get the actual properties to display
    const foundProperties = filterProperties(properties || [])

    const choiceType = isChoiceType(parent)
    const noChildProps = function () {
        if (
            (   
                parent?.type === DEFINED_DEFINITION_PROPERTY_TYPE.ARRAY && 
                parent?.ofProperty?.type === DEFINED_DEFINITION_PROPERTY_TYPE.ENUM
            ) ||
            parent?.type === DEFINED_DEFINITION_PROPERTY_TYPE.ENUM
        ) {
            return false
        }

        return foundProperties.every(prop => {
            if (prop.ofProperty) {
                return false
            }

            return !(prop.properties?.length ?? 0)
        })
    }()

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
                            const description = prop.ofProperty?.description || prop.description || ""
                            const metaInfo = renderMetaInfo(prop.meta)

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

                                {
                                    description || metaInfo
                                        ? <div className={cn.ApiRefPropertiesDescriptionHost}>
                                            <>
                                                <div>
                                                    {description}
                                                </div>
                                                <div>
                                                    {renderMetaInfo(prop.meta)}
                                                </div>
                                            </>
                                        </div>
                                        : null
                                }
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
    if (
        property.type === DEFINED_DEFINITION_PROPERTY_TYPE.ARRAY && 
        property.ofProperty?.type === DEFINED_DEFINITION_PROPERTY_TYPE.ENUM
    ) {
        return true
    }

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

function filterProperties(properties: DefinitionProperty[]): DefinitionProperty[] {
    return properties.filter(property => {
        if (property?.meta?.some(m => m.name === "internal" && m.value === "true")) {
            if (HIDE_INTERNAL) {
                return false
            }
        }

        return true
    })
}

function resolvePropertySymbol(property: DefinitionProperty): string {
    function resolvePropertySymbolInner(property: DefinitionProperty) {
        if (property?.ofProperty) {
            switch (property.ofProperty.type) {
                case DEFINED_DEFINITION_PROPERTY_TYPE.ARRAY: {
                    let ofOfSymbols: string[] = []

                    if (property.type) {
                        ofOfSymbols.push(property.type)
                    }

                    if (property.ofProperty.ofProperty) {
                        const symbol = groupSymbol(property.ofProperty.ofProperty)

                        if (symbol) {
                            ofOfSymbols.push(symbol)
                        }
                    }

                    const atomicDefinedSymbol = atomicDefinedPropertySymbol(property.ofProperty)
                    const ofPrefix = [
                        atomicDefinedSymbol,
                        "of"
                    ]

                    return [
                        [
                            ...ofPrefix,
                            ...ofOfSymbols
                        ].join(" ")
                    ]
                }
                case DEFINED_DEFINITION_PROPERTY_TYPE.UNION:
                case DEFINED_DEFINITION_PROPERTY_TYPE.ENUM:
                case DEFINED_DEFINITION_PROPERTY_TYPE.XOR: {
                    if (property.ofProperty.properties?.length) {
                        const atomicDefinedSymbol = atomicDefinedPropertySymbol(property)

                        if (atomicDefinedSymbol) {
                            let unionSymbol = ""
                            if (
                                property.ofProperty.type === DEFINED_DEFINITION_PROPERTY_TYPE.ENUM &&
                                property.ofProperty.ofProperty?.type
                            ) {
                                unionSymbol = groupSymbol({
                                    name: "",
                                    description: "",
                                    type: property.ofProperty.ofProperty?.type,
                                    properties: property.ofProperty.properties || [],
                                })
                            }

                            if (!unionSymbol) {
                                unionSymbol = groupSymbol({
                                    name: "",
                                    description: "",
                                    type: DEFINED_DEFINITION_PROPERTY_TYPE.UNION,
                                    properties: property.ofProperty.properties || [],
                                })

                            if (unionSymbol?.length && unionSymbol.includes("$$")) {
                                return [atomicDefinedSymbol]
                            }

                            return [
                                [
                                    atomicDefinedSymbol,
                                    "of",
                                    unionSymbol
                                ].join(" ")
                            ]
                        }

                        return [
                            property.type,
                            groupSymbol(property.ofProperty)
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
                            groupSymbol(property.ofProperty)
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
            case DEFINED_DEFINITION_PROPERTY_TYPE.UNION, DEFINED_DEFINITION_PROPERTY_TYPE.XOR: {
                if (property.properties?.length) {
                    const respMap = {}
                    let resp: string[] = []
                    for (const prop of property.properties) {
                        let symbols = resolvePropertySymbolInner(prop)

                        if (prop.ofProperty && symbols.length > 1) {
                            symbols = [[
                                symbols[0],
                                ...symbols.slice(1, symbols.length),
                            ].join("")]
                        }

                        resp.push(...symbols)
                    }

                    let hasOr = false // TODO: in the future better
                    for (const symbol of resp) {
                        if (symbol.trim() === "or") {
                            hasOr = true
                            break
                        }
                        respMap[symbol] = true
                    }

                    if (!hasOr) {
                        resp = Object.keys(respMap)
                    }

                    return [resp.join(" or ")]
                }

                break
            }

            case DEFINED_DEFINITION_PROPERTY_TYPE.ARRAY: {
                return ["array"]
            }

            case DEFINED_DEFINITION_PROPERTY_TYPE.ENUM: {
                return ["enum"]
            }
        }

        if (property.type?.startsWith("$$")) {
            return []
        }

        return [property.type]
    }

    const symbolsParts = resolvePropertySymbolInner(property)
    if (nullableProperty(property)) {
        if (symbolsParts.length) {
            symbolsParts.push("or", "null")
        } else {
            symbolsParts.push("null")
        }
    }

    return symbolsParts.join(" ")
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
    const symbol = resolvePropertySymbol(property)
    if (symbol?.startsWith("$$")) {
        return ""
    }

    return symbol
}

function atomicPropertySymbol(property: DefinitionProperty): string {
    const defined = atomicDefinedPropertySymbol(property)

    if (!defined) {
        return property.type
    }

    return defined
}

function nullableProperty(property: DefinitionProperty): boolean {
    return property.meta?.some(m => m.name === "nullable" && m.value === "true") || false
}

function renderMetaInfo(meta: DefinitionPropertyMeta[] | undefined) {
    if (!meta?.length) return null;

    const minimum = meta.find(m => m.name === 'minimum')?.value;
    const maximum = meta.find(m => m.name === 'maximum')?.value;
    const example = meta.find(m => m.name === 'example')?.value;
    const examples = meta.find(m => m.name === 'examples')?.value;

    const rangeInfo: React.ReactNode[] = [];
    if (minimum !== undefined && maximum !== undefined) {
        rangeInfo.push(
            <div>
                Required range: <Badge>
                    {`${minimum} <= x <= ${maximum}`}
                </Badge>
            </div>
        );
    } else if (minimum !== undefined) {
        rangeInfo.push(
            <div>
                Required range: <Badge>
                    {`x >= ${minimum}`}
                </Badge>
            </div>
        );
    } else if (maximum !== undefined) {
        rangeInfo.push(
            <div>
                Required range: <Badge>
                    {`x <= ${maximum}`}
                </Badge>
            </div>
        );
    }

    const exampleInfo = example || examples ? <div part="examples">
        <span>Examples:</span>
        {
            example ? <Badge pre>{`${example}`}</Badge> : null
        }
        {
            Array.isArray(examples) && <div part="examples-list">
                {examples.map((example, i) => (
                    <Badge key={`example-${i}`} pre>{`${example}`}</Badge>
                ))}
            </div>
        }
    </div> : null

    if (!rangeInfo?.length && !exampleInfo) {
        return null
    }
    
    return <atlas-apiref-meta-info className={cn.ApiRefPropertiesMetaInfoHost}>
        {rangeInfo?.map((info, i) => (
            <div key={`range-${i}`}>{info}</div>
        ))}
        {exampleInfo}
    </atlas-apiref-meta-info>
}