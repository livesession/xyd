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

    /** API Docs configuration */
    api?: API

    /** Integrations configuration */
    integrations?: Integrations

    /** Plugins configuration */
    plugins?: Plugins

    /**
     * SEO configuration
     */
    seo?: SEO

    /** 
     * @internal
     * 
     * WebEditor configuration - building blocks for UI editing
     */
    webeditor?: WebEditor

    /**
     * 
     *  Components configuration
     */
    components?: Components

    /** Engine configuration - advanced engine-like configuration */
    engine?: Engine

    /**
     * @internal
     * Redirects configuration
     */
    redirects?: Redirects[]
}

// ------ START settings for theme START ------
// #region Theme
/**
 * Theme configuration that changes the look and feel of the project
 */
export interface Theme {
    /**
     * A theme name.
     */
    readonly name: ThemePresetName | (string & {})

    /**
     * Path to logo image or object with path to "light" and "dark" mode logo images, and where the logo links to.
     */
    logo?: string | Logo | React.JSX.Element

    /**
     * Font configuration for the theme.
     */
    fonts?: ThemeFont

    /**
     * Path to the favicon image. For example: /path/to/favicon.svg
     */
    favicon?: string;

    /**
     * The iconify library setup.
     */
    icons?: Icons

    /**
     * Appearance configuration for the theme.
     */
    appearance?: Appearance

    /**
     * Writer configuration for the theme.
     */
    writer?: Writer

    /**
     * Coder configuration for the theme, including options like syntax highlighting.
     */
    coder?: Coder

    /**
     * Head configuration
     */
    head?: HeadConfig[]

    /**
     * Custom scripts to be added to the head of the every page.
     * Paths are relative to the root of the project or absolute.
     */
    scripts?: Script[]
}

export type ThemeFont = Font | Font[] | {
    body?: Font | Font[]
    coder?: Font | Font[]
}
// #endregion Theme

export interface Font {
    /**
     * The font family to use.
     */
    family?: string;

    /**
     * The font weight to use.
     */
    weight?: string;

    /**
     * The font src to use.
     */
    src?: string;

    /**
     * The font format to use.
     */
    format?: "woff2" | "woff" | "ttf"
}

/**
 * Coder configuration for the theme, including options like syntax highlighting.
 */
export interface Coder {
    /**
     * If `true` then code blocks will have line numbers by default.
     */
    lines?: boolean

    /**
     * If `true` then code blocks will have a scrollbar by default.
     */
    scroll?: boolean

    /**
     * Syntax highlighting configuration.
     */
    syntaxHighlight?: SyntaxHighlight
}

export interface Writer {
    /**
     * The maximum number of table of conten§ts levels.
     */
    maxTocDepth?: number

    /**
     * Copy page button
     */
    copyPage?: boolean
}

/**
 * Appearance configuration for the theme.
 */
export interface Appearance {
    /**
     * The default color scheme to use.
     */
    colorScheme?: "light" | "dark" | "os"

    /**
     * Colors configuration for the theme.
     */
    colors?: Colors

    /**
     * CSS tokens for the theme.
     */
    cssTokens?: { [token: string]: string }

    // TODO: global and theme presets?
    /**
     * Presets for the theme.
     */
    presets?: string[]

    /**
     * Logo appearance for the theme.
     */
    logo?: AppearanceLogo

    /**
     * Search appearance for the theme.
     */
    search?: AppearanceSearch

    /**
     * Header appearance for the theme.
     */
    header?: AppearanceHeader

    /**
     * Tabs appearance for the theme.
     */
    tabs?: AppearanceTabs

    /**
     * Sidebar appearance for the theme.
     */
    sidebar?: AppearanceSidebar

    /**
     * Buttons appearance for the theme.
     */
    buttons?: AppearanceButtons

    /**
     * Banner appearance for the theme.
     */
    banner?: AppearanceBanner

    /**
     * Content appearance for the theme.
     */
    content?: AppearanceContent

    /**
     * Footer appearance for the theme.
     */
    footer?: AppearanceFooter
}

export interface Colors {
    /**
     * The primary color of the theme.
     */
    primary: string

