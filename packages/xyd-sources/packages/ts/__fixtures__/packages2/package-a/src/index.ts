// import React from "react";

import type { Theme as SyntaxHighlight } from "@code-hike/lighter";

/**
 * Main settings interface for the application
 */
export interface Settings {
    /** Theme configuration for the application */
    theme?: Theme | ThemeResolver

    /** Navigation configuration */
    navigation?: Navigation

    /** API configuration */
    api?: API

    /** Integrations configuration */
    integrations?: Integrations

    /** Redirects configuration */
    redirects?: Redirects[]

    /** SEO configuration */
    seo?: SEO
}

// ------ START setting for theme START ------
// #region Theme
/**
 * Theme configuration that changes the look and feel of the project
 */
export interface Theme {
    /** 
     * A preset theme configuration that changes the look and feel of the project. 
     * A theme is a set of default styling configurations. 
     * Examples: cosmo, gusto, poetry, picasso,
     */
    readonly name: ThemePresetName | string

    /** Markdown configuration for the theme, including options like syntax highlighting */
    markdown?: Markdown

    /** 
     * Path to logo image or object with path to "light" and "dark" mode logo images, and where the logo links to. 
     * SVG format is recommended as it does not pixelate and the file size is generally smaller.
     */
    logo?: string | Logo | React.JSX.Element

    /** Path to the favicon image. For example: /path/to/favicon.svg */
    favicon?: string;

    /** Hex color codes for your global theme */
    colors?: Colors

    /** Set a custom background image to be displayed behind every page */
    backgroundImage?: string

    /** 
     * Custom fonts. Apply globally or set different fonts for headings and the body text.
     */
    font?: FontDetailsType | { headings?: FontDetailsType, body?: FontDetailsType }

    /** The location of the search bar entry */
    search?: SearchType
}
// #endregion Theme

/**
 * Theme resolver interface (TODO: in the future (typescript))
 */
export interface ThemeResolver extends Theme {

}

/**
 * Markdown configuration interface
 */
export interface Markdown {
    /** Syntax highlighting configuration */
    syntaxHighlight: SyntaxHighlight
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
 * Color configuration interface
 */
export interface Colors {
    /** The primary color. Used most often for highlighted content, section headers, accents, in light mode */
    primary: string

    /** The primary color for dark mode. Used most often for highlighted content, section headers, accents, in dark mode */
    light?: string

    /** The primary color for important buttons */
    dark?: string

    /** The color of the background in both light and dark mode */
    background?: {
        /** Light mode background color */
        light: string

        /** Dark mode background color */
        dark: string
    }
}

/**
 * Font details configuration interface
 */
export interface FontDetailsType {
    /** 
     * The font family name. Custom fonts and all Google Fonts are supported. 
     * e.g. "Open Sans", "Playfair Display"
     */
    family: string

    /** 
     * The font weight. Precise values such as 560 are also supported for variable fonts. 
     * Check under the Styles section for your Google Font for the available weights.
     */
    weight?: number

    /** The URL to the font file. Can be used to specify a font that is not from Google Fonts */
    url?: string

    /** The font format. Required if using a custom font source (url) */
    format?: "woff" | "woff2"
}

/** Available theme preset names */
export type ThemePresetName = "poetry" | "cosmo" | "opener" | "picasso" | "picasso"

/** Search bar location options */
export type SearchType = "side" | "top"

// ------ END  setting for theme END ------


// ------ START  setting for navigation START ------
/**
 * Navigation configuration interface
 */
export interface Navigation {
    /** Definition of sidebar - an array of groups with all the pages within that group */
    sidebar: (SidebarRoute | Sidebar)[]

    /** Array of headers */
    header?: Header[]

    /** The call to action button in the topbar */
    topbarCtaButton?: CallToAction

    /** 
     * Array of version names. Only use this if you want to show different versions of docs 
     * with a dropdown in the navigation bar.
     */
    versions?: string[]

    /** Anchors, includes the icon, name, and url */
    anchors?: AnchorRoot

