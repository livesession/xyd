import React, {useEffect, useState} from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs"; // TODO: remove and use separation
import {
    AnnotationHandler,
    InnerLine,
    Pre,
    highlight,
    HighlightedCode,
} from "codehike/code"

import {
    CodeCopy,
} from "@/components/Code";
import {theme as defaultTheme} from "@/components/Code/default-theme" // TODO: support multiple themes
import {withLocalStored} from "@/components/Code/CodeSample/withLocalStored";
import {
    $sample,
    $languages,
    $code,
    $mark,
    $lineNumber
} from "./CodeSample.styles";

// TODO: try to use codehiki in build time / ASYNC !!! - we need rr server-components
// TODO: separate highlight

export interface MDXCodeSampleBlock {
    /** This is the raw code. May include annotation comments. */
    value: string;
    /** The programming language. */
    lang: string;
    /** Metadata string (the content after the language name in a markdown codeblock). */
    meta: string;
}

export interface CodeSampleProps {
    name: string;
    description: string;
    codeblocks: MDXCodeSampleBlock[];
}

const $$LocalStoredTab = withLocalStored(TabsPrimitive.Root);

export function CodeSample(props: CodeSampleProps) {
    const [highlighted, setHighlighted] = useState<HighlightedCode[]>([]);

    useEffect(() => {
        async function fetchHighlight() {
            const result = await Promise.all(
                props.codeblocks?.map((codeblock) => highlight(codeblock, defaultTheme))
            );

            setHighlighted(result);
        }

        fetchHighlight();
    }, [props.codeblocks]);

    if (highlighted.length === 0) {
        return <div>Loading</div>;
    }

    if (!highlighted) {
        return <div>Loading</div>;
    }


    return (
        <$$LocalStoredTab
            className={$sample.host}
            style={highlighted[0]?.style}
            localStorageKey={`preferredLanguage[${name}]`}
            defaultValue={highlighted[0]?.meta}
        >
            <div className={$languages.host}>
                <$Description description={props.description}/>

                <TabsPrimitive.List className={$languages.list}>
                    {props.codeblocks?.map(({meta}, i) => (
                        <TabsPrimitive.Trigger value={meta!} key={i} className={$languages.button}>
                            {meta}
                        </TabsPrimitive.Trigger>
                    ))}
                </TabsPrimitive.List>

                <div className={$languages.copy}>
                    {props.codeblocks?.map((codeblock, i) => (
                        <TabsPrimitive.Content value={codeblock.meta!} asChild key={i}>
                            <CodeCopy text={codeblock.value}/>
                        </TabsPrimitive.Content>
                    ))}
                </div>
            </div>

            {highlighted?.map((codeblock, i) => (
                <TabsPrimitive.Content value={codeblock.meta} key={i}>
                    <Pre
                        className={$code.host}
                        style={codeblock?.style || codeblock?.style}
                        code={codeblock}
                        handlers={[mark, lineNumber]}
                    />
                </TabsPrimitive.Content>
            ))}
        </$$LocalStoredTab>
    )
}

function $Description(props: { description: string }) {
    return <div className={$languages.description}>
        <div className={$languages.description$item}>
            {props.description}
        </div>
    </div>
}

const mark: AnnotationHandler = {
    name: "Mark",
    Line: ({annotation, ...props}) => {
        return (
            <div className={`${$mark.host} ${annotation && $mark.$$annotated}`}>
                <InnerLine
                    merge={props}
                    className={$mark.line}
                />
            </div>
        )
    },
}

const lineNumber: AnnotationHandler = {
    name: "LineNumber",
    Line: ({annotation, ...props}) => {
        const width = props.totalLines.toString().length + 1

        return (
            <>
        <span
            style={{minWidth: `${width}ch`}}
            className={$lineNumber.host}
        >
          {props.lineNumber}
        </span>
                <InnerLine merge={props}/>
            </>
        )
    },
}

