// TODO: og

/**
 * @todo rename to PageMeta
 * 
 * Represents metadata for a content page.
 * Usually used as md/mdx frontmatter.
 *
 */
export interface Metadata<P = void> {
    /** The main title of the content - by default visible in navigation and page title */
    title: string

    /** Title to display in the sidebar navigation */
    sidebarTitle?: string

    /** Display description for SEO/llms.txt purposes */
    description?: string

    /**  Icon identifier for the navigation item */
    icon?: string

    /** Layout type for the content display */
    layout?: PageLayout

    /** Max depth for table of contents */
    maxTocDepth?: number

    /** External URL for the content */
    url?: string

    /**
     * If false, hide the copy page button
     */
    copyPage?: boolean

    /**
     * @internal
     * 
     * The type of component to render this content with 
     */
    component?: "docs" | "atlas" | "home" | "firstslide" | "bloghome" | "blogpost"

    /** 
     * @internal
     * 
     * Properties specific to the component type
     */
    componentProps?: P

    /** 
     * @internal
     * 
     * Group for sidebar navigation 
    */
    group?: string[]

    /**
     * Uniform for API Docs references
     */
    uniform?: PageMetaUniform

    /**
     * @internal
     * 
     * used for graphql references
     */
    graphql?: string

    /**
     * @internal
     * 
     * used for openapi references
     */
    openapi?: string

    /**
     * If true, hide from navigation
     */
    hidden?: boolean

    /**
     * Optional 'tocCard' for custom cards in the table of contents
     * 
     * @example
     * ```
     * tocCard: {
     *     link: "https://github.com/livesession/livesession-browser",
     *     title: "Checkout the code",
     *     description: "Check how to use the LiveSession Browser SDK",
     *     icon: "github"
     * }
     * ```
     */
    tocCard?: TocCard | TocCard[]
}

export interface TocCard {
    /** 'link' to the card */
    link: string

    /** 'title' of the card */
    title: string

    /** 'description' of the card */
    description: string

    /** 'icon' of the card */
    icon?: string
}

export type PageMetaUniform = string | PageMetaUniformDetails;

/**
 * Uniform details allows to specify more options than just the path, for example eager loading
 */
export type PageMetaUniformDetails = {
    /**
     * Path to the uniform file / url
     */
    path: string

    /**
     * If true, the uniform will be eagerly loaded
     */
    eager?: boolean
}

export type MetadataMap<P = void> = { [page: string]: Metadata<P> }

// TODO: "custom" in the future?  

export type PageLayout = "wide" | "page" | "reader" 
