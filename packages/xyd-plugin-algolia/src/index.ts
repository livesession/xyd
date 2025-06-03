import type { Plugin as VitePlugin, ResolvedConfig } from 'vite'

import type { Settings } from '@xyd-js/core'
import type { Plugin } from '@xyd-js/plugins'

import type { AlgoliaPluginOptions } from './types'

export default function AlgoliaPlugin(
    pluginOptions?: AlgoliaPluginOptions
): Plugin {
    return function (settings: Settings) {
        return {
            name: "plugin-algolia",
            vite: [
                vitePlugin(
                    settings,
                    pluginOptions,
                )
            ]
        }
    }
}

function vitePlugin(
    settings: Settings,
    pluginOptions?: AlgoliaPluginOptions
): VitePlugin {
    const virtualModuleId = 'virtual:xyd-plugin-algolia-data'
    const resolvedVirtualModuleId = `\0${virtualModuleId}`

    let resolveConfig: ResolvedConfig | null = null


    return {
        name: 'xyd-plugin-algolia',
        enforce: 'pre',

        config: () => ({
            resolve: {
                alias: {
                    'virtual-component:Search': new URL('./Search.tsx', import.meta.url).pathname
                }
            }
        }),

        async configResolved(config: ResolvedConfig) {
            if (resolveConfig) {
                return
            }

            resolveConfig = config
        },

        async resolveId(id) {
            if (id === virtualModuleId) {
                return resolvedVirtualModuleId
            }
        },

        async load(this, id: string) {
            if (id !== resolvedVirtualModuleId) {
                return
            }

            const config = {
                appId: pluginOptions?.appId || "",
                apiKey: pluginOptions?.apiKey || "",
                indexName: pluginOptions?.indexName || ""
            }

            return `
            const config = ${JSON.stringify(config)};

            export default { config };
        `
        }
    }
}