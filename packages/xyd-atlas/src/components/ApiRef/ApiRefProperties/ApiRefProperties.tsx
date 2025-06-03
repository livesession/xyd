import React, { useState } from "react";
import { DefinitionProperty, DefinitionPropertyMeta } from "@xyd-js/uniform";

import * as cn from "./ApiRefProperties.styles";
import { useBaseMatch } from "@/components/Atlas/AtlasContext";

export interface ApiRefPropertiesProps {
    properties: DefinitionProperty[]
}

export function ApiRefProperties({ properties }: ApiRefPropertiesProps) {
    return <ul className={cn.ApiRefPropertiesUlHost}>
        {
            properties?.map((property, i) => {
                const propName = property.name
                const propValue = property.type

                return <li className={cn.ApiRefPropertiesLiHost} key={i}>
                    {
                        propName || propValue ?
                            <dl className={cn.ApiRefPropertiesDlHost}>
                                <PropName value={propName} meta={property.meta || []} />
                                <PropType
                                    property={property}
                                    meta={property.meta || []}
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
                        property.properties ?
                            <SubProperties
                                parent={property}
                                properties={property.properties}
                            /> : null
                    }
                </li>
            })
        }
    </ul>
}


interface PropNameProps {
    value: string
    meta: DefinitionPropertyMeta[]
    parentChoiceType?: boolean
}

function PropName(props: PropNameProps) {
    if (!props.value) {
        return null
    }

    return <atlas-apiref-propname>
        <dd>
            <code
                data-parent-choice-type={props.parentChoiceType ? "true" : undefined}
                className={cn.ApiRefPropertiesPropNameCodeHost}
            >{props.value}</code>
        </dd>
    </atlas-apiref-propname>
}

interface PropTypeProps {
    property: DefinitionProperty

    meta?: PropMetaProps[]
}

function propTypesMap(property: DefinitionProperty, multipleTypesMap: { [key: string]: number } = {}) {
    const propType = property.type

    if (propType === "$$enum") {
        const types = property?.properties?.reduce((acc, prop) => {
            return {
                ...acc,
                [prop.type]: 1
            }
        }, {})
        Object.keys(types).forEach(t => {
            multipleTypesMap[t] = 1
        })
    } else if (propType === "$$xor" || propType === "$$union") {
        const types = property?.properties?.reduce((acc, prop) => {
            return {
                ...acc,
                [prop.type]: 1
            }
        }, {})
        Object.keys(types).forEach(t => {
            switch (t) {
                case "$$array": {
                    multipleTypesMap["array"] = 1

                    break;
                }

                case "$$enum": {
                    if (property.properties) {
                        property.properties.forEach(p => {
                            propTypesMap(p, multipleTypesMap)
                        })
                    }

                    break
                }

                default: {
                    multipleTypesMap[t] = 1

                    break;
                }
            }
        })
    } else if (propType === "$$array") {
        multipleTypesMap["array"] = 1
    } else {
        multipleTypesMap[propType] = 1
    }

    return multipleTypesMap
}


function PropType({ property, meta }: PropTypeProps) {
    const baseMatch = useBaseMatch()

    if (!property || !property.type) {
        return null
    }

    const propType = property.type

    let href = ""
    let valueText = propType

    if (property?.symbolDef?.canonical) {
        let symbolLink = property.symbolDef.canonical
        if (!Array.isArray(symbolLink)) { // TODO: support array of canonicals
            if (!symbolLink.startsWith("/")) {
                symbolLink = "/" + symbolLink
            }
            href = `${baseMatch}${symbolLink}`;
        }
    }

    const multipleTypes = Object.keys(propTypesMap(property))

    for (const m of meta || []) { // TODO: find better way to do this
        if (m.name === "nullable") {
            multipleTypes.push("null")
        }
    }
    valueText = multipleTypes.join(" or ")

    return <atlas-apiref-proptype>
        <dd>
            <code className={cn.ApiRefPropertiesPropTypeCodeHost}>
                {
                    href
                        ? <>
                            (<a className={cn.ApiRefPropertiesPropTypeCodeLink} href={href}>{valueText}</a>)
                        </>
                        : valueText
                }
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

    const choiceType = isChoiceType(parent)
    const hasArguments = parent.meta?.some(m => m.name === 'hasArguments' && m.value === 'true')

    return <>
        {properties?.length ? <PropToggle
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
                        properties?.map((prop, i) => {
                            const propName = (prop.name)
                            const propValue = (prop.type)

                            return <li className={cn.ApiRefPropertiesSubPropsLi} key={i}>
                                {
                                    propName || propValue ?
                                        <dl className={cn.ApiRefPropertiesDlHost}>
                                            <PropName
                                                parentChoiceType={choiceType || !!hasArguments}
                                                meta={prop.meta || []} value={propName}
                                            />
                                            <PropType
                                                property={prop}
                                                meta={prop.meta || []}
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
                                    prop.properties ?
                                        <SubProperties
                                            parent={prop}
                                            properties={prop.properties} /> : null
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
    return ["$$enum", "$$xor", "$$union", "$$array"].includes(property.type)
}
