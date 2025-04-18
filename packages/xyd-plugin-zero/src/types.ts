import {Plugin as VitePlugin} from "vite"
import {RouteConfigEntry} from "@react-router/dev/routes";

import {Settings} from "@xyd-js/core";

type VitePluginData = {
    preinstall: any // TODO: fix any
}

export interface PresetData {
    routes: RouteConfigEntry[]
}

export type Preset<T> = (
    settings?: Settings,
    options?: T
) => {
    // TODO: args and return should be based on passed preinstall plugin
    preinstall: ((options?: any) => (settings: Settings, data: PresetData) => Promise<any>)[]
    routes: RouteConfigEntry[]
    // TODO: 'data' comes from merged object of preinstall
    vitePlugins: (() => (data: VitePluginData) => Promise<VitePlugin>)[]
}

export interface PluginOutput {
    vitePlugins: VitePlugin[],

    settings: Settings,

    routes: RouteConfigEntry[]
}

export type Plugin = () => Promise<PluginOutput | null>
