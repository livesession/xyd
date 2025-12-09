import type {Plugin as Vite} from "vite"
import React from "react"
import { Plugin as MarkdownPlugin } from 'unified';

import {type UniformPlugin as Uniform} from "@xyd-js/uniform"
import {HeadConfig, Settings} from "@xyd-js/core"
import type {SurfaceTarget} from "@xyd-js/framework"

// // TODO: share with theme-api ?
// export interface PluginCustomComponents {
//     component: React.ComponentType<any>
//     surface: SurfaceTarget
// }

export type PluginComponents = {
    component: React.ComponentType<any>,
    name?: string,
    dist?: string // TODO: fix in the future
    isInline?: boolean // true if component should be inlined instead of imported
}[] | {
    [component: string]: React.ComponentType<any>
}

/**
 * Plugin interface
 *
 * @example
 * ```ts
 * function myPlugin(): Plugin {
 *     return {
 *         name: "my-plugin",
 *         vite: [
 *             {
 *                 name: "my-vite-plugin",
 *             }
 *         ],
 *         uniform: [
 *             pluginOpenAIMeta,
 *         ],
 *         atlas: {
 *             components: {
 *             }
 *         }
 *     }
 * }
 * ```
 */
export interface PluginConfig {
    name: string

    vite?: Vite[]
    uniform?: Uniform<any>[] // TODO: fix any
    components?: PluginComponents
    head?: HeadConfig[]
    markdown?: {
        remark: MarkdownPlugin[],
        rehype: MarkdownPlugin[],
    },
    hooks?: {
        //  TODO: types
        applyComponents?: (cfg: any) => boolean
    }
}

export type Plugin = (settings: Readonly<Settings>) => PluginConfig

// atlas?: { // TODO: in the future
//     components?: any
// }
// customComponents?: {
//     [name: string]: PluginCustomComponents
// },
