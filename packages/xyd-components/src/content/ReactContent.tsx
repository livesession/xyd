import React, { createContext, useContext, useEffect, useRef, useState } from 'react'
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
    UnderlineNav,
    Text,

    // Icon,
    IconCode,
    IconCustomEvent,
    IconFunnels,
    IconMetrics,
    IconSessionReplay,
    IconAlert,
    IconBrowser,
    IconREST,
    IconGraphQL,
    IconWebhooks,
    IconJSBrowser,
    IconJSNode,
    IconStorybook,
    IconReactRouter,
    IconNextJS,
    IconAppTemplate,
    IconQuote,
} from '../writer'
import { CodeSample } from "../coder";
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
            iconContent,
            coderContent,
            directiveContent,
            contentDecorators
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
            UnderlineNav: NoopComponent,
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
            return <$$Heading depth={1} {...props} />
        },
        h2: props => {
            return <$$Heading depth={2} {...props} />
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

        React: NoopReactComponent,
    }
}

interface HeadingContentProps {
    id: string
    depth: 1 | 2 | 3 | 4 | 5 | 6
    children: React.ReactNode
}

function $Heading({ id, depth, children }: HeadingContentProps) {
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

    return <Heading ref={ref} id={id} size={depth} active={active} onClick={() => {
        // navigate({
        //     hash: id
        // })

        // TODO: !!! in the future we should use react-router but some issues with the hash !!!
        const url = new URL(window.location.href)
        url.hash = id
        history.replaceState(null, '', url)

        document.querySelector(`#${id}`)?.scrollIntoView()
    }}>
        {children}
    </Heading>
}

export function writerContent() {
    const GuideCardContent = $GuideCardContentComponent.bind(this)
    GuideCardContent.List = GuideCard.List

    const UnderlineNavContent = $UnderlineNavContentComponent.bind(this)
    UnderlineNavContent.Content = $UnderlineNavContentContentComponent.bind(this)
    UnderlineNavContent.Item = $UnderlineNavItemContentComponent.bind(this)
    UnderlineNavContent.Item.displayName = "UnderlineNav.Item"

    return {
        Callout,
        Details,
        GuideCard: GuideCardContent,
        Steps,
        Tabs,
        Table,
        Badge,
        UnderlineNav: UnderlineNavContent,

        Subtitle(props) {
            const paragraph = props?.children?.props?.children

            return <Heading size={4} kind="muted" {...props}>
                {paragraph}
            </Heading>
        }
    }
}

function $GuideCardContentComponent(props) {
    return <GuideCard
        {...props}
        as={this?.options?.Link}
    />
}

const UnderlineNavContentContext = createContext({
    value: "",
    onChange: (v: string) => {
    }
})

function $UnderlineNavContentComponent(props) {
    const [value, setValue] = useState(props.value)

    return <UnderlineNavContentContext value={{ value, onChange: setValue }}>
        <UnderlineNav
            {...props}
            value={value}
            onChange={val => {
                setValue(val)
            }}
        />
    </UnderlineNavContentContext>
}

function $UnderlineNavContentContentComponent(this: ReactContent, props) {
    const { onChange } = useContext(UnderlineNavContentContext)
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

    return <UnderlineNav.Content {...props} defaultActive={tabsMatch} />
}

function $UnderlineNavItemContentComponent(props) {
    const { onChange } = useContext(UnderlineNavContentContext)
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

    return <UnderlineNav.Item
        {...props}
        as={this?.options?.Link}
        defaultActive={tabsMatch}
    />
}

// TODO: better system for icons + should work with .md like icon="session-replay" etc.
export function iconContent() {
    return {
        // Icon,

        // TODO: remove below and use iconset system
        IconSessionReplay,
        IconMetrics,
        IconFunnels,
        IconCode,
        IconCustomEvent,
        IconAlert,
        IconBrowser,
        IconREST,
        IconGraphQL,
        IconWebhooks,
        IconJSBrowser,
        IconJSNode,
        IconStorybook,
        IconReactRouter,
        IconNextJS,
        IconAppTemplate,
        IconQuote,
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
                theme={this.settings?.theme?.markdown?.syntaxHighlight || undefined}
                codeblocks={JSON.parse(props.codeblocks)}
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

    return <CodeSample
        theme={this.settings?.theme?.markdown?.syntaxHighlight || undefined}
        name={lang}
        description={props?.children?.props?.meta}
        codeblocks={[
            {
                value: props?.children?.props?.children,
                lang: lang,
                meta: lang,
                highlighted,
            }
        ]}
        size="full" // TODO: in the future configurable
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

    return <Link
        href={href}
        newWindow={newWindow || EXTERNAL_HREF_REGEX.test(href)}
        {...props}
    >
        {children}
    </Link>
}