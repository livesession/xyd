import remarkFrontmatter from "remark-frontmatter";
import remarkMdxFrontmatter from "remark-mdx-frontmatter";
import remarkGfm from "remark-gfm";
import remarkDirective from 'remark-directive'

import {Settings} from "@xyd-js/core";

import {remarkMdxToc, RemarkMdxTocOptions} from "./mdToc";
import {remarkInjectCodeMeta} from "./mdCode";
import {extractThemeSettings} from "./mdThemeSettings";
import {extractPage} from "./mdPage";
import {mdComponentDirective} from "./component-directives";
import {mdFunctionImportCode, mdFunctionUniform} from "./functions"
import {mdServerHighlight} from "./developer-writing";

export function defaultRemarkPlugins(
    toc: RemarkMdxTocOptions,
    settings?: Settings
) {
    return [
        remarkFrontmatter,
        remarkMdxFrontmatter,
        remarkGfm,
        remarkDirective,
        remarkMdxToc(toc),
        remarkInjectCodeMeta,
        extractThemeSettings,
        extractPage,

        mdComponentDirective(settings),

        ...remarkFunctionPlugins()
    ]
}

function remarkFunctionPlugins() {
    return [
        mdFunctionImportCode,
        mdFunctionUniform
    ]
}

export function defaultRehypePlugins(settings?: Settings) {
    return [
        mdServerHighlight(settings)
    ]
}
