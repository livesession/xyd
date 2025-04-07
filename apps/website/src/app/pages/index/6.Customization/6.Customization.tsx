import {parseRoot} from "codehike/blocks";
import {highlight, Pre, RawCode} from "codehike/code";

import CodeSnippets from "./CodeSnippets.mdx"
import {FeaturesShowcase} from "./FeaturesShowcase";

interface CodeSnippets {
    componentsLibrary: RawCode
    pageRendering: RawCode
    themeAPI: RawCode
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
    const composableArchitectureCode = <Code codeblock={data.composableArchitecture}/>

    return <div id="customization">
        <FeaturesShowcase
            codeSnippets={{
                componentsLibrary: componentsLibraryCode,
                pageRendering: pageRenderingCode,
                themeAPI: themeAPICode,
                composableArchitecture: composableArchitectureCode
            }}
        />
    </div>
}

export async function Code({codeblock}: { codeblock: RawCode }) {
    const highlighted = await highlight(codeblock, "material-default")
    return (
        <Pre
            code={highlighted}
        />
    )
}
