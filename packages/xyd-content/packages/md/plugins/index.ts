import remarkFrontmatter from "remark-frontmatter";
import remarkMdxFrontmatter from "remark-mdx-frontmatter";
import remarkGfm from "remark-gfm";
import remarkDirective from 'remark-directive'

import {remarkMdxToc, RemarkMdxTocOptions} from "./md-toc";
import {remarkInjectCodeMeta} from "./md-code";
import {extractThemeSettings} from "./md-themeSettings";
import {extractPage} from "./md-page";
import {mdCodeGroup} from "./md-codegroup";

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
        mdCodeGroup
    ]
}