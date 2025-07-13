import React, { Fragment } from 'react'
import type { ReactElement } from 'react'

import * as cn from './Breadcrumbs.styles'

export interface BreadcrumbsProps {
    className?: string;
    items: {
        title: string
        href?: string
    }[]

    as?: React.ElementType
}

export function Breadcrumbs({ className, items, as }: BreadcrumbsProps): ReactElement {
    const Link = as || $Link

    return (
        <xyd-breadcrumbs
            className={`${cn.BreadcrumbsHost} ${className || ''}`}
        >
            {items.map((item, index) => {
                const lastActive = index === items.length - 1

                return (
                    <Fragment key={item.href + item.title}>
                        {index > 0 && <$BreadcrumbIcon />}
                        <div
                            part="item"
                            data-active={lastActive ? "true" : "false"}
                        >
                            {item.href && !lastActive ? (
                                <Link href={item.href}>{item.title}</Link>
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

function $BreadcrumbIcon() {
    return <span part="icon">/</span>
}

function $Link({ href, children, ...rest }) {
    return <a
        href={href}
        {...rest}
    >
        {children}
    </a>
}