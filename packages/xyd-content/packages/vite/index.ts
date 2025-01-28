import type {Plugin} from 'rollup';
import mdx from '@mdx-js/rollup';

import {RemarkMdxTocOptions, mdOptions} from "../md";

export interface VitePluginInterface {
    toc: RemarkMdxTocOptions
}

export function vitePlugins(options: VitePluginInterface): Plugin[] {
    return [
        mdx(mdOptions(options.toc)),
    ];
}