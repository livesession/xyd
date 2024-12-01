import React, {Children, cloneElement, useEffect, useRef, useState} from 'react'
import type {ComponentProps, ReactElement, ReactNode} from 'react'
import cn from 'clsx'

import {Code, Pre, Table, Td, Th, Tr} from '@xyd/components/content'

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
                            h2: 'mt-4 pb-3 text-3xl',
                            h3: 'mt-4 pb-3 text-2xl',
                            h4: 'mt-4 pb-3 text-xl',
                            h5: 'mt-4 pb-3 text-lg',
                            h6: 'mt-4 pb-3 text-base'
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

const findSummary = (children: ReactNode) => {
    let summary: ReactNode = null
    const restChildren: ReactNode[] = []

    Children.forEach(children, (child, index) => {
        if (child && (child as ReactElement).type === Summary) {
            summary ||= child
            return
        }

        let c = child
        if (
            !summary &&
            child &&
            typeof child === 'object' &&
            (child as ReactElement).type !== Details &&
            'props' in child &&
            child.props
        ) {
            const result = findSummary(child.props.children)
            summary = result[0]
            c = cloneElement(child, {
                ...child.props,
                children: result[1]?.length ? result[1] : undefined,
                key: index
            })
        }
        restChildren.push(c)
    })

    return [summary, restChildren]
}

const Details = ({
                     children,
                     open,
                     ...props
                 }: ComponentProps<'details'>): ReactElement => {
    const [openState, setOpen] = useState(!!open)
    const [summary, restChildren] = findSummary(children)

    // To animate the close animation we have to delay the DOM node state here.
    const [delayedOpenState, setDelayedOpenState] = useState(openState)
    useEffect(() => {
        if (openState) {
            setDelayedOpenState(true)
        } else {
            const timeout = setTimeout(() => setDelayedOpenState(openState), 500)
            return () => clearTimeout(timeout)
        }
    }, [openState])

    return (
        <details
            className="my-4 rounded border border-gray-200 bg-white p-2 shadow-sm first:mt-0 dark:border-neutral-800 dark:bg-neutral-900"
            {...props}
            open={delayedOpenState}
            {...(openState && {'data-expanded': true})}
        >
            {/*<DetailsProvider value={setOpen}>{summary}</DetailsProvider>*/}
            {summary}
            <HCollapse isOpen={openState}>{restChildren}</HCollapse>
        </details>
    )
}

const Summary = (props: ComponentProps<'summary'>): ReactElement => {
    // const setOpen = useDetails()
    return (
        <summary
            className={cn(
                'flex items-center cursor-pointer list-none p-1 transition-colors hover:bg-gray-100 dark:hover:bg-neutral-800',
                "before:mr-1 before:inline-block before:transition-transform before:content-[''] dark:before:invert before:shrink-0",
                'rtl:before:rotate-180 [[data-expanded]>&]:before:rotate-90'
            )}
            {...props}
            // onClick={e => {
            //     e.preventDefault()
            //     setOpen(v => !v)
            // }}
            onClick={() => {
                alert("Summary")
            }}
        />
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
                className="mt-2 text-4xl font-bold tracking-tight text-[#1c1e1e] dark:text-slate-100"
                {...props}
            />
        ),
        h2: props => <HeadingLink tag="h2" context={context} {...props} />,
        h3: props => <HeadingLink tag="h3" context={context} {...props} />,
        h4: props => <HeadingLink tag="h4" context={context} {...props} />,
        h5: props => <HeadingLink tag="h5" context={context} {...props} />,
        h6: props => <HeadingLink tag="h6" context={context} {...props} />,
        ul: props => (
            <ul
                className="mt-6 list-disc first:mt-0 ltr:ml-6 rtl:mr-6"
                {...props}
            />
        ),
        ol: props => (
            <ol
                className="mt-6 list-decimal first:mt-0 ltr:ml-6 rtl:mr-6"
                {...props}
            />
        ),
        li: props => <li className="my-2" {...props} />,
        blockquote: props => (
            <blockquote
                className={cn(
                    'mt-6 border-gray-300 italic text-gray-700 dark:border-gray-700 dark:text-gray-400',
                    'first:mt-0 ltr:border-l-2 ltr:pl-6 rtl:border-r-2 rtl:pr-6'
                )}
                {...props}
            />
        ),
        hr: props => (
            <hr
                className="my-8 border-neutral-200/70 contrast-more:border-neutral-400 dark:border-primary-100/10 contrast-more:dark:border-neutral-400"
                {...props}
            />
        ),
        a: Link,
        table: props => (
            <Table
                className="xyd-scrollbar mt-6 p-0 first:mt-0"
                {...props}
            />
        ),
        p: props => <p className="mt-6 leading-7 first:mt-0" {...props} />,
        tr: Tr,
        th: Th,
        td: Td,
        details: Details,
        summary: Summary,
        pre: Pre,
        code: Code,
    }
}
