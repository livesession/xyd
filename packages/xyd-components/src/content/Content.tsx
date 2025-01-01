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
    Tabs,
    Steps,

    IconCode,
    IconCustomEvent,
    IconFunnels,
    IconMetrics,
    IconSessionReplay,
} from '@xyd/components/writer'
import {CodeSample} from "@xyd/components/coder";

import {Content as ContentComponent} from "./Content/index";
import {Subtitle} from "./Subtitle";
import {Anchor} from "./Anchor";

const EXTERNAL_HREF_REGEX = /https?:\/\//

const Link = ({href = '', className, ...props}) => (
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
            <ul{...props}>
                {props.children}
            </ul>
        ),
        ol: props => (
            <ol{...props}
            >
                {props.children}
            </ol>
        ),
        li: props => <li {...props} >
            {props.children}
        </li>,

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
        Table,
        Badge,
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
    }
}

