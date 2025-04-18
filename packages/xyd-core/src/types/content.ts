/**
 * Represents metadata for a content page.
 * Usually used as md/mdx frontmatter.
 *
 */
export interface Metadata<P = void> {
    /** The main title of the content - by default visible in navigation and page title */
    title: string | {
        title: string
        code: string // TODO: delete
    }

    /** Optional disply description for SEO purposes */
    description?: string

    /** Optional title to display in the sidebar navigation */
    sidebarTitle?: string

    /** Optional icon identifier for the navigation item */
    icon?: string

    /** Optional layout type for the content display */
    layout?: "page" | "wide" | "center"

    /** The type of component to render this content with */
    component?: "docs" | "atlas" | "page"

    /** Optional properties specific to the component type */
    componentProps?: P

    /** Optional 'group' for sidebar navigation */
    group?: string[]
}

export type MetadataMap<P = void> = { [page: string]: Metadata<P> }
