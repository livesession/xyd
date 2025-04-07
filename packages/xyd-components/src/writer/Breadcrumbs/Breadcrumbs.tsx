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
    items: {
        title: string
        href?: string
    }[]
}

export function Breadcrumbs(props: BreadcrumbsProps): ReactElement {
    return (
        <div className={cn.BreadcrumbsHost}>
            {props.items.map((item, index) => {
                const lastActive = index === props.items.length - 1

                return (
                    <Fragment key={item.href + item.title}>
                        {index > 0 && <ArrowRightIcon className={cn.BreadcrumbsIcon}/>}
                        <div className={`
                            ${cn.BreadcrumbsItem}
                            ${lastActive && cn.BreadcrumbsItemActive}
                        `}
                             title={item.title}
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
        </div>
    )
}
