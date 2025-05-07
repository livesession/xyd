import fs from "fs/promises"

import { VFile } from "vfile"
import { PluggableList } from "unified";
import { compile as mdxCompile } from "@mdx-js/mdx";

import { Settings } from "@xyd-js/core"

export {
    pageFrontMatters,
    filterNavigationByLevels
} from "./navigation"

export type { VarCode } from "./types"

export class ContentFS {
    constructor(
        private readonly settings: Settings,
        private readonly remarkPlugins: PluggableList,
        private readonly rehypePlugins: PluggableList,
    ) { }

    public async compile(filePath: string): Promise<string> {
        await fs.access(filePath)

        const content = await fs.readFile(filePath, "utf-8");

        const vfile = new VFile({
            path: filePath,
            value: content,
            contents: content
        });

        const compiled = await mdxCompile(vfile, {
            remarkPlugins: this.remarkPlugins,
            rehypePlugins: this.rehypePlugins,
            recmaPlugins: [],
            outputFormat: 'function-body',
            development: false,
        });

        return String(compiled)
    }

    public async readRaw(filePath: string) {
        await fs.access(filePath)

        const content = await fs.readFile(filePath, "utf-8");

        return content
    }
}
