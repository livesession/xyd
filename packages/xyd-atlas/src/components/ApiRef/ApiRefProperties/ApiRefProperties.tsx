import React, { useState } from "react";
import { DefinitionProperty, DefinitionPropertyMeta } from "@xyd-js/uniform";

import { type MDXReference, uniformValue, uniformChild } from "@/utils/mdx"
import * as cn from "./ApiRefProperties.styles";

export interface ApiRefPropertiesProps {
    properties: MDXReference<DefinitionProperty[]>
}

export function ApiRefProperties({ properties }: ApiRefPropertiesProps) {
    return <ul className={cn.ApiRefPropertiesUlHost}>
        {
            properties?.map((property, i) => {
                const propName = uniformValue(property.name)
                const propValue = uniformValue(property.type)

                return  <li className={cn.ApiRefPropertiesLiHost} key={i}>
                {
                    propName || propValue ?
                        <dl className={cn.ApiRefPropertiesDlHost}>
                            <PropName value={propName} />
                            <PropType
                                value={propValue}
                                meta={property.meta || []}
                            />
                            <PropMetaList
                                metas={property.meta || []}
                            />
                        </dl> : null
                }
                <div className={cn.ApiRefPropertiesDescriptionHost}>
                    {uniformChild(property.description) || uniformChild(property)}
                </div>
                {
                    property.properties ?
                        <SubProperties
                            properties={property.properties as MDXReference<DefinitionProperty>[]}
                        /> : null
                }
            </li>
            })
        }
    </ul>
}

function PropName({ value }: { value: string }) {
    if (!value) {
        return null
    }
    return <atlas-apiref-propname>
        <dd>
            <code className={cn.ApiRefPropertiesPropNameCodeHost}>{value}</code>
        </dd>
    </atlas-apiref-propname>
}

interface PropTypeProps {
    value: string

    href?: string

    meta?: PropMetaProps[]
}
function PropType({ value, href, meta }: PropTypeProps) {
    if (!value) {
        return null
    }

    let valueText = value

    const multipleTypes = [value]
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
                        ? <a className={cn.ApiRefPropertiesPropTypeCodeLink} href={href}>{valueText}</a>
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
        case "enum":
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

function SubProperties({ properties }: { properties: MDXReference<DefinitionProperty>[] }) {
    const [expanded, setExpanded] = useState(false)

    return <>
        {properties?.length ? <PropToggle
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
                            const propName = uniformValue(prop.name)
                            const propValue = uniformValue(prop.type)

                            return <li className={cn.ApiRefPropertiesSubPropsLi} key={i}>
                                {
                                    propName || propValue ?
                                        <dl className={cn.ApiRefPropertiesDlHost}>
                                            <PropName value={propName} />
                                            <PropType
                                                value={propValue}
                                                meta={prop.meta || []}
                                            />
                                            <PropMetaList
                                                metas={prop.meta || []}
                                            />
                                        </dl> : null
                                }
                                <div className={cn.ApiRefPropertiesDescriptionHost}>
                                    {uniformChild(prop.description) || uniformChild(prop)}
                                </div>
                                {
                                    prop.properties ?
                                        <SubProperties
                                            properties={prop.properties as MDXReference<DefinitionProperty>[]} /> : null
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
    onClick: () => void
}

function PropToggle(props: PropsToggleProps) {
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
            <span className={cn.ApiRefPropertiesPropToggleLink}>{props.isExpanded ? 'Hide properties' : 'Show properties'}</span>
        </button>
    )
}

