import React, { Suspense } from "react";
import type { HighlightedCode, AnnotationHandler } from "codehike/code";
import { InnerLine, Pre } from "codehike/code";
import { Theme } from "@code-hike/lighter";

import { Text } from "../../writer/Text"
import { CodeTheme, type CodeThemeBlockProps } from "../CodeTheme";
import * as cn from "./Code.styles";
import { CodeLoader } from "./CodeLoader";
import { Icon } from "src/writer/Icon";

export interface CodeProps {
    codeblocks?: CodeThemeBlockProps[];
    theme?: Theme
    children: React.ReactNode
}

export function Code(props: CodeProps) {
    return <Suspense fallback={<CodeLoader />}>
        <CodeTheme
            codeblocks={props.codeblocks}
            theme={props.theme}
        >
            {props.children}
        </CodeTheme>
    </Suspense>
}

// TODO: fix any
Code.LineNumber = function CodeLineNumber(props: any) {
    if (!props.children || !props.children.length) {
        return null
    }
    return (
        <xyd-code-linenumber
            className={cn.LineNumberHost}
            style={{ minWidth: `${props.width}ch` }}
        >
            <span part="line-number">
                {props.lineNumber}
            </span>
            <InnerLine merge={props} />
        </xyd-code-linenumber>
    )
}

// TODO: fix any
Code.Mark = function CodeMark(props: any) {
    return <xyd-code-mark
        data-diff={props.annotation?.diff ? "true" : undefined}
        data-query={props.annotation?.diff && props.annotation?.query ? props.annotation?.query : undefined}
        data-annotated={String(!!props.annotation)}
        className={`${cn.MarkHost}`}
    >
        <InnerLine
            part="line"
            merge={props}
        />
    </xyd-code-mark>
}

Code.MarkInline = function CodeMarkInline(props: any) {
    return (
        <xyd-code-mark-inline
            data-diff={props.annotation?.diff ? "true" : undefined}
            data-query={props.annotation?.diff && props.annotation?.query ? props.annotation?.query : undefined}
            className={cn.MarkInlineHost}
        >
            {props.children}
        </xyd-code-mark-inline>
    )
}

// TODO: fix any
Code.Bg = function CodeLine(props: any) {
    return <xyd-code-bg
        data-annotated={String(!!props.annotation)}
        className={`${cn.BgHost}`}
    >
        {props.children}
    </xyd-code-bg>
}

Code.Pre = function CodePre(props: {
    codeblock: HighlightedCode,
    size?: "full",
    handlers: AnnotationHandler[],
    className?: string,
    descriptionHead?: string | React.ReactNode,
    descriptionContent?: string | React.ReactNode,
    descriptionIcon?: string
}
) {
    const {
        size,
        className,
        codeblock,
        handlers,
    } = props;

    fixLastToken(codeblock)

    let description: React.ReactNode | null = null
    
    if (props.descriptionHead || props.descriptionContent) {
        description = <div part="code-description" className={cn.CodeDescription}>
            <div>
                {props.descriptionIcon ? <Icon name={props.descriptionIcon} size={16} /> : <_DefaultDescriptionIcon />}
            </div>

            <div>
                <Text weight="bold">
                    {props.descriptionHead}
                </Text>
                <span>
                    {props.descriptionContent}
                </span>
            </div>
        </div>

    }
    return <xyd-code-pre>
        <Pre
            part="pre"
            data-size={size}
            style={codeblock?.style || codeblock?.style}
            className={`${cn.CodeHost} ${className || ""}`}
            code={codeblock}
            handlers={handlers}
        />

        {description}
    </xyd-code-pre>
}

/**
 * FOR SOME REASONS FOR SINGLE CODE BLOCKS LAST TOKEN IS EMPTY STRING
 * 
 * @todo: fix this
 */
function fixLastToken(codeblock: HighlightedCode) {
    const lastToken = codeblock.tokens[codeblock.tokens.length - 1]
    if (typeof lastToken === 'string' && (lastToken === ' ' || lastToken === '\n')) {
        codeblock.tokens.pop()
    }
}

function _DefaultDescriptionIcon() {
    return <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        strokeWidth={3}
        stroke="currentColor"
        fill="none"
        width={16}
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
        <path d="M12 12l8 -4.5" />
        <path d="M12 12v9" />
        <path d="M12 12l-8 -4.5" />
        <path d="M12 12l8 4.5" />
        <path d="M12 3v9" />
        <path d="M12 12l-8 4.5" />
    </svg>
}