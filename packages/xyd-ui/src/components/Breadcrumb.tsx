import React, {Fragment} from 'react'
import type {ReactElement} from 'react'
import cn from 'clsx'
import {ArrowRightIcon} from '@radix-ui/react-icons'

import {UIAnchor} from './Anchor'
import {tv} from "tailwind-variants";

function styled() {

}

styled.breadcrumbs = tv({
    slots: {
        container: cn(
            "xyd-breadcrumb mt-1.5 flex items-center gap-1 overflow-hidden",
            "text-sm text-gray-500 dark:text-gray-400 contrast-more:text-current"
        ),
        icon: "w-3.5 shrink-0",
        item: "whitespace-nowrap transition-colors"
    },
    variants: {
        active: {
            true: {
                item: cn(
                    "font-medium text-gray-700 contrast-more:font-bold contrast-more:text-current",
                    "dark:text-gray-100 contrast-more:dark:text-current"
                )
            },
            false: {
                item: cn(
                    "min-w-[24px] overflow-hidden text-ellipsis",
                    "hover:text-gray-900 dark:hover:text-gray-100"
                )
            }
        },
        href: {
            true: {
            }
        }
    }
})

export interface UIBreadcrumbProps {
    items: {
        title: string
        href?: string
    }[]
}

export function UIBreadcrumb(props: UIBreadcrumbProps): ReactElement {
    const {container, icon, item: itemClass} = styled.breadcrumbs()

    return (
        <div className={container()}>
            {props.items.map((item, index) => {
                const lastActive = index === props.items.length - 1

                return (
                    <Fragment key={item.href + item.title}>
                        {index > 0 && <ArrowRightIcon className={icon()}/>}
                        <div className={itemClass({active: lastActive, href: !!item.href})}
                             title={item.title}
                        >
                            {item.href && !lastActive ? (
                                <UIAnchor href={item.href}>{item.title}</UIAnchor>
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
