import path from "node:path";

import matter from "gray-matter";

import type { Settings } from "@xyd-js/core";

/**
 * A page's raw markdown with the body a generated page renders from its
 * frontmatter. A generated CLI command page holds only its frontmatter
 * (`cli: <source>#<command path>`); its `.md` twin gets the command itself,
 * as markdown, after it. A hand-written page with a `cli` frontmatter, in its
 * string or its object form (`cli: {path: ...}`), gets the same. Any other
 * page is returned as it is.
 */
export async function withGeneratedBody(
    content: string,
    filePath: string,
    settings: Settings,
    cliSpecs: Map<string, Promise<unknown>>,
): Promise<string> {
    let cli: unknown;
    try {
        cli = matter(content)?.data?.cli;
    } catch {
        return content;
    }
    if (!cli || (typeof cli !== "string" && typeof cli !== "object")) {
        return content;
    }

    try {
        const { cliPageMarkdown } = await import("@xyd-js/content");
        const body = await cliPageMarkdown(cli, settings, {
            pageDir: path.dirname(filePath),
            cache: cliSpecs,
        });
        if (!body) {
            return content;
        }

        return `${content.replace(/\s*$/, "")}\n\n${body}`;
    } catch (error) {
        const value = typeof cli === "string" ? cli : JSON.stringify(cli);
        console.warn(`Failed to render the markdown of ${value}:`, error);
        return content;
    }
}
