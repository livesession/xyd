import * as React from "react";

import type { Theme as SyntaxHighlight } from "@code-hike/lighter";

/**
 * Main settings interface for the application
 */
export interface Settings {
    /** Theme configuration for the application */
    theme?: Theme

    /** Navigation configuration */
    navigation?: Navigation

    /** API configuration */
    api?: API

    /** Integrations configuration */
    integrations?: Integrations

    /** Plugins configuration */
    plugins?: Plugins

    /**
     * @unsafe
     *
     * Redirects configuration
     */
    redirects?: Redirects[]

    /**
     * @unsafe
     * SEO configuration
     */
    seo?: SEO

    /** Engine configuration */
    engine?: Engine
}

// ------ START settings for theme START ------
// #region Theme
/**
 * Theme configuration that changes the look and feel of the project
 */
export interface Theme {
    /**
     * A preset theme configuration that changes the look and feel of the project.
     * A theme is a set of default styling configurations.
     *
     * Example built-in themes: `cosmo`, `gusto`, `poetry`, `picasso`
     */
    readonly name: ThemePresetName | (string & {})

    /** Markdown configuration for the theme, including options like syntax highlighting */
    markdown?: Markdown

    /**
     * Path to logo image or object with path to "light" and "dark" mode logo images, and where the logo links to.
     * SVG format is recommended as it does not pixelate and the file size is generally smaller.
     */
    logo?: string | Logo | React.JSX.Element

    /**
     * Banner configuration for the theme.
     */
    banner?: Banner

    /** Path to the favicon image. For example: /path/to/favicon.svg */
    favicon?: string;

    /** The defult level of the table of contents. */
    maxTocDepth?: number

    /** Head configuration */
    head?: HeadConfig[]

    /** The iconify library */
    icons?: Icons
}
// #endregion Theme

/**
 * Configuration type for head elements that can be added to the HTML head.
 * Format: [tagName, attributes]
 *
 * @example: ['script', { src: 'https://example.com/script.js', defer: true }]
 */
type HeadConfig =
    | [string, Record<string, string | boolean>]

/**
 * Markdown configuration interface
 */
export interface Markdown {
    /** Syntax highlighting configuration */
    syntaxHighlight?: SyntaxHighlight
}

/**
 * Logo configuration interface
 */
export interface Logo {
    /** Path to the logo in light mode. For example: `/path/to/logo.svg` */
    light?: string;

    /** Path to the logo in dark mode. For example: `/path/to/logo.svg` */
    dark?: string;

    /** Where clicking on the logo links you to */
    href?: string;
}

/**
 * Banner configuration interface
 */
export interface Banner {
    /**
     * Banner content.
     */
    content: string | React.JSX.Element
}

export interface IconLibrary {
    /** The iconify library name */
    name: string

    /** The iconify library version */
    version?: string

    /** The default iconify icon name */
    default?: boolean

    /** Merge icons from the library into the default iconify library */
    noprefix?: boolean
}

export interface Icons {
    /** The iconify library */
    library?: string | string[] | IconLibrary | IconLibrary[]
}

/** Available theme preset names */
export type ThemePresetName = "poetry" | "cosmo" | "opener" | "picasso"

/** Search bar location options */
export type SearchType = "side" | "top"

// ------ END  settings for theme END ------


// ------ START  settings for navigation START ------
/**
 * Navigation configuration interface
 */
export interface Navigation {
    /** Definition of sidebar - an array of groups with all the pages within that group */
    sidebar: (SidebarRoute | Sidebar)[]

    /** Array of headers */
    header?: Header[]

    /** Array of sub headers */
    subheader?: SubHeader[]

    /**
     * Array of version names. Only use this if you want to show different versions of docs
     * with a dropdown in the navigation bar.
     */
    // versions?: string[]

    /** Anchors, includes the icon, name, and url */
    anchors?: AnchorRoot
}

/**
 * Sidebar multi-group configuration
 */
export interface SidebarRoute {
    /** Route for this sidebar group */
    route: string

