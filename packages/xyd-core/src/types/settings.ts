export interface Settings {
    // styling configurations for the documentation
    styling?: Styling

    structure?: Structure

    api?: API

    integrations?: Integrations

    redirects?: Redirects[]

    seo?: SEO
}

// ------ START  setting for styling START ------
export interface Styling {
    // Name of your company or project. Used for the global title.
    name: string;

    // Path to logo image or object with path to “light” and “dark” mode logo images, and where the logo links to. SVG format is recommended.
    // It does not pixelate and the file size is generally smaller.
    logo?: string | Logo | JSX.Element

    // Path to the favicon image. For example: /path/to/favicon.svg
    favicon?: string;

    // Hex color codes for your global theme
    colors?: Colors

    // A preset theme configuration that changes the look and feel of the project. A theme is a set of default styling configurations. Examples: gusto, poetry, plato, picasso
    theme?: ThemeType

    // The global layout style of the documentation.
    layout?: LayoutType

    // Set a decorative background.
    background?: Background

    // Set a custom background image to be displayed behind every page.
    backgroundImage?: string

    // Custom fonts. Apply globally or set different fonts for headings and the body text.
    font?: FontDetailsType | { headings?: FontDetailsType, body?: FontDetailsType }

    // Customize the dark mode toggle.
    modeToggle?: ModeToggle

    // Customize the styling of components within the sidebar.
    sidebar?: StyleSidebar

    // Styling configurations for the topbar.
    topbar?: Topbar

    // The location of the search bar entry.
    search?: SearchType

    // The style of the rounded edges.
    rounded?: Rounded
}

export interface Logo {
    // Path to the logo in light mode. For example: `/path/to/logo.svg`
    light?: string;

    // Path to the logo in dark mode. For example: `/path/to/logo.svg`
    dark?: string;

    // Where clicking on the logo links you to
    href?: string;
}

export interface Colors {
    // The primary color. Used most often for highlighted content, section headers, accents, in light mode
    primary: string

    // The primary color for dark mode. Used most often for highlighted content, section headers, accents, in dark mode
    light?: string

    // The primary color for important buttons
    dark?: string

    // The color of the background in both light and dark mode
    background?: {
        light: string

        dark: string
    }
}

export interface Background {
    // The style of the decorative background.
    style?: "gradient" | "grid" | "windows"
}


export interface FontDetailsType {
    // The font family name. Custom fonts and all Google Fonts are supported. e.g. “Open Sans”, “Playfair Display”
    family: string

    // The font weight. Precise values such as 560 are also supported for variable fonts. Check under the Styles section for your Google Font for the available weights.
    weight?: number

    // The URL to the font file. Can be used to specify a font that is not from Google Fonts.
    url?: string

    // The font format. Required if using a custom font source (url).
    format?: "woff" | "woff2"

}

export interface ModeToggle {
    // Set if you always want to show light or dark mode for new users. When not set, we default to the same mode as the user’s operating system.
    default?: "light" | "dark"

    // Set to true to hide the dark/light mode toggle. You can combine isHidden with default to force your docs to only use light or dark mode.
    isHidden?: boolean
}

export interface StyleSidebar {
    // The styling of the sidebar item.
    items: "container" | "card" | "border" | "undecorated"
}

export interface Topbar {
    // Styling configurations for the topbar.
    style: "default" | "gradient"
}

export type ThemeType = "gusto" | "poetry" | "plato" | "picasso"

export type LayoutType = "app" | "default"

export type SearchType = "side" | "top"

export type Rounded = "default" | "sharp"
// ------ END  setting for styling END ------


// ------ START  setting for structure START ------
export interface Structure {
    // Definition of sidebar - an array of groups with all the pages within that group
    sidebar: (SidebarMulti | Sidebar) []

    // Array of headers
    header?: Header[]

    // The call to action button in the topbar
    topbarCtaButton?: CallToAction

    // Array of version names. Only use this if you want to show different versions of docs with a dropdown in the navigation bar.
    versions?: string[]

    // Anchors, includes the icon, name, and url.
    anchors?: AnchorRoot

    // An object of social media accounts where the key:property pair represents the social media platform and the account url.
    footerSocials?: FooterSocials

    // Configurations to enable feedback buttons
    feedback?: Feedback

    // Configurations to change the search prompt
    search?: Search
}

export interface SidebarMulti {
    // routing match
    match: string

    // sidebar items
    items: Sidebar[]
}

export interface Sidebar {
    // The name of the group.
    group?: string

