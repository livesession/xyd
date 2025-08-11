import type {Plugin} from 'rollup';
import mdx from '@mdx-js/rollup';

import {Settings} from "@xyd-js/core";

import {RemarkMdxTocOptions, markdownPlugins} from "../md";

export interface VitePluginInterface {
    toc: RemarkMdxTocOptions
    settings: Settings
}

export async function vitePlugins(options: VitePluginInterface): Promise<Plugin[]> {
    return [
        mdx(await markdownPlugins(
            options.toc,
            options.settings
        )),
    ];
}