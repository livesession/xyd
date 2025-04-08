import React from 'react'

import {
    Badge,
    Blockquote,
    Callout,
    Code,
    Details,
    GuideCard,
    Heading,
    Hr,
    Table,
    TableV2,
    Tabs,
    Steps,
    List,
    ListOl,

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
export default function content() {
    return {
        ...stdContent(),
        ...writerContent(),
        ...helperContent(),
        ...iconContent(),
        ...coderContent(),
        ...directiveContent(),
    }
}

export function stdContent() {
    return {
        h1: (props) => <div><Heading id={props.children} {...props}/></div>,
        h2: props => <div><Heading id={props.children} size={2} {...props} /></div>,
        h3: props => <div><Heading id={props.children} size={3} {...props} /></div>,
        h4: props => <div><Heading id={props.children} size={4} {...props} /></div>,
        h5: props => <div><Heading id={props.children} size={5} {...props} /></div>,
        h6: props => <div><Heading id={props.children} size={6} {...props} /></div>,
        p: props => <p {...props} />,

        ul: props => (
            <List{...props}>
                {props.children}
            </List>
        ),
        ol: props => (
            <ListOl{...props}>
                {props.children}
            </ListOl>
        ),
        li: props => <List.Item {...props} >
            {props.children}
        </List.Item>,

        table: TableV2,
        tr: TableV2.Tr,
        th: TableV2.Th,
        td: (props) => <TableV2.Td {...props}>
            <TableV2.Cell>
                {props.children}
            </TableV2.Cell>
        </TableV2.Td>,

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
                size="full" // TODO: in the future configurable
            />
        },
        details: Details,
        blockquote: Blockquote,

        hr: Hr,
        a: Link,
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
    }
}

export function directiveContent() {
    return {
        // TODO: deprecate?
        DirectiveCodeSample: (props) => {
            return <CodeSample
                {...props}
                codeblocks={JSON.parse(props.codeblocks)}
            />
        }
    }
}

export function helperContent() {
    return {
        Content: ContentComponent,
        Subtitle
    }
}

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
        CodeSample,
    }
}
