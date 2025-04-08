import remarkFrontmatter from "remark-frontmatter";
import remarkMdxFrontmatter from "remark-mdx-frontmatter";
import remarkGfm from "remark-gfm";
import remarkDirective from 'remark-directive'

import {remarkMdxToc, RemarkMdxTocOptions} from "./mdToc";
import {remarkInjectCodeMeta} from "./mdCode";
import {extractThemeSettings} from "./mdThemeSettings";
import {extractPage} from "./mdPage";
import {mdCodeGroup} from "./mdCodeGroup";
import {remarkDirectiveWithMarkdown} from "./mdComponentDirective";

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
        mdCodeGroup, // TODO: to delete (use remarkDirectiveWithMarkdown)
        remarkDirectiveWithMarkdown
    ]
}