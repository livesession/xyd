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

    /** Disply description for SEO purposes */
    description?: string

    /**  Icon identifier for the navigation item */
    icon?: string

    /** Layout type for the content display */
    layout?: PageLayout

    /** Max depth for table of contents */
    maxTocDepth?: number

    /**
     * @internal
     * 
     * The type of component to render this content with 
     */
    component?: "docs" | "atlas" | "page"

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
     * @internal
     * 
     * Optional 'tocGithub' for github references
     * 
     * @todo: !!! IN THE FUTURE COMPOSE API !!!
     * 
     * @example
     * ```
     * tocGithub: {
     *     link: "https://github.com/livesession/livesession-browser",
     *     title: "Checkout the code",
     *     description: "Check how to use the LiveSession Browser SDK",
     * }
     * ```
     */
    tocGithub?: {
        /** 'link' for github references */
        link: string

        /** 'title' for github references */
        title: string

        /** 'description' for github references */
        description: string
    }
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

export type PageLayout = "wide" | "page" | "center"
