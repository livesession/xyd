import type {Plugin} from 'rollup';
import mdx from '@mdx-js/rollup';

import {Settings} from "@xyd-js/core";

import {RemarkMdxTocOptions, markdownPlugins} from "../md";

export interface VitePluginInterface {
    toc: RemarkMdxTocOptions
    settings: Settings
}

export function vitePlugins(options: VitePluginInterface): Plugin[] {
    return [
        mdx(markdownPlugins(
            options.toc,
            options.settings
        )),
    ];
}