import type {Plugin as Vite} from "vite"
import React from "react"
import { Plugin as MarkdownPlugin } from 'unified';

import {type UniformPlugin as Uniform} from "@xyd-js/uniform"
import {HeadConfig, Settings, Metadata} from "@xyd-js/core"
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

export interface HookCallbackArgs {
    metadata: Metadata<any>
}

/**
 * Plugin interface
 *
 * @example
 * ```ts
 * function myPlugin(): Plugin {
 *     return (settings) => {
 *         return {
 *             name: "my-plugin",
 *             vite: [
 *                 {
 *                     name: "my-vite-plugin",
 *                 }
 *             ],
 *             uniform: [
 *                 pluginOpenAIMeta,
 *             ],
 *             components: [
 *                 {
 *                     component: MyComponent,
 *                     name: "MyComponent",
 *                     dist: "./dist/MyComponent.js"
 *                 }
 *             ],
 *             head: [
 *                 ["style", {}, "body { margin: 0; }"]
 *             ],
 *             markdown: {
 *                 remark: [remarkPlugin],
 *                 rehype: [rehypePlugin],
 *             },
 *             hooks: {
 *                 applyComponents(cfg) {
 *                     return cfg?.metadata?.component === "my-plugin";
 *                 }
 *             }
 *         }
 *     }
 * }
 * ```
 */
/**
 * A custom page registered by a plugin.
 * Renders a React component inside the xyd theme layout at a given route.
 */
export interface PluginPage {
    /** Route path (e.g., "/login", "/auth/callback") */
    route: string
    /** React component to render as the page content */
    component: React.ComponentType<any>
    /** Component dist path for bundling (like PluginComponents.dist) */
    dist?: string
    /** Page metadata (title, description, etc.) */
    metadata?: Partial<Metadata<any>>
    /** If true, page is public even when access control defaultAccess is "protected" */
    public?: boolean
    /**
     * Whether to inherit the theme's CSS (design tokens, fonts, etc.).
     * When true (default), the page has access to all xyd CSS variables.
     * Set to false for fully standalone pages with no theme dependency.
     * @default true
     */
    layoutCss?: boolean
}

export interface PluginConfig {
    name: string

    vite?: Vite[]
    uniform?: Uniform<any>[] // TODO: fix any
    components?: PluginComponents
    /** Custom pages rendered inside the theme layout at specified routes */
    pages?: PluginPage[]
    head?: HeadConfig[]
    markdown?: {
        remark?: MarkdownPlugin[],
        rehype?: MarkdownPlugin[],
        remarkRehypeHandlers?: any // TODO: fix any
    },
    hooks?: {
        //  TODO: types
        applyComponents?: (cfg: HookCallbackArgs) => boolean

        // TODO: finish
        // applyHeads?: (cfg: any) => boolean
    }
}

export type Plugin = (settings: Readonly<Settings>) => PluginConfig

// atlas?: { // TODO: in the future
//     components?: any
// }
// customComponents?: {
//     [name: string]: PluginCustomComponents
// },