import {promises as fs} from "fs";
import path from "path";

import {VFile} from "vfile";
import {compile as mdxCompile} from "@mdx-js/mdx";

import {mdOptions} from "../packages/md";

export async function compileBySlug(
    slug: string,
    mdx: boolean
): Promise<string> {
    // TODO: cwd ?
    const filePath = path.join(process.cwd(), `${slug}.${mdx ? "mdx" : "md"}`)

    await fs.access(filePath)

    const content = await fs.readFile(filePath, "utf-8");

    return await compile(content, filePath)
}

async function compile(content: string, filePath: string): Promise<string> {
    const vfile = new VFile({
        path: filePath,
        value: content,
        contents: content
    });

    const opt = mdOptions({
        minDepth: 2 // TODO: configurable?
    })

    const compiled = await mdxCompile(vfile, {
        remarkPlugins: opt.remarkPlugins,
        rehypePlugins: opt.rehypePlugins,
        recmaPlugins: [],
        outputFormat: 'function-body',
        development: false,
    });

    return String(compiled)
}