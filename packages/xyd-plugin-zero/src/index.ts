import {Settings} from "@xyd/core";
import type {Plugin as VitePlugin} from "vite";
import {RouteConfigEntry} from "@react-router/dev/routes";

import {docsPreset} from "./presets/docs";
import {graphqlPreset} from "./presets/graphql";
import {openapiPreset} from "./presets/openapi";

import type {PluginOutput, Plugin} from "./types";

// TODO: where a plugin runner function should be placed?
// TODO: better plugin runner

// type VitePlugin = any

// TODO: return routes?
export async function pluginZero(): Promise<PluginOutput | null> {
    let settings: Settings | null = null
    const vitePlugins: VitePlugin[] = []
    const routes: RouteConfigEntry[] = []

    {
        const options = {
            urlPrefix: "/docs"
        }

        const docs = docsPreset(undefined, options)
        docs.preinstall = docs.preinstall || []

        let preinstallMerge = {}

        for (const preinstall of docs.preinstall) {
            const resp = await preinstall()()

            if (resp && typeof resp === 'object') {
                preinstallMerge = {
                    ...preinstallMerge,
                    ...resp
                }
            }
        }

        docs.vitePlugins = docs.vitePlugins || []
        for (const vitePlugin of docs.vitePlugins) {
            const vitePlug = await vitePlugin()({
                preinstall: preinstallMerge
            })

            vitePlugins.push(vitePlug)
        }

        if ("settings" in preinstallMerge) {
            settings = preinstallMerge.settings as Settings
        }

        docs.routes = docs.routes || []
        routes.push(...docs.routes)
    }

    if (!settings) {
        console.error('settings not found')
        return null
    }

    {
        const options = {}

        const gql = graphqlPreset(settings, options)
        gql.preinstall = gql.preinstall || []

        let preinstallMerge = {}

        for (const preinstall of gql.preinstall) {
            const resp = await preinstall(options)(settings)

            if (resp && typeof resp === 'object') {
                preinstallMerge = {
                    ...preinstallMerge,
                    ...resp
                }
            }
        }

        gql.vitePlugins = gql.vitePlugins || []
        for (const vitePlugin of gql.vitePlugins) {
            const vitePlug = await vitePlugin()({
                preinstall: preinstallMerge
            })

            vitePlugins.push(vitePlug)
        }

        gql.routes = gql.routes || []
        routes.push(...gql.routes)
    }

    {
        if (typeof settings?.api?.graphql === "string") {
        }

        const options = {}

        const oap = openapiPreset(settings, options)
        oap.preinstall = oap.preinstall || []

        let preinstallMerge = {}

        for (const preinstall of oap.preinstall) {
            const resp = await preinstall(options)(settings)

            if (resp && typeof resp === 'object') {
                preinstallMerge = {
                    ...preinstallMerge,
                    ...resp
                }
            }
        }

        oap.vitePlugins = oap.vitePlugins || []
        for (const vitePlugin of oap.vitePlugins) {
            const vitePlug = await vitePlugin()({
                preinstall: preinstallMerge
            })

            vitePlugins.push(vitePlug)
        }

        oap.routes = oap.routes || []
        routes.push(...oap.routes)
    }

    return {
        vitePlugins,
        settings,
        routes
    }
}

export type {
    Plugin,
    PluginOutput
}

