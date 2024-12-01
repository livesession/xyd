import type {Plugin} from 'rollup';
import mdx from '@mdx-js/rollup';

import {RemarkMdxTocOptions} from "@/mdx/toc";
import {mdxOptions} from "@/mdx/options";

export interface VitePluginInterface {
    toc: RemarkMdxTocOptions
}

export function vitePlugins(options: VitePluginInterface): Plugin[] {
    return [
        mdx(mdxOptions(options.toc)),
    ];
}