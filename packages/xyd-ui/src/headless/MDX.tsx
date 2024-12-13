import React, {Children, cloneElement, useEffect, useRef, useState} from 'react'
import type {ComponentProps, ReactElement, ReactNode} from 'react'
import cn from 'clsx'

import {
    Blockquote,
    Code,
    Details,
    Hr,
    Table,
} from '@xyd/components/writer'
import {CodeSample} from "@xyd/components/coder";

import {
    HAnchor,
    HCollapse
} from './index'

// import type {AnchorProps} from './components'
// import type {DocsThemeConfig} from './constants'
// import {DetailsProvider, useDetails, useSetActiveAnchor} from './contexts'
// import {useIntersectionObserver, useSlugs} from './contexts'

// Anchor links
function HeadingLink({
                         tag: Tag,
                         context,
                         children,
                         id,
                         className,
                         ...props
                     }: ComponentProps<'h2'> & {
    tag: `h${2 | 3 | 4 | 5 | 6}`
    context: { index: number }
}): ReactElement {
    // const setActiveAnchor = useSetActiveAnchor()
    // const slugs = useSlugs()
    // const observer = useIntersectionObserver()
    const obRef = useRef<HTMLAnchorElement>(null)

    // TODO: implt
    // useEffect(() => {
    //     if (!id) return
    //     const heading = obRef.current
    //     if (!heading) return
    //     slugs.set(heading, [id, (context.index += 1)])
    //     observer?.observe(heading)
    //
    //     return () => {
    //         observer?.disconnect()
    //         slugs.delete(heading)
    //         setActiveAnchor(f => {
    //             const ret = {...f}
    //             delete ret[id]
    //             return ret
    //         })
    //     }
    // }, [id, context, slugs, observer, setActiveAnchor])

    return (
        <Tag
            className={
                // can be added by footnotes
                className === 'sr-only'
                    ? 'sr-only'
                    : cn(
                        'font-normal tracking-tight text-[#1c1e1e] dark:text-slate-100',
                        {
                            h2: 'mt-4-x pb-3-x text-3xl',
                            h3: 'mt-4-x pb-3-x text-2xl',
                            h4: 'mt-4-x pb-3-x text-xl',
                            h5: 'mt-4-x pb-3-x text-lg',
                            h6: 'mt-4-x pb-3-x text-base'
                        }[Tag]
                    )
            }
            {...props}
        >
            {children}
            {id && (
                <a
                    href={`#${id}`}
                    id={id}
                    className="subheading-anchor"
                    aria-label="Permalink for this section"
                    ref={obRef}
                />
            )}
        </Tag>
    )
}

const EXTERNAL_HREF_REGEX = /https?:\/\//

const Link = ({href = '', className, ...props}) => (
    <HAnchor
        href={href}
        newWindow={EXTERNAL_HREF_REGEX.test(href)}
        className={cn(
            'text-primary-600 underline decoration-from-font [text-underline-position:from-font]',
            className
        )}
        {...props}
    />
)

const A = ({href = '', ...props}) => (
    <HAnchor href={href} newWindow={EXTERNAL_HREF_REGEX.test(href)} {...props} />
)

// TODO: MOVE SOMWHERE ELSE
export const getComponents = () => {
    const context = {index: 0}
    return {
        h1: props => (
            <h1
                className="mt-2-x text-4xl font-bold tracking-tight text-[#1c1e1e] dark:text-slate-100"
                {...props}
            />
        ),
        h2: props => <HeadingLink tag="h2" context={context} {...props} />,
        h3: props => <HeadingLink tag="h3" context={context} {...props} />,
        h4: props => <HeadingLink tag="h4" context={context} {...props} />,
        h5: props => <HeadingLink tag="h5" context={context} {...props} />,
        h6: props => <HeadingLink tag="h6" context={context} {...props} />,
        p: props => <p className="mt-6-x leading-7 first:mt-0" {...props} />,

        ul: props => (
            <ul
                className="mt-6-x list-disc first:mt-0 ltr:ml-6 rtl:mr-6"
                {...props}
            />
        ),
        ol: props => (
            <ol
                className="mt-6-x list-decimal first:mt-0 ltr:ml-6 rtl:mr-6"
                {...props}
            />
        ),
        li: props => <li className="my-2" {...props} />,

        table: Table,
        tr: Table.Tr,
        th: Table.Th,
        td: Table.Td,


        code: Code,
        pre: props => {
            const lang = (props?.children?.props?.className || "").replace("language-", "") // TODO: better solution

            return <CodeSample
                name={lang}
                description={props?.children?.props?.meta}
                codeblocks={[
                    {
                        value: props?.children?.props?.children,
                        lang: lang,
                        meta: lang,
                    }
                ]}
            />
        },
        details: Details,
        blockquote: Blockquote,

        hr: Hr,
        a: Link,
    }
}
