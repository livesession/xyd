import {RemarkMdxTocOptions} from "./plugins/md-toc";
import {defaultPlugins} from "./plugins"

export {RemarkMdxTocOptions} from "./plugins/md-toc";

export function mdOptions(toc: RemarkMdxTocOptions) {
    return {
        remarkPlugins: [
            ...defaultPlugins(toc)
        ],
        rehypePlugins: []
    }
}