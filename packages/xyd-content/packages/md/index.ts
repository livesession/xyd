import { Settings } from "@xyd-js/core";

import { defaultRehypePlugins, defaultRemarkPlugins } from "./plugins"
import { RemarkMdxTocOptions } from "./plugins/mdToc";

export { RemarkMdxTocOptions, } from "./plugins/mdToc";
export { mapSettingsToDocSections } from "./search"
export type { DocSectionSchema } from "./search/types"

export function markdownPlugins(
    toc: RemarkMdxTocOptions, // TODO: unify this cuz it should come from core -global settings and toc options?
    settings?: Settings
) {
    const remarkPlugins = [...defaultRemarkPlugins(toc, settings)]

    const rehypePlugins = [...defaultRehypePlugins(settings)]

    return {
        remarkPlugins,
        rehypePlugins,
    }
}