import { tmpdir } from "os";
import { join } from "path";
import { pathToFileURL } from "url";
import fs, { rm, writeFile } from "fs/promises"

import { VFile } from "vfile"
import { PluggableList } from "unified";
import { compile as mdxCompile } from "@mdx-js/mdx";

import { Settings } from "@xyd-js/core"

export type { VarCode } from "./types"

export class ContentFS {
    constructor(
        private readonly settings: Settings,
        private readonly remarkPlugins: PluggableList,
        private readonly rehypePlugins: PluggableList,
        private readonly recmaPlugins: PluggableList,
    ) { }

    public async compile(filePath: string): Promise<string> {
        await fs.access(filePath)

        const content = await fs.readFile(filePath, "utf-8");

        return await this.compileContent(content, filePath)
    }

    public async compileContent(content: string, filePath?: string): Promise<string> {
        const vfile = new VFile({
            path: filePath,
            value: content,
            contents: content
        });

        const compiled = await mdxCompile(vfile, {
            remarkPlugins: this.remarkPlugins,
            rehypePlugins: this.rehypePlugins,
            recmaPlugins: this.recmaPlugins || [],
            development: false,
            outputFormat: 'function-body',
            jsx: false,
            // jsx: false,
            // outputFormat: "program", // needed for import/export
        });

        return String(compiled)
    }


    public async compileContentV2(content: string, filePath?: string): Promise<string> {
        const vfile = new VFile({
            path: filePath,
            value: content,
            contents: content
        });

        const compiled = await mdxCompile(vfile, {
            remarkPlugins: this.remarkPlugins,
            rehypePlugins: this.rehypePlugins,
            recmaPlugins: [],
            development: false,
            jsx: true,
            outputFormat: "program", // needed for import/export
        });

        const tempPath = join(tmpdir(), `mdx-${Date.now()}.mjs`);
        await writeFile(tempPath, String(compiled), "utf8");

        return tempPath
    }

    public async readRaw(filePath: string) {
        await fs.access(filePath)

        const content = await fs.readFile(filePath, "utf-8");

        return content
    }
}