    /** 
     * An object of social media accounts where the key:property pair represents 
     * the social media platform and the account url.
     */
    footerSocials?: FooterSocials

    /** Configurations to enable feedback buttons */
    feedback?: Feedback

    /** Configurations to change the search prompt */
    search?: Search
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
    pages?: (string | Sidebar)[]

    /** The Fontawesome icon for the group. Note: this only applies to sub-folders */
    icon?: string

    /** 
     * The type of Fontawesome icon. Must be one of: brands, duotone, light, sharp-solid, solid, thin
     */
    iconType?: string
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
export interface Header {
    /** The name of the button */
    name?: string

    /** The url once you click on the button. Example: https://mintlify.com/contact */
    url?: string

    /** Sub-header configuration */
    sub?: SubHeader
}

/**
 * Call to action configuration
 */
export interface CallToAction {
    /** 
     * Link shows a button. GitHub shows the repo information at the url provided 
     * including the number of GitHub stars.
     */
    type?: "link" | "github"

    /** 
     * If type is a link: What the button links to. 
     * If type is a github: Link to the repository to load GitHub information from.
     */
    url?: string

    /** Text inside the button. Only required if type is a link */
    name?: string

    /** The style of the button */
    style?: "pill" | "roundedRectangle"

    /** Whether to display the arrow */
    arrow?: boolean
}

/**
 * Anchor configuration
 */
export interface Anchor {
    /** The Font Awesome or JSX icon used to feature the anchor */
    icon?: string | React.JSX.Element

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
    bottom: Anchor[]
}

/**
 * Footer socials configuration
 */
export interface FooterSocials {
    /** 
     * One of the following values website, facebook, x, youtube, discord, slack, 
     * github, linkedin, instagram, hacker-news
     */
    [key: string]: string

    /** The URL to the social platform */
    property: string
}

/**
 * Feedback configuration
 */
export interface Feedback {
    /** Enables a rating system for users to indicate whether the page has been helpful */
    thumbsRating?: boolean

    /** Enables a button to allow users to suggest edits via pull requests */
    suggestEdit?: boolean

    /** Enables a button to allow users to raise an issue about the documentation */
    raiseIssue?: boolean
}

/**
 * Search configuration
 */
export interface Search {
    /** Set the prompt for the search bar. Default is Search... */
    prompt?: string
}

// ------ END  setting for structure END ------


// ------ START  setting for API START ------
/**
 * API file type - can be a string, array of strings, or a map of strings
 */
export type APIFile = string | string[] | { [id: string]: string }

/**
 * API configuration interface
 */
export interface API {
    /** API information */
    info?: APIInfo

    /** 
     * A string/array/map of strings of URL(s) or relative path(s) pointing to your OpenAPI file.
     */
    openapi?: APIFile

    /** 
     * A string or an array of strings of URL(s) or relative path(s) pointing to your GraphQL file.
     */
    graphql?: APIFile

    /** 
     * A string or an array of strings of URL(s) or relative path(s) pointing to your source code folder.
     */
    sources?: APIFile

    /** 
     * TODO: better in the future? -> move outside of API ?
     * Route configuration for API endpoints
     */
    route?: {
        /** GraphQL route */
        graphql?: string

        /** OpenAPI route */
        openapi?: string

        /** Sources route */
        sources?: string
    }
}

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
     * The default value that's designed to be a prefix for the authentication input field.
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

// ------ END  setting for API END ------


// ------ START  setting for integrations START ------
/**
 * Integrations configuration
 */
export interface Integrations {
    /** 
     * Configurations to add third-party analytics integrations. 
     * See full list of supported analytics here.
     */
    analytics?: Analytics
}

/**
 * Analytics configuration
 */
export interface Analytics {
    /** Livesession analytics configuration */
    livesession: {
        /** Tracking ID for Livesession */
        trackId: string
    }
}

// ------ END  setting for integrations END ------


// ------ START  setting for redirecs START ------
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
    /** Whether to index hidden pages */
    indexHiddenPages: boolean
}

// ------ END  setting for redirects END ------
