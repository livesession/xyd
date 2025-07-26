import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { HighlightedCode } from 'codehike/code';

import {
    Settings
} from "@xyd-js/core"

import {
    Anchor,
    Badge,
    Blockquote,
    Callout,
    Code,
    Details,
    GuideCard,
    Heading,
    Hr,
    Table,
    Tabs,
    Steps,
    List,
    ListOl,
    Text,
    Button,
    Icon,
    Image,
    Update,
    Card,
    ColorSchemeButton,
    Breadcrumbs
} from '../../writer'
import { PageHome, PageFirstSlide, PageBlogHome } from '../../pages'
import { CodeSample } from "../../coder";
import { GridDecorator } from './GridDecorator';

interface ReactContentOptions {
    Link?: React.ElementType
    components?: { [component: string]: (props: any) => React.JSX.Element | null }
    useLocation?: () => {
        search: string
    } // TODO: !!!! BETTER API !!!!!
    useNavigate?: (to: any) => void // TODO: !!!! BETTER API !!!!!
    useNavigation?: () => any, // TODO: !!!! BETTER API !!!!!

}

export class ReactContent {
    constructor(
        protected settings?: Settings,
        protected options?: ReactContentOptions
    ) {
    }

    public components(): { [component: string]: (props: any) => React.JSX.Element | null } {
        const builtInComponents = [
            stdContent,
            writerContent,
            pageComponents,
            iconContent,
            coderContent,
            directiveContent,
            contentDecorators,
        ]
            .map(fn => fn.bind(this))
            .reduce((acc, fn) => ({ ...acc, ...fn() }), {});

        return {
            ...builtInComponents,
            ...this.options?.components || {}
        }
    }

    public noop() {
        const components = this.components()

        const noopBuiltInFlatComponents = [
            ...Object.keys(components),
            ...Object.keys(this.options?.components || {})
        ].reduce((acc, key) => {
            acc[key] = () => null
            return acc
        }, {})

        const noopNestedComponents = {
            Steps: NoopComponent,
            Tabs: NoopComponent,
            GuideCard: NoopComponent,
            Table: NoopComponent,
        }

        return {
            ...noopBuiltInFlatComponents,
            ...noopNestedComponents,
            React: NoopReactComponent,
        }
    }
}

function NoopComponent() {
    return null
}
NoopComponent.Item = () => null
NoopComponent.Content = () => null
NoopComponent.List = () => null
NoopComponent.Head = () => null
NoopComponent.Td = () => null
NoopComponent.Tr = () => null
NoopComponent.Th = () => null
NoopComponent.Cell = () => null


function NoopReactComponent() { // TODO: !!!! in the future refactor but `html-to-jsx-transform` creates <React.Fragment> !!!
    return null
}
NoopReactComponent.Fragment = React.Fragment

export function stdContent(
    this: ReactContent,
) {
    const $$Pre = $Pre.bind(this)
    const $$Heading = $Heading.bind(this)

    return {
        h1: (props) => {
            return <$$Heading depth={1} {...props} noanchor />
        },
        h2: props => {
            const appearance = this.settings?.theme?.appearance

            return <>
                {appearance?.content?.sectionSeparator ? <Hr /> : null}

                <$$Heading depth={2} {...props} />
            </>
        },
        h3: props => {
            return <$$Heading depth={3} {...props} />
        },
        h4: props => {
            return <$$Heading depth={4} {...props} />
        },
        h5: props => {
            return <$$Heading depth={5} {...props} />
        },
        p: props => {
            return <Text {...props} />
        },
        ul: props => {
            return <List {...props}>
                {props.children}
            </List>
        },
        ol: props => {
            return <ListOl {...props}>
                {props.children}
            </ListOl>
        },
        li: props => {
            return <List.Item {...props} >
                {props.children}
            </List.Item>
        },

        table: (props) => {
            return <Table {...props} />
        },
        tr: (props) => {
            return <Table.Tr {...props} />
        },
        th: (props) => {
            return <Table.Th {...props} />
        },
        td: (props) => {
            return <Table.Td {...props}>
                <Table.Cell>
                    {props.children}
                </Table.Cell>
            </Table.Td>
        },

        code: (props) => {
            return <Code {...props} />
        },
        pre: $$Pre,
        details: (props) => {
            return <Details {...props} />
        },
        blockquote: (props) => {
            return <Blockquote {...props} />
        },
        hr: (props) => {
            return <Hr {...props} />
        },
        a: (props) => {
            return <$Link {...props} as={this?.options?.Link} />
        },
        br: (props) => {
            return <br />
        },
        img: (props) => {
            return <Image {...props} />
        },
        picture: (props) => {
            const { children, ...rest } = props

            return <picture {...rest}>
                {children}
            </picture>
        },
        source: (props) => {
            const { children, ...rest } = props

            return <source {...rest} />
        },

        React: NoopReactComponent,
    }
}

