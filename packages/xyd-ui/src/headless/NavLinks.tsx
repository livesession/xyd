import React from "react"
import type {ReactElement} from 'react'
import cn from 'clsx'
import {ArrowLeftIcon, ArrowRightIcon} from '@radix-ui/react-icons'
import {tv} from "tailwind-variants";

import {HAnchor} from './Anchor'

function styled() {
}

styled.navLinks = tv({
    slots: {
        container: cn(
            'mb-8 flex items-center justify-between border-t pt-8 dark:border-neutral-800',
            'contrast-more:border-neutral-400 dark:contrast-more:border-neutral-400',
            'print:hidden'
        ),
        link: cn(
            'flex max-w-[50%] items-center gap-1 py-4 text-base font-medium',
            "text-base-600 transition-colors [word-break:break-word] hover:text-primary-600 dark:text-gray-300 md:text-lg",
        ),
        icon: cn('inline h-5 shrink-0'),
    },
    variants: {
        prev: {
            true: {
                link: 'ltr:pr-4 rtl:pl-4',
                icon: 'ltr:rotate-180'
            }
        },
        next: {
            true: {
                link: 'ltr:ml-auto ltr:pl-4 ltr:text-right rtl:mr-auto rtl:pr-4 rtl:text-left',
                icon: 'rtl:rotate-180'
            }
        }
    }
})

export interface HNavLinksProps {
    prev?: {
        title: string
        href: string
    }
    next?: {
        title: string
        href: string
    }
}

export const HNavLinks = (props: HNavLinksProps): ReactElement | null => {
    const {
        container,
        link,
        icon
    } = styled.navLinks()

    return (
        <div className={container()}>
            {props.prev ? (
                <HAnchor
                    href={props.prev.href}
                    title={props.prev.title}
                    className={link({prev: true})}
                >
                    <ArrowLeftIcon className={icon({prev: true})}/>
                    {props.prev.title}
                </HAnchor>
            ) : <div/>}
            {props.next && (
                <HAnchor
                    href={props.next.href}
                    title={props.next.title}
                    className={link({next: true})}
                >
                    {props.next.title}
                    <ArrowRightIcon className={icon({next: true})}/>
                </HAnchor>
            )}
        </div>
    )
}
