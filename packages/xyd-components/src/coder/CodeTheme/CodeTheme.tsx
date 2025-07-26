import React, { createContext, useState, use, useEffect, Suspense } from "react";
import { Theme } from "@code-hike/lighter";
import { highlight } from "codehike/code";
import type { HighlightedCode as CodeHikeHighlightedCode } from "codehike/code";

import defaultTheme from "../themes/cosmo"
import { Loader } from "../../kit";

export interface CodeThemeProps {
    codeblocks?: CodeThemeBlockProps[];
    theme?: Theme
    children: React.ReactNode;
}

export interface SyntaxHighlightedCode extends CodeHikeHighlightedCode {
    title?: string
}

export interface CodeThemeBlockProps {
    /** This is the raw code. May include annotation comments. */
    value: string;
    /** The programming language. */
    lang: string;
    /** Metadata string (the content after the language name in a markdown codeblock). */
    meta: string;

    title?: string

    /** The highlighted code. */
    highlighted?: SyntaxHighlightedCode
}

const CodeThemeProvider = createContext<{
    highlighted: SyntaxHighlightedCode[];
}>({
    highlighted: [],
});

export function useCodeTheme() {
    return use(CodeThemeProvider);
}

// TODO: lazy-loading - some codeblocks on server and another on client
// TODO: lazdy client loading only on specific codeblock
export function CodeTheme(props: CodeThemeProps) {
    // Initialize with server-side highlighted codeblocks
    const [highlighted, setHighlighted] = useState<HighlightedCode[] | undefined>(initializeHighlighted(props.codeblocks));
    const [clientSideFetch, setClientSideFetch] = useState(true)

    useEffect(() => {
        setHighlighted(initializeHighlighted(props.codeblocks))
    }, [props.codeblocks])

    useEffect(() => {
        if (!props.codeblocks) {
            return;
        }

        // Check if we need to highlight any codeblocks
        const needsHighlighting = props.codeblocks.some(
            codeblock => !codeblock.highlighted || !codeblock.highlighted.tokens
        );

        if (needsHighlighting) {
            clientSideHighlight();
        }
    }, [props.codeblocks]);

    function initializeHighlighted(codeblocks: any) {
        if (!codeblocks) return [];

        return codeblocks.map(codeblock => {
            if (codeblock.highlighted && codeblock.highlighted.tokens) {
                return {
                    ...codeblock.highlighted,
                    meta: codeblock.highlighted?.meta || codeblock.meta,
                    title: codeblock.title
                };
            }

            return null
        }).filter(Boolean) as SyntaxHighlightedCode[]
    }

    async function clientSideHighlight() {
        if (!props.codeblocks) {
            return;
        }

        const allHighlighted = props.codeblocks.every(codeblock => codeblock.highlighted)
        if (allHighlighted) {
            return;
        }
        
        const newHighlighted = await fetchHighlight(props.codeblocks, props.theme || defaultTheme);
        setHighlighted(newHighlighted)

        setClientSideFetch(false)
    }

    const withTheme = <CodeThemeProvider
        value={{
            highlighted: highlighted || [],
        }}
    >
        {props.children}
    </CodeThemeProvider>

    const allHighlighted = props.codeblocks?.every(codeblock => codeblock.highlighted)
    if (allHighlighted) {
        return withTheme
    }

    if (clientSideFetch) {
        return <Loader />
    }

    return withTheme
}

// TODO: own server with grammars (codehike)
async function fetchHighlight(codeblocks: CodeThemeBlockProps[], theme: Theme) {
    return await Promise.all(
        codeblocks?.map((codeblock) => highlight(codeblock, theme))
    );
}
