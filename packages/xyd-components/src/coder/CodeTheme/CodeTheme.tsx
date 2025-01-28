import React, {createContext, use} from "react";
import {Theme} from "@code-hike/lighter";
import {highlight} from "codehike/code";
import type {HighlightedCode} from "codehike/code";

import {theme as defaultTheme} from "./default-theme"

export interface CodeThemeProps {
    codeblocks: CodeThemeBlockProps[]
    children: React.ReactNode
    theme?: Theme
}

export interface CodeThemeBlockProps {
    /** This is the raw code. May include annotation comments. */
    value: string;
    /** The programming language. */
    lang: string;
    /** Metadata string (the content after the language name in a markdown codeblock). */
    meta: string;
}

const CodeThemeProvider = createContext<{
    highlighted: HighlightedCode[]
}>({
    highlighted: []
})

export function useCodeTheme() {
    return use(CodeThemeProvider)
}

export function CodeTheme(props: CodeThemeProps) {
    const highlighted = use(fetchHighlight(props.codeblocks, props.theme || defaultTheme));

    return <CodeThemeProvider value={{
        highlighted
    }}>
        {props.children}
    </CodeThemeProvider>
}

async function fetchHighlight(codeblocks: CodeThemeBlockProps[], theme: Theme) {
    return await Promise.all(
        codeblocks?.map((codeblock) => highlight(codeblock, theme))
    );
}

