import remarkFrontmatter from "remark-frontmatter";
import remarkMdxFrontmatter from "remark-mdx-frontmatter";
import remarkGfm from "remark-gfm";

import {remarkMdxToc, RemarkMdxTocOptions} from "@/mdx/toc";
import {remarkInjectCodeMeta} from "@/mdx/code";

export function mdxOptions(toc: RemarkMdxTocOptions) {
    return {
        remarkPlugins: [
            remarkFrontmatter,
            remarkMdxFrontmatter,
            remarkGfm,
            remarkInjectCodeMeta,
            remarkMdxToc(toc)
        ],
        rehypePlugins: []
    }
}