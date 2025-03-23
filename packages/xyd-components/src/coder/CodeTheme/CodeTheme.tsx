import React, { createContext, useState, use, useEffect } from "react";
import { Theme } from "@code-hike/lighter";
import { highlight } from "codehike/code";
import type { HighlightedCode } from "codehike/code";

import defaultTheme from "../themes/cosmo-light"

export interface CodeThemeProps {
  codeblocks: CodeThemeBlockProps[];
  children: React.ReactNode;
  theme?: Theme;
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
  highlighted: HighlightedCode[];
}>({
  highlighted: [],
});

export function useCodeTheme() {
  return use(CodeThemeProvider);
}

export function CodeTheme(props: CodeThemeProps) {
  const highlighted = use(
    fetchHighlight(props.codeblocks, props.theme || defaultTheme)
  );

  return (
    <CodeThemeProvider
      value={{
        highlighted,
      }}
    >
      {props.children}
    </CodeThemeProvider>
  );
}

// `CodeThemeSync` ?
export function CodeThemeCSR(props: CodeThemeProps) {
  const [highlighted, setHighlighted] = useState<HighlightedCode[]>([]);

  useEffect(() => {
    fetchHighlight(props.codeblocks, props.theme || defaultTheme).then(
      setHighlighted
    );
  }, [props.codeblocks, props.theme]);

  if (!highlighted) {
    return <div>loading${`...`}</div>;
  }

  return (
    <CodeThemeProvider
      value={{
        highlighted,
      }}
    >
      {props.children}
    </CodeThemeProvider>
  );
}

async function fetchHighlight(codeblocks: CodeThemeBlockProps[], theme: Theme) {
  return await Promise.all(
    codeblocks?.map((codeblock) => highlight(codeblock, theme))
  );
}