    /** Sidebar items within this group */
    items: Sidebar[]
}

/**
 * Sidebar configuration
 */
export interface Sidebar {
    /** The name of the group */
    group?: string

    /**
     * The relative paths to the markdown files that will serve as pages.
     * Note: groups are recursive, so to add a sub-folder add another group object in the page array.
     */
    pages?: PageURL[]

    /**
     * The icon of the group.
     */
    icon?: string

    /**
     * The sort order of the group.
     */
    sort?: number
}

/**
 * Page URL type
 */
export type PageURL = string | VirtualPage | Sidebar

/**
 * @internal
 *
 * Virtual page type
 *
 * Virtual pages are composition of pages, needed for templating e.g in uniform
 *
 * Example:
 *
 * {
 *  pages: [0
 *    ".xyd/.cache/.content/docs/rest/todo:docs/rest/todo",
 *  ]
 * }
 *
 * above will be rendered as docs/rest/todo.md using composition from xyd's `.content`
 */
export type VirtualPage = string | {
    /** The virtual page to use for the page */
    virtual: string

    /** The page to use for the page */
    page: string

    /** The template to use for the page */
    templates?: string | string[]
}


/**
 * Sub-header configuration
 */
export interface SubHeader {
    /** Route for this sub-header */
    route: string

    /** Name of this sub-header */
    name: string

    /** Items within this sub-header */
    items: Header[]
}

/**
 * Header configuration
 */
export type Header = {
    /** The name of the button */
    name?: string

    /** The url once you click on the button */
    url?: string

    /** Float the header to the right */
    float?: "right"
}

/**
 * Anchor configuration
 */
export interface Anchor {
    /** The iconify icon name */
    icon?: string

    /** The name of the anchor label */
    name?: string

    /**
     * The start of the URL that marks what pages go in the anchor.
     * Generally, this is the name of the folder you put your pages in.
     */
    url?: string
}

/**
 * Anchor root configuration
 */
export interface AnchorRoot {
    /** Bottom anchors */
    bottom?: Anchor[]
}

// ------ END  settings for structure END ------


// ------ START  settings for API START ------
/**
 * API configuration interface
 */
export interface API {
    /**
     * OpenAPI configuration
     */
    openapi?: APIFile

    /**
     * GraphQL configuration
     */
    graphql?: APIFile

    /**
     * Sources configuration
     */
    sources?: APIFile
}

/**
 * API file configuration. Can be a path, an array of paths, a map of paths, or an advanced configuration
 */
export type APIFile = string | string[] | APIFileMap | APIFileAdvanced

/**
 * API file map type
 */
export type APIFileMap = {
    [name: string]: string | APIFileAdvanced
}

/**
 * API file advanced type
 */
export type APIFileAdvanced = {
    /** API information configuration */
    info?: APIInfo

    /** Route configuration */
    route: string
}

/**
 * API file type - can be a string, array of strings, or a map of strings
 */

/**
 * API information configuration
 */
export interface APIInfo {
    /**
     * The base url for all API endpoints. If baseUrl is an array, it will enable
     * for multiple base url options that the user can toggle.
     */
    baseUrl?: string

    /** Authentication information */
    auth?: APIAuth

    /**
     * The name of the authentication parameter used in the API playground.
     * If method is basic, the format should be [usernameName]:[passwordName]
     */
    name?: string

    /**
     * The default value that's designed to be a prefisx for the authentication input field.
     * E.g. If an inputPrefix of AuthKey would inherit the default input result of the authentication field as AuthKey.
     */
    inputPrefix?: string

    /** Configurations for the API playground */
    playground?: APIPlayground

    /** Request configuration */
    request?: APIInfoRequest
}

/**
 * API authentication configuration
 */
export interface APIAuth {
    /** The authentication strategy used for all API endpoints */
    method: "bearer" | "basic" | "key"
}

/**
 * API playground configuration
 */
export interface APIPlayground {
    /** Playground display mode */
    mode?: "show" | "simple" | "hide"
}

