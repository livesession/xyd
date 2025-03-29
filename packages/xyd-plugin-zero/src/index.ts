import {Settings} from "@xyd-js/core";
import type {Plugin as VitePlugin} from "vite";
import {RouteConfigEntry} from "@react-router/dev/routes";

import {docsPreset} from "./presets/docs";
import {graphqlPreset} from "./presets/graphql";
import {openapiPreset} from "./presets/openapi";
import {sourcesPreset} from "./presets/sources";

import type {PluginOutput, Plugin} from "./types";

// TODO: better plugin runner
// TODO: REFACTOR
export async function pluginZero(): Promise<PluginOutput | null> {
    let settings: Settings | null = null
    const vitePlugins: VitePlugin[] = []
    const routes: RouteConfigEntry[] = []

    // base docs preset setup
    {
        const options = {
            urlPrefix: "" // TODO: configurable
        }

        const docs = docsPreset(undefined, options)
        docs.preinstall = docs.preinstall || []

        let preinstallMerge = {}

        for (const preinstall of docs.preinstall) {
            const resp = await preinstall()({}, {
                routes: docs.routes
            })

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
        throw new Error("settings not found")
    }

    // graphql preset setup
    if (settings?.api?.graphql) {
        const options = {}

        const gql = graphqlPreset(settings, options)
        gql.preinstall = gql.preinstall || []

        let preinstallMerge = {}

        for (const preinstall of gql.preinstall) {
            const resp = await preinstall(options)(settings, {
                routes: gql.routes
            })

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

    // openapi preset setup
    if (settings?.api?.openapi) {
        const options = {}

        const oap = openapiPreset(settings, options)
        oap.preinstall = oap.preinstall || []

        let preinstallMerge = {}

        for (const preinstall of oap.preinstall) {
            const resp = await preinstall(options)(settings, {
                routes: oap.routes
            })

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

    if (settings?.api?.sources) {
        const options = {
            root: "" // TODO: FINISH
        }

        const src = sourcesPreset(settings, options)
        src.preinstall = src.preinstall || []

        let preinstallMerge = {}

        for (const preinstall of src.preinstall) {
            const resp = await preinstall(options)(settings, {
                routes: src.routes
            })

            if (resp && typeof resp === 'object') {
                preinstallMerge = {
                    ...preinstallMerge,
                    ...resp
                }
            }
        }

        src.vitePlugins = src.vitePlugins || []
        for (const vitePlugin of src.vitePlugins) {
            const vitePlug = await vitePlugin()({
                preinstall: preinstallMerge
            })

            vitePlugins.push(vitePlug)
        }

        src.routes = src.routes || []
        routes.push(...src.routes)
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

