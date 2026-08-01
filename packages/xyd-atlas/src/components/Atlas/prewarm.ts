import type { Theme } from "@code-hike/lighter";
import { prewarmHighlight, type CodeThemeBlockProps } from "@xyd-js/components/coder";

/**
 * Pre-highlight a reference's (default) code samples INTO the shared highlight
 * cache WITHOUT rendering them — so when that reference is scrolled into view in
 * a virtualized list its code samples paint instantly (no loader flash). Mirrors
 * `ApiRefSamples`' `createCodeblocks` (example 0 per group, the one shown by
 * default). Idempotent + never throws.
 */
export async function prewarmReference(reference: any, theme?: Theme): Promise<void> {
    const codeblocks: CodeThemeBlockProps[] = [];

    for (const group of reference?.examples?.groups ?? []) {
        const example = group?.examples?.[0];
        for (const tab of example?.codeblock?.tabs ?? []) {
            codeblocks.push({
                value: String(tab.code || ""),
                lang: String(tab.language || ""),
                meta: String(tab.context || ""),
                highlighted: tab.highlighted,
            });
        }
    }

    await prewarmHighlight(codeblocks, theme);
}
