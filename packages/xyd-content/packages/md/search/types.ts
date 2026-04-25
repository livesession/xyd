export interface DocSectionSchema { // TODO: move to @xyd-js/plugins/search ?
    /**
     * Id of the page e.g. "getting-started"
     */
    pageId: string

    /**
     * URL of the page e.g. "/getting-started"
     */
    pageUrl: string

    /**
     * Title of the page e.g. "Getting Started"
     */
    pageTitle: string

    /**
     * Level of the heading e.g. 1, 2
     */
    headingLevel: number

    /**
     * Title of the heading e.g. "Making a new project"
     */
    headingTitle: string

    /**
     * Summary of the page e.g. "This is the summary of the page"
     */
    summary: string

    /**
     * Content of the section
     */
    content: string

    /**
     * Access level for the page. Set by the framework when access control is active.
     * Search data generators should preserve this field so virtual modules can
     * embed client-side filtering automatically.
     */
    access?: string
}