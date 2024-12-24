import React from 'react'
import cn from 'clsx'

import {
    Blockquote,
    Code,
    Details,
    Heading,
    Hr,
    Table,
} from '@xyd/components/writer'
import {CodeSample} from "@xyd/components/coder";

import {
    UIAnchor,
} from './index'

const EXTERNAL_HREF_REGEX = /https?:\/\//

const Link = ({href = '', className, ...props}) => (
    <UIAnchor
        href={href}
        newWindow={EXTERNAL_HREF_REGEX.test(href)}
        className={cn(
            'text-[#7051d4] no-underline',
            className
        )}
        {...props}
    />
)

// TODO: MOVE SOMWHERE ELSE
export const getComponents = () => {
    return {
        h1: (props) => <div><Heading id={props.children} {...props}/></div>,
        h2: props => <div><Heading id={props.children} size={2} {...props} /></div>,
        h3: props => <div><Heading id={props.children} size={3} {...props} /></div>,
        h4: props => <div><Heading id={props.children} size={4} {...props} /></div>,
        h5: props => <div><Heading id={props.children} size={5} {...props} /></div>,
        h6: props => <div><Heading id={props.children} size={6} {...props} /></div>,
        p: props => <p className="mt-6-x first:mt-0" {...props} />,

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
                size="full" // TODO: in the future configurable
            />
        },
        details: Details,
        blockquote: Blockquote,

        hr: Hr,
        a: Link,
    }
}