    /**
     * The light color of the theme.
     */
    light?: string

    /**
     * The dark color of the theme.
     */
    dark?: string
}

export interface AppearanceTabs {
    /**
     * The tabs to display in the header.
     */
    surface?: "center" | "sidebar"
}

/**
 * AppearanceLogo configuration for the theme.
 */
export interface AppearanceLogo {
    /**
     * If `true` then the logo will be displayed on the sidebar.
     */
    sidebar?: boolean | "mobile" | "desktop"

    /**
     * If `true` then the logo will be displayed on the header.
     */
    header?: boolean | "mobile" | "desktop"
}

export interface AppearanceContent {
    /**
     * Content decorator for the theme.
     */
    contentDecorator?: "secondary"

    /**
     * If `true` then the breadcrumbs will be displayed.
     */
    breadcrumbs?: boolean

    /**
     * If `true` then the section separator will be displayed.
     */
    sectionSeparator?: boolean;
}

export interface AppearanceFooter {
    /**
     * The footer surface.
     */
    surface?: "page"
}

export interface AppearanceSearch {
    /**
     * If `true` then the search bar will be displayed as a full width.
     */
    fullWidth?: boolean

    /**
     * If `true` then the search bar will be displayed on the sidebar.
     */
    sidebar?: boolean | "mobile" | "desktop"

    /**
     * If `true` then the search bar will be displayed in the middle of the header.
     */
    middle?: boolean | "mobile" | "desktop"

    /**
     * If `true` then the search bar will be displayed on the right side of the header.
     */
    right?: boolean | "mobile" | "desktop"
}

export interface AppearanceHeader {
    /**
     * If `true` then the header external links will display an external arrow.
     */
    externalArrow?: boolean

    /**
     * If `right` then separator will be displayed on the right side of the header.
     */
    separator?: "right"

    /**
     * The type of the header.
     */
    type?: "classic" | "pad"

    /**
     * The button size of the header.
     */
    buttonSize?: "sm" | "md" | "lg"
}

export interface AppearanceSidebar {
    /**
     * If `true` then the sidebar will display a scroll shadow.
     */
    externalArrow?: boolean

    /**
     * If `true` then the sidebar will display a scroll shadow.
     */
    scrollShadow?: boolean

    /**
     * The color of the sidebar scrollbar.
     */
    scrollbar?: "secondary"

    /**
     * The color of the sidebar scrollbar.
     */
    scrollbarColor?: string
}

export interface AppearanceButtons {
    rounded?: boolean | "lg" | "md" | "sm"
}

export interface AppearanceBanner {
    /**
     * If `true` then the banner will have fixed position (always visible).
     */
    fixed?: boolean
}

/**
 * Configuration type for head elements that can be added to the HTML head.
 * Format: [tagName, attributes]
 *
 * @example: ['script', { src: 'https://example.com/script.js', defer: true }]
 */
export type HeadConfig =
    | [string, Record<string, string | boolean>, string?]

export type Script = string

/**
 * Logo configuration interface
 */
export interface Logo {
    /** Path to the logo in light mode. For example: `/path/to/logo.svg` */
    light?: string;

    /** Path to the logo in dark mode. For example: `/path/to/logo.svg` */
    dark?: string;

    /** External href to when clicking on the logo */
    href?: string;

    /** The page to link to when clicking on the logo */
    page?: string
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
    library?: string | IconLibrary | (string | IconLibrary)[]
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
    /**
     * Sidebar navigation - main navigation on the left side of the page.
     */
    sidebar: SidebarNavigation

    /**
     * Tabs navigation - navigation through tabs.
     */
    tabs?: Tabs

    /**
     * Sidebar dropdown navigation - navigation through dropdown in the sidebar.
     */
    sidebarDropdown?: SidebarDropdown

    /**
     * Segments navigation - navigation elements visible only on specific routes.
     */
    segments?: Segment[]

    /**
     * Anchors navigation - fixed navigation, for anchor-like elements.
     */
    anchors?: Anchors

