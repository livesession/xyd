import { promises as fs } from "fs";
import path from "path";

import { PluggableList } from "unified";
import { VFile } from "vfile";
import { compile as mdxCompile } from "@mdx-js/mdx";

interface FsCompileOptions {
    remarkPlugins: PluggableList;
    rehypePlugins: PluggableList;
}

export async function compileBySlug(
    slug: string,
    mdx: boolean,
    opt?: FsCompileOptions
): Promise<string> {
    // TODO: cwd ?
    const filePath = path.join(process.cwd(), `${slug}.${mdx ? "mdx" : "md"}`)

    await fs.access(filePath)

    const content = await fs.readFile(filePath, "utf-8");

    const vfile = new VFile({
        path: filePath,
        value: content,
        contents: content
    });

    const compiled = await mdxCompile(vfile, {
        remarkPlugins: opt?.remarkPlugins || [],
        rehypePlugins: opt?.rehypePlugins || [],
        recmaPlugins: [],
        outputFormat: 'function-body',
        development: false,
    });

    return String(compiled)
}

