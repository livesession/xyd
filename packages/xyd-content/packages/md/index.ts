import { Settings } from "@xyd-js/core";
import { Plugin } from 'unified';

import { defaultRecmaPlugins, defaultRehypePlugins, defaultRemarkPlugins } from "./plugins"
import { RemarkMdxTocOptions } from "./plugins/mdToc";

export { RemarkMdxTocOptions, } from "./plugins/mdToc";
export { mapSettingsToDocSections } from "./search"
export type { DocSectionSchema } from "./search/types"

export async function markdownPlugins(
    toc: RemarkMdxTocOptions, // TODO: unify this cuz it should come from core -global settings and toc options?
    settings?: Settings
): Promise<{
    remarkPlugins: Plugin[];
    rehypePlugins: Plugin[];
    recmaPlugins: Plugin[];
}> {
    const remarkPlugins = [...defaultRemarkPlugins(toc, settings)]

    const rehypePlugins = [...(await defaultRehypePlugins(settings))]

    const recmaPlugins = [...defaultRecmaPlugins(settings)]

    return {
        remarkPlugins,
        rehypePlugins,
        recmaPlugins,
    }
}