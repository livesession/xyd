import remarkFrontmatter from "remark-frontmatter";
import remarkMdxFrontmatter from "remark-mdx-frontmatter";
import remarkGfm from "remark-gfm";
import remarkDirective from 'remark-directive'

import { Settings } from "@xyd-js/core";

import { remarkMdxToc, RemarkMdxTocOptions } from "./mdToc";
import { remarkInjectCodeMeta } from "./mdCode";
import { extractThemeSettings } from "./mdThemeSettings";
import { extractPage } from "./mdPage";
import { mdHeadingId } from "./mdHeadingId";
import { rehypeHeading } from "./rehypeHeading";
import { mdComponentDirective } from "./component-directives";
import { mdFunctionChangelog, mdFunctionImportCode, mdFunctionUniform } from "./functions"
import { mdCodeRehype } from "./developer-writing";
import { mdMeta } from "./meta";
import { mdComposer } from "./composer/mdComposer";
import { outputVars } from "./output-variables";

export function defaultRemarkPlugins(
    toc: RemarkMdxTocOptions,
    settings?: Settings
) {
    return [
        ...thirdPartyRemarkPlugins(),
        ...remarkPlugins(toc, settings),
    ]
}

function thirdPartyRemarkPlugins() {
    return [
        remarkFrontmatter,
        remarkMdxFrontmatter,
        remarkGfm,
        remarkDirective,
    ]
}

function remarkPlugins(
    toc: RemarkMdxTocOptions,
    settings?: Settings
) {
    return [
        mdHeadingId,
        remarkInjectCodeMeta,
        remarkMdxToc(toc),
        extractThemeSettings,
        extractPage,
        outputVars,
        mdComponentDirective(settings),
        mdComposer(settings),
        ...remarkFunctionPlugins(settings),
        mdMeta(settings),
    ]
}

function remarkFunctionPlugins(settings?: Settings) {
    return [
        mdFunctionImportCode(settings),
        mdFunctionUniform(settings),
        mdFunctionChangelog(),
    ]
}

export function defaultRehypePlugins(settings?: Settings) {
    return [
        rehypeHeading,
        mdCodeRehype(settings)
    ]
}
