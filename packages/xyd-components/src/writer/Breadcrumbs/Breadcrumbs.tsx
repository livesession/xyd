import React, {Fragment} from 'react'
import type {ReactElement} from 'react'
import {ArrowRightIcon} from '@radix-ui/react-icons'

import {$breadcrumbs} from './Breadcrumbs.styles'

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
        <div className={$breadcrumbs.host}>
            {props.items.map((item, index) => {
                const lastActive = index === props.items.length - 1

                return (
                    <Fragment key={item.href + item.title}>
                        {index > 0 && <ArrowRightIcon className={$breadcrumbs.icon}/>}
                        <div className={`
                            ${$breadcrumbs.item}
                            ${lastActive && $breadcrumbs.item$$active}
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