    // The relative paths to the markdown files that will serve as pages.
    // Note: groups are recursive, so to add a sub-folder add another group object in the page array.
    pages?: (string | Sidebar)[]

    // The Fontawesome icon for the group. Note: this only applies to sub-folders.
    icon?: string

    // The type of Fontawesome icon. Must be one of: brands, duotone, light, sharp-solid, solid, thin
    iconType?: string
}

export interface SubHeader {
    match: string
    name: string
    items: Header[]
}

export interface Header {
    // The name of the button.
    name?: string

    // The url once you click on the button. Example: https://mintlify.com/contact
    url?: string

    sub?: SubHeader
}

export interface CallToAction {
    // Link shows a button. GitHub shows the repo information at the url provided including the number of GitHub stars.
    type?: "link" | "github"

    // If type is a link: What the button links to. If type is a github: Link to the repository to load GitHub information from.
    url?: string

    // Text inside the button. Only required if type is a link.
    name?: string

    // The style of the button.
    style?: "pill" | "roundedRectangle"

    // Whether to display the arrow
    arrow?: boolean
}

export interface Anchor {
    // The Font Awesome or JSX icon used to feature the anchor.
    icon?: string | JSX.Element

    // The name of the anchor label.
    name?: string

    // The start of the URL that marks what pages go in the anchor. Generally, this is the name of the folder you put your pages in.
    url?: string
}

export interface AnchorRoot {
    bottom: Anchor[]
}

export interface FooterSocials {
    // One of the following values website, facebook, x, youtube, discord, slack, github, linkedin, instagram, hacker-news
    [key: string]: string

    // The URL to the social platform.
    property: string
}

export interface Feedback {
    // Enables a rating system for users to indicate whether the page has been helpful
    thumbsRating?: boolean

    // Enables a button to allow users to suggest edits via pull requests
    suggestEdit?: boolean

    // Enables a button to allow users to raise an issue about the documentation
    raiseIssue?: boolean
}

export interface Search {
    // Set the prompt for the search bar. Default is Search...
    prompt?: string
}

// ------ END  setting for structure END ------


// ------ START  setting for API START ------
export interface API {
    info?: APIInfo

    // A string or an array of strings of URL(s) or relative path(s) pointing to your OpenAPI file.
    openapi?: string | string[]

    // A string or an array of strings of URL(s) or relative path(s) pointing to your GraphQL file.
    graphql?: string | string[]

    // TODO: better in the future?
    match?: {
        graphql?: string
        openapi?: string
    }
}

export interface APIInfo {
    // The base url for all API endpoints. If baseUrl is an array, it will enable for multiple base url options that the user can toggle.
    baseUrl?: string

    // auth info
    auth?: APIAuth

    // The name of the authentication parameter used in the API playground.
    // If method is basic, the format should be [usernameName]:[passwordName]
    name?: string

    /*
    The default value that’s designed to be a prefix for the authentication input field.

    E.g. If an inputPrefix of AuthKey would inherit the default input result of the authentication field as AuthKey.
    */
    inputPrefix?: string

    // Configurations for the API playground
    playground?: APIPlayground

    request?: APIInfoRequest

    paramFields?: ApiParamFields
}

export interface APIAuth {
    // The authentication strategy used for all API endpoints.
    method: "bearer" | "basic" | "key"
}

export interface APIPlayground {
    mode?: "show" | "simple" | "hide"
}

export interface APIInfoRequest {
    // Configurations for the auto-generated API request examples
    example?: {
        /*
        An array of strings that determine the order of the languages of the auto-generated request examples.
        You can either define custom languages utilizing x-codeSamples or use our default languages which include bash, python, javascript, php, go, java
        */
        languages?: string[]
    }
}

export interface ApiParamFields {
    /*
    The default expanded state of expandable options in the API playground.

    "all" - every expandable component is expanded

    "topLevel" - every top-level expandable component is expanded

    "topLevelOneOfs" - every top-level oneOf type is expanded

    "none" - every expandable component is closed (default behavior)
    */
    expanded: "all" | "topLevel" | "topLevelOneOfs" | "none"
}

// ------ END  setting for API END ------


// ------ START  setting for integrations START ------
export interface Integrations {
    // Configurations to add third-party analytics integrations. See full list of supported analytics here.
    analytics?: Analytics
}

export interface Analytics {
    livesession: {
        trackId: string
    }
}

// ------ END  setting for integrations END ------


// ------ START  setting for redirecs START ------
export interface Redirects {
    source: string

    destination: string
}

export interface SEO {
    indexHiddenPages: boolean
}

// ------ END  setting for redirects END ------
