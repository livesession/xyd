import { tmpdir } from "os";
import { join } from "path";
import { pathToFileURL } from "url";
import fs, { rm, writeFile } from "fs/promises"

import { VFile } from "vfile"
import { PluggableList } from "unified";
import { compile as mdxCompile } from "@mdx-js/mdx";

import { Settings } from "@xyd-js/core"

export type { VarCode } from "./types"

/**
 * Check if a path is a remote URL
 */
function isRemoteUrl(filePath: string): boolean {
    return filePath.startsWith('http://') || filePath.startsWith('https://');
}

/**
 * Fetch content from a remote URL
 */
async function fetchRemoteContent(url: string): Promise<string> {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
    }
    return response.text();
}

export class ContentFS {
    constructor(
        private readonly settings: Settings,
        private readonly remarkPlugins: PluggableList,
        private readonly rehypePlugins: PluggableList,
        private readonly recmaPlugins: PluggableList,
    ) { }

    public async compile(filePath: string): Promise<string> {
        let content: string;
        
        if (isRemoteUrl(filePath)) {
            // Handle remote URLs
            content = await fetchRemoteContent(filePath);
        } else {
            // Handle local files
            await fs.access(filePath);
            content = await fs.readFile(filePath, "utf-8");
        }

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
        if (isRemoteUrl(filePath)) {
            // Handle remote URLs
            return await fetchRemoteContent(filePath);
        } else {
            // Handle local files
            await fs.access(filePath);
            return await fs.readFile(filePath, "utf-8");
        }
    }
}
