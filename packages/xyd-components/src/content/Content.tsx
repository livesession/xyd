import React from 'react'

import {HighlightedCode} from 'codehike/code';

import {
    Settings
} from "@xyd-js/core"

import {
    Badge,
    Blockquote,
    Callout,
    Code,
    Details,
    GuideCard,
    Heading,
    Hr,
    TableV2,
    Tabs,
    Steps,
    List,
    ListOl,
    UnderlineNav,

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
import {CodeSample} from "../coder";

import {Content as ContentComponent} from "./Content/index";
import {Subtitle} from "./Subtitle";
import {Anchor} from "./Anchor";

const EXTERNAL_HREF_REGEX = /https?:\/\//

const Link = ({href = '', className = "", ...props}) => (
    <Anchor
        href={href}
        newWindow={EXTERNAL_HREF_REGEX.test(href)}
        {...props}
    />
)

// TODO: options?
export default function content(settings?: Settings) {
    return {
        ...stdContent(settings),
        ...writerContent(),
        ...helperContent(),
        ...iconContent(),
        ...coderContent(),

        ...directiveContent(settings),
    }
}

export function stdContent(settings?: Settings) {
    return {
        h1: (props) => {
            return <div><Heading id={props.children} {...props}/></div>
        },
        h2: props => {
            return <div><Heading id={props.children} size={2} {...props} /></div>
        },
        h3: props => {
            return <div><Heading id={props.children} size={3} {...props} /></div>
        },
        h4: props => {
            return <div><Heading id={props.children} size={4} {...props} /></div>
        },
        h5: props => {
            return <div><Heading id={props.children} size={5} {...props} /></div>
        },
        p: props => {
            return <p {...props} />
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
            return <TableV2 {...props} />
        },
        tr: (props) => {
            return <TableV2.Tr {...props} />
        },
        th: (props) => {
            return <TableV2.Th {...props} />
        },
        td: (props) => {
            return <TableV2.Td {...props}>
                <TableV2.Cell>
                    {props.children}
                </TableV2.Cell>
            </TableV2.Td>
        },

        code: (props) => {
            return <Code {...props} />
        },
        pre: props => {
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
                theme={settings?.theme?.markdown?.syntaxHighlight || undefined}
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
        },
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
            return <Link {...props} />
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
        Table: TableV2,
        Badge,
        UnderlineNav,
    }
}

export function helperContent() {
    return {
        Content: ContentComponent,
        Subtitle
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

function directiveContent(settings?: Settings) {
    return {
        // TODO: deprecate? - but currently needed for directive cuz we do JSON.parse here
        DirectiveCodeGroup: (props) => {
            return <CodeSample
                {...props}
                theme={settings?.theme?.markdown?.syntaxHighlight || undefined}
                codeblocks={JSON.parse(props.codeblocks)}
            />
        }
    }
}