    /**
     * Array of version names. Only use this if you want to show different versions of docs
     * with a dropdown in the navigation bar.
     */
    // versions?: string[]
}

export type SidebarDropdown = NavigationItem[]

/**
 * Tabs configuration
 */
export type Tabs = NavigationItem[]

/**
 * Sidebar navigation type
 */
export type SidebarNavigation = (SidebarRoute | Sidebar | string)[]

/**
 * Sidebar route configuration
 */
export interface SidebarRoute {
    /** Route for this sidebar */
    route: string

    /** The group of the route */
    group?: string | false

    /** The id of the route */
    id?: string

    /** Sidebar pages within this route or sub routes */
    pages: Sidebar[] | SidebarRoute[]
}

// TODO: rename to NavigationGroup ?

/**
 * Sidebar configuration
 */
export interface Sidebar {
    /** The name of the group */
    group?: string | false

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
     * The order of the group.
     */
    order?: Order
}

type Order =
  | 0
  | -1
  | { after: string }
  | { before: string };

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
 * Segment configuration
 */
export interface Segment {
    /** Route for this segment */
    route: string

    /** Title of this segment */
    title?: string

    /** Appearance of this segment. If 'sidebarDropdown' then show this segment as a dropdown in the sidebar if match. */
    appearance?: "sidebarDropdown"

    /** Items within this segment */
    pages: NavigationItem[]
}

/**
 * Core interface for navigation items
 */
export interface NavigationItem {
    /**
     * The navigation item title
     */
    title?: string

    /**
     * The navigation item description
     */
    description?: string

    /**
     * The navigation page, if set it redirects to the page + matches based on routing
     */
    page?: string

    /**
     * The navigation href, if set it redirects but does not match based on routing
     */
    href?: string

    /**
     * The navigation item icon
     */
    icon?: string | React.ReactNode
}

export type NavigationItemButton = NavigationItem & {
    button: "primary" | "secondary"
}

export type NavigationItemSocial = NavigationItem & {
    social: Social
}


/**
 * Anchor root configuration
 */
export interface Anchors {
    /** Header anchors */
    header?: AnchorHeader[]

    /** Sidebar anchors */
    sidebar?: {
        top?: NavigationItem[]

        bottom?: NavigationItem[]
    }
}

// TODO: in the future
type AnchorHeaderGithub = {
    githubUrl: string
}

export type AnchorHeader = NavigationItem | NavigationItemButton | NavigationItemSocial

// ------ END settings for navigation END ------


// ------ START settings for webeditor START ------
/**
 * WebEditor navigation item configuration
 */
export type WebEditorNavigationItem = NavigationItem & Partial<JSONComponent> & {
    /**
     * If `true` then the item will be displayed on mobile.
     */
    mobile?: boolean

    /**
     * If `true` then the item will be displayed on desktop.
     */
    desktop?: boolean
}

export interface Components {
    /**
     * WebEditor banner configuration
     */
    banner?: WebEditorBanner

    /**
     * WebEditor footer configuration
     */
    footer?: WebEditorFooter
}

// TODO: webeditor appearance?
/**
 * WebEditor configuration
 */
export interface WebEditor {
    /**
     * WebEditor header configuration
     */
    sidebarTop?: WebEditorNavigationItem[]

    /**
     * WebEditor header configuration
     */
    header?: WebEditorHeader[]

    /**
     * WebEditor header configuration
     */
    subheader?: WebEditorSubHeader
}

export type Social = "x" | "facebook" | "youtube" | "discord" | "slack" | "github" | "linkedin" | "instagram" | "hackernews" | "medium" | "telegram" | "bluesky" | "reddit"

export interface WebEditorFooter {
    kind?: "minimal"

    logo?: boolean | ComponentLike

    /** Footer socials */
    social?: {
        [K in Social]?: string
    }
    /** Footer links  */
    links?: WebEditorFooterLinks

    /** Footer footnote */
    footnote?: ComponentLike
}

export type WebEditorFooterLinks = WebEditorFooterLink[] | WebEditorFooterLinkItem[]

export interface WebEditorFooterLink {
    header: string
    items: WebEditorFooterLinkItem[]
}