interface HeadingContentProps {
    id: string
    depth: 1 | 2 | 3 | 4 | 5 | 6
    children: React.ReactNode
    label?: string
    subtitle?: string
    noanchor?: boolean
    style?: any
}

function $Heading({ id, depth, children, label, subtitle, noanchor, style }: HeadingContentProps) {
    // const location = this?.options?.useLocation?.() // TODO: !!!! BETTER API !!!!!
    // const navigate = this?.options?.useNavigate() // TODO: !!!! BETTER API !!!!!
    const navigation = this?.options?.useNavigation() // TODO: !!!! BETTER API !!!!!

    const ref = useRef<HTMLHeadingElement>(null!)
    const [active, setActive] = useState(false)

    function onReplaceState(e: any) {
        const active = window.location.hash === `#${id}`
        setActive(active)
    }

    useEffect(() => {
        window.addEventListener('replaceState', onReplaceState)

        const active = window.location.hash === `#${id}`
        setActive(active)

        if (active && ref.current && navigation?.state !== "loading") {
            ref.current.scrollIntoView()
        }

        return () => {
            window.removeEventListener('replaceState', onReplaceState)
        }
    }, [])

    return <Heading
        ref={ref}
        id={id}
        size={depth}
        active={active}
        onClick={() => {
            // navigate({
            //     hash: id
            // })

            // TODO: !!! in the future we should use react-router but some issues with the hash !!!
            const url = new URL(window.location.href)
            url.hash = id
            history.replaceState(null, '', url)

            document.querySelector(`#${id}`)?.scrollIntoView()
        }}
        label={label}
        subtitle={subtitle}
        noanchor={noanchor}
        style={style}
    >
        {children}
    </Heading>
}

export function writerContent() {
    const GuideCardContent = $GuideCardContentComponent.bind(this)
    GuideCardContent.List = GuideCard.List
    const BreadcrumbsContent = $BreadcrumbsContentComponent.bind(this)

    const TabsContent = $TabsContentComponent.bind(this)
    TabsContent.Content = $TabsContentContentComponent.bind(this)
    TabsContent.Item = $TabsItemContentComponent.bind(this)
    TabsContent.Item.displayName = "Tabs.Item"

    return {
        Callout,
        Details,
        GuideCard: GuideCardContent,
        Breadcrumbs: BreadcrumbsContent,
        Steps,
        Tabs: TabsContent,
        Table,
        Badge,
        Button,
        Subtitle(props) {
            const paragraph = props?.children?.props?.children

            return <Heading size={4} kind="muted" {...props}>
                {paragraph}
            </Heading>
        },
        Update,
        Card: $Card.bind(this),
        ColorSchemeButton: ColorSchemeButton
    }
}

function pageComponents() {
    return {
        PageHome,
        PageFirstSlide,
        PageBlogHome: $PageBlogHome.bind(this)
    }
}

function $PageBlogHome(props) {
    return <PageBlogHome
        {...props}
        as={this?.options?.Link}
    />
}

function $GuideCardContentComponent(props) {
    return <GuideCard
        {...props}
        as={this?.options?.Link}
    />
}

function $BreadcrumbsContentComponent(props) {
    return <Breadcrumbs
        {...props}
        as={this?.options?.Link}
    />
}

function $Card(props) {
    return <Card
        {...props}
        link={this?.options?.Link}
    />
}

const TabsContentContext = createContext({
    value: "",
    onChange: (v: string) => {
    }
})

function $TabsContentComponent(props) {
    const [value, setValue] = useState(props.value)

    return <TabsContentContext value={{ value, onChange: setValue }}>
        <Tabs
            {...props}
            value={value}
            onChange={val => {
                const url = new URL(window.location.href)
                const currentParams = url.searchParams

                // Update parameters from the new params
                new URLSearchParams(val).forEach((value, key) => {
                    currentParams.set(key, value)
                })

                url.search = currentParams.toString()
                history.replaceState(null, '', url)

                setValue(val)
            }}
        />
    </TabsContentContext>
}

function $TabsContentContentComponent(this: ReactContent, props) {
    const { onChange } = useContext(TabsContentContext)
    const location = this?.options?.useLocation?.() // TODO: !!!! BETTER API !!!!!

    const search = location?.search
    const params = new URLSearchParams(search)
    const propsParams = new URLSearchParams(props.value)

    let tabsMatch: boolean | undefined = true
    let keyMatchExists = true
    propsParams.forEach((value, key) => {
        const paramKey = params.get(key)
        if (paramKey !== value) {
            tabsMatch = false
        }
        if (!paramKey) {
            keyMatchExists = false
        }
    })

    useEffect(() => {
        if (tabsMatch) {
            onChange(props.value)
        }
    }, [tabsMatch])

    if (!keyMatchExists) {
        tabsMatch = undefined
    }

    return <Tabs.Content {...props} defaultActive={tabsMatch} />
}

