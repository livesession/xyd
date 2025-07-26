import {parseRoot} from "codehike/blocks";
import {highlight, Pre, RawCode} from "codehike/code";
import React from 'react';

import CodeSnippets from "./CodeSnippets.mdx"
import {FeaturesShowcase} from "./FeaturesShowcase";
import {Feature} from "./types";
import { DEFAULT_CODE_THEME } from "@/app/const";

interface CodeSnippets {
    componentsLibrary: RawCode
    pageRendering: RawCode
    themeAPI: RawCode
    codeCustomization: RawCode
    composableArchitecture: RawCode
}

export async function Customization() {
    const data = parseRoot(CodeSnippets, undefined, {
        components: {
            Code
        }
    }) as CodeSnippets

    const componentsLibraryCode = <Code codeblock={data.componentsLibrary}/>
    const pageRenderingCode = <Code codeblock={data.pageRendering}/>
    const themeAPICode = <Code codeblock={data.themeAPI}/>
    const codeCustomizationCode = <Code codeblock={data.codeCustomization}/>
    const composableArchitectureCode = <Code codeblock={data.composableArchitecture}/>

    const features: Feature[] = [
        {
            id: 'components-library',
            name: 'Components library.',
            code: componentsLibraryCode
        },
        {
            id: 'theme',
            name: 'Theme API for customizations.',
            code: themeAPICode
        },
        {
            id: 'page-rendering',
            name: 'Page rendering freedom.',
            code: pageRenderingCode
        },
        {
            id: 'code-customization',
            name: 'Powerful code-based customization.',
            code: codeCustomizationCode
        },
        {
            id: 'composable-architecture',
            name: 'Composable architecture.',
            code: composableArchitectureCode
        },
    ];

    return <div id="customization">
        <FeaturesShowcase features={features} />
    </div>
}

export async function Code({codeblock}: { codeblock: RawCode }) {
    const highlighted = await highlight(codeblock, DEFAULT_CODE_THEME)
    return (
        <Pre
            code={highlighted}
        />
    )
}
