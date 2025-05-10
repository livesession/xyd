import type { Plugin as Vite } from "vite"

import { type UniformPlugin as Uniform } from "@xyd-js/uniform"
import { Settings } from "@xyd-js/core"

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

    atlas?: {
        components?: any
    }
}

export type Plugin = (settings: Settings) => PluginConfig