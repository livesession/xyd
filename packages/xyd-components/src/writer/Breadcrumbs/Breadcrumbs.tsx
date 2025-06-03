import React, {Fragment} from 'react'
import type {ReactElement} from 'react'
import {ArrowRightIcon} from '@radix-ui/react-icons'

import * as cn from './Breadcrumbs.styles'

function Anchor({children, ...rest}) {
    return <a {...rest}>
        {children}
    </a>
}

export interface BreadcrumbsProps {
    className?: string;
    items: {
        title: string
        href?: string
    }[]
}

export function Breadcrumbs({className, items}: BreadcrumbsProps): ReactElement {
    return (
        <xyd-breadcrumbs
            className={`${cn.BreadcrumbsHost} ${className || ''}`}
        >
            {items.map((item, index) => {
                const lastActive = index === items.length - 1

                return (
                    <Fragment key={item.href + item.title}>
                        {index > 0 && <ArrowRightIcon part="icon"/>}
                        <div 
                            part="item"
                            data-active={lastActive ? "true" : "false"}
                        >
                            {item.href && !lastActive ? (
                                <Anchor href={item.href}>{item.title}</Anchor>
                            ) : (
                                item.title
                            )}
                        </div>
                    </Fragment>
                )
            })}
        </xyd-breadcrumbs>
    )
}
