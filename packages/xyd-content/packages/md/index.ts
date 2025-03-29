import {RemarkMdxTocOptions} from "./plugins/mdToc";
import {defaultPlugins} from "./plugins"

export {RemarkMdxTocOptions} from "./plugins/mdToc";

export function mdOptions(toc: RemarkMdxTocOptions) {
    return {
        remarkPlugins: [
            ...defaultPlugins(toc)
        ],
        rehypePlugins: []
    }
}