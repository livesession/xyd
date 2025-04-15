import React from 'react'

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
    IconQuote
} from '../writer'
import { CodeSample } from "../coder";

import cn from "./ContentDecoator.styles";
class Content {
    constructor(protected settings?: Settings) {

    }
}

export function ContentDecorator({children}: {children: React.ReactNode}) {
    return <xyd-content-decorator className={cn.ContentDecoratorHost}>
        {children}
    </xyd-content-decorator>
}

// TODO: options?
export default function content(settings?: Settings) {
    const content = new Content(settings)

    // TODO: automatically bind content to all functions?
    return {
        ...stdContent.call(content),
        ...writerContent(),
        ...iconContent(),
        ...coderContent(),

        ...directiveContent.call(content),
    }
}

export function stdContent(
    this: Content,
) {
    const $$Pre = $Pre.bind(this)

    return {
        h1: (props) => {
            return <Heading id={props.children} {...props} />
        },
        h2: props => {
            return <Heading id={props.children} size={2} {...props} />
        },
        h3: props => {
            return <Heading id={props.children} size={3} {...props} />
        },
        h4: props => {
            return <Heading id={props.children} size={4} {...props} />
        },
        h5: props => {
            return <Heading id={props.children} size={5} {...props} />
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
            return <$Link {...props} />
        },
    }
}

export function writerContent() {
    return {
        Callout,
        Details,
        GuideCard,
        Steps,
        Tabs,
        Table,
        Badge,
        UnderlineNav,

        Subtitle(props) {
            const paragraph = props?.children?.props?.children

            return <Heading size={5} kind="muted" {...props}>
                {paragraph}
            </Heading>
        }
    }
}

// TODO: better system for icons + should work with .md like icon="session-replay" etc.
export function iconContent() {
    return {
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

function directiveContent(
    this: Content,
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


function $Pre(
    this: Content,
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
                highlighted
            }
        ]}
        size="full" // TODO: in the future configurable
    />
}

const EXTERNAL_HREF_REGEX = /https?:\/\//

const $Link = ({ href = '', className = "", ...props }) => (
    <Anchor
        href={href}
        newWindow={EXTERNAL_HREF_REGEX.test(href)}
        {...props}
    />
)
