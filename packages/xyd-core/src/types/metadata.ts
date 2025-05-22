// TODO: og

/**
 * Represents metadata for a content page.
 * Usually used as md/mdx frontmatter.
 *
 */
export interface Metadata<P = void> {
    /** The main title of the content - by default visible in navigation and page title */
    title?: string

    /** Optional title to display in the sidebar navigation */
    sidebarTitle?: string

    /** Optional disply description for SEO purposes */
    description?: string

    /** Optional icon identifier for the navigation item */
    icon?: string

    /** Optional layout type for the content display */
    layout?: PageLayout

    /** The type of component to render this content with */
    component?: "docs" | "atlas" | "page"

    /** Optional properties specific to the component type */
    componentProps?: P

    /** Optional 'group' for sidebar navigation */
    group?: string[]

    /** Optional 'uniform' for component references */
    uniform?: string

    /** Optional 'graphql' for graphql references */
    graphql?: string

    /** Optional 'openapi' for openapi references */
    openapi?: string

    /** Optional 'hidden' for content visibility */
    hidden?: boolean

    /**
     * Optional 'tocGithub' for github references
     * 
     * @optional
     * @unsafe
     * @todo: !!! IN THE FUTURE COMPOSE API !!!
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

export type MetadataMap<P = void> = { [page: string]: Metadata<P> }

export type PageLayout = "wide" | "page" | "center"