function $TabsItemContentComponent(props) {
    const { onChange } = useContext(TabsContentContext)
    const location = this?.options?.useLocation?.()

    const search = location?.search
    const params = new URLSearchParams(search)
    const propsParams = new URLSearchParams(props.value)

    let tabsMatch = true
    propsParams.forEach((value, key) => {
        if (params.get(key) !== value) {
            tabsMatch = false
        }
    })

    useEffect(() => {
        if (tabsMatch) {
            onChange(props.value)
        }
    }, [tabsMatch])

    return <Tabs.Item
        {...props}
        as={this?.options?.Link}
        defaultActive={tabsMatch}
    />
}

// TODO: better system for icons + should work with .md like icon="session-replay" etc.
export function iconContent() {
    return {
        Icon,
    }
}

export function coderContent() {
    return {
        CodeSample, // TODO: server side highlight?
    }
}

export function directiveContent(
    this: ReactContent,
) {
    return {
        // TODO: deprecate? - but currently needed for directive cuz we do JSON.parse here
        DirectiveCodeGroup: (props) => {
            return <CodeSample
                {...props}
                theme={this.settings?.theme?.coder?.syntaxHighlight || undefined}
                codeblocks={JSON.parse(props.codeblocks || "[]")}
            />
        }
    }
}

export function contentDecorators() {
    return {
        GridDecorator
    }
}

function $Pre(
    this: ReactContent,
    props: any
) {
    let highlighted: HighlightedCode | undefined = undefined

    if (props.highlighted) {
        // if ssr highlighted code
        try {
            const serverHighlight: HighlightedCode = JSON.parse(props.highlighted)

            if (serverHighlight) {
                highlighted = serverHighlight
            }
        } catch (e) {
            console.error("Error parsing highlighted code", e)
        }
    }
    const lang = (props?.children?.props?.className || "").replace("language-", "")

    let descriptionContent: React.ReactNode | undefined = undefined
    if (props?.descriptionContent) {
        const code = mdxContent(props?.descriptionContent)
        if (code?.component) {
            const Component = MemoMDXComponent(code?.component)

            descriptionContent = <Component components={this.components()} />
        }
    }

    return <CodeSample
        theme={this.settings?.theme?.coder?.syntaxHighlight || undefined}
        name={lang}
        description={typeof props?.title === "string" ? props?.title : props?.children?.props?.meta}
        codeblocks={[
            {
                value: props?.children?.props?.children,
                lang: lang,
                meta: lang,
                highlighted,
            }
        ]}
        lineNumbers={props?.lineNumbers}
        size={props?.size}
        descriptionHead={props?.descriptionHead}
        descriptionContent={descriptionContent}
        descriptionIcon={props?.descriptionIcon}
    />
}

const EXTERNAL_HREF_REGEX = /https?:\/\//

interface LinkProps {
    href?: string
    as?: React.ElementType
    newWindow?: boolean
    children?: React.ReactNode
}

function $Link({
    href = '',
    as,
    newWindow,
    children,
    ...props
}: LinkProps) {
    const Link = as || Anchor

    if (!as) {
        // TODO: fix any
        (props as any).newWindow = newWindow || EXTERNAL_HREF_REGEX.test(href)
    }

    return <Link
        href={href}
        {...props}
        as={as}
    >
        {children}
    </Link>
}

// TODO: move to content?
function mdxExport(code: string) {
    // Create a wrapper around React.createElement that adds keys to elements in lists
    const scope = {
        Fragment: React.Fragment,
        jsxs: createElementWithKeys,
        jsx: createElementWithKeys,
        jsxDEV: createElementWithKeys,
    }
    const fn = new Function(...Object.keys(scope), code)

    return fn(scope)
}

function MemoMDXComponent(codeComponent: any) {
    return useMemo(
        () => codeComponent ? codeComponent : null,
        [codeComponent]
    )
}


// // TODO: move to content?
function mdxContent(code: string) {
    const content = mdxExport(code) // TODO: fix any
    if (!mdxExport) {
        return {}
    }

    return {
        component: content?.default,
    }
}

const createElementWithKeys = (type: any, props: any) => {
    // Process children to add keys to all elements
    const processChildren = (childrenArray: any[]): any[] => {
        return childrenArray.map((child, index) => {
            // If the child is a React element and doesn't have a key, add one
            if (React.isValidElement(child) && !child.key) {
                return React.cloneElement(child, { key: `mdx-${index}` });
            }
            // If the child is an array, process it recursively
            if (Array.isArray(child)) {
                return processChildren(child);
            }
            return child;
        });
    };

    // Handle both cases: children as separate args or as props.children
    let processedChildren;

    if (props && props.children) {
        if (Array.isArray(props.children)) {
            processedChildren = processChildren(props.children);
        } else if (React.isValidElement(props.children) && !props.children.key) {
            // Single child without key
            processedChildren = React.cloneElement(props.children, { key: 'mdx-child' });
        } else {
            // Single child with key or non-React element
            processedChildren = props.children;
        }
    } else {
        processedChildren = [];
    }

    // Create the element with processed children
    return React.createElement(type, {
        ...props,
        children: processedChildren
    });
};