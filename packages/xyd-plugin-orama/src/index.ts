import type { Plugin, ResolvedConfig } from 'vite'

import type { Settings } from '@xyd-js/core'
import { mapSettingsToDocSections, type DocSectionSchema } from '@xyd-js/content/md'

import { DEFAULT_SUGGESTIONS } from './const'
import type { OramaPluginOptions, OramaCloudConfig, OramaSectionSchema } from './types'

export function OramaPlugin(
    xydSettings: Settings,
    pluginOptions: OramaPluginOptions = {}
): Plugin {
    const virtualModuleId = 'virtual:xyd-plugin-orama-data'
    const resolvedVirtualModuleId = `\0${virtualModuleId}`

    let resolveConfig: ResolvedConfig | null = null

    return {
        name: 'xyd-plugin-orama',
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

            let cloudConfig: OramaCloudConfig | null = null
            if (pluginOptions.endpoint && pluginOptions.apiKey) {
                cloudConfig = {
                    endpoint: pluginOptions.endpoint,
                    api_key: pluginOptions.apiKey
                }
            }

            const sections = (await mapSettingsToDocSections(xydSettings)).map(mapDocSectionsToOrama)

            return `
                const docs = ${JSON.stringify(sections)};
                const cloudConfig = ${JSON.stringify(cloudConfig)};
                const suggestions = ${JSON.stringify(pluginOptions.suggestions || DEFAULT_SUGGESTIONS)};

                export default { docs, cloudConfig, suggestions };
            `
        }
    }
}

function mapDocSectionsToOrama(doc: DocSectionSchema): OramaSectionSchema {
    return {
        category: '', // TODO: finih

        path: doc.pageUrl,

        title: doc.headingTitle,

        description: doc.content,

        content: doc.content,

        // section: doc.content,
        // version: string
    }
}