/**
 * API request configuration
 */
export interface APIInfoRequest {
    /** Configurations for the auto-generated API request examples */
    example?: {
        /**
         * An array of strings that determine the order of the languages of the auto-generated request examples.
         * You can either define custom languages utilizing x-codeSamples or use our default languages which include
         * bash, python, javascript, php, go, java
         */
        languages?: string[]
    }
}

// ------ END  settings for API END ------


// ------ START  settings for integrations START ------
/**
 * Integrations configuration
 */
export interface Integrations {
    /**
     * Configurations to add third-party analytics integrations.
     * See full list of supported analytics here.
     */
    analytics?: IntegrationAnalytics

    /**
     * Configurations to add third-party search integrations.
     * See full list of supported search here.
     */
    search?: IntegrationSearch
}

// #region IntegrationAnalytics
/**
 * Analytics configuration
 */
export interface IntegrationAnalytics {
    /** Livesession analytics configuration */
    livesession?: {
        /** Livesession's TrackID */
        trackId: string
    }
}
// #endregion IntegrationAnalytics

/**
 * Search configuration
 */
export interface IntegrationSearch {
    /** Algolia search configuration */
    algolia?: {
        /** Algolia application ID */
        appId: string

        /** Algolia API key */
        apiKey: string
    }

    orama?: {
        /** Orama endpoint */
        endpoint: string

        /** Orama API key */
        apiKey: string

        /** Orama suggestions */
        suggestions?: string[]
    } | boolean
}

// ------ END  settings for integrations END ------

// ------ START  settings for plugins START ------

/**
 * Plugin configuration
 *
 * @example
 * 1)
 * {
 *  plugins: [
 *    "livesession",
 *  ]
 * }
 *
 * or 2)
 * {
 *  plugins: [
 *    [
 *      "livesession",
 *      "accountID.websiteID",
 *      {
 *          keystrokes: true
 *      }
 *    ]
 *  ]
 * }
 *
 * you can also use the type to define the plugin config in your code:
 *
 * const livesessionPlugin: PluginConfig<"livesession", [string, { keystrokes: boolean }]> = [
 *    "livesession",
 *    "accountID.websiteID",
 *    {
 *        keystrokes: true
 *    }
 * ]
 */
export type Plugins = (string | PluginConfig)[]

export type PluginConfig<
    PluginName extends string = string,
    PluginArgs extends unknown[] = unknown[]
> = [PluginName, ...PluginArgs]


// ------ END  settings for plugins END ------

// ------ START  settings for redirecs START ------
/**
 * Redirects configuration
 */
export interface Redirects {
    /** Source path to redirect from */
    source: string

    /** Destination path to redirect to */
    destination: string
}

/**
 * SEO configuration
 */
export interface SEO {
    /**
     * Domain name
     */
    domain?: string

    /**
     * Meta tags
     */
    metatags?: {[tag: string]: string} // TODO: in the future type-safe
}

// ------ END  settings for redirects END ------

// ------ START settings for engine START ------
/**
 * Config configuration
 */
export interface Engine {
    /**
     * Path aliases for imports. Avoid long relative paths by creating shortcuts.
     *
     * @example
     * ```json
     * {
     *   "paths": {
     *     "@my-package/*": ["../my-package/src/*"],
     *     "@livesession-go/*": ["https://github.com/livesession/livesession-go/*"]
     *   }
     * }
     * ```
     *
     * Usage:
     * ```typescript
     * // Instead of
     * @importCode("../../../my-package/src/components/Badge.tsx")
     *
     * // Use
     * @importCode("@my-package/src/components/Badge.tsx")
     * ```
     */
    paths?: EnginePaths

    /**
     * @unsafe
     *
     * Uniform configuration
     *
     */
    uniform?: EngineUniform
}

export type EnginePaths = { [key: string]: string[] }

export type EngineUniform = {
    /**
     * If `true` then virtual pages will not created and generated content will be stored on disk
     */
    store?: boolean
}

// ------ END  settings for config END ------