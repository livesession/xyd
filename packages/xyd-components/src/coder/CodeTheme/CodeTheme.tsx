import React, { createContext, useState, use, useEffect, Suspense } from "react";
import { Theme } from "@code-hike/lighter";
import { highlight } from "codehike/code";
import type { HighlightedCode } from "codehike/code";

import defaultTheme from "../themes/cosmo-light"
import { Loader } from "../../kit";

export interface CodeThemeProps {
    codeblocks?: CodeThemeBlockProps[];
    theme?: Theme
    children: React.ReactNode;
}

export interface CodeThemeBlockProps {
    /** This is the raw code. May include annotation comments. */
    value: string;
    /** The programming language. */
    lang: string;
    /** Metadata string (the content after the language name in a markdown codeblock). */
    meta: string;

    /** The highlighted code. */
    highlighted?: HighlightedCode
}

const CodeThemeProvider = createContext<{
    highlighted: HighlightedCode[];
}>({
    highlighted: [],
});

export function useCodeTheme() {
    return use(CodeThemeProvider);
}

// TODO: lazy-loading - some codeblocks on server and another on client
export function CodeTheme(props: CodeThemeProps) {
    // Initialize with server-side highlighted codeblocks
    const [highlighted, setHighlighted] = useState<HighlightedCode[] | undefined>(() => {
        if (!props.codeblocks) return [];

        return props.codeblocks.map(codeblock => {
            if (codeblock.highlighted && codeblock.highlighted.tokens) {
                return {
                    ...codeblock.highlighted,
                    meta: codeblock.highlighted?.meta || codeblock.meta,
                };
            }

            return {};
        })
    });
    const [isClientSide, setIsClientSide] = useState(true)

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

    async function clientSideHighlight() {
        if (!props.codeblocks) {
            return;
        }

        // Only highlight codeblocks that don't already have highlighting
        const codeblocksToHighlight = props.codeblocks.filter(
            codeblock => !codeblock.highlighted || !codeblock.highlighted.tokens
        );

        if (codeblocksToHighlight.length === 0) {
            return;
        }

        const newHighlighted = await fetchHighlight(codeblocksToHighlight, props.theme || defaultTheme);

        // Merge with existing highlighted codeblocks
        setHighlighted(prevHighlighted => {
            if (!prevHighlighted) return newHighlighted;

            // Create a map of existing highlighted codeblocks
            const highlightedMap = new Map();
            prevHighlighted?.forEach((codeblock, index) => {
                if (codeblock.highlighted && codeblock.highlighted.tokens) {
                    highlightedMap.set(index, codeblock.highlighted);
                }
            });

            // Create the final array with all codeblocks highlighted
            const result: HighlightedCode[] = [];
            props.codeblocks?.forEach((_, index) => {
                if (highlightedMap.has(index)) {
                    result.push(highlightedMap.get(index));

                    return
                }

                // Find the corresponding newly highlighted codeblock
                const newIndex = codeblocksToHighlight.findIndex(
                    cb => cb.value === props.codeblocks![index].value
                );
                if (newIndex >= 0) {
                    result.push(newHighlighted[newIndex]);
                }
            });

            return result;
        });

        setIsClientSide(false)
    }

    const withTheme = <CodeThemeProvider
        value={{
            highlighted: highlighted || [],
        }}
    >
        {props.children}
    </CodeThemeProvider>

    const fullSsr = props.codeblocks?.every(codeblock => codeblock.highlighted)
    if (fullSsr) {
        return withTheme
    }

    if (isClientSide) {
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