export type WebEditorFooterLinkItem = {
    label: string
    href: string
}

export interface WebEditorBanner {
    /**
     * Banner content.
     */
    content: ComponentLike

    /**
     * Banner label.
     */
    label?: string

    /**
     * Banner kind.
     */
    kind?: "secondary"

    /**
     * Banner href.
     */
    href?: string

    /**
     * Banner icon.
     */
    icon?: string

    // /**
    //  * Banner store. TODO: in the future
    //  */
    // store?: number
}

/**
 * WebEditor header configuration
 */
export type WebEditorHeader = WebEditorNavigationItem & {
    /** Float the header to the right */
    float?: "right" | "center"
}

/**
 * WebEditorSubHeader header configuration
 */
export interface WebEditorSubHeader {
    /** Items of this subheader */
    items: WebEditorNavigationItem[]

    /** Title of this segment */
    title?: string
}

// ------ END settings for webeditor END ------


// ------ START settings for API START ------
/**
 * API Docs configuration interface
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

    /**
     * Custom apps directory.
     */
    [".apps"]?: AppsDirectory
}

// #region IntegrationAnalytics
/**
 * Analytics configuration
 */
export interface IntegrationAnalytics {
    /** Livesession analytics configuration */
    livesession?: IntegrationAnalyticsLiveSession
}

// #endregion IntegrationAnalytics

/**
 * Livesession analytics configuration
 */
export interface IntegrationAnalyticsLiveSession {
    /** Livesession's TrackID */
    trackId: string
}

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

export interface AppsDirectory {
    /**
     * Github star app configuration.
     * List of all [options](https://github.com/buttons/react-github-btn).
     */
    githubStar?: IntegrationAppGithubStar
}

export interface IntegrationAppGithubStar {
    /**
     * The title of the Github button
     */
    title: string

    /**
     * The label of the Github Button
     */
    label?: string

    /**
     * The href of the Github project
     */
    href: string

    /**
     * The data-show-count of the Github project
     */
    dataShowCount?: boolean

    /**
     * The data-icon of the Github button
     */
    dataIcon?: string

    /**
     * The data-size of the Github button
     */
    dataSize?: string

    /**
     * The aria-label of the Github button
     */
    ariaLabel?: string
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
 * @example [audience:dev]
 * You can also use the type to define the plugin config in your code:
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
    metatags?: { [tag: string]: string } // TODO: in the future type-safe
}

// ------ END  settings for redirects END ------

// ------ START settings for engine START ------
/**
 * Engine configuration
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

/**
 * JSON representation of a component.
 */
export interface JSONComponent {
    /**
     * The component type, e.g. "Button", "Card", etc.
     */
    component: string

    /**
     * The component's children, which can be a string, an array of strings, or an array of JSONComponent objects.
     */
    props?: Record<string, any>
}

/**
 * A type that can be used to represent a component-like structure.
 */
export type ComponentLike = React.JSX.Element | JSONComponent | string

export interface ThemeColors {
    colorScheme: string;
    foreground: string;
    background: string;
    lighter: {
        inlineBackground: string;
    };
    editor: {
        background: string;
        foreground: string;
        lineHighlightBackground: string;
        rangeHighlightBackground: string;
        infoForeground: string;
        selectionBackground: string;
    };
    focusBorder: string;
    tab: {
        activeBackground: string;
        activeForeground: string;
        inactiveBackground: string;
        inactiveForeground: string;
        border: string;
        activeBorder: string;
        activeBorderTop: string;
    };
    editorGroup: {
        border: string;
    };
    editorGroupHeader: {
        tabsBackground: string;
    };
    editorLineNumber: {
        foreground: string;
    };
    input: {
        background: string;
        foreground: string;
        border: string;
    };
    icon: {
        foreground: string;
    };
    sideBar: {
        background: string;
        foreground: string;
        border: string;
    };
    list: {
        activeSelectionBackground: string;
        activeSelectionForeground: string;
        hoverBackground: string;
        hoverForeground: string;
    };
}

export interface UserPreferences {
    themeColors?: ThemeColors
}