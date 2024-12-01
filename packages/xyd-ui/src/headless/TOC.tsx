import React, {useEffect, useRef} from 'react'
import type {ReactElement} from 'react'
import cn from 'clsx'
import scrollIntoView from 'scroll-into-view-if-needed'
import {tv} from 'tailwind-variants'

function styled() {
}

styled.toc = tv({
    slots: {
        container: cn(
            'xyd-scrollbar sticky top-16 overflow-y-auto pr-4 pt-6 text-sm [hyphens:auto]',
            'max-h-[calc(100vh-var(--xyd-navbar-height)-env(safe-area-inset-bottom))] ltr:-mr-4 rtl:-ml-4'
        ),
        title: "mb-4 font-semibold tracking-tight",

        meta: cn(
            'sticky bottom-0 flex flex-col items-start gap-2 pb-8 dark:border-neutral-800',
            'contrast-more:border-t contrast-more:border-neutral-400 contrast-more:shadow-none contrast-more:dark:border-neutral-400'
        ),
    },
    variants: {
        headings: {
            true: {
                meta: cn(
                    'mt-8 border-t bg-white pt-8 shadow-[0_-12px_16px_white] dark:bg-dark dark:shadow-[0_-12px_16px_#111]',
                )
            }
        }
    }
})

styled.item = tv({
    slots: {
        container: "my-2 scroll-my-6 scroll-py-6",
        link: cn(
            "inline-block",
            'contrast-more:text-gray-900 contrast-more:underline contrast-more:dark:text-gray-50 w-full break-words',
            "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
        )
    },
    variants: {
        active: {
            true: {
                link: "text-primary-600 subpixel-antialiased contrast-more:!text-primary-600"
            }
        },
        depth: {
            2: {
                link: "font-semibold",
            },
            3: {
                link: 'pl-4 ltr:pl-4 rtl:pr-4',
            },
            4: {
                link: 'pl-8 ltr:pl-8 rtl:pr-8',
            },
            5: {
                link: 'pl-12 ltr:pl-12 rtl:pr-12'
            },
            6: {
                link: 'pl-16 ltr:pl-16 rtl:pr-16',
            }
        }
    }
})

styled.meta = tv({
    base: cn(
        'sticky bottom-0 flex flex-col items-start gap-2 pb-8 dark:border-neutral-800',
        'contrast-more:border-t contrast-more:border-neutral-400 contrast-more:shadow-none contrast-more:dark:border-neutral-400'
    ),
    variants: {
        headings: {
            true: 'mt-8 border-t bg-white pt-8 shadow-[0_-12px_16px_white] dark:bg-dark dark:shadow-[0_-12px_16px_#111]'
        }
    }
})

export interface HTocProps {
    title: string | JSX.Element

    activeSlug?: string

    children?: JSX.Element

    meta?: JSX.Element
}

export function HToc(props: HTocProps): ReactElement {
    const tocRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!props.activeSlug) return
        const anchor = tocRef.current?.querySelector(
            `li > a[href="#${props.activeSlug}"]`
        )

        if (anchor) {
            scrollIntoView(anchor, {
                behavior: 'smooth',
                block: 'center',
                inline: 'center',
                scrollMode: 'always',
                boundary: tocRef.current
            })
        }
    }, [props.activeSlug])

    const {container, title} = styled.toc()

    return (
        <div
            ref={tocRef}
            className={container()}
        >
            {props.children && (
                <>
                    <p className={title()}>
                        {props.title}
                    </p>
                    <ul>
                        {props.children}
                    </ul>
                </>
            )}

            {props.meta}
        </div>
    )
}

export interface HTocItemProps {
    children: string | JSX.Element

    href: string

    depth?: 2 | 3 | 4 | 5 | 6

    active?: boolean
}

export function HTocItem(props: HTocItemProps) {
    const {container, link} = styled.item()

    return <li className={container()}>
        <a href={props.href} className={link({
            active: props.active,
            depth: props.depth
        })}
        >
            {props.children}
        </a>
    </li>
}

export interface HTocMetaProps {
    children: JSX.Element

    headings?: boolean
}

export function HTocMeta(props) {
    return <div className={styled.meta()}
    >
        {props.children}
    </div>
}