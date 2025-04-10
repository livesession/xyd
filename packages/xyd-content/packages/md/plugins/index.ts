import remarkFrontmatter from "remark-frontmatter";
import remarkMdxFrontmatter from "remark-mdx-frontmatter";
import remarkGfm from "remark-gfm";
import remarkDirective from 'remark-directive'

import { mdComponentDirective } from "./component-directives";
import { mdFunctionImportCode } from "./functions"
import { remarkMdxToc, RemarkMdxTocOptions } from "./mdToc";
import { remarkInjectCodeMeta } from "./mdCode";
import { extractThemeSettings } from "./mdThemeSettings";
import { extractPage } from "./mdPage";

export function defaultPlugins(toc: RemarkMdxTocOptions) {
    return [
        remarkFrontmatter,
        remarkMdxFrontmatter,
        remarkGfm,
        remarkDirective,
        remarkMdxToc(toc),
        remarkInjectCodeMeta,
        extractThemeSettings,
        extractPage,

        mdComponentDirective,

        ...functionPlugins()
    ]
}

function functionPlugins() {
    return [
        mdFunctionImportCode
    ]
}