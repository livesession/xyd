import React, {useState} from "react";
import {DefinitionProperty} from "@xyd-js/uniform";

import {MDXReference, mdxValue} from "@/utils/mdx"
import * as cn from "./ApiRefProperties.styles";

export interface ApiRefPropertiesProps {
    properties: MDXReference<DefinitionProperty[]>
}

export function ApiRefProperties({properties}: ApiRefPropertiesProps) {
    return <ul className={cn.ApiRefPropertiesUlHost}>
        {
            properties?.map((property, i) => (
                <li className={cn.ApiRefPropertiesLiHost} key={i}>
                    <dl className={cn.ApiRefPropertiesDlHost}>
                        <PropName name="name" value={mdxValue(property.name)}/>
                        <PropType
                            name="type"
                            value={mdxValue(property.type)}
                            href={propertyTypeHref(property)}
                        />
                    </dl>
                    <div className={cn.ApiRefPropertiesDescriptionHost}>
                        {property.children}
                    </div>
                    {
                        property.properties ?
                            <SubProperties
                                properties={property.properties as MDXReference<DefinitionProperty>[]}
                            /> : null
                    }
                </li>
            ))
        }
    </ul>
}

function PropName({name, value}: { name: string, value: string }) {
    return <>
        <dd>
            <code className={cn.ApiRefPropertiesPropNameCodeHost}>{value}</code>
        </dd>
    </>
}

function PropType({name, value, href}: { name: string, value: string, href?: string }) {
    return <>
        <dd>
            <code className={cn.ApiRefPropertiesPropTypeCodeHost}>
                {
                    href
                        ? <a className={cn.ApiRefPropertiesPropTypeCodeLink} href={href}>{value}</a>
                        : value
                }
            </code>
        </dd>
    </>
}

function SubProperties({properties}: { properties: MDXReference<DefinitionProperty>[] }) {
    const [expanded, setExpanded] = useState(false)

    return <>
        <PropToggle
            onClick={() => setExpanded(!expanded)}
            isExpanded={expanded}
        />

        <div
            className={`${cn.ApiRefPropertiesSubPropsHost} ${expanded && cn.ApiRefPropertiesSubPropsHostExpanded}`}
        >
            <div className={cn.ApiRefPropertiesSubPropsBox}>
                <ul role="list" className={cn.ApiRefPropertiesSubPropsUl}>
                    {
                        properties?.map((prop, i) => {
                            return <li className={cn.ApiRefPropertiesSubPropsLi} key={i}>
                                <dl className={cn.ApiRefPropertiesDlHost}>
                                    <PropName name="name" value={mdxValue(prop.name)}/>
                                    <PropType
                                        name="type"
                                        value={mdxValue(prop.type)}
                                        href={propertyTypeHref(prop)}
                                    />
                                </dl>
                                <div className={cn.ApiRefPropertiesDescriptionHost}>
                                    {prop.children}
                                </div>
                                {
                                    prop.properties ?
                                        <SubProperties
                                            properties={prop.properties as MDXReference<DefinitionProperty>[]}/> : null
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

function propertyTypeHref(property: MDXReference<DefinitionProperty>) {
    if (property?.context?.graphqlBuiltInType?.title === "true") { // graphqlBuiltInType should be a boolean
        return undefined
    }

    // TODO: FINISH SLUG
    return property.context?.graphqlTypeShort?.title
        ? `/docs/api/graphql/${property.context?.graphqlTypeShort?.title}-${mdxValue(property.context?.graphqlTypeFlat?.title)}`
        : undefined
}